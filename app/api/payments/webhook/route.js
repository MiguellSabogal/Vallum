import { NextResponse } from 'next/server';
import { processWebhook } from '../../../../server/payments.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Webhook real de la pasarela. La firma se verifica sobre el cuerpo CRUDO.
export async function POST(request) {
  const raw = await request.text();
  const signature = request.headers.get('x-webhook-signature') || '';
  try {
    return NextResponse.json(processWebhook(raw, signature));
  } catch (e) {
    if (e && e.status) return NextResponse.json({ error: e.error }, { status: e.status });
    console.error('[webhook] error:', e);
    return NextResponse.json({ error: 'Error procesando webhook.' }, { status: 500 });
  }
}
