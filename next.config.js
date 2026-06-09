/** @type {import('next').NextConfig} */
const API_ORIGIN = process.env.API_ORIGIN || 'http://localhost:3001';

const nextConfig = {
  // Reenvía las llamadas /api/* del navegador al backend Express existente
  // (mismo patrón que el proxy de Vite). El SSR usa API_ORIGIN directamente.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_ORIGIN}/api/:path*` }];
  },
};

module.exports = nextConfig;
