import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

type Role = "ADMIN" | "OPERATEUR";
type Site = "DKR" | "DJIB";

type Membre = {
  id: string;
  nomComplet: string;
  username: string;
  role: Role;
  site: Site;
  actif: boolean;
  etudiantsAjoutes: number;
  derniereConnexion: string;
};

const membres: Membre[] = [
  { id: "1", nomComplet: "Aminata Diop",   username: "aminata.diop", role: "ADMIN",     site: "DKR",  actif: true,  etudiantsAjoutes: 84, derniereConnexion: "Il y a 2 min" },
  { id: "2", nomComplet: "Yacine Mbaye",   username: "yacine.mbaye", role: "OPERATEUR", site: "DKR",  actif: true,  etudiantsAjoutes: 67, derniereConnexion: "Il y a 18 min" },
  { id: "3", nomComplet: "Said Omar",      username: "said.omar",    role: "OPERATEUR", site: "DJIB", actif: true,  etudiantsAjoutes: 92, derniereConnexion: "Il y a 1h" },
  { id: "4", nomComplet: "Khadija Souleiman", username: "khadija.s", role: "OPERATEUR", site: "DJIB", actif: true,  etudiantsAjoutes: 34, derniereConnexion: "Il y a 3h" },
  { id: "5", nomComplet: "Pape Sall",      username: "pape.sall",    role: "OPERATEUR", site: "DKR",  actif: false, etudiantsAjoutes: 15, derniereConnexion: "Il y a 12 jours" },
];

export default function UtilisateursPage() {
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
              {membres.length} membres · {membres.filter(m => m.actif).length} actifs
            </p>
          </div>

          <Button size="md">
            <IconPlus /> Inviter un opérateur
          </Button>
        </div>

        {/* Filtres rapides */}
        <div className="rounded-xl border border-border bg-card p-3 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, identifiant…"
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <TabBtn active>Tous</TabBtn>
            <TabBtn>Admins</TabBtn>
            <TabBtn>Opérateurs</TabBtn>
            <TabBtn>DKR</TabBtn>
            <TabBtn>DJIB</TabBtn>
          </div>
        </div>

        {/* Grille de cartes membres */}
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
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                  {m.nomComplet.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{m.nomComplet}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{m.username}
                  </p>
                </div>
                <button
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Plus d'actions"
                >
                  <IconMore />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-4">
                <Badge variant={m.role === "ADMIN" ? "primary" : "default"}>
                  {m.role === "ADMIN" ? "Admin" : "Opérateur"}
                </Badge>
                <Badge variant={m.site === "DKR" ? "default" : "warning"}>
                  Site {m.site}
                </Badge>
                {!m.actif && <Badge variant="outline">Désactivé</Badge>}
                {m.actif && (
                  <Badge variant="success">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1" />
                    Actif
                  </Badge>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Étudiants ajoutés</p>
                  <p className="font-semibold tabular-nums mt-0.5">
                    {m.etudiantsAjoutes}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dernière connexion</p>
                  <p className="text-sm mt-0.5">{m.derniereConnexion}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}

function TabBtn({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      className={cn(
        "h-10 px-3.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
        active
          ? "bg-primary text-primary-foreground"
          : "text-foreground/70 hover:bg-secondary",
      )}
    >
      {children}
    </button>
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

function IconSearch({ className }: { className?: string }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
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
