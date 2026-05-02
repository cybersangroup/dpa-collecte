import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { loadDashboardData } from "@/lib/dashboard-data";
import { Topbar } from "@/components/layout/Topbar";
import { TableauDeBordClient } from "./TableauDeBordClient";

export const dynamic = "force-dynamic";

export default async function TableauDeBordPage() {
  const session = await getServerSession(authOptions);
  const data = await loadDashboardData(session?.user?.name ?? null);

  return (
    <>
      <Topbar title="Tableau de bord" />
      <TableauDeBordClient data={data} />
    </>
  );
}
