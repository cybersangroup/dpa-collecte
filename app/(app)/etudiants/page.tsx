import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { db } from "@/lib/db";
import { ProfileType } from "@prisma/client";
import React from "react";

export const dynamic = "force-dynamic";

const profileLabels: Record<ProfileType, { label: string; color: "primary" | "warning" | "outline" | "success" }> = {
  ETUDIANT_ELEVE: { label: "Étudiant/Élève", color: "primary" },
  PROF:           { label: "Professeur",      color: "success" },
  SURVEILLANT:    { label: "Surveillant",      color: "warning" },
  PARENT:         { label: "Parent",           color: "outline" },
};

export default async function EtudiantsPage() {
  noStore();
  const students = await db.student.findMany({
    include: {
      city: true,
      addedBy: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <>
      <Topbar title="Étudiants" />

      <div className="flex-1 p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Liste des étudiants collectés
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {students.length} personnes enregistrées
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="md">
              <IconDownload /> Exporter CSV
            </Button>
            <Link href="/etudiants/ajouter">
              <Button size="md">
                <IconPlus /> Ajouter
              </Button>
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <Th sortable active>Nom / Prénom</Th>
                  <Th>Profil</Th>
                  <Th>Téléphone</Th>
                  <Th>Niveau / Info</Th>
                  <Th sortable>Site</Th>
                  <Th>Ajouté par</Th>
                  <Th>Source</Th>
                  <Th sortable>Date</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((s) => {
                  const profil = profileLabels[s.profileType] ?? profileLabels.ETUDIANT_ELEVE;
                  const initials = `${s.nom[0] ?? ""}${s.prenom?.[0] ?? ""}`.toUpperCase();
                  const niveauInfo = s.classe
                    ? `${s.niveauScolaire ?? ""} — ${s.classe}`.replace(/^— /, "")
                    : s.niveauScolaire
                    ? s.niveauScolaire
                    : s.nombreEleves != null
                    ? `${s.nombreEleves} élève(s)`
                    : "—";
                  return (
                    <tr key={s.id} className="hover:bg-secondary/30 transition-colors cursor-pointer group">
                      <td className="px-4 py-3">
                        <Link href={`/etudiants/${s.id}`} className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-semibold">
                            {initials}
                          </div>
                          <div>
                            <p className="font-medium group-hover:text-primary transition-colors">
                              {s.nom} {s.prenom}
                            </p>
                            {s.etablissement && (
                              <p className="text-xs text-muted-foreground">{s.etablissement}</p>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={profil.color}>{profil.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">
                        {s.telephone}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{niveauInfo}</td>
                      <td className="px-4 py-3">
                        <Badge variant={s.city.code === "DKR" ? "primary" : "warning"}>
                          {s.city.code}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {s.addedBy?.nomComplet ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={s.source === "QR_AUTO" ? "success" : "outline"}>
                          {s.source === "QR_AUTO" ? "QR auto" : "Opérateur"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDateTime(s.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/etudiants/${s.id}`}>
                          <Button variant="ghost" size="icon" aria-label="Voir le détail">
                            <IconChevron />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      Aucune personne enregistrée pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function Th({
  children,
  sortable,
  active,
  className,
}: {
  children: React.ReactNode;
  sortable?: boolean;
  active?: boolean;
  className?: string;
}) {
  return (
    <th
      className={
        "px-4 py-3 text-left font-semibold " +
        (sortable ? "cursor-pointer select-none hover:text-foreground " : "") +
        (className ?? "")
      }
    >
      <span className="inline-flex items-center gap-1.5">
        {children}
        {sortable && (
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={active ? "text-primary" : "opacity-50"}
          >
            <path d="m6 9 6-6 6 6" />
            <path d="m6 15 6 6 6-6" />
          </svg>
        )}
      </span>
    </th>
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

function IconDownload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconChevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
