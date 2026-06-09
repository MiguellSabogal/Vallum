import { NextResponse } from 'next/server';
import db from '../../../../server/db.js';
import { verifyPassword, signToken } from '../../../../server/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const { email, password } = await request.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ error: 'Email y contraseña son obligatorios.' }, { status: 400 });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase());
  const ok = user && (await verifyPassword(password, user.passwordHash));
  if (!ok) {
    return NextResponse.json({ error: 'Credenciales inválidas.' }, { status: 401 });
  }
  return NextResponse.json({ token: signToken(user), user: { email: user.email, role: user.role } });
}
