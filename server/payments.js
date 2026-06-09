// Pagos: proveedor (mock) + verificación de webhooks.
// El diseño está pensado para que cambiar a Wompi/Mercado Pago sea reemplazar
// `createPayment` y el mapeo del evento, manteniendo intacto `processWebhook`.
import crypto from 'node:crypto';
import db from './db.js';
import { PAYMENT_WEBHOOK_SECRET } from './env.js';

// Firma HMAC-SHA256 de un cuerpo crudo (string). El mismo algoritmo en ambos lados.
export function sign(rawString) {
  return crypto.createHmac('sha256', PAYMENT_WEBHOOK_SECRET).update(rawString).digest('hex');
}

// Comparación en tiempo constante para evitar fugas por temporización.
function verifySignature(rawString, signature) {
  const expected = sign(rawString);
  if (!signature || signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// Inicia un pago para un pedido. En mock, devuelve una URL a nuestra pasarela simulada.
export function createPayment(order) {
  const paymentId = `MOCK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  db.prepare("UPDATE orders SET paymentId = ?, paymentStatus = 'pendiente' WHERE id = ?")
    .run(paymentId, order.id);
  return { paymentId, checkoutUrl: `/pago/${order.reference}` };
}

// Procesa un evento de webhook. Es el ÚNICO sitio que cambia el estado de pago.
// Verifica firma → idempotencia → monto → transición de estado (con restock si se rechaza).
export function processWebhook(rawString, signature) {
  if (!verifySignature(rawString, signature)) {
    throw { status: 401, error: 'Firma de webhook inválida.' };
  }

  let event;
  try { event = JSON.parse(rawString); } catch { throw { status: 400, error: 'Payload inválido.' }; }

  const { eventId, reference, paymentId, amount, outcome } = event;
  if (!eventId || !reference || !outcome) {
    throw { status: 400, error: 'Evento incompleto.' };
  }

  // Idempotencia: si ya procesamos este eventId, devolvemos el estado actual sin repetir.
  const already = db.prepare('SELECT 1 FROM webhook_events WHERE eventId = ?').get(eventId);
  if (already) {
    const o = db.prepare('SELECT status, paymentStatus FROM orders WHERE reference = ?').get(reference);
    return { idempotent: true, status: o?.status, paymentStatus: o?.paymentStatus };
  }

  const order = db.prepare('SELECT * FROM orders WHERE reference = ?').get(reference);
  if (!order) throw { status: 404, error: 'Pedido no encontrado.' };

  // Verificación de monto: el importe pagado debe coincidir con el total del pedido.
  if (Number(amount) !== order.total) {
    throw { status: 400, error: 'El monto del pago no coincide con el pedido.' };
  }

  const apply = db.transaction(() => {
    db.prepare('INSERT INTO webhook_events (eventId, type) VALUES (?, ?)')
      .run(eventId, event.type || outcome);

    if (outcome === 'aprobado' && order.paymentStatus !== 'aprobado') {
      db.prepare("UPDATE orders SET status = 'pagado', paymentStatus = 'aprobado', paymentId = ?, paymentMethod = ? WHERE id = ?")
        .run(paymentId || order.paymentId, event.method || 'tarjeta', order.id);
    } else if (outcome === 'rechazado' && order.paymentStatus === 'pendiente') {
      // Compensación: cancela el pedido y DEVUELVE el stock reservado al crearlo.
      const items = db.prepare('SELECT productId, qty FROM order_items WHERE orderId = ?').all(order.id);
      const restock = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
      for (const it of items) {
        if (it.productId != null) restock.run(it.qty, it.productId);
      }
      db.prepare("UPDATE orders SET status = 'cancelado', paymentStatus = 'rechazado' WHERE id = ?")
        .run(order.id);
    }
  });
  apply();

  const updated = db.prepare('SELECT status, paymentStatus FROM orders WHERE id = ?').get(order.id);
  return updated;
}
