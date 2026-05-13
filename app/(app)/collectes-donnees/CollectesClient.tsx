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
  genre: string | null;
  profileType: ProfileType;
  telephone: string;
  niveauScolaire: string | null;
  classe: string | null;
  nombreEleves: number | null;
  etablissement: string | null;
  adresse: string | null;
  source: string;
  createdAt: Date;
  city: { code: string; nom: string };
  addedBy: { nomComplet: string } | null;
  campaign: { id: string; titre: string } | null;
};

type Campaign = { id: string; titre: string };

const profileLabels: Record<ProfileType, { label: string; color: "primary" | "warning" | "outline" | "success" }> = {
  ETUDIANT_ELEVE: { label: "Étudiant/Élève", color: "primary" },
  PROF:           { label: "Professeur",      color: "success" },
  SURVEILLANT:    { label: "Surveillant",      color: "warning" },
  PARENT:         { label: "Parent",           color: "outline" },
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(date));
}

// ─── Export CSV ──────────────────────────────────────────────────────────────

function exportCsv(students: Student[]) {
  const sep = ";";
  const header = ["Nom", "Prénom", "Profil", "Genre", "Téléphone", "Adresse", "Niveau/Classe", "Établissement", "Site", "Source", "Tournée", "Ajouté par", "Date"].join(sep);
  const rows = students.map((s) => [
    s.nom,
    s.prenom ?? "",
    profileLabels[s.profileType]?.label ?? s.profileType,
    s.genre === "M" ? "Masculin" : s.genre === "F" ? "Féminin" : "",
    s.telephone,
    s.adresse ?? "",
    [s.niveauScolaire, s.classe].filter(Boolean).join(" — ") || (s.nombreEleves != null ? `${s.nombreEleves} élève(s)` : ""),
    s.etablissement ?? "",
    s.city.code,
    s.source === "QR_AUTO" ? "QR auto" : "Opérateur",
    s.campaign?.titre ?? "",
    s.addedBy?.nomComplet ?? "",
    formatDateTime(s.createdAt),
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(sep));

  const bom = "\uFEFF";
  const content = bom + [header, ...rows].join("\r\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `collectes-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Export Excel (SpreadsheetML, aucune dépendance) ─────────────────────────

function escapeXml(v: string) {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function exportExcel(students: Student[]) {
  const cols = ["Nom", "Prénom", "Profil", "Genre", "Téléphone", "Adresse", "Niveau/Classe", "Établissement", "Site", "Source", "Tournée", "Ajouté par", "Date"];
  const rows = students.map((s) => [
    s.nom,
    s.prenom ?? "",
    profileLabels[s.profileType]?.label ?? s.profileType,
    s.genre === "M" ? "Masculin" : s.genre === "F" ? "Féminin" : "",
    s.telephone,
    s.adresse ?? "",
    [s.niveauScolaire, s.classe].filter(Boolean).join(" — ") || (s.nombreEleves != null ? `${s.nombreEleves} élève(s)` : ""),
    s.etablissement ?? "",
    s.city.code,
    s.source === "QR_AUTO" ? "QR auto" : "Opérateur",
    s.campaign?.titre ?? "",
    s.addedBy?.nomComplet ?? "",
    formatDateTime(s.createdAt),
  ]);

  const makeRow = (values: string[]) =>
    `<Row>${values.map((v) => `<Cell><Data ss:Type="String">${escapeXml(String(v))}</Data></Cell>`).join("")}</Row>`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:x="urn:schemas-microsoft-com:office:excel">
  <Styles>
    <Style ss:ID="header"><Font ss:Bold="1"/><Interior ss:Color="#EEF2FF" ss:Pattern="Solid"/></Style>
  </Styles>
  <Worksheet ss:Name="Collectes">
    <Table>
      ${makeRow(cols).replace("<Row>", '<Row ss:StyleID="header">')}
      ${rows.map(makeRow).join("\n      ")}
    </Table>
  </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `collectes-${new Date().toISOString().slice(0, 10)}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Composant ───────────────────────────────────────────────────────────────

const selClass = "rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

export function CollectesClient({
  students,
  campaigns,
  totalCount,
}: {
  students: Student[];
  campaigns: Campaign[];
  totalCount: number;
}) {
  const [search, setSearch]               = useState("");
  const [filterProfil, setFilterProfil]   = useState("ALL");
  const [filterSite, setFilterSite]       = useState("ALL");
  const [filterSource, setFilterSource]   = useState("ALL");
  const [filterCampaign, setFilterCampaign] = useState("ALL");
  const [sortBy, setSortBy]               = useState<"nom" | "date" | "site">("date");
  const [sortAsc, setSortAsc]             = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = students.filter((s) => {
      const fullName = `${s.nom} ${s.prenom ?? ""}`.toLowerCase();
      const matchSearch  = !q || fullName.includes(q) || s.telephone.includes(q) || (s.etablissement ?? "").toLowerCase().includes(q);
      const matchProfil  = filterProfil  === "ALL" || s.profileType  === filterProfil;
      const matchSite    = filterSite    === "ALL" || s.city.code    === filterSite;
      const matchSource  = filterSource  === "ALL" || s.source       === filterSource;
      const matchCampaign = filterCampaign === "ALL"
        || (filterCampaign === "NONE" && !s.campaign)
        || s.campaign?.id === filterCampaign;
      return matchSearch && matchProfil && matchSite && matchSource && matchCampaign;
    });

    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "nom")  cmp = a.nom.localeCompare(b.nom, "fr");
      if (sortBy === "date") cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "site") cmp = a.city.code.localeCompare(b.city.code, "fr");
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [students, search, filterProfil, filterSite, filterSource, filterCampaign, sortBy, sortAsc]);

  const toggleSort = (col: "nom" | "date" | "site") => {
    if (sortBy === col) setSortAsc((p) => !p);
    else { setSortBy(col); setSortAsc(true); }
  };

  const SortIcon = ({ col }: { col: "nom" | "date" | "site" }) => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      className={sortBy === col ? "text-primary" : "opacity-30"}>
      {sortBy === col && sortAsc
        ? <path d="m6 15 6-6 6 6" />
        : sortBy === col
          ? <path d="m6 9 6 6 6-6" />
          : <><path d="m6 9 6-6 6 6" /><path d="m6 15 6 6 6-6" /></>}
    </svg>
  );

  return (
    <div className="space-y-4">
      {/* ── En-tête : titre + actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Liste des données collectées</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{totalCount} enregistrement(s)</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="md" onClick={() => exportCsv(filtered)}>
            <IconDownload /> CSV
          </Button>
          <Button variant="outline" size="md" onClick={() => exportExcel(filtered)}>
            <IconDownload /> Excel
          </Button>
          <a href="/collectes-donnees/ajouter">
            <Button size="md">
              <IconPlus /> Ajouter
            </Button>
          </a>
        </div>
      </div>

      {/* Recherche + filtres */}
      <div className="space-y-2">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, téléphone, établissement…"
            className="w-full rounded-xl border border-input bg-background pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={filterProfil} onChange={(e) => setFilterProfil(e.target.value)} className={selClass + " flex-1 min-w-[140px]"}>
            <option value="ALL">Tous profils</option>
            <option value="ETUDIANT_ELEVE">Étudiant/Élève</option>
            <option value="PROF">Professeur</option>
            <option value="SURVEILLANT">Surveillant</option>
            <option value="PARENT">Parent</option>
          </select>
          <select value={filterSite} onChange={(e) => setFilterSite(e.target.value)} className={selClass + " flex-1 min-w-[100px]"}>
            <option value="ALL">Tous sites</option>
            <option value="DKR">DKR</option>
            <option value="DJIB">DJIB</option>
          </select>
          <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className={selClass + " flex-1 min-w-[120px]"}>
            <option value="ALL">Toutes sources</option>
            <option value="QR_AUTO">QR auto</option>
            <option value="OPERATEUR">Opérateur</option>
          </select>
          <select value={filterCampaign} onChange={(e) => setFilterCampaign(e.target.value)} className={selClass + " flex-1 min-w-[160px]"}>
            <option value="ALL">Toutes tournées</option>
            <option value="NONE">Sans tournée</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.titre}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} enregistrement(s){filtered.length !== students.length && ` sur ${students.length}`}
      </p>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold cursor-pointer select-none hover:text-foreground whitespace-nowrap"
                  onClick={() => toggleSort("nom")}>
                  <span className="inline-flex items-center gap-1.5">Nom / Prénom <SortIcon col="nom" /></span>
                </th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Profil</th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Téléphone</th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Niveau / Info</th>
                <th className="px-4 py-3 text-left font-semibold cursor-pointer select-none hover:text-foreground whitespace-nowrap"
                  onClick={() => toggleSort("site")}>
                  <span className="inline-flex items-center gap-1.5">Site <SortIcon col="site" /></span>
                </th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Tournée</th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Source</th>
                <th className="px-4 py-3 text-left font-semibold cursor-pointer select-none hover:text-foreground whitespace-nowrap"
                  onClick={() => toggleSort("date")}>
                  <span className="inline-flex items-center gap-1.5">Date <SortIcon col="date" /></span>
                </th>
                <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">Actions</th>
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
                    <td className="px-4 py-3 min-w-[160px]">
                      <Link href={`/collectes-donnees/${s.id}`} className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-semibold shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="font-medium group-hover:text-primary transition-colors whitespace-nowrap">
                            {s.nom} {s.prenom}
                          </p>
                          {s.etablissement && (
                            <p className="text-xs text-muted-foreground truncate max-w-[140px]">{s.etablissement}</p>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant={profil.color}>{profil.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums whitespace-nowrap">{s.telephone}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{niveauInfo}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant={s.city.code === "DKR" ? "primary" : "warning"}>{s.city.code}</Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {s.campaign ? (
                        <span className="text-xs text-muted-foreground">{s.campaign.titre}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant={s.source === "QR_AUTO" ? "success" : "outline"}>
                        {s.source === "QR_AUTO" ? "QR auto" : "Opérateur"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                      {formatDateTime(s.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link href={`/collectes-donnees/${s.id}`}>
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
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Aucune donnée collectée trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
