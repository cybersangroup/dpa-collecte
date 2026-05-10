import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/db";
import { UtilisateursClient } from "./UtilisateursClient";

export const dynamic = "force-dynamic";

export default async function UtilisateursPage() {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id ?? "";

  const membres = await db.user.findMany({
    where: { id: { not: currentUserId } },
    include: {
      city: true,
      _count: { select: { studentsAdded: true } },
    },
    orderBy: { nomComplet: "asc" },
  });

  const actifs = membres.filter((m) => m.actif).length;

  return (
    <>
      <Topbar title="Utilisateurs" />

      <div className="flex-1 p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Équipe de collecte</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {membres.length} membre{membres.length !== 1 ? "s" : ""} · {actifs} actif
              {actifs !== 1 ? "s" : ""}
            </p>
          </div>

          <Link href="/utilisateurs/ajouter">
            <Button size="md">
              <IconPlus /> Ajouter un opérateur
            </Button>
          </Link>
        </div>

        <UtilisateursClient
          users={membres.map((m) => ({
            ...m,
            role: m.role as "ADMIN" | "OPERATEUR",
          }))}
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
