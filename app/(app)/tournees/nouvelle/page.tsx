import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/db";
import { createCampaign } from "../actions";

export const dynamic = "force-dynamic";

const erreurMessages: Record<string, string> = {
  champs: "Merci de remplir tous les champs obligatoires.",
  dates: "Les dates de début et de fin ne sont pas valides.",
  ordre: "La date de fin doit être postérieure à la date de début.",
  ville: "La ville sélectionnée est invalide ou inactive.",
  db: "Impossible d’enregistrer la tournée. Réessayez dans un instant.",
};

type PageProps = {
  searchParams?: Promise<{ erreur?: string }>;
};

export default async function NouvelleTourneePage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const erreurKey = typeof sp.erreur === "string" ? sp.erreur : undefined;
  const erreurText = erreurKey ? erreurMessages[erreurKey] ?? erreurMessages.db : null;

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
              {erreurText ? (
                <div
                  role="alert"
                  className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {erreurText}
                </div>
              ) : null}

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
                  {cities.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Aucune ville en base. Exécutez le seed Prisma ou ajoutez des villes.
                    </p>
                  ) : null}
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
