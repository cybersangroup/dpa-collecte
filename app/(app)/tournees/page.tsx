import Link from "next/link";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { getPublicAppUrl } from "@/lib/app-url";
import { db } from "@/lib/db";
import { TourneesClient } from "./TourneesClient";

export const dynamic = "force-dynamic";

export default async function TourneesPage() {
  const publicAppUrl = getPublicAppUrl();

  const tournees = await db.campaign.findMany({
    include: {
      city: true,
      _count: { select: { students: true } },
    },
    orderBy: { startsAt: "desc" },
    take: 100,
  });

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
              {tournees.length} tournée{tournees.length !== 1 ? "s" : ""} · QR codes uniques par terrain
            </p>
          </div>

          <Link href="/tournees/nouvelle">
            <Button size="md">
              <IconPlus /> Nouvelle tournée
            </Button>
          </Link>
        </div>

        {tournees.length === 0 ? (
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
        ) : (
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
