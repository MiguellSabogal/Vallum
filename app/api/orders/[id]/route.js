import { NextResponse } from 'next/server';
import db from '../../../../server/db.js';
import { verifyBearer } from '../../../../server/auth.js';
import { ORDER_STATUSES } from '../../../../server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Detalle de un pedido con sus líneas (admin)
export function GET(request, { params }) {
  if (!verifyBearer(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(params.id);
  if (!order) return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 });
  const items = db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(order.id);
  return NextResponse.json({ ...order, items });
}

// Cambiar el estado de un pedido (admin)
export async function PATCH(request, { params }) {
  if (!verifyBearer(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  const { status } = await request.json().catch(() => ({}));
  if (!ORDER_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 });
  }
  const info = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, params.id);
  if (info.changes === 0) return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 });
  return NextResponse.json(db.prepare('SELECT * FROM orders WHERE id = ?').get(params.id));
}
