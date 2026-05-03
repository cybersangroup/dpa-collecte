"use client";

import { useEffect, useState } from "react";

/**
 * Détecte quand un nouveau Service Worker est prêt et propose un rechargement.
 * Affiché uniquement sur les pages protégées (app layout).
 */
export function UpdatePrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.ready.then((reg) => {
      reg.addEventListener("updatefound", () => {
        const newSw = reg.installing;
        if (!newSw) return;
        newSw.addEventListener("statechange", () => {
          // Un nouveau SW est installé ET il y avait déjà un SW actif (mise à jour)
          if (newSw.state === "installed" && navigator.serviceWorker.controller) {
            setShow(true);
          }
        });
      });
    });

    // Écoute aussi le message envoyé par le SW lui-même (skipWaiting activé)
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="rounded-xl border border-border bg-card shadow-xl px-4 py-3 flex items-center gap-3">
        <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Nouvelle version disponible</p>
          <p className="text-xs text-muted-foreground">Rechargez pour appliquer la mise à jour.</p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Actualiser
        </button>
      </div>
    </div>
  );
}
