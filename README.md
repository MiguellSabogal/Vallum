# VALLUM — Next.js (migración SEO)

Versión **Next.js (App Router)** del frontend de Vallum. Su objetivo es el **SEO**:
la landing se renderiza en el **servidor** (SSR), así Google recibe el HTML con los
productos y los `<meta>` ya dentro — a diferencia de la versión Vite (SPA), donde el
HTML inicial era un `<div>` vacío.

Hecho con el patrón *strangler fig*: se levantó al lado de la versión Vita y, al
consolidar la API dentro de Next, quedó **autosuficiente** (frontend + API + BD en
un solo proyecto). La versión Vite (`../vallum-react`) ya se puede retirar.

## Estado

✅ Landing pública con **SSR + metadata**
✅ Rutas por género (`/hombre`, `/mujer`, `/unisex`) y `/calidades`, cada una con su metadata
✅ Carrito, checkout y página de pago `/pago/[reference]`
✅ **Panel admin** (`/admin`) — productos y pedidos
✅ **API consolidada en Route Handlers** (`app/api/*`) — auth JWT, productos, pedidos y pagos
   con SQLite (better-sqlite3). Ya no hay servidor Express separado.

## Requisitos para correr

Necesita una base **PostgreSQL** (local o gestionada). Configura `DATABASE_URL`.

```bash
cd vallum-next
npm install
cp .env.example .env.local   # pon tus secretos y DATABASE_URL
npm run dev                  # http://localhost:3000  (web + API)
```

Al arrancar, el esquema se crea solo y se siembra con 8 productos y el admin
(idempotente). Datos (`pg`), no SQLite: persiste en serverless y aguanta concurrencia.

## Cómo se logra el SEO

- `app/page.jsx` y las rutas de categoría son **Server Components**: consultan la BD en
  el servidor y renderizan los productos dentro del HTML (marcados `dynamic` para reflejar
  cambios del admin). Cada categoría tiene su propio `<title>`/`description`.
- `app/layout.jsx` exporta `metadata` (Open Graph incluido) que Next inyecta en el `<head>`.
- Los componentes interactivos (carrito, tarjetas, 3D) llevan `'use client'`; Next igual
  los renderiza a HTML en el servidor y luego los **hidrata**. (Lo que dependa de
  `localStorage` se lee tras montar, no en el primer render, para no romper la hidratación.)

## API (Route Handlers)

`app/api/*` reutiliza `server/{db,auth,payments,store}.js`. Endpoints: `auth/login`,
`auth/me`, `products` (+`/[id]`), `orders` (+`/[id]`, `/[id]/pay`, `/ref/[reference]`),
`payments/webhook` y `payments/mock/[reference]`.

## Verificación rápida del SSR

```bash
curl -s http://localhost:3000/ | grep -o "<title>[^<]*</title>"
curl -s http://localhost:3000/ | grep -c "Inspirado en"   # > 0 ⇒ productos en el HTML
```
