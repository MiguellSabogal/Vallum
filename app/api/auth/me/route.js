import { NextResponse } from 'next/server';
import { verifyBearer } from '../../../../server/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(request) {
  const user = verifyBearer(request.headers.get('authorization'));
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  return NextResponse.json({ user: { email: user.email, role: user.role } });
}
