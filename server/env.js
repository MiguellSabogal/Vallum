// Centraliza/valida la configuración del backend.
// En Next, las variables de .env / .env.local se cargan automáticamente.

function required(name) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(
      `[config] Falta la variable de entorno "${name}". ` +
      `Copia .env.example a .env y rellénala.`
    );
  }
  return value;
}

export const PORT = process.env.PORT || 3001;
export const JWT_SECRET = required('JWT_SECRET');
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';
export const ADMIN_EMAIL = required('ADMIN_EMAIL');
export const ADMIN_PASSWORD = required('ADMIN_PASSWORD');

// Pagos: proveedor activo y secreto para firmar/verificar los webhooks.
export const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || 'mock';
export const PAYMENT_WEBHOOK_SECRET = required('PAYMENT_WEBHOOK_SECRET');
