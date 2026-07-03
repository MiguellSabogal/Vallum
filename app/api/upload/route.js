import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!file) return NextResponse.json({ error: 'Sin archivo.' }, { status: 400 });
    if (!file.name.endsWith('.webp')) return NextResponse.json({ error: 'Solo .webp' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const dir = join(process.cwd(), 'public', 'catalogo');
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });

    const fname = file.name;
    const path = join(dir, fname);
    await writeFile(path, Buffer.from(bytes));

    return NextResponse.json({ url: `/catalogo/${fname}` });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
