"use client";

import * as React from "react";
import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/cn";
import { createStudent, type StudentFormState } from "@/app/(app)/etudiants/actions";
import { StudentSource } from "@prisma/client";

/* ─── Types de profil ─── */
type ProfileType = "ETUDIANT_ELEVE" | "PROF" | "SURVEILLANT" | "PARENT";

const profiles: { value: ProfileType; label: string; icon: string }[] = [
  { value: "ETUDIANT_ELEVE", label: "Étudiant / Élève", icon: "🎓" },
  { value: "PROF", label: "Professeur", icon: "📚" },
  { value: "SURVEILLANT", label: "Surveillant", icon: "👁️" },
  { value: "PARENT", label: "Parent", icon: "👨‍👩‍👦" },
];

type Mode = "operateur" | "qr";

type Props = {
  mode: Mode;
  cityId?: string;
  campaignId?: string;
};

const initialState: StudentFormState = { status: "idle" };

export function StudentForm({ mode, cityId, campaignId }: Props) {
  const isQr = mode === "qr";
  const source: StudentSource = isQr ? StudentSource.QR_AUTO : StudentSource.OPERATEUR;

  const boundAction = createStudent.bind(null, { cityId, campaignId, source });
  const [state, action, isPending] = useActionState(boundAction, initialState);

  const [profile, setProfile] = React.useState<ProfileType>("ETUDIANT_ELEVE");
  const [countryIso, setCountryIso] = React.useState("SN");
  const selectedCountry = countryPhoneOptions.find((c) => c.iso === countryIso) ?? countryPhoneOptions[0];

  const showNiveau = profile === "ETUDIANT_ELEVE" || profile === "PROF";
  const showNombreEleves = profile === "SURVEILLANT" || profile === "PARENT";
  const showEtablissement = profile !== "PARENT";

  useEffect(() => {
    if (state.status === "success") {
      const t = setTimeout(() => {
        if (isQr) {
          // Recharge la page QR pour réinitialiser le formulaire
          window.location.reload();
        } else {
          window.location.assign("/etudiants");
        }
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [state, isQr]);

  return (
    <div className="space-y-5">
      {/* Feedback */}
      {state.status === "error" && (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.message}
        </div>
      )}
      {state.status === "success" && (
        <div role="status" className="rounded-lg border border-emerald-400/40 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          {isQr ? "Inscription enregistrée ! Merci." : "Enregistré avec succès ! Redirection…"}
        </div>
      )}

      <form action={action} className="space-y-5">
        {/* Champ caché profileType */}
        <input type="hidden" name="profileType" value={profile} />

        {/* Sélecteur de profil */}
        <div className="space-y-2">
          <Label>Type de profil <span className="text-destructive">*</span></Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {profiles.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setProfile(p.value)}
                disabled={isPending}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-medium transition-colors",
                  profile === p.value
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "border-border bg-card hover:bg-secondary text-foreground",
                )}
              >
                <span className="text-lg">{p.icon}</span>
                <span className="text-xs leading-tight text-center">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Nom + Prénom */}
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField id="nom" label="Nom" required disabled={isPending} placeholder="Ndiaye" />
          <FormField id="prenom" label="Prénom" required disabled={isPending} placeholder="Mariam" />
        </div>

        {/* Genre + Âge */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="genre">Genre</Label>
            <select
              id="genre"
              name="genre"
              disabled={isPending}
              className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-primary disabled:opacity-50"
            >
              <option value="">— Sélectionner —</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          <FormField
            id="age"
            label="Âge"
            type="number"
            inputMode="numeric"
            min={5}
            max={120}
            disabled={isPending}
            placeholder="25"
          />
        </div>

        {/* Téléphone */}
        <div className="space-y-2">
          <Label htmlFor="telephone">Téléphone <span className="text-destructive">*</span></Label>
          <div className="flex gap-2">
            <select
              id="countryCode"
              name="countryCode"
              value={countryIso}
              disabled={isPending}
              onChange={(e) => setCountryIso(e.target.value)}
              className="w-[155px] h-11 shrink-0 rounded-lg border border-input bg-card px-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-primary disabled:opacity-50"
            >
              {countryPhoneOptions.map((c) => (
                <option key={c.iso} value={c.iso}>
                  {c.flag} {c.dialCode} · {c.label}
                </option>
              ))}
            </select>
            <Input
              id="telephone"
              name="telephone"
              type="tel"
              inputMode="tel"
              required
              disabled={isPending}
              placeholder="77 123 45 67"
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Indicatif : {selectedCountry.flag} {selectedCountry.dialCode}
          </p>
        </div>

        {/* Niveau scolaire — ETUDIANT_ELEVE et PROF */}
        {showNiveau && (
          <FormField
            id="niveauScolaire"
            label="Niveau scolaire"
            disabled={isPending}
            placeholder={profile === "PROF" ? "Ex. Licence, Master…" : "Ex. Tle S, 3ème, BTS…"}
            helper="Précisez la classe ou le niveau de diplôme."
          />
        )}

        {/* Nombre d'élèves — SURVEILLANT et PARENT */}
        {showNombreEleves && (
          <FormField
            id="nombreEleves"
            label="Nombre d'élèves"
            type="number"
            inputMode="numeric"
            min={0}
            disabled={isPending}
            placeholder="Ex. 35"
            helper={profile === "PARENT" ? "Nombre d'enfants scolarisés." : "Nombre d'élèves sous votre responsabilité."}
          />
        )}

        {/* Établissement — masqué pour PARENT */}
        {showEtablissement && (
          <FormField
            id="etablissement"
            label="Établissement"
            disabled={isPending}
            placeholder="Nom de l'école ou lycée"
          />
        )}

        {/* Bloc "Ajouté par" — mode opérateur uniquement */}
        {!isQr && (
          <div className="rounded-lg bg-secondary/60 border border-border px-4 py-3 flex items-center gap-3 text-sm">
            <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
              OP
            </div>
            <p className="text-muted-foreground text-xs">Ajouté par l'opérateur connecté · injecté automatiquement</p>
          </div>
        )}

        {/* Boutons */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <Button type="reset" variant="outline" size="lg" className="sm:flex-1" disabled={isPending}>
            Réinitialiser
          </Button>
          <Button type="submit" size="lg" className="sm:flex-[2]" disabled={isPending}>
            {isPending ? (
              <><SpinnerIcon /> Enregistrement…</>
            ) : isQr ? "Je m'inscris" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ─── Composants helpers ─── */

function FormField({
  id,
  label,
  required,
  helper,
  ...inputProps
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  required?: boolean;
  helper?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <Input id={id} name={id} required={required} {...inputProps} />
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
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

/* ─── Indicatifs téléphoniques ─── */

const countryPhoneOptions = [
  { iso: "SN", flag: "🇸🇳", dialCode: "+221", label: "Senegal" },
  { iso: "DJ", flag: "🇩🇯", dialCode: "+253", label: "Djibouti" },
  { iso: "CI", flag: "🇨🇮", dialCode: "+225", label: "Cote d'Ivoire" },
  { iso: "GN", flag: "🇬🇳", dialCode: "+224", label: "Guinee" },
  { iso: "CM", flag: "🇨🇲", dialCode: "+237", label: "Cameroun" },
  { iso: "FR", flag: "🇫🇷", dialCode: "+33", label: "France" },
];
