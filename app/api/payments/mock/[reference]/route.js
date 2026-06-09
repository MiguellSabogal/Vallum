import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getOrderRowByRef } from '../../../../../server/store.js';
import { processWebhook, sign } from '../../../../../server/payments.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Pasarela simulada (modo mock): construye un evento firmado y lo procesa por el
// mismo camino que un webhook real (firma + idempotencia + monto).
export async function POST(request, { params }) {
  if ((process.env.PAYMENT_PROVIDER || 'mock') !== 'mock') {
    return NextResponse.json({ error: 'No disponible.' }, { status: 404 });
  }
  const body = await request.json().catch(() => ({}));
  const outcome = body.outcome === 'rechazado' ? 'rechazado' : 'aprobado';
  const order = await getOrderRowByRef(params.reference);
  if (!order) return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 });

  const event = {
    eventId: `evt_${crypto.randomBytes(6).toString('hex')}`,
    type: `payment.${outcome}`,
    reference: order.reference,
    paymentId: order.paymentId,
    amount: order.total,
    method: 'tarjeta',
    outcome,
  };
  const raw = JSON.stringify(event);
  try {
    return NextResponse.json(await processWebhook(raw, sign(raw)));
  } catch (e) {
    if (e && e.status) return NextResponse.json({ error: e.error }, { status: e.status });
    return NextResponse.json({ error: 'Error simulando el pago.' }, { status: 500 });
  }
}
