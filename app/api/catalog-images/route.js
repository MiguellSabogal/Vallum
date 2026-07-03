import { readdirSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const dir = join(process.cwd(), 'public', 'catalogo');
    const files = readdirSync(dir)
      .filter(f => f.endsWith('.webp'))
      .sort();

    return NextResponse.json({ images: files });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
