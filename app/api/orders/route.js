import { NextResponse } from 'next/server';
import db from '../../../server/db.js';
import { verifyBearer } from '../../../server/auth.js';
import { placeOrder } from '../../../server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Crear pedido (público)
export async function POST(request) {
  const { customer, items } = await request.json().catch(() => ({}));
  const required = ['name', 'email', 'phone', 'address', 'city'];
  for (const f of required) {
    if (!customer || !customer[f] || String(customer[f]).trim() === '') {
      return NextResponse.json({ error: `El campo "${f}" es obligatorio.` }, { status: 400 });
    }
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'El carrito está vacío.' }, { status: 400 });
  }
  try {
    return NextResponse.json(placeOrder(customer, items), { status: 201 });
  } catch (e) {
    if (e && e.status) return NextResponse.json({ error: e.error }, { status: e.status });
    console.error('[orders] error:', e);
    return NextResponse.json({ error: 'No se pudo crear el pedido.' }, { status: 500 });
  }
}

// Listar pedidos (admin)
export function GET(request) {
  if (!verifyBearer(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  return NextResponse.json(db.prepare('SELECT * FROM orders ORDER BY id DESC').all());
}
