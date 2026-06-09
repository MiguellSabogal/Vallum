/** @type {import('next').NextConfig} */
const nextConfig = {
  // pg trae dependencias opcionales nativas; lo marcamos externo para que Node lo
  // cargue tal cual en el servidor en vez de que webpack intente empaquetarlo.
  experimental: {
    serverComponentsExternalPackages: ['pg'],
  },
};

module.exports = nextConfig;
