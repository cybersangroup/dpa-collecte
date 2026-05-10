import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/db";
import { InscriptionsClient } from "./InscriptionsClient";

export const dynamic = "force-dynamic";

export default async function InscriptionsPage() {
  noStore();

  const inscriptions = await db.inscription.findMany({
    include: {
      formation: { select: { nom: true, categorie: true, prix: true, devise: true } },
      enfants:   { select: { nom: true } },
      addedBy:   { select: { nomComplet: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <Topbar title="Inscriptions formations" />

      <div className="flex-1 p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Inscriptions aux formations</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {inscriptions.length} inscription(s) enregistrée(s)
            </p>
          </div>
          <Link href="/inscriptions/ajouter">
            <Button size="md">
              <IconPlus /> Ajouter
            </Button>
          </Link>
        </div>

        <InscriptionsClient
          inscriptions={inscriptions.map((i) => ({
            ...i,
            statut: i.statut as "EN_ATTENTE" | "VALIDEE" | "REJETEE",
            type:   i.type   as "ADULTE" | "PARENT",
            formation: { ...i.formation, categorie: i.formation.categorie as string },
          }))}
        />

        <div className="text-xs text-muted-foreground text-center pt-2">
          Formulaire public :{" "}
          <Link href="/inscription" target="_blank" className="text-primary underline underline-offset-2">/inscription</Link>
        </div>
      </div>
    </>
  );
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
