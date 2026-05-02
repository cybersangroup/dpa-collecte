"use client";

import * as React from "react";
import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/cn";
import { createStudent, type StudentFormState } from "@/app/(app)/etudiants/actions";

/* URL de la chaîne WhatsApp DPA — à personnaliser */
const WHATSAPP_CHANNEL_URL = "https://whatsapp.com/channel/0029Vb8Bw8uDeON58ldFoB3h";

type ProfileType = "ETUDIANT_ELEVE" | "PROF" | "SURVEILLANT" | "PARENT";

const profiles: { value: ProfileType; label: string; icon: string }[] = [
  { value: "ETUDIANT_ELEVE", label: "Étudiant / Élève", icon: "🎓" },
  { value: "PROF",           label: "Professeur",        icon: "📚" },
  { value: "SURVEILLANT",    label: "Surveillant",        icon: "👁️" },
  { value: "PARENT",         label: "Parent",             icon: "👨‍👩‍👦" },
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
  const source = isQr ? "QR_AUTO" : ("OPERATEUR" as const);

  const boundAction = createStudent.bind(null, { cityId, campaignId, source });
  const [state, action, isPending] = useActionState(boundAction, initialState);

  /* État local du formulaire */
  const [profile, setProfile]       = useState<ProfileType>("ETUDIANT_ELEVE");
  const [countryIso, setCountryIso] = useState("SN");
  const [formKey, setFormKey]       = useState(0); // incrémenter pour vider les inputs HTML
  const [showWaPopup, setShowWaPopup] = useState(false);
  const [countdown, setCountdown]   = useState(5);

  const selectedCountry = countryPhoneOptions.find((c) => c.iso === countryIso) ?? countryPhoneOptions[0];
  const showNiveau       = profile === "ETUDIANT_ELEVE" || profile === "PROF";
  const showNombreEleves = profile === "SURVEILLANT"    || profile === "PARENT";
  const showEtablissement = profile !== "PARENT";

  /* ── Succès QR : réinitialiser le formulaire puis afficher le popup WA ── */
  useEffect(() => {
    if (state.status !== "success") return;

    if (isQr) {
      // Vider le formulaire
      setProfile("ETUDIANT_ELEVE");
      setCountryIso("SN");
      setFormKey((k) => k + 1);

      // Afficher le popup WhatsApp après 1 s
      const t = setTimeout(() => setShowWaPopup(true), 1000);
      return () => clearTimeout(t);
    } else {
      // Mode opérateur → redirection vers la liste
      const t = setTimeout(() => window.location.assign("/etudiants"), 1500);
      return () => clearTimeout(t);
    }
  }, [state.status, isQr]);

  /* ── Décompte dans le popup WA ── */
  useEffect(() => {
    if (!showWaPopup) { setCountdown(5); return; }
    if (countdown <= 0) {
      window.open(WHATSAPP_CHANNEL_URL, "_blank", "noopener,noreferrer");
      setShowWaPopup(false);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [showWaPopup, countdown]);

  return (
    <div className="space-y-5">
      {/* Popup WhatsApp */}
      {showWaPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border border-border shadow-xl max-w-sm w-full p-6 space-y-4 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">
              💬
            </div>
            <div>
              <h3 className="font-semibold text-lg">Merci pour votre inscription !</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Vous allez être redirigé vers la chaîne WhatsApp de Digital Profsan Academy.
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              Redirection automatique dans{" "}
              <span className="font-semibold text-foreground">{countdown}s</span>…
            </div>
            <div className="flex flex-col gap-2">
              <Button
                size="lg"
                className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white"
                onClick={() => {
                  window.open(WHATSAPP_CHANNEL_URL, "_blank", "noopener,noreferrer");
                  setShowWaPopup(false);
                }}
              >
                Accéder à la chaîne WhatsApp →
              </Button>
              <Button
                variant="ghost"
                size="md"
                className="w-full text-muted-foreground"
                onClick={() => setShowWaPopup(false)}
              >
                Rester sur cette page
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback succès (QR) */}
      {state.status === "success" && isQr && (
        <div role="status" className="rounded-lg border border-emerald-400/40 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Inscription enregistrée ! Le formulaire a été réinitialisé.
        </div>
      )}

      {/* Feedback succès (opérateur) */}
      {state.status === "success" && !isQr && (
        <div role="status" className="rounded-lg border border-emerald-400/40 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Enregistré avec succès ! Redirection…
        </div>
      )}

      {/* Feedback erreur */}
      {state.status === "error" && (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.message}
        </div>
      )}

      {/* Le formKey force le re-mount du formulaire pour vider les inputs natifs */}
      <form key={formKey} action={action} className="space-y-5">
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

        {/* Nom complet + Prénom */}
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField id="nom"    label="Nom complet" required disabled={isPending} />
          <FormField id="prenom" label="Prénom"               disabled={isPending} />
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
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Indicatif : {selectedCountry.flag} {selectedCountry.dialCode}
          </p>
        </div>

        {/* Adresse — pour tout le monde */}
        <FormField id="adresse" label="Adresse" disabled={isPending} />

        {/* Niveau scolaire — ETUDIANT_ELEVE et PROF */}
        {showNiveau && (
          <FormField
            id="niveauScolaire"
            label="Niveau scolaire"
            disabled={isPending}
            placeholder={profile === "PROF" ? "Licence, Master…" : "Tle S, 3ème, BTS…"}
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
            helper={
              profile === "PARENT"
                ? "Nombre d'enfants scolarisés."
                : "Nombre d'élèves sous votre responsabilité."
            }
          />
        )}

        {/* Établissement — masqué pour PARENT */}
        {showEtablissement && (
          <FormField
            id="etablissement"
            label="Établissement"
            disabled={isPending}
          />
        )}

        {/* Bloc "Ajouté par" — opérateur uniquement */}
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
            {isPending
              ? <><SpinnerIcon /> Enregistrement…</>
              : isQr ? "Je m'inscris" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ─── Helpers ─── */

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

const countryPhoneOptions = [
  { iso: "SN", flag: "🇸🇳", dialCode: "+221", label: "Senegal" },
  { iso: "DJ", flag: "🇩🇯", dialCode: "+253", label: "Djibouti" },
  { iso: "CI", flag: "🇨🇮", dialCode: "+225", label: "Cote d'Ivoire" },
  { iso: "GN", flag: "🇬🇳", dialCode: "+224", label: "Guinee" },
  { iso: "CM", flag: "🇨🇲", dialCode: "+237", label: "Cameroun" },
  { iso: "FR", flag: "🇫🇷", dialCode: "+33", label: "France" },
];
