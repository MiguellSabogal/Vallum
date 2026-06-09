import { NextResponse } from 'next/server';
import { verifyPassword, signToken } from '../../../../server/auth.js';
import { getUserByEmail } from '../../../../server/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const { email, password } = await request.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ error: 'Email y contraseña son obligatorios.' }, { status: 400 });
  }
  const user = await getUserByEmail(email);
  const ok = user && (await verifyPassword(password, user.passwordHash));
  if (!ok) {
    return NextResponse.json({ error: 'Credenciales inválidas.' }, { status: 401 });
  }
  return NextResponse.json({ token: signToken(user), user: { email: user.email, role: user.role } });
}
