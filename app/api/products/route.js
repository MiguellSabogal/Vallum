import { NextResponse } from 'next/server';
import { verifyBearer } from '../../../server/auth.js';
import { getAllProducts, createProduct, parseProductBody } from '../../../server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/products — lista pública
export async function GET() {
  return NextResponse.json(await getAllProducts());
}

// POST /api/products — crear (protegido con JWT)
export async function POST(request) {
  if (!verifyBearer(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  const { value, error } = parseProductBody(await request.json().catch(() => ({})));
  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json(await createProduct(value), { status: 201 });
}
