import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPrefixes = [
  "/tableau-de-bord",
  "/etudiants",
  "/tournees",
  "/utilisateurs",
  "/parametres",
];

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
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
  /*
   * Le matcher exclut explicitement :
   *  - les fichiers statiques (_next/static, _next/image, favicon, icons, images)
   *  - manifest.webmanifest  → doit être public pour le PWA
   *  - sw.js / workbox-*     → Service Worker généré par next-pwa
   *  - /api/auth/*           → endpoints NextAuth (login, session, csrf…)
   *  - /qr/*                 → formulaire public étudiant via QR code
   *  - /offline              → page fallback hors-ligne du PWA
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|icons/|logo\\.png|manifest\\.webmanifest|sw\\.js|workbox-.*\\.js|api/auth|qr/|offline).*)",
  ],
};
