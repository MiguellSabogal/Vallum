import { list, head } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  try {
    const pathname = params.pathname;
    if (!pathname || typeof pathname !== 'string') {
      return NextResponse.json({ error: 'Path requerido' }, { status: 400 });
    }

    const blobs = await list({ prefix: pathname, limit: 1 });
    if (!blobs.blobs.length) {
      return NextResponse.json({ error: 'Blob no encontrado' }, { status: 404 });
    }

    const blob = blobs.blobs[0];
    const res = await fetch(blob.url);
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000' },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
