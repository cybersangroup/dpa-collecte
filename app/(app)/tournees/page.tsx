import Link from "next/link";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { QrPreview } from "@/components/qr/QrPreview";
import { getPublicAppUrl } from "@/lib/app-url";
import { db } from "@/lib/db";

export default async function TourneesPage() {
  const publicAppUrl = getPublicAppUrl();
  const now = new Date();
  const tournees = await db.campaign.findMany({
    include: {
      city: true,
      _count: {
        select: { students: true },
      },
    },
    orderBy: { startsAt: "desc" },
    take: 30,
  });

  return (
    <>
      <Topbar title="Tournées & QR codes" />

      <div className="flex-1 p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Tournées de collecte
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Génère un QR code unique et signé pour chaque tournée terrain
            </p>
          </div>

          <Link href="/tournees/nouvelle">
            <Button size="md">
              <IconPlus /> Nouvelle tournée
            </Button>
          </Link>
        </div>

        {tournees.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">
              Aucune tournée pour l&apos;instant.
            </p>
            <Link href="/tournees/nouvelle" className="inline-block mt-4">
              <Button size="sm">
                <IconPlus /> Créer la première tournée
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {tournees.map((t) => {
              const isActive = t.qrIsActive && t.endsAt > now;
              const qrUrl = `${publicAppUrl}/qr/${t.qrToken}`;
              return (
                <article
                  key={t.id}
                  className="rounded-xl border border-border bg-card overflow-hidden flex flex-col md:flex-row"
                >
                  <div className="p-5 sm:p-6 flex-1 min-w-0">
                    <div className="flex items-start gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold tracking-tight truncate">
                          {t.titre}
                        </h3>
                        <p className="text-xs text-muted-foreground font-mono mt-1">
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

                    <dl className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
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

                    <div className="mt-5 flex flex-wrap gap-2">
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
                      <Button variant="outline" size="sm">
                        <IconCopy /> Copier le lien
                      </Button>
                    </div>
                  </div>

                  <div className="md:w-56 flex items-center justify-center p-5 bg-secondary/30 border-t md:border-t-0 md:border-l border-border">
                    <div className="rounded-lg bg-white p-3 shadow-sm">
                      <QrPreview value={qrUrl} size={140} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
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

