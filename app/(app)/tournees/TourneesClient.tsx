"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";
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

/* ─── Modal de partage QR ─── */
function ShareQrModal({
  titre,
  qrUrl,
  onClose,
}: {
  titre: string;
  qrUrl: string;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleCopy() {
    navigator.clipboard.writeText(qrUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Inscription DPA — ${titre}`, text: "Scannez ce QR code pour vous inscrire.", url: qrUrl });
      } catch { /* annulé par l'utilisateur */ }
    } else {
      handleCopy();
    }
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qr-${titre.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-sm p-6 space-y-5">
        {/* En-tête */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-lg">Partager le QR code</h3>
            <p className="text-sm text-muted-foreground mt-0.5 truncate max-w-[220px]">{titre}</p>
          </div>
          <button type="button" onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* QR code (canvas pour le téléchargement) */}
        <div className="flex justify-center">
          <div className="rounded-xl bg-white p-4 shadow-sm inline-block">
            <QRCodeCanvas
              ref={canvasRef as React.Ref<HTMLCanvasElement>}
              value={qrUrl}
              size={200}
              marginSize={2}
              bgColor="#ffffff"
              fgColor="#0f172a"
            />
          </div>
        </div>

        {/* URL */}
        <div className="rounded-lg bg-secondary/50 border border-border px-3 py-2 text-xs font-mono text-muted-foreground break-all">
          {qrUrl}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 gap-2">
          <Button size="lg" className="w-full gap-2" onClick={handleNativeShare}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            Partager le lien
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="md" className="gap-2" onClick={handleCopy}>
              {copied
                ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> Copié !</>
                : <><IconCopy /> Copier le lien</>}
            </Button>
            <Button variant="outline" size="md" className="gap-2" onClick={handleDownload}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Télécharger
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Modal de confirmation ─── */
function ConfirmModal({
  count,
  onConfirm,
  onCancel,
}: {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // Fermeture sur Échap
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="confirm-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden
      />
      {/* Boîte */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card shadow-xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </div>
          <div>
            <p id="confirm-title" className="font-semibold text-foreground">
              Supprimer {count === 1 ? "cette tournée" : `ces ${count} tournées`} ?
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cette action est irréversible. Les étudiants liés ne seront pas supprimés mais détachés de la tournée.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Annuler
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm}>
            Supprimer
          </Button>
        </div>
      </div>
    </div>
  );
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<{ titre: string; qrUrl: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Calcul de "now" côté client uniquement pour éviter l'hydration mismatch #418
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); }, []);

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

  function confirmDelete() {
    setConfirmOpen(false);
    startTransition(async () => {
      const res = await deleteCampaigns(Array.from(selected));
      if (res.ok) {
        setToast({ type: "success", message: `${selected.size} tournée(s) supprimée(s).` });
        setSelected(new Set());
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
    <>
      {/* Modal de partage QR */}
      {shareTarget && (
        <ShareQrModal
          titre={shareTarget.titre}
          qrUrl={shareTarget.qrUrl}
          onClose={() => setShareTarget(null)}
        />
      )}

      {/* Modal de confirmation suppression */}
      {confirmOpen && (
        <ConfirmModal
          count={selected.size}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmOpen(false)}
        />
      )}

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

        {/* Barre de sélection */}
        {tournees.length > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => { if (el) el.indeterminate = someSelected; }}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">
                {selected.size === 0 ? "Tout sélectionner" : `${selected.size} sélectionné(s)`}
              </span>
            </label>

            {selected.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                disabled={isPending}
                onClick={() => setConfirmOpen(true)}
                className="ml-auto"
              >
                {isPending ? (
                  <><SpinnerIcon /> Suppression…</>
                ) : (
                  <><IconTrash /> Supprimer {selected.size === 1 ? "la sélection" : `les ${selected.size}`}</>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Liste */}
        <div className="grid gap-4">
          {tournees.map((t) => {
            // now peut être null avant hydration — on considère la tournée comme active par défaut
            const isActive = now
              ? t.qrIsActive && new Date(t.endsAt) > now
              : t.qrIsActive;
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
                      <h3 className="text-base font-semibold tracking-tight truncate">{t.titre}</h3>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{t.qrToken}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant={t.city.code === "DKR" ? "primary" : "warning"}>
                        {t.city.code} · {t.city.nom}
                      </Badge>
                      <Badge variant={isActive ? "success" : "outline"}>
                        {isActive ? (
                          <><span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />Active</>
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
                      <dd className="mt-0.5 font-semibold tabular-nums text-primary">{t._count.students}</dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="primary" size="sm"
                      onClick={() => setShareTarget({ titre: t.titre, qrUrl })}>
                      <IconShare /> Partager le QR
                    </Button>
                    <Link href={`/tournees/${t.id}/qr`}>
                      <Button variant="outline" size="sm"><IconPrinter /> Impression</Button>
                    </Link>
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
function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
function IconShare() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
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
