/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Commenté pour permettre les pages dynamiques
  // distDir: 'out',
  trailingSlash: true,
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
  async redirects() {
    return [
      {
        source: '/candidatures',
        destination: '/candidature',
        permanent: true,
      },
      {
        source: '/candidatures/:path*',
        destination: '/candidature/:path*',
        permanent: true,
      },
      {
        source: '/candidature/ecran',
        destination: '/ecran-candidatures.html',
        permanent: false,
      },
    ]
  },
  // Forcer l'export de toutes les pages
  generateBuildId: () => 'build',
  // Configuration pour Netlify - optimiser la taille du build
  experimental: {
    useDeploymentId: true,
  },
  // Optimiser la taille du build
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

export default nextConfig