"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { QrPreview } from "@/components/qr/QrPreview";
import { cn } from "@/lib/cn";
import { deleteCampaigns } from "./actions";

type City = { code: string; nom: string };

type Tournee = {
  id: string;
  titre: string;
  qrToken: string;
  qrIsActive: boolean;
  startsAt: Date;
  endsAt: Date;
  city: City;
  _count: { students: number };
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function TourneesClient({
  tournees,
  publicAppUrl,
}: {
  tournees: Tournee[];
  publicAppUrl: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const now = new Date();

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === tournees.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(tournees.map((t) => t.id)));
    }
  }

  function handleDelete() {
    if (selected.size === 0) return;
    const label =
      selected.size === 1
        ? "cette tournée"
        : `ces ${selected.size} tournées`;
    if (!confirm(`Supprimer ${label} ? Cette action est irréversible.`)) return;

    startTransition(async () => {
      const res = await deleteCampaigns(Array.from(selected));
      if (res.ok) {
        setToast({ type: "success", message: `${selected.size} tournée(s) supprimée(s).` });
        setSelected(new Set());
        // Rechargement complet pour rafraîchir la liste serveur
        setTimeout(() => window.location.assign("/tournees"), 900);
      } else {
        setToast({ type: "error", message: res.message ?? "Erreur inconnue." });
      }
    });
  }

  function copyLink(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setToast({ type: "success", message: "Lien copié !" });
      setTimeout(() => setToast(null), 2000);
    });
  }

  const allSelected = selected.size === tournees.length && tournees.length > 0;
  const someSelected = selected.size > 0 && !allSelected;

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div
          role={toast.type === "error" ? "alert" : "status"}
          className={cn(
            "rounded-lg border px-4 py-3 text-sm flex items-center gap-2",
            toast.type === "success"
              ? "border-emerald-400/40 bg-emerald-50 text-emerald-700"
              : "border-destructive/40 bg-destructive/10 text-destructive",
          )}
        >
          {toast.type === "success" ? (
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          ) : (
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          )}
          {toast.message}
        </div>
      )}

      {/* Barre de sélection / suppression */}
      {tournees.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
            />
            <span className="text-sm text-muted-foreground">
              {selected.size === 0
                ? "Tout sélectionner"
                : `${selected.size} sélectionné(s)`}
            </span>
          </label>

          {selected.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={handleDelete}
              className="ml-auto"
            >
              {isPending ? (
                <>
                  <SpinnerIcon />
                  Suppression…
                </>
              ) : (
                <>
                  <IconTrash />
                  Supprimer {selected.size === 1 ? "la sélection" : `les ${selected.size}`}
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Liste */}
      <div className="grid gap-4">
        {tournees.map((t) => {
          const isActive = t.qrIsActive && new Date(t.endsAt) > now;
          const qrUrl = `${publicAppUrl}/qr/${t.qrToken}`;
          const isSelected = selected.has(t.id);

          return (
            <article
              key={t.id}
              className={cn(
                "rounded-xl border bg-card overflow-hidden flex flex-col md:flex-row transition-colors",
                isSelected ? "border-primary/50 bg-primary/5" : "border-border",
              )}
            >
              {/* Checkbox latéral */}
              <div className="flex items-start p-4 md:p-5 md:pr-0">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleOne(t.id)}
                  aria-label={`Sélectionner ${t.titre}`}
                  className="mt-1 h-4 w-4 rounded border-border accent-primary cursor-pointer"
                />
              </div>

              <div className="p-4 sm:p-5 flex-1 min-w-0">
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold tracking-tight truncate">
                      {t.titre}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {t.qrToken}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant={t.city.code === "DKR" ? "primary" : "warning"}>
                      {t.city.code} · {t.city.nom}
                    </Badge>
                    <Badge variant={isActive ? "success" : "outline"}>
                      {isActive ? (
                        <>
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                          Active
                        </>
                      ) : "Expirée"}
                    </Badge>
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Début</dt>
                    <dd className="mt-0.5">{formatDateTime(t.startsAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Expiration</dt>
                    <dd className="mt-0.5">{formatDateTime(t.endsAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Inscrits via QR</dt>
                    <dd className="mt-0.5 font-semibold tabular-nums text-primary">
                      {t._count.students}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/tournees/${t.id}/qr`}>
                    <Button variant="primary" size="sm">
                      <IconPrinter /> Vue impression
                    </Button>
                  </Link>
                  <a href={qrUrl} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm">
                      Ouvrir lien QR
                    </Button>
                  </a>
                  <Button variant="outline" size="sm" onClick={() => copyLink(qrUrl)}>
                    <IconCopy /> Copier le lien
                  </Button>
                </div>
              </div>

              <div className="md:w-48 flex items-center justify-center p-4 bg-secondary/30 border-t md:border-t-0 md:border-l border-border">
                <div className="rounded-lg bg-white p-3 shadow-sm">
                  <QrPreview value={qrUrl} size={120} />
                </div>
              </div>
            </article>
          );
        })}
      </div>
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

function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function IconPrinter() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
