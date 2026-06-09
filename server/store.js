// Capa de acceso a datos / lógica de negocio (compartida por los route handlers
// y los Server Components). Reutiliza la misma transacción atómica de pedidos.
import crypto from 'node:crypto';
import db from './db.js';

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
      isNew: body.isNew ? 1 : 0,
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

// Lecturas usadas también por los Server Components (SSR sin HTTP).
export function getAllProducts() {
  return db.prepare('SELECT * FROM products ORDER BY id').all().map(toClient);
}

// Transacción atómica: precios del servidor, validación de stock y descuento.
export const placeOrder = db.transaction((customer, items) => {
  let total = 0;
  const lines = [];

  for (const raw of items) {
    const productId = Number(raw.productId);
    const quality = raw.quality === 'AA' ? 'AA' : 'AAA';
    const qty = Math.floor(Number(raw.qty));
    if (!productId || !Number.isFinite(qty) || qty < 1) {
      throw { status: 400, error: 'Ítem de pedido inválido.' };
    }
    const p = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!p) throw { status: 404, error: `El producto #${productId} ya no existe.` };
    if (p.stock < qty) {
      throw { status: 409, error: `Sin stock suficiente de "${p.name}" (quedan ${p.stock}).` };
    }
    const unitPrice = quality === 'AA' ? p.priceAA : p.priceAAA;
    const lineTotal = unitPrice * qty;
    total += lineTotal;
    lines.push({ productId, productName: p.name, quality, unitPrice, qty, lineTotal });
  }

  const reference = generateReference();
  const orderId = db.prepare(`
    INSERT INTO orders (reference, customerName, customerEmail, customerPhone, address, city, notes, total)
    VALUES (@reference, @customerName, @customerEmail, @customerPhone, @address, @city, @notes, @total)
  `).run({
    reference,
    customerName: customer.name.trim(),
    customerEmail: customer.email.trim(),
    customerPhone: customer.phone.trim(),
    address: customer.address.trim(),
    city: customer.city.trim(),
    notes: (customer.notes || '').trim(),
    total,
  }).lastInsertRowid;

  const insItem = db.prepare(`
    INSERT INTO order_items (orderId, productId, productName, quality, unitPrice, qty, lineTotal)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const decStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
  for (const l of lines) {
    insItem.run(orderId, l.productId, l.productName, l.quality, l.unitPrice, l.qty, l.lineTotal);
    decStock.run(l.qty, l.productId);
  }

  return { id: orderId, reference, total, status: 'pendiente' };
});
