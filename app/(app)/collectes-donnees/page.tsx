import { unstable_noStore as noStore } from "next/cache";
import { Topbar } from "@/components/layout/Topbar";
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
        <CollectesClient
          students={students.map((s) => ({
            ...s,
            profileType: s.profileType as "ETUDIANT_ELEVE" | "PROF" | "SURVEILLANT" | "PARENT",
          }))}
          campaigns={campaigns}
          totalCount={students.length}
        />
      </div>
    </>
  );
}
