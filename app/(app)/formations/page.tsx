import { unstable_noStore as noStore } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Topbar } from "@/components/layout/Topbar";
import { getPublicAppUrl } from "@/lib/app-url";
import { db } from "@/lib/db";
import { FormationsClient } from "./FormationsClient";

export const dynamic = "force-dynamic";

export default async function FormationsPage() {
  noStore();
  const session  = await getServerSession(authOptions);
  const isAdmin  = session?.user?.role === "ADMIN";
  const appUrl   = getPublicAppUrl();

  const formations = await db.formation.findMany({
    include: {
      _count:  { select: { inscriptions: true } },
      shifts:  { orderBy: { createdAt: "asc" } },
    },
    orderBy: [{ categorie: "asc" }, { nom: "asc" }],
  });

  return (
    <>
      <Topbar title="Formations" />

      <div className="flex-1 p-4 sm:p-6">
        <FormationsClient
          formations={formations.map((f) => ({
            ...f,
            categorie: f.categorie as "ENFANT" | "ADULTE",
          }))}
          isAdmin={isAdmin}
          appUrl={appUrl}
        />
      </div>
    </>
  );
}
