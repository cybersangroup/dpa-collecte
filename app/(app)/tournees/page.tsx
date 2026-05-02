import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { getPublicAppUrl } from "@/lib/app-url";
import { db } from "@/lib/db";
import { TourneesClient } from "./TourneesClient";

export const dynamic = "force-dynamic";

export default async function TourneesPage() {
  // Double opt-out de tout cache Vercel
  noStore();

  const publicAppUrl = getPublicAppUrl();

  let tournees: Awaited<ReturnType<typeof db.campaign.findMany<{
    include: { city: true; _count: { select: { students: true } } };
    orderBy: { startsAt: "desc" };
  }>>> = [];
  let dbError: string | null = null;

  try {
    tournees = await db.campaign.findMany({
      include: {
        city: true,
        _count: { select: { students: true } },
      },
      orderBy: { startsAt: "desc" },
      take: 100,
    });
  } catch (err) {
    console.error("[TourneesPage] DB error:", err);
    dbError = err instanceof Error ? err.message : String(err);
  }

  return (
    <>
      <Topbar title="Tournées & QR codes" />

      <div className="flex-1 p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Tournées de collecte
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {dbError
                ? "Erreur de chargement"
                : `${tournees.length} tournée${tournees.length !== 1 ? "s" : ""} · QR codes uniques par terrain`}
            </p>
          </div>

          <Link href="/tournees/nouvelle">
            <Button size="md">
              <IconPlus /> Nouvelle tournée
            </Button>
          </Link>
        </div>

        {/* Bloc d'erreur visible pour diagnostic */}
        {dbError && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-5 text-sm space-y-2">
            <p className="font-semibold text-destructive">Impossible de charger les tournées</p>
            <p className="text-muted-foreground font-mono break-all">{dbError}</p>
            <p className="text-xs text-muted-foreground">
              Vérifiez les variables <code>DATABASE_URL</code> et <code>DIRECT_URL</code> dans les paramètres Vercel.
            </p>
          </div>
        )}

        {!dbError && tournees.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">
              Aucune tournée pour l&apos;instant.
            </p>
            <Link href="/tournees/nouvelle" className="inline-block mt-4">
              <Button size="sm">
                <IconPlus /> Créer la première tournée
              </Button>
            </Link>
          </div>
        )}

        {!dbError && tournees.length > 0 && (
          <TourneesClient tournees={tournees} publicAppUrl={publicAppUrl} />
        )}
      </div>
    </>
  );
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
