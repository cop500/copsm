/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Commenté pour permettre les pages dynamiques
  // distDir: 'out',
  trailingSlash: true,
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // Forcer l'export de toutes les pages
  generateBuildId: () => 'build',
}

export default nextConfig