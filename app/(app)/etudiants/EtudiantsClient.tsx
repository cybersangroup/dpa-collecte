"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type ProfileType = "ETUDIANT_ELEVE" | "PROF" | "SURVEILLANT" | "PARENT";

type Student = {
  id: string;
  nom: string;
  prenom: string | null;
  profileType: ProfileType;
  telephone: string;
  niveauScolaire: string | null;
  classe: string | null;
  nombreEleves: number | null;
  etablissement: string | null;
  source: string;
  createdAt: Date;
  city: { code: string; nom: string };
  addedBy: { nomComplet: string } | null;
};

const profileLabels: Record<ProfileType, { label: string; color: "primary" | "warning" | "outline" | "success" }> = {
  ETUDIANT_ELEVE: { label: "Étudiant/Élève", color: "primary" },
  PROF:           { label: "Professeur",      color: "success" },
  SURVEILLANT:    { label: "Surveillant",      color: "warning" },
  PARENT:         { label: "Parent",           color: "outline" },
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

const selClass = "rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

export function EtudiantsClient({ students }: { students: Student[] }) {
  const [search, setSearch]       = useState("");
  const [filterProfil, setFilterProfil] = useState("ALL");
  const [filterSite, setFilterSite]     = useState("ALL");
  const [filterSource, setFilterSource] = useState("ALL");
  const [sortBy, setSortBy]             = useState<"nom" | "date" | "site">("date");
  const [sortAsc, setSortAsc]           = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = students.filter((s) => {
      const fullName = `${s.nom} ${s.prenom ?? ""}`.toLowerCase();
      const matchSearch =
        !q ||
        fullName.includes(q) ||
        s.telephone.includes(q) ||
        (s.etablissement ?? "").toLowerCase().includes(q);
      const matchProfil  = filterProfil  === "ALL" || s.profileType  === filterProfil;
      const matchSite    = filterSite    === "ALL" || s.city.code    === filterSite;
      const matchSource  = filterSource  === "ALL" || s.source       === filterSource;
      return matchSearch && matchProfil && matchSite && matchSource;
    });

    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "nom")  cmp = a.nom.localeCompare(b.nom, "fr");
      if (sortBy === "date") cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "site") cmp = a.city.code.localeCompare(b.city.code, "fr");
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [students, search, filterProfil, filterSite, filterSource, sortBy, sortAsc]);

  const toggleSort = (col: "nom" | "date" | "site") => {
    if (sortBy === col) setSortAsc((p) => !p);
    else { setSortBy(col); setSortAsc(true); }
  };

  const SortIcon = ({ col }: { col: "nom" | "date" | "site" }) => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      className={sortBy === col ? "text-primary" : "opacity-30"}>
      {sortBy === col && sortAsc
        ? <><path d="m6 15 6-6 6 6" /></>
        : sortBy === col
          ? <><path d="m6 9 6 6 6-6" /></>
          : <><path d="m6 9 6-6 6 6" /><path d="m6 15 6 6 6-6" /></>}
    </svg>
  );

  return (
    <div className="space-y-4">
      {/* Barre de recherche + filtres */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, téléphone, établissement…"
            className="w-full rounded-xl border border-input bg-background pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
        </div>
        <select value={filterProfil} onChange={(e) => setFilterProfil(e.target.value)} className={selClass}>
          <option value="ALL">Tous les profils</option>
          <option value="ETUDIANT_ELEVE">Étudiant/Élève</option>
          <option value="PROF">Professeur</option>
          <option value="SURVEILLANT">Surveillant</option>
          <option value="PARENT">Parent</option>
        </select>
        <select value={filterSite} onChange={(e) => setFilterSite(e.target.value)} className={selClass}>
          <option value="ALL">Tous les sites</option>
          <option value="DKR">DKR</option>
          <option value="DJIB">DJIB</option>
        </select>
        <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className={selClass}>
          <option value="ALL">Toutes sources</option>
          <option value="QR_AUTO">QR auto</option>
          <option value="OPERATOR">Opérateur</option>
        </select>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} personne(s){filtered.length !== students.length && ` sur ${students.length}`}
      </p>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold cursor-pointer select-none hover:text-foreground"
                  onClick={() => toggleSort("nom")}>
                  <span className="inline-flex items-center gap-1.5">Nom / Prénom <SortIcon col="nom" /></span>
                </th>
                <th className="px-4 py-3 text-left font-semibold">Profil</th>
                <th className="px-4 py-3 text-left font-semibold">Téléphone</th>
                <th className="px-4 py-3 text-left font-semibold">Niveau / Info</th>
                <th className="px-4 py-3 text-left font-semibold cursor-pointer select-none hover:text-foreground"
                  onClick={() => toggleSort("site")}>
                  <span className="inline-flex items-center gap-1.5">Site <SortIcon col="site" /></span>
                </th>
                <th className="px-4 py-3 text-left font-semibold">Ajouté par</th>
                <th className="px-4 py-3 text-left font-semibold">Source</th>
                <th className="px-4 py-3 text-left font-semibold cursor-pointer select-none hover:text-foreground"
                  onClick={() => toggleSort("date")}>
                  <span className="inline-flex items-center gap-1.5">Date <SortIcon col="date" /></span>
                </th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => {
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
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-semibold shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="font-medium group-hover:text-primary transition-colors">{s.nom} {s.prenom}</p>
                          {s.etablissement && <p className="text-xs text-muted-foreground">{s.etablissement}</p>}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3"><Badge variant={profil.color}>{profil.label}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{s.telephone}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{niveauInfo}</td>
                    <td className="px-4 py-3">
                      <Badge variant={s.city.code === "DKR" ? "primary" : "warning"}>{s.city.code}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.addedBy?.nomComplet ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={s.source === "QR_AUTO" ? "success" : "outline"}>
                        {s.source === "QR_AUTO" ? "QR auto" : "Opérateur"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">{formatDateTime(s.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/etudiants/${s.id}`}>
                        <Button variant="ghost" size="icon" aria-label="Voir">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m9 18 6-6-6-6" />
                          </svg>
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">Aucune personne trouvée.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
