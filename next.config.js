/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3 es un módulo nativo: hay que dejar que Node lo cargue tal cual
  // en el servidor en vez de que webpack intente empaquetarlo.
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
};

module.exports = nextConfig;
