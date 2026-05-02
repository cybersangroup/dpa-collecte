import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Route de diagnostic — accessible sans auth pour tester la connexion DB.
 * À supprimer une fois le problème résolu.
 *
 * GET /api/debug
 */
export async function GET() {
  const info: Record<string, unknown> = {
    ts: new Date().toISOString(),
    env: {
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
      DIRECT_URL_SET: !!process.env.DIRECT_URL,
      NEXTAUTH_SECRET_SET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? null,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? null,
      NODE_ENV: process.env.NODE_ENV,
    },
  };

  try {
    const [campaignCount, userCount, cityCount] = await Promise.all([
      db.campaign.count(),
      db.user.count(),
      db.city.count(),
    ]);
    info.db = { ok: true, campaignCount, userCount, cityCount };
  } catch (err) {
    info.db = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  return NextResponse.json(info, {
    headers: { "Cache-Control": "no-store" },
  });
}
