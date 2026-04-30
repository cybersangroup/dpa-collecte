import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/db";

async function createCampaign(formData: FormData) {
  "use server";

  const titre = String(formData.get("titre") ?? "").trim();
  const cityId = String(formData.get("cityId") ?? "").trim();
  const startsAt = String(formData.get("startsAt") ?? "").trim();
  const endsAt = String(formData.get("endsAt") ?? "").trim();

  if (!titre || !cityId || !startsAt || !endsAt) return;

  const startsAtDate = new Date(startsAt);
  const endsAtDate = new Date(endsAt);

  if (Number.isNaN(startsAtDate.getTime()) || Number.isNaN(endsAtDate.getTime())) return;

  const qrToken = `camp_${randomBytes(8).toString("hex")}`;
  const defaultAdmin = await db.user.findFirst({
    where: { role: "ADMIN", actif: true },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  await db.campaign.create({
    data: {
      titre,
      cityId,
      startsAt: startsAtDate,
      endsAt: endsAtDate,
      qrToken,
      createdById: defaultAdmin?.id,
    },
  });

  redirect("/tournees");
}

export default async function NouvelleTourneePage() {
  const cities = await db.city.findMany({
    where: { actif: true },
    orderBy: { nom: "asc" },
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
              <form action={createCampaign} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="titre">Titre de campagne</Label>
                  <Input id="titre" name="titre" required placeholder="Ex. Journée orientation Dakar" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cityId">Ville</Label>
                  <select
                    id="cityId"
                    name="cityId"
                    required
                    className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-primary"
                  >
                    <option value="">Sélectionner une ville</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.code} · {city.nom} ({city.countryName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="startsAt">Début</Label>
                    <Input id="startsAt" name="startsAt" type="datetime-local" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endsAt">Fin</Label>
                    <Input id="endsAt" name="endsAt" type="datetime-local" required />
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit">Créer la tournée</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
