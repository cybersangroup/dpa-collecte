import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/** Routes nécessitant une session active */
const protectedPrefixes = [
  "/tableau-de-bord",
  "/etudiants",
  "/tournees",
  "/utilisateurs",
  "/parametres",
];

/**
 * Ressources publiques qui ne doivent JAMAIS être bloquées,
 * même si le matcher les capture par accident.
 */
const publicPaths = [
  "/manifest.webmanifest",
  "/offline",
  "/sw.js",
  "/connexion",
];

function isPublicPath(pathname: string) {
  if (publicPaths.includes(pathname)) return true;
  if (pathname.startsWith("/icons/")) return true;
  if (pathname.startsWith("/api/auth/")) return true;
  if (pathname.startsWith("/api/debug")) return true;
  if (pathname.startsWith("/qr/")) return true;
  if (pathname.startsWith("/workbox-")) return true;
  if (pathname.startsWith("/_next/")) return true;
  return false;
}

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Laisse passer toutes les ressources publiques sans vérification de token
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const isProtectedRoute = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtectedRoute && !token) {
    const callbackUrl = `${pathname}${search}`;
    const signInUrl = new URL("/connexion", req.url);
    signInUrl.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Applique le proxy sur toutes les routes sauf les fichiers statiques Next.js
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
