import type { NextConfig } from "next";
import posts from "./supabase/seed/posts.json";
import oldSite from "./supabase/seed/old-site-content.json";
import { legacyRedirects } from "./src/lib/seo/legacy-redirects";

const nextConfig: NextConfig = {
  // Pin the project root so a stray lockfile in a parent folder can't change it.
  turbopack: { root: __dirname },
  // "use cache" + cacheTag for public CMS reads (docs/ARCHITECTURE.md §9). Request-time
  // reads (cookies, params, searchParams) must sit inside <Suspense>.
  cacheComponents: true,
  partialPrefetching: true,
  // Phones on the local network can open `next dev` (e.g. http://192.168.1.34:3000).
  allowedDevOrigins: ["192.168.1.34"],
  experimental: {
    // Two root layouts ((site) + (admin)) need app/global-not-found.tsx for unmatched URLs.
    globalNotFound: true,
  },
  async redirects() {
    return [
      // Old GoDaddy URLs (docs/ARCHITECTURE.md §9): devotionals (/dailylightdevotional/f/:slug,
      // with exact rules for the 8 slugs that changed) and pages (/contact-us → /contact,
      // /partner-with-us → /give, /dailylightdevotional → /devotionals, …).
      ...legacyRedirects(posts, oldSite.redirects),
      // The devotionals briefly lived at /blog on the new site.
      { source: "/blog", destination: "/devotionals", permanent: true },
      { source: "/blog/:slug", destination: "/devotionals/:slug", permanent: true },
    ];
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
