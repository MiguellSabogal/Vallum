// Pagos: proveedor (mock) + verificación de webhooks (PostgreSQL, async).
// Cambiar a Wompi/Mercado Pago = reemplazar createPayment y el mapeo del evento;
// processWebhook (firma, idempotencia, monto, restock) no cambia.
import crypto from 'node:crypto';
import { pool, ready } from './db.js';
import { PAYMENT_PROVIDER, PAYMENT_WEBHOOK_SECRET } from './env.js';

export function sign(rawString) {
  return crypto.createHmac('sha256', PAYMENT_WEBHOOK_SECRET).update(rawString).digest('hex');
}

function verifySignature(rawString, signature) {
  const expected = sign(rawString);
  if (!signature || signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// Inicia un pago para un pedido según el proveedor activo.
// - contraentrega: no hay pasarela; el pedido queda confirmado y se paga al recibir.
// - mock (pago online, para el futuro): devuelve la URL de nuestra pasarela simulada.
//   Cambiar a Wompi/Mercado Pago = reemplazar solo la rama mock.
export async function createPayment(order) {
  await ready();

  if (PAYMENT_PROVIDER === 'contraentrega') {
    const paymentId = `COD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    await pool.query(
      `UPDATE orders SET "paymentId" = $1, "paymentMethod" = 'contraentrega', "paymentStatus" = 'contraentrega' WHERE id = $2`,
      [paymentId, order.id]
    );
    return { paymentId, checkoutUrl: `/pago/${order.reference}` };
  }

  const paymentId = `MOCK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  await pool.query(`UPDATE orders SET "paymentId" = $1, "paymentStatus" = 'pendiente' WHERE id = $2`, [paymentId, order.id]);
  return { paymentId, checkoutUrl: `/pago/${order.reference}` };
}

// Único punto que cambia el estado de pago. Verifica firma → idempotencia → monto
// → transición (con restock compensatorio si se rechaza).
export async function processWebhook(rawString, signature) {
  if (!verifySignature(rawString, signature)) {
    throw { status: 401, error: 'Firma de webhook inválida.' };
  }

  let event;
  try { event = JSON.parse(rawString); } catch { throw { status: 400, error: 'Payload inválido.' }; }

  const { eventId, reference, paymentId, amount, outcome } = event;
  if (!eventId || !reference || !outcome) {
    throw { status: 400, error: 'Evento incompleto.' };
  }

  await ready();

  // Idempotencia: si ya procesamos este eventId, devolvemos el estado actual.
  const already = await pool.query('SELECT 1 FROM webhook_events WHERE "eventId" = $1', [eventId]);
  if (already.rowCount > 0) {
    const o = await pool.query('SELECT status, "paymentStatus" FROM orders WHERE reference = $1', [reference]);
    return { idempotent: true, status: o.rows[0]?.status, paymentStatus: o.rows[0]?.paymentStatus };
  }

  const oRes = await pool.query('SELECT * FROM orders WHERE reference = $1', [reference]);
  const order = oRes.rows[0];
  if (!order) throw { status: 404, error: 'Pedido no encontrado.' };

  if (Number(amount) !== order.total) {
    throw { status: 400, error: 'El monto del pago no coincide con el pedido.' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('INSERT INTO webhook_events ("eventId", type) VALUES ($1, $2)', [eventId, event.type || outcome]);

    if (outcome === 'aprobado' && order.paymentStatus !== 'aprobado') {
      await client.query(
        `UPDATE orders SET status = 'pagado', "paymentStatus" = 'aprobado', "paymentId" = $1, "paymentMethod" = $2 WHERE id = $3`,
        [paymentId || order.paymentId, event.method || 'tarjeta', order.id]
      );
    } else if (outcome === 'rechazado' && order.paymentStatus === 'pendiente') {
      // Compensación: cancela y DEVUELVE el stock reservado.
      const items = await client.query('SELECT "productId", qty FROM order_items WHERE "orderId" = $1', [order.id]);
      for (const it of items.rows) {
        if (it.productId != null) {
          await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [it.qty, it.productId]);
        }
      }
      await client.query(`UPDATE orders SET status = 'cancelado', "paymentStatus" = 'rechazado' WHERE id = $1`, [order.id]);
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  const upd = await pool.query('SELECT status, "paymentStatus" FROM orders WHERE id = $1', [order.id]);
  return upd.rows[0];
}
