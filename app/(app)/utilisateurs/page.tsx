import Link from "next/link";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function UtilisateursPage() {
  const membres = await db.user.findMany({
    where: {},
    include: {
      city: true,
      _count: { select: { studentsAdded: true } },
    },
    orderBy: { nomComplet: "asc" },
  });

  const actifs = membres.filter((m) => m.actif).length;

  return (
    <>
      <Topbar title="Utilisateurs" />

      <div className="flex-1 p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Équipe de collecte
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {membres.length} membre{membres.length !== 1 ? "s" : ""} · {actifs} actif
              {actifs !== 1 ? "s" : ""}
            </p>
          </div>

          <Link href="/utilisateurs/ajouter">
            <Button size="md">
              <IconPlus /> Ajouter un opérateur
            </Button>
          </Link>
        </div>

        {membres.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Aucun utilisateur en base. Exécutez le seed Prisma ou créez un compte via le script admin.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {membres.map((m) => (
              <article
                key={m.id}
                className={cn(
                  "rounded-xl border bg-card p-5 transition-shadow hover:shadow-md",
                  m.actif ? "border-border" : "border-border/60 opacity-70",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
                    {m.nomComplet
                      .trim()
                      .split(/\s+/)
                      .filter(Boolean)
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{m.nomComplet}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{m.username}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Plus d'actions"
                    disabled
                  >
                    <IconMore />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  <Badge variant={m.role === "ADMIN" ? "primary" : "default"}>
                    {m.role === "ADMIN" ? "Admin" : "Opérateur"}
                  </Badge>
                  <Badge variant="outline">
                    {m.city.code} · {m.city.nom}
                  </Badge>
                  {!m.actif && <Badge variant="outline">Désactivé</Badge>}
                  {m.actif && (
                    <Badge variant="success">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1" />
                      Actif
                    </Badge>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-border text-sm">
                  <p className="text-xs text-muted-foreground">Étudiants ajoutés</p>
                  <p className="font-semibold tabular-nums mt-0.5">
                    {m._count.studentsAdded}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconMore() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}
