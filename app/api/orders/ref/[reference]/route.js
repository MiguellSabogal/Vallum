import { NextResponse } from 'next/server';
import db from '../../../../../server/db.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Estado público de un pedido por referencia (página de pago)
export function GET(request, { params }) {
  const o = db
    .prepare('SELECT reference, total, status, paymentStatus FROM orders WHERE reference = ?')
    .get(params.reference);
  if (!o) return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 });
  return NextResponse.json(o);
}
