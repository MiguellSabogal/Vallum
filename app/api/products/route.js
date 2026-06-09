import { NextResponse } from 'next/server';
import db from '../../../server/db.js';
import { verifyBearer } from '../../../server/auth.js';
import { parseProductBody, toClient } from '../../../server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/products — lista pública
export function GET() {
  const rows = db.prepare('SELECT * FROM products ORDER BY id').all();
  return NextResponse.json(rows.map(toClient));
}

// POST /api/products — crear (protegido con JWT)
export async function POST(request) {
  if (!verifyBearer(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const { value, error } = parseProductBody(body);
  if (error) return NextResponse.json({ error }, { status: 400 });
  const info = db.prepare(`
    INSERT INTO products
      (house, name, inspiredBy, gender, isNew, priceAA, priceAAA, reviews, reviewCount, accentColor, notes, colorBg, colorText, imageUrl, stock)
    VALUES
      (@house, @name, @inspiredBy, @gender, @isNew, @priceAA, @priceAAA, @reviews, @reviewCount, @accentColor, @notes, @colorBg, @colorText, @imageUrl, @stock)
  `).run(value);
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
  return NextResponse.json(toClient(row), { status: 201 });
}
