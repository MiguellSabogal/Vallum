// Lógica de autenticación: hashing de contraseñas, JWT y middleware de protección.
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from './env.js';

// Verifica el JWT de una cabecera "Authorization: Bearer <token>".
// Devuelve el usuario decodificado o null (uso en route handlers de Next).
export function verifyBearer(authHeader) {
  const header = authHeader || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Compara una contraseña en texto plano contra el hash guardado (sin revelar el hash).
export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// Genera un hash bcrypt (para crear/actualizar usuarios).
export function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

// Firma un JWT con los datos mínimos del usuario (nunca metas la contraseña aquí).
export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Middleware: exige un JWT válido en `Authorization: Bearer <token>`.
// Si es válido, adjunta el usuario decodificado a req.user y continúa.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    return res.status(401).json({ error: 'No autorizado.' });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (err) {
    // Token manipulado, mal firmado o caducado
    const expired = err.name === 'TokenExpiredError';
    return res.status(401).json({ error: expired ? 'Sesión expirada.' : 'No autorizado.' });
  }
}

// Middleware opcional: exige además un rol concreto (admin, editor…).
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Permiso insuficiente.' });
    }
    next();
  };
}
