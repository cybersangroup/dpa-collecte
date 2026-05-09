import { Topbar } from "@/components/layout/Topbar";
import { InscriptionForm } from "@/components/forms/InscriptionForm";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AjouterInscriptionPage() {
  const formations = await db.formation.findMany({
    where: { actif: true },
    select: { id: true, nom: true, categorie: true, duree: true, prix: true, devise: true },
    orderBy: [{ categorie: "asc" }, { nom: "asc" }],
  });

  return (
    <>
      <Topbar title="Nouvelle inscription" />

      <div className="flex-1 p-4 sm:p-6">
        <div className="max-w-xl mx-auto w-full space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Nouvelle inscription</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Enregistrez une inscription à une formation d'été.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm">
            <InscriptionForm
              formations={formations.map((f) => ({
                ...f,
                categorie: f.categorie as "ENFANT" | "ADULTE",
              }))}
              mode="operator"
            />
          </div>
        </div>
      </div>
    </>
  );
}
