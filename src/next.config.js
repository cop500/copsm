/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: [
      'localhost',
      // Ajoutez votre domaine Supabase ici plus tard
    ],
  },
}

module.exports = nextConfig