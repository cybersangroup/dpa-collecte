 "use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/cn";

const niveaux = [
  "Licence 1",
  "Licence 2",
  "Licence 3",
  "Master 1",
  "Master 2",
  "Doctorat",
  "Autre",
];

type Mode = "operateur" | "qr";

export function StudentForm({ mode }: { mode: Mode }) {
  const isQr = mode === "qr";
  const [selectedCountry, setSelectedCountry] = React.useState(countryPhoneOptions[0]);

  return (
    <form className="space-y-5">
      <FormField
        id="nom"
        label="Nom complet"
        required
        placeholder="Mariam Ndiaye"
      />

      <FormField
        id="adresse"
        label="Adresse"
        required
        placeholder="Quartier, ville"
      />

      <div className="space-y-2">
        <Label htmlFor="telephone">
          Téléphone <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-2">
          <div className="w-[150px]">
            <label className="sr-only" htmlFor="countryCode">
              Indicatif pays
            </label>
            <select
              id="countryCode"
              name="countryCode"
              value={selectedCountry.iso}
              onChange={(e) => {
                const found = countryPhoneOptions.find((c) => c.iso === e.target.value);
                if (found) {
                  setSelectedCountry(found);
                }
              }}
              className="h-11 w-full rounded-lg border border-input bg-card px-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-primary"
            >
              {countryPhoneOptions.map((country) => (
                <option key={country.iso} value={country.iso}>
                  {country.flag} {country.dialCode} · {country.label}
                </option>
              ))}
            </select>
          </div>
          <Input
            id="telephone"
            name="telephone"
            type="tel"
            inputMode="tel"
            required
            placeholder={isQr ? "77 123 45 67" : "77 123 45 67"}
            className="flex-1"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Indicatif sélectionné : {selectedCountry.flag} {selectedCountry.dialCode}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="niveau">
          Niveau d&apos;étude <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {niveaux.map((n) => (
            <label
              key={n}
              className={cn(
                "flex items-center justify-center cursor-pointer rounded-lg border border-border bg-card px-3 py-2.5 text-sm",
                "has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary",
                "hover:bg-secondary",
              )}
            >
              <input
                type="radio"
                name="niveau"
                value={n}
                className="sr-only"
                required
              />
              {n}
            </label>
          ))}
        </div>
      </div>

      {!isQr && (
        <div className="rounded-lg bg-secondary/60 border border-border px-4 py-3 flex items-center gap-3 text-sm">
          <span className="h-8 w-8 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
            AD
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-medium">Ajouté par : Aminata Diop</p>
            <p className="text-xs text-muted-foreground">
              Admin · DKR · injecté automatiquement
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
        <Button type="reset" variant="outline" size="lg" className="sm:flex-1">
          Réinitialiser
        </Button>
        <Button type="submit" size="lg" className="sm:flex-[2]">
          {isQr ? "Je m'inscris" : "Enregistrer l'étudiant"}
        </Button>
      </div>
    </form>
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
      {helper && (
        <p className="text-xs text-muted-foreground">{helper}</p>
      )}
    </div>
  );
}
