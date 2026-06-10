"""
╔══════════════════════════════════════════════════════════════════════════════╗
║        CELESTIAL BOUTIQUE M&V — Orquestador de Catálogo Multiagente         ║
║        Arquitectura: 1 Orquestador + 10 Worker Agents concurrentes          ║
╚══════════════════════════════════════════════════════════════════════════════╝

Flujo:
  1. Orquestador lee el PDF del catálogo y extrae/divide productos en 10 lotes
  2. 10 agentes worker procesan sus lotes en paralelo (asyncio + ThreadPoolExecutor)
  3. Cada worker hace UPSERT en PostgreSQL (INSERT … ON CONFLICT DO UPDATE)
  4. Al finalizar todos, el orquestador dispara revalidación de caché en Next.js

Requisitos:
  pip install anthropic psycopg2-binary pymupdf pillow python-dotenv

Variables de entorno (.env o sistema):
  DATABASE_URL          postgresql://user:pass@host:5432/dbname
  ANTHROPIC_API_KEY     sk-ant-...
  NEXT_REVALIDATE_URL   http://localhost:3000/api/revalidate   (o URL de producción)
  NEXT_REVALIDATE_SECRET secret_token_revalidacion
  CATALOG_PDF_PATH      ./CATÁLOGO PERFUMGLASS_2026.pdf
"""

import asyncio
import base64
import io
import json
import os
import sys
import time
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Optional

import anthropic
import fitz                    # PyMuPDF
import psycopg2
import urllib.request
import urllib.error
from dotenv import load_dotenv
from PIL import Image

load_dotenv()

# ─── Configuración ────────────────────────────────────────────────────────────
DATABASE_URL          = os.getenv("DATABASE_URL", "")
ANTHROPIC_API_KEY     = os.getenv("ANTHROPIC_API_KEY", "")
NEXT_REVALIDATE_URL   = os.getenv("NEXT_REVALIDATE_URL", "http://localhost:3000/api/revalidate")
NEXT_REVALIDATE_SECRET = os.getenv("NEXT_REVALIDATE_SECRET", "")
CATALOG_PDF_PATH      = os.getenv("CATALOG_PDF_PATH", "./CATÁLOGO PERFUMGLASS_2026.pdf")

NUM_WORKERS           = 10       # agentes concurrentes
VISION_MODEL          = "claude-opus-4-8"
MAX_TOKENS_PER_CALL   = 1024
RENDER_DPI_SCALE      = 1.5      # resolución de renderizado de páginas
PRICE_AA              = 35_000   # COP calidad AA
PRICE_AAA             = 55_000   # COP calidad AAA

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("orchestrator")


# ─── Modelos de datos ─────────────────────────────────────────────────────────
@dataclass
class Product:
    name: str
    house: str                          # marca/casa inspiradora
    inspired_by: str                    # nombre exacto del perfume original
    gender: str                         # "hombre" | "mujer" | "unisex"
    price_aa: int  = PRICE_AA
    price_aaa: int = PRICE_AAA
    notes: str     = ""
    is_new: bool   = False
    reviews: int   = 5
    review_count: int = 0
    accent_color: str = "#D4AF37"
    color_bg: str     = "#1A1A1A"
    color_text: str   = "#D4AF37"
    image_url: str    = ""
    stock: int        = 100
    page_num: int     = 0               # página de origen en el PDF


@dataclass
class WorkerResult:
    worker_id: int
    products_processed: int = 0
    products_inserted: int  = 0
    products_updated: int   = 0
    errors: list            = field(default_factory=list)
    duration_seconds: float = 0.0


# ─── Herramientas de base de datos ────────────────────────────────────────────
def get_db_connection():
    """Abre una conexión PostgreSQL usando DATABASE_URL."""
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL no configurada. Revisa tu archivo .env")
    return psycopg2.connect(DATABASE_URL)


def upsert_product(conn, product: Product) -> str:
    """
    INSERT … ON CONFLICT (name, gender) DO UPDATE
    Retorna 'inserted' o 'updated'.
    """
    sql = """
    INSERT INTO products (
        house, name, "inspiredBy", gender, "isNew",
        "priceAA", "priceAAA", reviews, "reviewCount",
        "accentColor", notes, "colorBg", "colorText",
        "imageUrl", stock
    ) VALUES (
        %(house)s, %(name)s, %(inspired_by)s, %(gender)s, %(is_new)s,
        %(price_aa)s, %(price_aaa)s, %(reviews)s, %(review_count)s,
        %(accent_color)s, %(notes)s, %(color_bg)s, %(color_text)s,
        %(image_url)s, %(stock)s
    )
    ON CONFLICT (name, gender)
    DO UPDATE SET
        house          = EXCLUDED.house,
        "inspiredBy"   = EXCLUDED."inspiredBy",
        "isNew"        = EXCLUDED."isNew",
        "priceAA"      = EXCLUDED."priceAA",
        "priceAAA"     = EXCLUDED."priceAAA",
        "accentColor"  = EXCLUDED."accentColor",
        notes          = EXCLUDED.notes,
        "imageUrl"     = EXCLUDED."imageUrl",
        stock          = EXCLUDED.stock
    RETURNING (xmax = 0) AS inserted
    """
    with conn.cursor() as cur:
        cur.execute(sql, {
            "house":        product.house,
            "name":         product.name,
            "inspired_by":  product.inspired_by,
            "gender":       product.gender,
            "is_new":       product.is_new,
            "price_aa":     product.price_aa,
            "price_aaa":    product.price_aaa,
            "reviews":      product.reviews,
            "review_count": product.review_count,
            "accent_color": product.accent_color,
            "notes":        product.notes,
            "color_bg":     product.color_bg,
            "color_text":   product.color_text,
            "image_url":    product.image_url,
            "stock":        product.stock,
        })
        row = cur.fetchone()
        conn.commit()
        return "inserted" if row and row[0] else "updated"


def ensure_upsert_constraint(conn):
    """Crea el UNIQUE constraint necesario para el upsert si no existe."""
    with conn.cursor() as cur:
        cur.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint
                    WHERE conname = 'products_name_gender_key'
                ) THEN
                    ALTER TABLE products ADD CONSTRAINT products_name_gender_key
                    UNIQUE (name, gender);
                END IF;
            END $$;
        """)
        conn.commit()


# ─── Visión: extracción de productos con Claude ───────────────────────────────
def page_to_base64(doc: fitz.Document, page_num: int, scale: float = RENDER_DPI_SCALE) -> str:
    """Renderiza una página PDF y la convierte a base64 PNG."""
    mat = fitz.Matrix(scale, scale)
    pix = doc[page_num].get_pixmap(matrix=mat)
    img = Image.open(io.BytesIO(pix.tobytes("png")))
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return base64.standard_b64encode(buf.getvalue()).decode()


EXTRACTION_PROMPT = """Analiza esta imagen del catálogo de perfumes de RG Distribuidora.

Si la página muestra un SEPARADOR DE SECCIÓN (texto grande: CABALLERO, DAMA, MUJER, UNISEX), responde:
{"type": "section", "gender": "<hombre|mujer|unisex>"}

Si la página muestra un PRODUCTO, extrae:
{
  "type": "product",
  "name": "nombre del perfume tal como aparece en la caja/frasco",
  "house": "marca/casa de la fragancia original",
  "inspired_by": "nombre completo del perfume original de lujo",
  "gender": "hombre|mujer|unisex",
  "notes": "notas olfativas si son visibles, si no deja vacío",
  "accent_color": "color hex dominante de la caja/frasco (ej: #D4AF37 para dorado)"
}

Responde ÚNICAMENTE con el JSON. Sin explicaciones."""


def extract_product_from_page(
    client: anthropic.Anthropic,
    doc: fitz.Document,
    page_num: int,
    current_gender: str,
) -> Optional[dict]:
    """Llama a Claude Vision para extraer datos de un producto en una página."""
    try:
        img_b64 = page_to_base64(doc, page_num)
        response = client.messages.create(
            model=VISION_MODEL,
            max_tokens=MAX_TOKENS_PER_CALL,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/png",
                            "data": img_b64,
                        },
                    },
                    {"type": "text", "text": EXTRACTION_PROMPT},
                ],
            }],
        )
        raw = response.content[0].text.strip()
        # Limpia markdown si Claude lo incluye
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw)
        if data.get("type") == "product" and not data.get("gender"):
            data["gender"] = current_gender
        return data
    except Exception as e:
        return {"type": "error", "error": str(e), "page": page_num}


# ─── Worker Agent ─────────────────────────────────────────────────────────────
def worker_agent(
    worker_id: int,
    page_batch: list[int],
    pdf_path: str,
) -> WorkerResult:
    """
    Worker Agent: procesa su lote de páginas del PDF.
    Extrae productos con Claude Vision y los upserts en PostgreSQL.
    """
    result   = WorkerResult(worker_id=worker_id)
    log_w    = logging.getLogger(f"worker-{worker_id:02d}")
    t_start  = time.time()

    log_w.info(f"Iniciando — {len(page_batch)} páginas: {page_batch[0]}→{page_batch[-1]}")

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    doc    = fitz.open(pdf_path)
    conn   = get_db_connection()

    current_gender = "hombre"   # Sección por defecto (las primeras páginas son CABALLERO)

    for page_num in page_batch:
        try:
            data = extract_product_from_page(client, doc, page_num, current_gender)

            if not data or data.get("type") == "error":
                log_w.warning(f"  p{page_num+1}: error — {data.get('error','?')}")
                result.errors.append({"page": page_num + 1, "error": data.get("error", "?")})
                continue

            if data["type"] == "section":
                current_gender = data.get("gender", current_gender)
                log_w.info(f"  p{page_num+1}: SECCIÓN → {current_gender.upper()}")
                continue

            if data["type"] == "product":
                product = Product(
                    name        = data.get("name", "").strip(),
                    house       = data.get("house", "").strip(),
                    inspired_by = data.get("inspired_by", data.get("name", "")),
                    gender      = data.get("gender", current_gender),
                    notes       = data.get("notes", ""),
                    accent_color= data.get("accent_color", "#D4AF37"),
                    page_num    = page_num + 1,
                )

                if not product.name:
                    continue

                # Asigna colores según género
                if product.gender == "mujer":
                    product.color_bg   = "#1A0A12"
                    product.color_text = "#E8A0BF"
                elif product.gender == "unisex":
                    product.color_bg   = "#0A1220"
                    product.color_text = "#9BB5D6"

                result.products_processed += 1
                action = upsert_product(conn, product)

                if action == "inserted":
                    result.products_inserted += 1
                    log_w.info(f"  p{page_num+1}: INSERT  → {product.name} [{product.gender}]")
                else:
                    result.products_updated += 1
                    log_w.info(f"  p{page_num+1}: UPDATE  → {product.name} [{product.gender}]")

        except Exception as e:
            log_w.error(f"  p{page_num+1}: EXCEPCIÓN — {e}")
            result.errors.append({"page": page_num + 1, "error": str(e)})
            try:
                conn.rollback()
            except Exception:
                pass

    conn.close()
    doc.close()
    result.duration_seconds = time.time() - t_start
    log_w.info(
        f"✓ Finalizado en {result.duration_seconds:.1f}s — "
        f"{result.products_inserted} INSERT, {result.products_updated} UPDATE, "
        f"{len(result.errors)} errores"
    )
    return result


# ─── Sincronización Frontend Next.js ─────────────────────────────────────────
def revalidate_nextjs_cache():
    """
    Dispara la revalidación de caché en Next.js vía API route.
    Usa urllib de la librería estándar — compatible con Python 3.9+.
    """
    if not NEXT_REVALIDATE_URL:
        log.warning("NEXT_REVALIDATE_URL no configurada — saltando revalidación")
        return

    paths = ["/", "/hombre", "/mujer", "/unisex", "/admin"]

    for path in paths:
        try:
            payload = json.dumps({"path": path}).encode("utf-8")
            req = urllib.request.Request(
                NEXT_REVALIDATE_URL,
                data=payload,
                method="POST",
                headers={
                    "Content-Type": "application/json",
                    "x-revalidate-secret": NEXT_REVALIDATE_SECRET,
                },
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status == 200:
                    log.info(f"  ✓ Revalidado: {path}")
                else:
                    log.warning(f"  ✗ {path} → HTTP {resp.status}")
        except urllib.error.HTTPError as e:
            log.warning(f"  ✗ {path} → HTTP {e.code}: {e.reason}")
        except Exception as e:
            log.error(f"  ✗ Error revalidando {path}: {e}")


# ─── Orquestador Principal ────────────────────────────────────────────────────
async def orchestrate():
    """
    Fase 1 — Ingesta: lee el PDF y divide páginas en 10 lotes equitativos.
    Fase 2 — Procesamiento paralelo: lanza 10 workers concurrentes.
    Fase 3 — Inserción: cada worker hace upserts en PostgreSQL.
    Fase 4 — Sincronización frontend: revalidación de caché Next.js.
    """
    log.info("═" * 70)
    log.info("  CELESTIAL BOUTIQUE M&V — Importación de Catálogo 2026")
    log.info("═" * 70)

    # Validaciones previas
    if not Path(CATALOG_PDF_PATH).exists():
        log.error(f"PDF no encontrado: {CATALOG_PDF_PATH}")
        sys.exit(1)
    if not DATABASE_URL:
        log.error("DATABASE_URL no configurada")
        sys.exit(1)
    if not ANTHROPIC_API_KEY:
        log.error("ANTHROPIC_API_KEY no configurada")
        sys.exit(1)

    # ── FASE 1: Ingesta ───────────────────────────────────────────────────────
    log.info("\n📂 FASE 1 — Ingesta del catálogo")
    doc = fitz.open(CATALOG_PDF_PATH)
    total_pages = len(doc)
    doc.close()
    log.info(f"   PDF: {CATALOG_PDF_PATH}")
    log.info(f"   Total de páginas: {total_pages}")

    # Saltar portada y última página (índice/cierre)
    product_pages = list(range(2, total_pages - 1))
    log.info(f"   Páginas de productos: {len(product_pages)}")

    # Crear constraint de upsert si no existe
    conn = get_db_connection()
    ensure_upsert_constraint(conn)
    conn.close()
    log.info("   Constraint de upsert verificado ✓")

    # Dividir en 10 lotes equitativos
    batch_size = max(1, len(product_pages) // NUM_WORKERS)
    batches = [
        product_pages[i : i + batch_size]
        for i in range(0, len(product_pages), batch_size)
    ]
    # Si sobran páginas por división entera, las añade al último lote
    while len(batches) > NUM_WORKERS:
        last = batches.pop()
        batches[-1].extend(last)

    log.info(f"   Lotes: {NUM_WORKERS} workers × ~{batch_size} páginas/worker")

    # ── FASE 2 & 3: Procesamiento paralelo + Inserción ────────────────────────
    log.info(f"\n🤖 FASE 2 — Lanzando {NUM_WORKERS} agentes worker en paralelo")
    t_start = time.time()
    all_results: list[WorkerResult] = []

    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor(max_workers=NUM_WORKERS) as executor:
        futures = {
            executor.submit(
                worker_agent,
                worker_id=idx + 1,
                page_batch=batch,
                pdf_path=CATALOG_PDF_PATH,
            ): idx + 1
            for idx, batch in enumerate(batches)
        }

        for future in as_completed(futures):
            wid = futures[future]
            try:
                result = future.result()
                all_results.append(result)
            except Exception as e:
                log.error(f"Worker {wid} falló con excepción: {e}")
                all_results.append(WorkerResult(worker_id=wid, errors=[str(e)]))

    total_time = time.time() - t_start

    # ── Resumen de inserción ──────────────────────────────────────────────────
    log.info("\n📊 RESUMEN DE INSERCIÓN")
    log.info("─" * 50)
    total_inserted = sum(r.products_inserted for r in all_results)
    total_updated  = sum(r.products_updated  for r in all_results)
    total_errors   = sum(len(r.errors)       for r in all_results)
    total_products = sum(r.products_processed for r in all_results)

    for r in sorted(all_results, key=lambda x: x.worker_id):
        status = "✓" if not r.errors else "⚠"
        log.info(
            f"  {status} Worker {r.worker_id:02d}: "
            f"{r.products_inserted:3d} INSERT + {r.products_updated:3d} UPDATE "
            f"| {len(r.errors)} err | {r.duration_seconds:.1f}s"
        )

    log.info("─" * 50)
    log.info(f"  TOTAL  : {total_products} productos procesados")
    log.info(f"  INSERT : {total_inserted}")
    log.info(f"  UPDATE : {total_updated}")
    log.info(f"  ERRORES: {total_errors}")
    log.info(f"  TIEMPO : {total_time:.1f}s ({total_time/60:.1f} min)")

    if total_errors > 0:
        log.warning(f"\n⚠  {total_errors} errores — revisa el log para detalles")

    # ── FASE 4: Sincronización Frontend ───────────────────────────────────────
    log.info("\n🔄 FASE 4 — Revalidando caché Next.js")
    revalidate_nextjs_cache()

    # Guardar reporte JSON
    report = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "catalog": str(CATALOG_PDF_PATH),
        "total_pages": total_pages,
        "total_products_processed": total_products,
        "total_inserted": total_inserted,
        "total_updated": total_updated,
        "total_errors": total_errors,
        "duration_seconds": round(total_time, 2),
        "workers": [asdict(r) for r in sorted(all_results, key=lambda x: x.worker_id)],
    }
    report_path = Path("catalog_import_report.json")
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False))

    log.info(f"\n✅ Importación completada — reporte guardado en {report_path}")
    log.info("═" * 70)

    return report


# ─── Modo batch: insertar desde JSON pre-extraído ─────────────────────────────
def insert_from_json(json_path: str):
    """
    Alternativa rápida: si ya tienes los productos extraídos en un JSON,
    los inserta directamente sin llamar a Vision API.
    Útil para re-importar o corregir datos sin re-procesar el PDF.
    """
    with open(json_path, encoding="utf-8") as f:
        products_data = json.load(f)

    conn = get_db_connection()
    ensure_upsert_constraint(conn)

    inserted = updated = errors = 0
    for d in products_data:
        try:
            p = Product(**d)
            action = upsert_product(conn, p)
            if action == "inserted":
                inserted += 1
            else:
                updated += 1
        except Exception as e:
            errors += 1
            log.error(f"Error insertando {d.get('name','?')}: {e}")

    conn.close()
    log.info(f"JSON import: {inserted} INSERT, {updated} UPDATE, {errors} errores")


# ─── Entry point ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "--from-json":
        insert_from_json(sys.argv[2])
    else:
        asyncio.run(orchestrate())
