// Capa de acceso a datos (async, PostgreSQL). Centraliza todo el SQL; los route
// handlers y Server Components solo llaman a estas funciones.
import crypto from 'node:crypto';
import { pool, ready } from './db.js';
import { BALAS } from '../src/lib/balas.js';

export function toClient(row) {
  return { ...row, isNew: !!row.isNew };
}

export const ORDER_STATUSES = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'];

export function generateReference() {
  return `VL-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

// Validación/normalización del cuerpo de un producto (panel admin).
export function parseProductBody(body) {
  const required = ['house', 'name'];
  for (const f of required) {
    if (!body[f] || String(body[f]).trim() === '') {
      return { error: `El campo "${f}" es obligatorio.` };
    }
  }
  return {
    value: {
      house: String(body.house).trim(),
      name: String(body.name).trim(),
      inspiredBy: body.inspiredBy ? String(body.inspiredBy).trim() : '',
      gender: body.gender || 'unisex',
      isNew: !!body.isNew,
      priceAA: Number(body.priceAA) || 0,
      priceAAA: Number(body.priceAAA) || 0,
      reviews: Number(body.reviews) || 5,
      reviewCount: Number(body.reviewCount) || 0,
      accentColor: body.accentColor || '#D4AF37',
      notes: body.notes || '',
      colorBg: body.colorBg || '#1A1A1A',
      colorText: body.colorText || '#D4AF37',
      imageUrl: body.imageUrl || '',
      stock: Number.isFinite(Number(body.stock)) ? Math.max(0, Math.floor(Number(body.stock))) : 0,
    },
  };
}

const PRODUCT_COLS = '(house, name, "inspiredBy", gender, "isNew", "priceAA", "priceAAA", reviews, "reviewCount", "accentColor", notes, "colorBg", "colorText", "imageUrl", stock)';
function productValues(v) {
  return [v.house, v.name, v.inspiredBy, v.gender, v.isNew, v.priceAA, v.priceAAA, v.reviews, v.reviewCount, v.accentColor, v.notes, v.colorBg, v.colorText, v.imageUrl, v.stock];
}

// ── PRODUCTOS ─────────────────────────────────────────
export async function getAllProducts() {
  await ready();
  const { rows } = await pool.query('SELECT * FROM products ORDER BY id');
  return rows.map(toClient);
}

export async function getProduct(id) {
  await ready();
  const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  return rows[0] ? toClient(rows[0]) : null;
}

export async function createProduct(v) {
  await ready();
  const { rows } = await pool.query(
    `INSERT INTO products ${PRODUCT_COLS} VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
    productValues(v)
  );
  return toClient(rows[0]);
}

export async function updateProduct(id, v) {
  await ready();
  const { rows } = await pool.query(
    `UPDATE products SET
       house=$1, name=$2, "inspiredBy"=$3, gender=$4, "isNew"=$5, "priceAA"=$6, "priceAAA"=$7,
       reviews=$8, "reviewCount"=$9, "accentColor"=$10, notes=$11, "colorBg"=$12, "colorText"=$13, "imageUrl"=$14, stock=$15
     WHERE id=$16 RETURNING *`,
    [...productValues(v), id]
  );
  return rows[0] ? toClient(rows[0]) : null;
}

export async function deleteProduct(id) {
  await ready();
  const { rowCount } = await pool.query('DELETE FROM products WHERE id = $1', [id]);
  return rowCount > 0;
}

// ── USUARIOS ──────────────────────────────────────────
export async function getUserByEmail(email) {
  await ready();
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [String(email).toLowerCase()]);
  return rows[0] || null;
}

// ── PEDIDOS ───────────────────────────────────────────
// Transacción atómica: precios del servidor, FOR UPDATE para bloquear el stock
// (evita overselling concurrente), descuento e inserción. Rollback ante cualquier fallo.
export async function placeOrder(customer, items) {
  await ready();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let total = 0;
    const lines = [];

    for (const raw of items) {
      const qty = Math.floor(Number(raw.qty));
      if (!Number.isFinite(qty) || qty < 1) {
        throw { status: 400, error: 'Ítem de pedido inválido.' };
      }

      // Balas recargadas: catálogo fijo, precio del servidor, sin stock por producto.
      // Id simple ("bala-50") o ligado a una fragancia ("bala-50:123").
      const balaMatch = typeof raw.productId === 'string' && raw.productId.match(/^(bala-\d+)(?::(\d+))?$/);
      const bala = balaMatch ? BALAS[balaMatch[1]] : null;
      if (bala) {
        let productName = bala.name;
        if (balaMatch[2]) {
          const fr = await client.query('SELECT name, house FROM products WHERE id = $1', [Number(balaMatch[2])]);
          if (fr.rows[0]) productName = `${bala.name} · ${fr.rows[0].name} (${fr.rows[0].house})`;
        }
        const lineTotal = bala.price * qty;
        total += lineTotal;
        lines.push({ productId: null, productName, quality: bala.size, unitPrice: bala.price, qty, lineTotal });
        continue;
      }

      const productId = Number(raw.productId);
      const quality = raw.quality === 'AA' ? 'AA' : 'AAA';
      if (!productId) {
        throw { status: 400, error: 'Ítem de pedido inválido.' };
      }
      const { rows } = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [productId]);
      const p = rows[0];
      if (!p) throw { status: 404, error: `El producto #${productId} ya no existe.` };
      if (p.stock < qty) throw { status: 409, error: `Sin stock suficiente de "${p.name}" (quedan ${p.stock}).` };
      const unitPrice = quality === 'AA' ? p.priceAA : p.priceAAA;
      const lineTotal = unitPrice * qty;
      total += lineTotal;
      lines.push({ productId, productName: p.name, quality, unitPrice, qty, lineTotal });
    }

    const reference = generateReference();
    const ins = await client.query(
      `INSERT INTO orders (reference, "customerName", "customerEmail", "customerPhone", address, city, notes, total)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [reference, customer.name.trim(), customer.email.trim(), customer.phone.trim(), customer.address.trim(), customer.city.trim(), (customer.notes || '').trim(), total]
    );
    const orderId = ins.rows[0].id;

    for (const l of lines) {
      await client.query(
        `INSERT INTO order_items ("orderId", "productId", "productName", quality, "unitPrice", qty, "lineTotal")
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [orderId, l.productId, l.productName, l.quality, l.unitPrice, l.qty, l.lineTotal]
      );
      if (l.productId !== null) {
        await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [l.qty, l.productId]);
      }
    }

    await client.query('COMMIT');
    return { id: orderId, reference, total, status: 'pendiente' };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function listOrders() {
  await ready();
  const { rows } = await pool.query('SELECT * FROM orders ORDER BY id DESC');
  return rows;
}

export async function getOrderRow(id) {
  await ready();
  const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function getOrderWithItems(id) {
  await ready();
  const o = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
  if (!o.rows[0]) return null;
  const items = await pool.query('SELECT * FROM order_items WHERE "orderId" = $1 ORDER BY id', [id]);
  return { ...o.rows[0], items: items.rows };
}

export async function updateOrderStatus(id, status) {
  await ready();
  const { rows } = await pool.query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
  return rows[0] || null;
}

export async function getOrderByRef(reference) {
  await ready();
  const { rows } = await pool.query('SELECT reference, total, status, "paymentStatus", "paymentMethod" FROM orders WHERE reference = $1', [reference]);
  return rows[0] || null;
}

export async function getOrderRowByRef(reference) {
  await ready();
  const { rows } = await pool.query('SELECT * FROM orders WHERE reference = $1', [reference]);
  return rows[0] || null;
}
