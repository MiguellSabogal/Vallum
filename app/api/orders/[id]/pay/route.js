import { NextResponse } from 'next/server';
import db from '../../../../../server/db.js';
import { createPayment } from '../../../../../server/payments.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function POST(request, { params }) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(params.id);
  if (!order) return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 });
  if (order.paymentStatus === 'aprobado') {
    return NextResponse.json({ error: 'El pedido ya está pagado.' }, { status: 409 });
  }
  const { paymentId, checkoutUrl } = createPayment(order);
  return NextResponse.json({ paymentId, checkoutUrl, provider: process.env.PAYMENT_PROVIDER || 'mock' });
}
