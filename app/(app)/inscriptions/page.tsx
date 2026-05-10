import { unstable_noStore as noStore } from "next/cache";
import { Topbar } from "@/components/layout/Topbar";
import { db } from "@/lib/db";
import { getPublicAppUrl } from "@/lib/app-url";
import { InscriptionsClient } from "./InscriptionsClient";

export const dynamic = "force-dynamic";

export default async function InscriptionsPage() {
  noStore();

  const appUrl = getPublicAppUrl();

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

      <div className="flex-1 p-4 sm:p-6">
        <InscriptionsClient
          appUrl={appUrl}
          totalCount={inscriptions.length}
          inscriptions={inscriptions.map((i) => ({
            ...i,
            statut: i.statut as "EN_ATTENTE" | "VALIDEE" | "REJETEE",
            type:   i.type   as "ADULTE" | "PARENT",
            formation: { ...i.formation, categorie: i.formation.categorie as string },
          }))}
        />
      </div>
    </>
  );
}
