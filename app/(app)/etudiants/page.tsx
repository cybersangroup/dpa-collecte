import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/db";
import { EtudiantsClient } from "./EtudiantsClient";

export const dynamic = "force-dynamic";

export default async function EtudiantsPage() {
  noStore();
  const students = await db.student.findMany({
    include: {
      city: true,
      addedBy: true,
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return (
    <>
      <Topbar title="Étudiants" />

      <div className="flex-1 p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Liste des étudiants collectés
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {students.length} personne(s) enregistrée(s)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="md">
              <IconDownload /> Exporter CSV
            </Button>
            <Link href="/etudiants/ajouter">
              <Button size="md">
                <IconPlus /> Ajouter
              </Button>
            </Link>
          </div>
        </div>

        <EtudiantsClient
          students={students.map((s) => ({
            ...s,
            profileType: s.profileType as "ETUDIANT_ELEVE" | "PROF" | "SURVEILLANT" | "PARENT",
          }))}
        />
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

function IconDownload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
