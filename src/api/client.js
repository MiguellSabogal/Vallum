// Cliente HTTP compartido por toda la capa de API.
// En desarrollo, Vite redirige /api -> http://localhost:3001 (ver vite.config.js).
export const BASE = '/api';

// Parsea la respuesta y lanza un Error con el mensaje del backend si no es ok.
export async function handle(res) {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body && body.error) msg = body.error;
    } catch { /* respuesta sin JSON */ }
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}

// Cabeceras para peticiones autenticadas (escrituras del admin).
export function authHeaders(token) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}
