import { NextResponse } from 'next/server';
import { verifyBearer } from '../../../../server/auth.js';
import { getProduct, updateProduct, deleteProduct, parseProductBody } from '../../../../server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const product = await getProduct(params.id);
  if (!product) return NextResponse.json({ error: 'Producto no encontrado.' }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(request, { params }) {
  if (!verifyBearer(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  const { value, error } = parseProductBody(await request.json().catch(() => ({})));
  if (error) return NextResponse.json({ error }, { status: 400 });
  const updated = await updateProduct(params.id, value);
  if (!updated) return NextResponse.json({ error: 'Producto no encontrado.' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(request, { params }) {
  if (!verifyBearer(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  const ok = await deleteProduct(params.id);
  if (!ok) return NextResponse.json({ error: 'Producto no encontrado.' }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
