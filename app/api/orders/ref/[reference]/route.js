import { NextResponse } from 'next/server';
import { getOrderByRef } from '../../../../../server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Estado público de un pedido por referencia (página de pago)
export async function GET(request, { params }) {
  const o = await getOrderByRef(params.reference);
  if (!o) return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 });
  return NextResponse.json(o);
}
