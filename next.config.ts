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
      {
        source: '/inscription-ateliers/ecran',
        destination: '/ecran-inscription-ateliers.html',
        permanent: false,
      },
      {
        source: '/assistance-stagiaires/demande/ecran',
        destination: '/ecran-assistance-stagiaires.html',
        permanent: false,
      },
      {
        source: '/registre-visiteurs/public/ecran',
        destination: '/ecran-registre-visiteurs.html',
        permanent: false,
      },
      {
        source: '/enquete-insertion/public/ecran',
        destination: '/ecran-enquete-insertion.html',
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