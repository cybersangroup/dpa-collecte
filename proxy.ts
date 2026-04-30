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
  matcher: [
    "/connexion",
    "/tableau-de-bord/:path*",
    "/etudiants/:path*",
    "/tournees/:path*",
    "/utilisateurs/:path*",
    "/parametres/:path*",
  ],
};
