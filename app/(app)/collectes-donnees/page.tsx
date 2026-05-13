import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/db";
import { CollectesClient } from "./CollectesClient";

export const dynamic = "force-dynamic";

export default async function CollectesPage() {
  noStore();

  const [students, campaigns] = await Promise.all([
    db.student.findMany({
      include: {
        city: true,
        addedBy: { select: { nomComplet: true } },
        campaign: { select: { id: true, titre: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    db.campaign.findMany({
      select: { id: true, titre: true },
      orderBy: { startsAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <>
      <Topbar title="Collectes" />

      <div className="flex-1 p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Liste des données collectées
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {students.length} enregistrement(s)
            </p>
          </div>

          <Link href="/collectes-donnees/ajouter">
            <Button size="md">
              <IconPlus /> Ajouter
            </Button>
          </Link>
        </div>

        <CollectesClient
          students={students.map((s) => ({
            ...s,
            profileType: s.profileType as "ETUDIANT_ELEVE" | "PROF" | "SURVEILLANT" | "PARENT",
          }))}
          campaigns={campaigns}
        />
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
