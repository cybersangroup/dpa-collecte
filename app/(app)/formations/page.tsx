import { unstable_noStore as noStore } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Topbar } from "@/components/layout/Topbar";
import { db } from "@/lib/db";
import { FormationsClient } from "./FormationsClient";

export const dynamic = "force-dynamic";

export default async function FormationsPage() {
  noStore();
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  const formations = await db.formation.findMany({
    include: { _count: { select: { inscriptions: true } } },
    orderBy:  [{ categorie: "asc" }, { nom: "asc" }],
  });

  return (
    <>
      <Topbar title="Formations" />

      <div className="flex-1 p-4 sm:p-6 space-y-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Gestion des formations</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formations.length} formation(s) — adultes et enfants
            {!isAdmin && " · En lecture seule (opérateur)"}
          </p>
        </div>

        <FormationsClient
          formations={formations.map((f) => ({
            ...f,
            categorie: f.categorie as "ENFANT" | "ADULTE",
            devise: f.devise,
          }))}
          isAdmin={isAdmin}
        />
      </div>
    </>
  );
}
