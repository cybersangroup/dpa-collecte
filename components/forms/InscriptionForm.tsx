"use client";

import { useActionState, useState, useEffect, useRef, useCallback } from "react";
import { createInscription, type InscriptionFormState } from "@/app/(app)/inscriptions/actions";

type Formation = {
  id: string;
  nom: string;
  categorie: "ENFANT" | "ADULTE";
  duree: string | null;
  prix: string | null;
  devise: string;
};

type Props = {
  formations: Formation[];
  /** "public" = page non authentifiée | "operator" = opérateur connecté */
  mode?: "public" | "operator";
};

const COUNTRY_CODES = [
  { code: "+253", flag: "🇩🇯", name: "Djibouti" },
  { code: "+221", flag: "🇸🇳", name: "Sénégal" },
  { code: "+33",  flag: "🇫🇷", name: "France" },
  { code: "+1",   flag: "🇺🇸", name: "États-Unis" },
  { code: "+212", flag: "🇲🇦", name: "Maroc" },
  { code: "+216", flag: "🇹🇳", name: "Tunisie" },
  { code: "+213", flag: "🇩🇿", name: "Algérie" },
];

const WHATSAPP_CHANNEL_URL = "https://whatsapp.com/channel/0029VaBkjtf3GJPLvxXBEs3Y";

const DEVISES = ["FCFA", "FDJ", "USD"];

export function InscriptionForm({ formations, mode = "public" }: Props) {
  const [formKey, setFormKey]             = useState(0);
  const [type, setType]                   = useState<"ADULTE" | "PARENT">("ADULTE");
  const [nombreEnfants, setNombreEnfants] = useState(1);
  const [selectedFormationId, setSelectedFormationId] = useState("");
  const [recuPreview, setRecuPreview]     = useState<string | null>(null);
  const [showWhatsApp, setShowWhatsApp]   = useState(false);
  const [countdown, setCountdown]         = useState(5);
  const countdownRef                      = useRef<ReturnType<typeof setInterval> | null>(null);

  const initialState: InscriptionFormState = { status: "idle" };
  const [state, formAction, isPending] = useActionState(createInscription, initialState);

  // Succès
  useEffect(() => {
    if (state.status === "success") {
      setTimeout(() => {
        setFormKey((k) => k + 1);
        setType("ADULTE");
        setNombreEnfants(1);
        setSelectedFormationId("");
        setRecuPreview(null);
        setCountdown(5);
        if (mode === "public") setShowWhatsApp(true);
      }, 600);
    }
  }, [state, mode]);

  // Compte à rebours WhatsApp
  useEffect(() => {
    if (!showWhatsApp) return;
    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(countdownRef.current!);
          window.location.href = WHATSAPP_CHANNEL_URL;
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [showWhatsApp]);

  const handleStay = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowWhatsApp(false);
  }, []);

  const formationsFiltered = formations.filter((f) =>
    type === "ADULTE" ? f.categorie === "ADULTE" : f.categorie === "ENFANT"
  );

  const selectedFormation = formationsFiltered.find((f) => f.id === selectedFormationId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { setRecuPreview(null); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setRecuPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const inputClass =
    "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";
  const labelClass = "block text-sm font-medium text-foreground mb-1.5";
  const selectClass =
    "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

  return (
    <>
      {/* Popup WhatsApp */}
      {showWhatsApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" className="w-8 h-8 fill-green-600">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-1">Inscription enregistrée !</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Rejoignez notre chaîne WhatsApp pour suivre nos actualités et formations.
              <br />
              Redirection dans <span className="font-bold text-primary">{countdown}s</span>…
            </p>
            <div className="flex flex-col gap-2">
              <a
                href={WHATSAPP_CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                Accéder à la chaîne WhatsApp
              </a>
              <button
                type="button"
                onClick={handleStay}
                className="w-full py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                Rester sur cette page
              </button>
            </div>
          </div>
        </div>
      )}

      <form key={formKey} action={formAction} className="space-y-5" encType="multipart/form-data">
        {/* Qui s'inscrit ? */}
        <div>
          <p className={labelClass}>Qui souhaitez-vous inscrire ?</p>
          <div className="grid grid-cols-2 gap-2">
            {(["ADULTE", "PARENT"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setType(t); setSelectedFormationId(""); }}
                className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                  type === t
                    ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "border-input bg-background text-foreground/70 hover:bg-secondary"
                }`}
              >
                {t === "ADULTE" ? "👤 Je m'inscris" : "👨‍👧 J'inscris mon/mes enfant(s)"}
              </button>
            ))}
          </div>
          <input type="hidden" name="type" value={type} />
        </div>

        {/* Téléphone */}
        <div>
          <label className={labelClass}>
            Téléphone <span className="text-destructive">*</span>
          </label>
          <div className="flex gap-2">
            <select name="countryCode" className="rounded-xl border border-input bg-background px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-28 shrink-0">
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
              ))}
            </select>
            <input type="tel" name="telephone" required placeholder="Numéro de téléphone" className={inputClass} />
          </div>
        </div>

        {/* Adresse */}
        <div>
          <label className={labelClass}>Adresse</label>
          <input type="text" name="adresse" placeholder="Votre adresse (optionnel)" className={inputClass} />
        </div>

        {/* Formation */}
        <div>
          <label className={labelClass}>
            Formation souhaitée <span className="text-destructive">*</span>
          </label>
          <select
            name="formationId"
            required
            value={selectedFormationId}
            onChange={(e) => setSelectedFormationId(e.target.value)}
            className={selectClass}
          >
            <option value="">— Choisir une formation —</option>
            {formationsFiltered.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nom}
                {f.duree ? ` · ${f.duree}` : ""}
                {f.prix  ? ` · ${f.prix} ${f.devise}` : ""}
              </option>
            ))}
          </select>
          {/* Récapitulatif formation sélectionnée */}
          {selectedFormation && selectedFormation.prix && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-sm">
              <span className="text-primary">💰</span>
              <span>
                Montant à régler :{" "}
                <strong>{selectedFormation.prix} {selectedFormation.devise}</strong>
              </span>
            </div>
          )}
          {formationsFiltered.length === 0 && (
            <p className="mt-1 text-xs text-muted-foreground">Aucune formation disponible pour le moment.</p>
          )}
        </div>

        {/* ── Message de paiement ─────────────────────────────────────── */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-4 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-sm text-amber-800 dark:text-amber-300">
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Procédez au paiement avant de continuer
          </div>
          <ol className="text-xs text-amber-700 dark:text-amber-400 space-y-1 list-decimal list-inside">
            <li>Effectuez le paiement du montant de la formation via votre wallet (Wave, Orange Money, Waafi…).</li>
            <li>Prenez une <strong>capture d'écran du reçu</strong> de confirmation de paiement.</li>
            <li>Joignez cette capture ci-dessous pour valider votre inscription.</li>
          </ol>
        </div>

        {/* Reçu de paiement */}
        <div>
          <label className={labelClass}>
            Reçu de paiement <span className="text-destructive">*</span>
          </label>
          <label className="flex flex-col items-center justify-center w-full h-36 rounded-xl border-2 border-dashed border-input bg-background hover:bg-secondary/50 cursor-pointer transition-colors relative overflow-hidden">
            {recuPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={recuPreview} alt="Aperçu reçu" className="absolute inset-0 w-full h-full object-contain p-1" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-none stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className="text-sm">Cliquez pour sélectionner une image</span>
                <span className="text-xs">JPG, PNG, WEBP ou PDF · max 5 Mo</span>
              </div>
            )}
            <input
              type="file"
              name="recu"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
          {recuPreview && (
            <button
              type="button"
              onClick={() => setRecuPreview(null)}
              className="mt-1 text-xs text-destructive hover:underline"
            >
              Supprimer l'image
            </button>
          )}
        </div>

        {/* Enfants (PARENT uniquement) */}
        {type === "PARENT" && (
          <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
            <div>
              <label className={labelClass}>
                Nombre d'enfants à inscrire <span className="text-destructive">*</span>
              </label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setNombreEnfants((n) => Math.max(1, n - 1))}
                  className="w-9 h-9 rounded-full border border-input bg-background flex items-center justify-center text-lg font-medium hover:bg-secondary transition-colors">−</button>
                <span className="w-8 text-center font-semibold tabular-nums">{nombreEnfants}</span>
                <button type="button" onClick={() => setNombreEnfants((n) => Math.min(8, n + 1))}
                  className="w-9 h-9 rounded-full border border-input bg-background flex items-center justify-center text-lg font-medium hover:bg-secondary transition-colors">+</button>
              </div>
              <input type="hidden" name="nombreEnfants" value={nombreEnfants} />
            </div>
            {Array.from({ length: nombreEnfants }, (_, i) => (
              <div key={i}>
                <label className={labelClass}>
                  Nom de l'enfant {nombreEnfants > 1 ? i + 1 : ""}{" "}
                  <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  name={`enfant_${i}`}
                  required
                  placeholder={`Nom complet de l'enfant ${nombreEnfants > 1 ? i + 1 : ""}`}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        )}

        {/* Feedback */}
        {state.status === "error" && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {state.message}
          </div>
        )}
        {state.status === "success" && (
          <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Inscription enregistrée ! Formulaire réinitialisé.
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Envoi en cours…
            </>
          ) : (
            "Envoyer mon inscription"
          )}
        </button>
      </form>
    </>
  );
}
