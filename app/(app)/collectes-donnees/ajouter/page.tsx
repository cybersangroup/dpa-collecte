import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Topbar } from "@/components/layout/Topbar";
import { StudentForm } from "@/components/forms/StudentForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function AjouterCollectePage() {
  const session = await getServerSession(authOptions);
  let cityId: string | undefined;

  if (session?.user?.id) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { cityId: true },
    });
    cityId = user?.cityId ?? undefined;
  }

  return (
    <>
      <Topbar title="Ajouter une personne" />

      <div className="flex-1 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto w-full">
          <Card>
            <CardHeader>
              <CardTitle>Nouvelle fiche</CardTitle>
              <CardDescription>
                Sélectionnez le type de profil puis remplissez les champs pour enregistrer la personne lors de la tournée.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StudentForm mode="operateur" cityId={cityId} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
