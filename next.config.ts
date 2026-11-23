import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the project root so a stray lockfile in a parent folder can't change it.
  turbopack: { root: __dirname },
  experimental: {
    // Two root layouts ((site) + (admin)) need app/global-not-found.tsx for unmatched URLs.
    globalNotFound: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
