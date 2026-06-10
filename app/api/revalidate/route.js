/**
 * POST /api/revalidate
 * Revalida rutas del catálogo. Llamado por el orquestador al finalizar la importación.
 *
 * Body: { "path": "/hombre" }
 * Header: x-revalidate-secret: <NEXT_REVALIDATE_SECRET>
 */
import { revalidatePath } from 'next/cache';
import { NextResponse }   from 'next/server';

const SECRET = process.env.NEXT_REVALIDATE_SECRET || '';

export async function POST(request) {
  // Verificar el secret
  const secret = request.headers.get('x-revalidate-secret');
  if (SECRET && secret !== SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let path = '/';
  try {
    const body = await request.json();
    path = body.path || '/';
  } catch {
    // sin body → revalidar raíz
  }

  try {
    revalidatePath(path);
    return NextResponse.json({ revalidated: true, path, timestamp: Date.now() });
  } catch (err) {
    return NextResponse.json(
      { revalidated: false, error: err.message },
      { status: 500 }
    );
  }
}
