import { get } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  try {
    const pathname = params.pathname;
    if (!pathname) return NextResponse.json({ error: 'Path requerido' }, { status: 400 });

    // Intenta recuperar el blob por nombre directo
    const blob = await get(pathname);
    if (!blob) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    const buffer = await blob.arrayBuffer();
    return new NextResponse(buffer, {
      headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000' },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
