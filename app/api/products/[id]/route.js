import { NextResponse } from 'next/server';
import db from '../../../../server/db.js';
import { verifyBearer } from '../../../../server/auth.js';
import { parseProductBody, toClient } from '../../../../server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(request, { params }) {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(params.id);
  if (!row) return NextResponse.json({ error: 'Producto no encontrado.' }, { status: 404 });
  return NextResponse.json(toClient(row));
}

export async function PUT(request, { params }) {
  if (!verifyBearer(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(params.id);
  if (!existing) return NextResponse.json({ error: 'Producto no encontrado.' }, { status: 404 });
  const { value, error } = parseProductBody(await request.json().catch(() => ({})));
  if (error) return NextResponse.json({ error }, { status: 400 });
  db.prepare(`
    UPDATE products SET
      house=@house, name=@name, inspiredBy=@inspiredBy, gender=@gender, isNew=@isNew,
      priceAA=@priceAA, priceAAA=@priceAAA, reviews=@reviews, reviewCount=@reviewCount,
      accentColor=@accentColor, notes=@notes, colorBg=@colorBg, colorText=@colorText, imageUrl=@imageUrl, stock=@stock
    WHERE id=@id
  `).run({ ...value, id: Number(params.id) });
  return NextResponse.json(toClient(db.prepare('SELECT * FROM products WHERE id = ?').get(params.id)));
}

export function DELETE(request, { params }) {
  if (!verifyBearer(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  const info = db.prepare('DELETE FROM products WHERE id = ?').run(params.id);
  if (info.changes === 0) return NextResponse.json({ error: 'Producto no encontrado.' }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
