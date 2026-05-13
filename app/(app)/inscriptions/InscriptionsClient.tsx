"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { QRCodeCanvas } from "qrcode.react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { updateStatutInscription } from "./actions";

type Inscription = {
  id: string;
  type: "ADULTE" | "PARENT";
  statut: "EN_ATTENTE" | "VALIDEE" | "REJETEE";
  nomParent: string | null;
  telephone: string;
  countryCode: string | null;
  adresse: string | null;
  recuUrl: string | null;
  createdAt: Date;
  formation: { nom: string; categorie: string; prix: string | null; devise: string };
  enfants: { nom: string }[];
  addedBy: { nomComplet: string } | null;
};

const STATUT_LABELS: Record<string, {
  label: string;
  variant: "success" | "warning" | "outline" | "primary" | "default";
}> = {
  EN_ATTENTE: { label: "En attente", variant: "warning" },
  VALIDEE:    { label: "Validée",    variant: "success" },
  REJETEE:    { label: "Rejetée",    variant: "outline" },
};

// ─── Dropdown avec position fixe (évite le clip de overflow-x-auto) ──────────

function ActionDropdown({ inscription, onUpdate }: {
  inscription: Inscription;
  onUpdate: (id: string, statut: "EN_ATTENTE" | "VALIDEE" | "REJETEE") => void;
}) {
  const [open, setOpen]     = useState(false);
  const [pos, setPos]       = useState<{ top: number; right: number } | null>(null);
  const btnRef              = useRef<HTMLButtonElement>(null);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if ("key" in e && e.key !== "Escape") return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const handleStatut = async (statut: "VALIDEE" | "REJETEE" | "EN_ATTENTE") => {
    setOpen(false);
    onUpdate(inscription.id, statut);
    await updateStatutInscription(inscription.id, statut);
  };

  const menu = open && pos ? createPortal(
    <div
      style={{ position: "fixed", top: pos.top, right: pos.right, zIndex: 9999 }}
      className="w-48 rounded-xl border border-border bg-card shadow-xl py-1 text-sm"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {inscription.statut !== "VALIDEE" && (
        <button onClick={() => handleStatut("VALIDEE")}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary transition-colors text-left text-green-700 dark:text-green-400">
          <IconCheck /> Valider
        </button>
      )}
      {inscription.statut !== "REJETEE" && (
        <button onClick={() => handleStatut("REJETEE")}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary transition-colors text-left text-destructive">
          <IconX /> Rejeter
        </button>
      )}
      {inscription.statut !== "EN_ATTENTE" && (
        <button onClick={() => handleStatut("EN_ATTENTE")}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary transition-colors text-left text-muted-foreground">
          <IconClock /> Remettre en attente
        </button>
      )}
      <div className="my-1 border-t border-border" />
      <a href={`/inscriptions/${inscription.id}/modifier`}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary transition-colors text-left">
        <IconEdit /> Modifier
      </a>
    </div>,
    document.body,
  ) : null;

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
        aria-label="Actions"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" />
        </svg>
      </button>
      {menu}
    </div>
  );
}

// ─── Modal QR code inscription publique ──────────────────────────────────────

function QRModal({ url, onClose }: { url: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const handleDownload = () => {
    const canvas = document.getElementById("insc-qr") as HTMLCanvasElement | null;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = "dpa-inscription-qr.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "Inscription DPA", url }); } catch {}
    } else { handleCopy(); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card shadow-xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">QR code — Formulaire d'inscription</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Ce QR code mène directement au formulaire public d'inscription aux formations.
        </p>
        <div className="flex justify-center">
          <div className="p-3 rounded-xl bg-white shadow-sm">
            <QRCodeCanvas id="insc-qr" value={url} size={180} level="M" />
          </div>
        </div>
        <div className="rounded-lg bg-secondary/50 border border-border px-3 py-2 text-xs font-mono text-muted-foreground break-all">{url}</div>
        <div className="grid grid-cols-1 gap-2">
          <Button size="md" className="w-full gap-2" onClick={handleShare}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            Partager le lien
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleCopy}>
              {copied ? "✓ Copié !" : "Copier le lien"}
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleDownload}>
              Télécharger PNG
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

export function InscriptionsClient({
  inscriptions: initial,
  appUrl,
  totalCount,
}: {
  inscriptions: Inscription[];
  appUrl: string;
  totalCount: number;
}) {
  const [inscriptions, setInscriptions] = useState(initial);
  const [search, setSearch]             = useState("");
  const [filterStatut, setFilterStatut] = useState("ALL");
  const [filterType, setFilterType]     = useState("ALL");
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading]   = useState(false);
  const [showQR, setShowQR]             = useState(false);

  const handleUpdate = (id: string, statut: "EN_ATTENTE" | "VALIDEE" | "REJETEE") => {
    setInscriptions((prev) => prev.map((i) => i.id === id ? { ...i, statut } : i));
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return inscriptions.filter((i) => {
      const matchSearch =
        !q ||
        (i.nomParent ?? "").toLowerCase().includes(q) ||
        i.telephone.includes(q) ||
        i.formation.nom.toLowerCase().includes(q);
      const matchStatut = filterStatut === "ALL" || i.statut === filterStatut;
      const matchType   = filterType   === "ALL" || i.type   === filterType;
      return matchSearch && matchStatut && matchType;
    });
  }, [inscriptions, search, filterStatut, filterType]);

  const allSelected  = filtered.length > 0 && filtered.every((i) => selected.has(i.id));
  const someSelected = selected.size > 0;
  const toggleAll    = () => { if (allSelected) setSelected(new Set()); else setSelected(new Set(filtered.map((i) => i.id))); };
  const toggleOne    = (id: string) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const bulkAction = async (statut: "VALIDEE" | "REJETEE") => {
    setBulkLoading(true);
    const ids = [...selected];
    await Promise.all(ids.map((id) => updateStatutInscription(id, statut)));
    setInscriptions((prev) => prev.map((i) => selected.has(i.id) ? { ...i, statut } : i));
    setSelected(new Set());
    setBulkLoading(false);
  };

  const inscriptionUrl = `${appUrl}/inscription`;
  const selClass = "rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

  return (
    <>
      {showQR && <QRModal url={inscriptionUrl} onClose={() => setShowQR(false)} />}

      <div className="space-y-4">
        {/* ── Header : titre + boutons ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Inscriptions aux formations</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalCount} inscription(s) enregistrée(s)
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="md" onClick={() => exportCsvInscriptions(filtered)}>
              <IconDownload /> CSV
            </Button>
            <Button variant="outline" size="md" onClick={() => exportExcelInscriptions(filtered)}>
              <IconDownload /> Excel
            </Button>
            <Button variant="outline" size="md" onClick={() => setShowQR(true)}>
              <IconQr /> Partager QR
            </Button>
            <a href="/inscriptions/ajouter">
              <Button size="md">
                <IconPlus /> Ajouter
              </Button>
            </a>
          </div>
        </div>

        {/* Barre de recherche + filtres */}
        <div className="space-y-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, téléphone, formation…"
              className="w-full rounded-xl border border-input bg-background pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} className={selClass + " flex-1 min-w-[130px]"}>
              <option value="ALL">Tous statuts</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="VALIDEE">Validée</option>
              <option value="REJETEE">Rejetée</option>
            </select>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={selClass + " flex-1 min-w-[110px]"}>
              <option value="ALL">Tous types</option>
              <option value="ADULTE">Adulte</option>
              <option value="PARENT">Parent</option>
            </select>
          </div>
        </div>

        {/* Actions groupées */}
        {someSelected && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-primary/5 border border-primary/20 px-4 py-2.5 text-sm">
            <span className="font-medium">{selected.size} sélectionné(s)</span>
            <button disabled={bulkLoading} onClick={() => bulkAction("VALIDEE")}
              className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50">
              ✓ Valider
            </button>
            <button disabled={bulkLoading} onClick={() => bulkAction("REJETEE")}
              className="px-3 py-1.5 rounded-lg bg-destructive text-white text-xs font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50">
              ✗ Rejeter
            </button>
            <button onClick={() => setSelected(new Set())} className="ml-auto text-muted-foreground hover:text-foreground text-xs">
              Désélectionner
            </button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {filtered.length} inscription(s){filtered.length !== inscriptions.length && ` sur ${inscriptions.length}`}
        </p>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 w-8">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-input accent-primary" />
                  </th>
                  <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Statut</th>
                  <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Contact</th>
                  <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Formation</th>
                  <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Montant</th>
                  <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Enfants</th>
                  <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Reçu</th>
                  <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Date</th>
                  <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((ins) => {
                  const s = STATUT_LABELS[ins.statut];
                  return (
                    <tr key={ins.id} className={`hover:bg-secondary/30 transition-colors ${selected.has(ins.id) ? "bg-primary/5" : ""}`}>
                      <td className="px-3 py-3">
                        <input type="checkbox" checked={selected.has(ins.id)} onChange={() => toggleOne(ins.id)} className="rounded border-input accent-primary" />
                      </td>
                      <td className="px-3 py-3"><Badge variant={s.variant}>{s.label}</Badge></td>
                      <td className="px-3 py-3 min-w-[140px]">
                        <p className="font-medium">{ins.nomParent ?? "—"}</p>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {ins.type === "ADULTE" ? "Adulte" : "Parent"} · {ins.countryCode ?? ""}{ins.telephone}
                        </p>
                      </td>
                      <td className="px-3 py-3 min-w-[140px]">
                        <p className="font-medium">{ins.formation.nom}</p>
                        <p className="text-xs text-muted-foreground">{ins.formation.categorie === "ENFANT" ? "Enfant" : "Adulte"}</p>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-muted-foreground tabular-nums">
                        {ins.formation.prix ? `${ins.formation.prix} ${ins.formation.devise}` : "—"}
                      </td>
                      <td className="px-3 py-3 min-w-[100px]">
                        {ins.enfants.length === 0
                          ? <span className="text-muted-foreground">—</span>
                          : <div className="space-y-0.5">{ins.enfants.map((e, i) => <p key={i} className="text-xs">{i + 1}. {e.nom}</p>)}</div>}
                      </td>
                      <td className="px-3 py-3">
                        {ins.recuUrl
                          ? <a href={ins.recuUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline underline-offset-2 hover:opacity-80">Voir</a>
                          : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground whitespace-nowrap text-xs">
                        {new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(ins.createdAt))}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <ActionDropdown inscription={ins} onUpdate={handleUpdate} />
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">Aucune inscription trouvée.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Export CSV ──────────────────────────────────────────────────────────────

function exportCsvInscriptions(inscriptions: Inscription[]) {
  const sep = ";";
  const header = ["Statut", "Type", "Nom/Parent", "Téléphone", "Adresse", "Formation", "Catégorie", "Montant", "Devise", "Nb enfants", "Noms enfants", "Reçu", "Ajouté par", "Date"].join(sep);
  const rows = inscriptions.map((i) => [
    i.statut === "EN_ATTENTE" ? "En attente" : i.statut === "VALIDEE" ? "Validée" : "Rejetée",
    i.type === "ADULTE" ? "Adulte" : "Parent",
    i.nomParent ?? "",
    `${i.countryCode ?? ""}${i.telephone}`,
    i.adresse ?? "",
    i.formation.nom,
    i.formation.categorie === "ENFANT" ? "Enfant" : "Adulte",
    i.formation.prix ?? "",
    i.formation.devise,
    String(i.enfants.length),
    i.enfants.map((e) => e.nom).join(", "),
    i.recuUrl ?? "",
    i.addedBy?.nomComplet ?? "",
    new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(i.createdAt)),
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(sep));

  const bom = "\uFEFF";
  const content = bom + [header, ...rows].join("\r\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inscriptions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportExcelInscriptions(inscriptions: Inscription[]) {
  const cols = ["Statut", "Type", "Nom/Parent", "Téléphone", "Adresse", "Formation", "Catégorie", "Montant", "Devise", "Nb enfants", "Noms enfants", "Reçu", "Ajouté par", "Date"];
  const rows = inscriptions.map((i) => [
    i.statut === "EN_ATTENTE" ? "En attente" : i.statut === "VALIDEE" ? "Validée" : "Rejetée",
    i.type === "ADULTE" ? "Adulte" : "Parent",
    i.nomParent ?? "",
    `${i.countryCode ?? ""}${i.telephone}`,
    i.adresse ?? "",
    i.formation.nom,
    i.formation.categorie === "ENFANT" ? "Enfant" : "Adulte",
    i.formation.prix ?? "",
    i.formation.devise,
    String(i.enfants.length),
    i.enfants.map((e) => e.nom).join(", "),
    i.recuUrl ?? "",
    i.addedBy?.nomComplet ?? "",
    new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(i.createdAt)),
  ]);

  const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const makeRow = (vals: string[], style?: string) =>
    `<Row${style ? ` ss:StyleID="${style}"` : ""}>${vals.map((v) => `<Cell><Data ss:Type="String">${esc(String(v))}</Data></Cell>`).join("")}</Row>`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles><Style ss:ID="h"><Font ss:Bold="1"/><Interior ss:Color="#EEF2FF" ss:Pattern="Solid"/></Style></Styles>
  <Worksheet ss:Name="Inscriptions">
    <Table>
      ${makeRow(cols, "h")}
      ${rows.map((r) => makeRow(r)).join("\n      ")}
    </Table>
  </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inscriptions-${new Date().toISOString().slice(0, 10)}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

function IconDownload() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconCheck() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>; }
function IconX()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>; }
function IconClock() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>; }
function IconEdit()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>; }
function IconQr()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3" /><path d="M21 14v0" /><path d="M14 21h7" /><path d="M21 17v4" /></svg>; }
function IconPlus()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>; }
