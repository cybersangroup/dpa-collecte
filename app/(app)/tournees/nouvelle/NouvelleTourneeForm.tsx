"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createCampaign, type CampaignFormState } from "../actions";

type City = { id: string; code: string; nom: string; countryName: string };

const initialState: CampaignFormState = { status: "idle" };

function todayLocalMin() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function NouvelleTourneeForm({ cities }: { cities: City[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, isPending] = useActionState(createCampaign, initialState);

  // Préserver les valeurs saisies en cas d'erreur
  const [titre, setTitre] = useState("");
  const [cityId, setCityId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const todayMin = todayLocalMin();

  useEffect(() => {
    if (state.status === "success") {
      const t = setTimeout(() => {
        window.location.assign("/tournees");
      }, 1200);
      return () => clearTimeout(t);
    }
    // En cas d'erreur on NE vide PAS le formulaire — les valeurs restent dans le state local
  }, [state]);

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
          className="mb-4 rounded-lg border border-emerald-400/40 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2"
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          Tournée créée ! Redirection vers la liste…
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
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cityId">Ville</Label>
          <select
            id="cityId"
            name="cityId"
            required
            disabled={isPending}
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
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
              min={todayMin}
              value={startsAt}
              onChange={(e) => {
                setStartsAt(e.target.value);
                // Si la fin est antérieure au nouveau début, on la réinitialise
                if (endsAt && e.target.value && endsAt <= e.target.value) {
                  setEndsAt("");
                }
              }}
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
              min={startsAt || todayMin}
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
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
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
