"use client";

import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

export function InscriptionQRCode({ appUrl }: { appUrl: string }) {
  const [url, setUrl] = useState(appUrl);

  useEffect(() => {
    // Priorité à l'URL exacte de la fenêtre (utile si NEXT_PUBLIC_APP_URL est absent)
    if (typeof window !== "undefined" && !appUrl) {
      setUrl(window.location.href);
    }
  }, [appUrl]);

  const handleDownload = () => {
    const canvas = document.getElementById("inscription-qr") as HTMLCanvasElement | null;
    if (!canvas) return;
    const link   = document.createElement("a");
    link.download = "dpa-inscription-qr.png";
    link.href     = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <p className="text-xs text-muted-foreground text-center max-w-xs">
        Partagez ce QR code pour accéder directement au formulaire d'inscription.
      </p>
      <div className="p-3 rounded-xl border border-border bg-white shadow-sm">
        <QRCodeCanvas
          id="inscription-qr"
          value={url}
          size={180}
          level="M"
          includeMargin={false}
        />
      </div>
      <button
        type="button"
        onClick={handleDownload}
        className="flex items-center gap-1.5 text-xs text-primary hover:underline underline-offset-2"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Télécharger le QR code
      </button>
    </div>
  );
}
