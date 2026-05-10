"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
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

const STATUT_LABELS: Record<string, { label: string; variant: "success" | "warning" | "outline" | "primary" | "default" }> = {
  EN_ATTENTE: { label: "En attente", variant: "warning" },
  VALIDEE:    { label: "Validée",    variant: "success" },
  REJETEE:    { label: "Rejetée",    variant: "outline" },
};

// ─── Dropdown Actions ────────────────────────────────────────────────────────

function ActionDropdown({ inscription, onUpdate }: {
  inscription: Inscription;
  onUpdate: (id: string, statut: "EN_ATTENTE" | "VALIDEE" | "REJETEE") => void;
}) {
  const [open, setOpen] = useState(false);
  const ref             = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleStatut = async (statut: "VALIDEE" | "REJETEE" | "EN_ATTENTE") => {
    setOpen(false);
    onUpdate(inscription.id, statut);
    await updateStatutInscription(inscription.id, statut);
  };

  const shareInscriptionUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/inscription`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
        aria-label="Actions"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-30 w-44 rounded-xl border border-border bg-card shadow-lg py-1 text-sm">
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
          <Link href={`/inscriptions/${inscription.id}/modifier`}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary transition-colors text-left">
            <IconEdit /> Modifier
          </Link>
          <a href={shareInscriptionUrl} target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary transition-colors text-left">
            <IconShare /> Partager le formulaire
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

export function InscriptionsClient({ inscriptions: initial }: { inscriptions: Inscription[] }) {
  const [inscriptions, setInscriptions] = useState(initial);
  const [search, setSearch]             = useState("");
  const [filterStatut, setFilterStatut] = useState("ALL");
  const [filterType, setFilterType]     = useState("ALL");
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading]   = useState(false);

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

  const allSelected   = filtered.length > 0 && filtered.every((i) => selected.has(i.id));
  const someSelected  = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((i) => i.id)));
  };
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const bulkAction = async (statut: "VALIDEE" | "REJETEE") => {
    setBulkLoading(true);
    const ids = [...selected];
    await Promise.all(ids.map((id) => updateStatutInscription(id, statut)));
    setInscriptions((prev) => prev.map((i) => selected.has(i.id) ? { ...i, statut } : i));
    setSelected(new Set());
    setBulkLoading(false);
  };

  const selClass = "rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

  return (
    <div className="space-y-4">
      {/* Barre de recherche + filtres */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, téléphone, formation…"
            className="w-full rounded-xl border border-input bg-background pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} className={selClass}>
          <option value="ALL">Tous les statuts</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="VALIDEE">Validée</option>
          <option value="REJETEE">Rejetée</option>
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={selClass}>
          <option value="ALL">Tous les types</option>
          <option value="ADULTE">Adulte</option>
          <option value="PARENT">Parent</option>
        </select>
      </div>

      {/* Actions groupées */}
      {someSelected && (
        <div className="flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/20 px-4 py-2.5 text-sm">
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

      {/* Résumé */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} inscription(s) affichée(s)
        {filtered.length !== inscriptions.length && ` sur ${inscriptions.length}`}
      </p>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 w-8">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll}
                    className="rounded border-input accent-primary" />
                </th>
                <th className="px-4 py-3 text-left font-semibold">Statut</th>
                <th className="px-4 py-3 text-left font-semibold">Contact</th>
                <th className="px-4 py-3 text-left font-semibold">Formation</th>
                <th className="px-4 py-3 text-left font-semibold">Montant</th>
                <th className="px-4 py-3 text-left font-semibold">Enfants</th>
                <th className="px-4 py-3 text-left font-semibold">Reçu</th>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((ins) => {
                const s = STATUT_LABELS[ins.statut];
                return (
                  <tr key={ins.id} className={`hover:bg-secondary/30 transition-colors ${selected.has(ins.id) ? "bg-primary/5" : ""}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(ins.id)} onChange={() => toggleOne(ins.id)}
                        className="rounded border-input accent-primary" />
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{ins.nomParent ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {ins.type === "ADULTE" ? "Adulte" : "Parent"} · {ins.countryCode ?? ""}{ins.telephone}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{ins.formation.nom}</p>
                      <p className="text-xs text-muted-foreground">{ins.formation.categorie === "ENFANT" ? "Enfant" : "Adulte"}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground tabular-nums">
                      {ins.formation.prix ? `${ins.formation.prix} ${ins.formation.devise}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {ins.enfants.length === 0 ? <span className="text-muted-foreground">—</span> : (
                        <div className="space-y-0.5">
                          {ins.enfants.map((e, i) => <p key={i} className="text-xs">{i + 1}. {e.nom}</p>)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {ins.recuUrl ? (
                        <a href={ins.recuUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary underline underline-offset-2 hover:opacity-80">
                          Voir
                        </a>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                      {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(ins.createdAt))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ActionDropdown inscription={ins} onUpdate={handleUpdate} />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Aucune inscription trouvée.
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

// ── Icônes ──────────────────────────────────────────────────────────────────
function IconCheck() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>; }
function IconX()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>; }
function IconClock() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>; }
function IconEdit()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>; }
function IconShare() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>; }
