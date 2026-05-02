import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { db } from "@/lib/db";
import { NouvelleTourneeForm } from "./NouvelleTourneeForm";

export const dynamic = "force-dynamic";

export default async function NouvelleTourneePage() {
  const cities = await db.city.findMany({
    where: { actif: true },
    orderBy: { nom: "asc" },
    select: { id: true, code: true, nom: true, countryName: true },
  });

  return (
    <>
      <Topbar title="Nouvelle tournée" />
      <div className="flex-1 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Créer une nouvelle tournée</CardTitle>
              <CardDescription>
                Cette tournée générera un QR unique pour l&apos;inscription des étudiants.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NouvelleTourneeForm cities={cities} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
