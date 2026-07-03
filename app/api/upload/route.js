import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!file) return NextResponse.json({ error: 'Sin archivo.' }, { status: 400 });
    if (!file.name.endsWith('.webp')) return NextResponse.json({ error: 'Solo .webp' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const blob = await put(file.name, Buffer.from(bytes), { access: 'private', contentType: 'image/webp' });

    return NextResponse.json({ url: blob.url });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
