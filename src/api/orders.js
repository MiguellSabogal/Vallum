// Capa de acceso a pedidos.
import { BASE, handle, authHeaders } from './client.js';

// Crea un pedido (público). El cliente solo manda productId/quality/qty;
// el servidor recalcula precios y total.
export function createOrder({ customer, items }) {
  const payload = {
    customer,
    items: items.map((it) => ({ productId: it.id, quality: it.quality, qty: it.qty })),
  };
  return fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handle);
}

// Listar pedidos (admin)
export function getOrders(token) {
  return fetch(`${BASE}/orders`, { headers: authHeaders(token) }).then(handle);
}

// Detalle de un pedido con sus líneas (admin)
export function getOrder(id, token) {
  return fetch(`${BASE}/orders/${id}`, { headers: authHeaders(token) }).then(handle);
}

// Cambiar el estado de un pedido (admin)
export function updateOrderStatus(id, status, token) {
  return fetch(`${BASE}/orders/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  }).then(handle);
}

// ── PAGOS ──────────────────────────────────────────
// Inicia el pago de un pedido y devuelve la URL de la pasarela.
export function initiatePayment(orderId) {
  return fetch(`${BASE}/orders/${orderId}/pay`, { method: 'POST' }).then(handle);
}

// Estado público de un pedido por referencia (para la página de pago).
export function getOrderByRef(reference) {
  return fetch(`${BASE}/orders/ref/${reference}`).then(handle);
}

// Pasarela simulada (modo mock): aprueba o rechaza el pago.
export function mockPay(reference, outcome) {
  return fetch(`${BASE}/payments/mock/${reference}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ outcome }),
  }).then(handle);
}
