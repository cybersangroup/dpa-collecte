"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createCampaign, type CampaignFormState } from "../actions";

type City = { id: string; code: string; nom: string; countryName: string };

const initialState: CampaignFormState = { status: "idle" };

export function NouvelleTourneeForm({ cities }: { cities: City[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, isPending] = useActionState(createCampaign, initialState);

  useEffect(() => {
    if (state.status === "success") {
      router.push("/tournees");
      router.refresh();
    }
  }, [state, router]);

  return (
    <>
      {state.status === "error" && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {state.message}
        </div>
      )}

      {state.status === "success" && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-emerald-400/40 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          Tournée créée avec succès ! Redirection…
        </div>
      )}

      <form ref={formRef} action={action} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="titre">Titre de campagne</Label>
          <Input
            id="titre"
            name="titre"
            required
            disabled={isPending}
            placeholder="Ex. Journée orientation Dakar"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cityId">Ville</Label>
          <select
            id="cityId"
            name="cityId"
            required
            disabled={isPending}
            className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-primary disabled:opacity-50"
          >
            <option value="">Sélectionner une ville</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.code} · {city.nom} ({city.countryName})
              </option>
            ))}
          </select>
          {cities.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Aucune ville en base. Exécutez le seed Prisma ou ajoutez des villes.
            </p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="startsAt">Début</Label>
            <Input
              id="startsAt"
              name="startsAt"
              type="datetime-local"
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endsAt">Fin</Label>
            <Input
              id="endsAt"
              name="endsAt"
              type="datetime-local"
              required
              disabled={isPending}
            />
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <SpinnerIcon />
                Création…
              </>
            ) : (
              "Créer la tournée"
            )}
          </Button>
        </div>
      </form>
    </>
  );
}

function SpinnerIcon() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
