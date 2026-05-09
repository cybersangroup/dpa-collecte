import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { Topbar } from "@/components/layout/Topbar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function InscriptionsPage() {
  noStore();

  const inscriptions = await db.inscription.findMany({
    include: {
      formation: { select: { nom: true, categorie: true, prix: true, devise: true } },
      enfants:   { select: { nom: true } },
      addedBy:   { select: { nomComplet: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      <Topbar title="Inscriptions formations" />

      <div className="flex-1 p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Inscriptions aux formations</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {inscriptions.length} inscription(s) enregistrée(s)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/inscriptions/ajouter">
              <Button size="md">
                <IconPlus /> Ajouter
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <Th>Profil</Th>
                  <Th>Formation</Th>
                  <Th>Montant</Th>
                  <Th>Téléphone</Th>
                  <Th>Adresse</Th>
                  <Th>Enfants</Th>
                  <Th>Reçu</Th>
                  <Th>Ajouté par</Th>
                  <Th>Date</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {inscriptions.map((ins) => (
                  <tr key={ins.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <Badge variant={ins.type === "ADULTE" ? "primary" : "warning"}>
                        {ins.type === "ADULTE" ? "Adulte" : "Parent"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{ins.formation.nom}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ins.formation.categorie === "ENFANT" ? "Enfant" : "Adulte"}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground tabular-nums">
                      {ins.formation.prix
                        ? `${ins.formation.prix} ${ins.formation.devise}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {ins.countryCode ? `${ins.countryCode} ` : ""}{ins.telephone}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {ins.adresse ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {ins.enfants.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <div className="space-y-0.5">
                          {ins.enfants.map((e, i) => (
                            <p key={i} className="text-xs">{i + 1}. {e.nom}</p>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {ins.recuUrl ? (
                        <a
                          href={ins.recuUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary underline underline-offset-2 hover:opacity-80"
                        >
                          <IconEye /> Voir
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {ins.addedBy?.nomComplet ?? "Public"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {formatDate(ins.createdAt)}
                    </td>
                  </tr>
                ))}
                {inscriptions.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      Aucune inscription enregistrée pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center pt-2">
          Formulaire public accessible à :{" "}
          <Link href="/inscription" target="_blank" className="text-primary underline underline-offset-2">
            /inscription
          </Link>
        </div>
      </div>
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left font-semibold">{children}</th>;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
