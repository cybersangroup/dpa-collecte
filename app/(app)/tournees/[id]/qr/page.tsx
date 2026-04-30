import Link from "next/link";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/branding/Logo";
import { QrPreview } from "@/components/qr/QrPreview";
import { getPublicAppUrl } from "@/lib/app-url";
import { db } from "@/lib/db";

export default async function TourneeQrPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await db.campaign.findUnique({
    where: { id },
    include: { city: true },
  });
  if (!campaign) {
    return (
      <>
        <Topbar title="Vue impression QR" />
        <div className="flex-1 p-6 text-sm text-muted-foreground">Tournée introuvable.</div>
      </>
    );
  }

  const campaignToken = campaign.qrToken;
  const qrUrl = `${getPublicAppUrl()}/qr/${campaignToken}`;

  return (
    <>
      <Topbar title="Vue impression QR" />

      <div className="flex-1 p-4 sm:p-8 print:p-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6 print:hidden">
            <Link
              href="/tournees"
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
            >
              ← Retour aux tournées
            </Link>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Télécharger PDF
              </Button>
              <Button size="sm">
                <IconPrinter /> Imprimer
              </Button>
            </div>
          </div>

          {/* Affiche A4 imprimable */}
          <div className="bg-white border border-border rounded-2xl shadow-sm p-8 sm:p-12 print:border-0 print:shadow-none print:rounded-none">
            <div className="flex flex-col items-center text-center">
              <Logo size={56} withWordmark />

              <p className="mt-8 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Inscription à la tournée
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
                {campaign.titre}
              </h2>
              <p className="mt-1 text-slate-500 text-sm">
                {campaign.city.code} · {campaign.city.nom}
              </p>

              <div className="mt-8 rounded-xl bg-white p-5 ring-1 ring-slate-200">
                <QrPreview value={qrUrl} size={280} />
              </div>

              <p className="mt-8 text-lg font-medium text-slate-900">
                Scannez ce QR code pour vous inscrire
              </p>
              <p className="mt-2 text-sm text-slate-500 max-w-md">
                Pointez l&apos;appareil photo de votre téléphone vers le code,
                puis remplissez le formulaire en quelques secondes.
              </p>

              <div className="mt-8 pt-6 border-t border-slate-200 w-full max-w-md">
                <p className="text-xs text-slate-400">
                  Lien direct
                </p>
                <p className="font-mono text-xs text-slate-700 mt-1 break-all">
                  {qrUrl}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
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
