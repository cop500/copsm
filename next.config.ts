/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Commenté pour permettre les pages dynamiques
  // distDir: 'out',
  trailingSlash: true,
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
  // Forcer l'export de toutes les pages
  generateBuildId: () => 'build',
  // Configuration pour Netlify
  experimental: {
    useDeploymentId: true,
  },
}

export default nextConfig