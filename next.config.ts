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
  // Force le nouveau SW à prendre le contrôle immédiatement sans attendre
  // que tous les onglets de l'ancienne version soient fermés.
  skipWaiting: true,
  fallbacks: {
    document: "/offline",
  },
})(nextConfig);
