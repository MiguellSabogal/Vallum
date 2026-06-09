import { NextResponse } from 'next/server';
import { verifyBearer } from '../../../../server/auth.js';
import { getOrderWithItems, updateOrderStatus, ORDER_STATUSES } from '../../../../server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Detalle de un pedido con sus líneas (admin)
export async function GET(request, { params }) {
  if (!verifyBearer(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  const order = await getOrderWithItems(params.id);
  if (!order) return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 });
  return NextResponse.json(order);
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
  const updated = await updateOrderStatus(params.id, status);
  if (!updated) return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 });
  return NextResponse.json(updated);
}
