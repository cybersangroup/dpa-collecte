import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

function extractHostFromUrl(value: string | undefined) {
  if (!value) return undefined;
  try {
    return new URL(value).hostname;
  } catch {
    return undefined;
  }
}

const allowedDevOrigins = Array.from(
  new Set(
    [
      "localhost",
      "127.0.0.1",
      extractHostFromUrl(process.env.NEXTAUTH_URL),
      extractHostFromUrl(process.env.NEXT_PUBLIC_APP_URL),
    ].filter((v): v is string => Boolean(v)),
  ),
);

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins,
};

export default withPWA({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    /*
     * NetworkOnly pour toutes les requêtes de navigation (mode: "navigate").
     * Cela empêche le Service Worker d'intercepter les pages protégées par
     * auth et d'obtenir un 401 faute de cookies de session.
     * Le navigateur gère directement la requête avec ses propres cookies.
     */
    runtimeCaching: [
      {
        urlPattern: ({ request }: { request: Request }) =>
          request.mode === "navigate",
        handler: "NetworkOnly" as const,
      },
      {
        // Ressources statiques Next.js : mise en cache agressive
        urlPattern: /^\/_next\/static\/.*/i,
        handler: "CacheFirst" as const,
        options: {
          cacheName: "next-static",
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        // Images et autres ressources publiques
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/i,
        handler: "StaleWhileRevalidate" as const,
        options: {
          cacheName: "assets",
          expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
    ],
  },
})(nextConfig);
