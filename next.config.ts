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
  async redirects() {
    return [
      { source: "/etudiants", destination: "/collectes-donnees", permanent: true },
      { source: "/etudiants/:path*", destination: "/collectes-donnees/:path*", permanent: true },
    ];
  },
};

export default withPWA({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/offline",
  },
})(nextConfig);
