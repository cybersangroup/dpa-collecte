"use client";

import { useActionState, useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { QRCodeCanvas } from "qrcode.react";
import {
  createFormation,
  updateFormation,
  deleteFormation,
  toggleFormationActif,
  createShift,
  deleteShift,
  type FormationFormState,
} from "@/app/(app)/inscriptions/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type Shift = {
  id: string;
  label: string;
  heureDebut: string;
  heureFin: string;
};

type Formation = {
  id: string;
  nom: string;
  description: string | null;
  categorie: "ENFANT" | "ADULTE";
  duree: string | null;
  prix: string | null;
  devise: string;
  frequence: string | null;
  jours: string | null;
  actif: boolean;
  shifts: Shift[];
  _count: { inscriptions: number };
};

type Props = {
  formations: Formation[];
  isAdmin: boolean;
  appUrl: string;
};

// ─── Formulaire création / édition ───────────────────────────────────────────

function FormationForm({ initial, onSuccess, onCancel }: {
  initial?: Formation; onSuccess: () => void; onCancel: () => void;
}) {
  const action = initial ? updateFormation.bind(null, initial.id) : createFormation;
  const [state, formAction, isPending] = useActionState<FormationFormState, FormData>(action, { status: "idle" });

  useEffect(() => { if (state.status === "success") onSuccess(); }, [state, onSuccess]);

  const inp = "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";
  const lbl = "block text-xs font-medium text-muted-foreground mb-1";

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className={lbl}>Nom *</label>
          <input name="nom" required defaultValue={initial?.nom} placeholder="Ex. Formation CCNA Cisco" className={inp} />
        </div>
        <div className="sm:col-span-2">
          <label className={lbl}>Description</label>
          <textarea name="description" rows={2} defaultValue={initial?.description ?? ""} className={inp + " resize-none"} />
        </div>
        <div>
          <label className={lbl}>Catégorie *</label>
          <select name="categorie" defaultValue={initial?.categorie ?? "ADULTE"} className={inp}>
            <option value="ADULTE">Adulte</option>
            <option value="ENFANT">Enfant</option>
          </select>
        </div>
        <div>
          <label className={lbl}>Durée</label>
          <input name="duree" defaultValue={initial?.duree ?? ""} placeholder="Ex. 2 semaines" className={inp} />
        </div>
        <div>
          <label className={lbl}>Montant</label>
          <input name="prix" defaultValue={initial?.prix ?? ""} placeholder="Ex. 35 000" className={inp} />
        </div>
        <div>
          <label className={lbl}>Devise</label>
          <select name="devise" defaultValue={initial?.devise ?? "FCFA"} className={inp}>
            <option value="FCFA">FCFA</option>
            <option value="FDJ">FDJ</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <div>
          <label className={lbl}>Fréquence</label>
          <input name="frequence" defaultValue={initial?.frequence ?? ""} placeholder="Ex. 2x / semaine" className={inp} />
        </div>
        <div>
          <label className={lbl}>Jours</label>
          <input name="jours" defaultValue={initial?.jours ?? ""} placeholder="Ex. Mardi - Jeudi" className={inp} />
        </div>
        {initial && (
          <div>
            <label className={lbl}>Statut</label>
            <select name="actif" defaultValue={String(initial.actif)} className={inp}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        )}
      </div>
      {state.status === "error" && <p className="text-xs text-destructive">{state.message}</p>}
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={isPending} className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60">
          {isPending ? "Enregistrement…" : initial ? "Enregistrer" : "Créer la formation"}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border border-input bg-background text-sm hover:bg-secondary transition-colors">Annuler</button>
      </div>
    </form>
  );
}

// ─── Modal formulaire (création / édition) ───────────────────────────────────

function FormationModal({ initial, onSuccess, onClose }: {
  initial?: Formation;
  onSuccess: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl p-6 my-6"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold">
            {initial ? `Modifier — ${initial.nom}` : "Nouvelle formation"}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <FormationForm initial={initial} onSuccess={onSuccess} onCancel={onClose} />
      </div>
    </div>,
    document.body,
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
    const canvas = document.getElementById("form-qr") as HTMLCanvasElement | null;
    if (!canvas) return;
    const a = document.createElement("a"); a.download = "dpa-inscription-qr.png"; a.href = canvas.toDataURL("image/png"); a.click();
  };

  const handleShare = async () => {
    if (navigator.share) { try { await navigator.share({ title: "Inscription DPA", url }); } catch {} } else { handleCopy(); }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card shadow-xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">QR code — Formulaire d&apos;inscription</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="flex justify-center">
          <div className="p-3 rounded-xl bg-white shadow-sm">
            <QRCodeCanvas id="form-qr" value={url} size={180} level="M" />
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
            <Button variant="outline" size="sm" onClick={handleCopy}>{copied ? "✓ Copié !" : "Copier le lien"}</Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>Télécharger PNG</Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── Gestion des créneaux ─────────────────────────────────────────────────────

function ShiftManager({ formation, isAdmin }: { formation: Formation; isAdmin: boolean }) {
  const [shifts, setShifts] = useState<Shift[]>(formation.shifts);
  const [label, setLabel]   = useState("Matin");
  const [debut, setDebut]   = useState("07H00");
  const [fin, setFin]       = useState("11H00");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const handleAdd = async () => {
    setError(null); setLoading(true);
    const res = await createShift(formation.id, label, debut, fin);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    window.location.reload();
  };

  const handleDelete = async (id: string) => {
    const res = await deleteShift(id);
    if (res.error) { setError(res.error); return; }
    setShifts((s) => s.filter((x) => x.id !== id));
  };

  const inp = "rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Créneaux horaires</p>
      {shifts.length === 0 && <p className="text-xs text-muted-foreground italic">Aucun créneau défini.</p>}
      <div className="flex flex-wrap gap-2">
        {shifts.map((s) => (
          <div key={s.id} className="flex items-center gap-1.5 bg-secondary rounded-lg px-2.5 py-1.5 text-xs">
            <span className="font-medium">{s.label}</span>
            <span className="text-muted-foreground">{s.heureDebut}–{s.heureFin}</span>
            {isAdmin && (
              <button onClick={() => handleDelete(s.id)} className="ml-1 text-muted-foreground hover:text-destructive transition-colors">×</button>
            )}
          </div>
        ))}
      </div>
      {isAdmin && (
        <div className="flex flex-wrap items-end gap-2 pt-1">
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Shift</p>
            <select value={label} onChange={(e) => setLabel(e.target.value)} className={inp}>
              <option>Matin</option><option>Midi</option><option>Soir</option><option>Journée</option>
            </select>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Début</p>
            <input value={debut} onChange={(e) => setDebut(e.target.value)} placeholder="07H00" className={inp + " w-20"} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Fin</p>
            <input value={fin} onChange={(e) => setFin(e.target.value)} placeholder="11H00" className={inp + " w-20"} />
          </div>
          <button onClick={handleAdd} disabled={loading} className="py-1.5 px-3 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50">
            + Ajouter
          </button>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

export function FormationsClient({ formations: initial, isAdmin, appUrl }: Props) {
  const [formations, setFormations]   = useState(initial);
  const [showCreate, setShowCreate]   = useState(false);
  const [editTarget, setEditTarget]   = useState<Formation | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toggling, setToggling]       = useState<string | null>(null);
  const [showQR, setShowQR]           = useState(false);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Recherche & filtres
  const [search, setSearch]                   = useState("");
  const [filterCategorie, setFilterCategorie] = useState("ALL");
  const [filterStatut, setFilterStatut]       = useState("ALL");

  const reload = () => window.location.reload();

  const handleDelete = async (id: string) => {
    setDeleteError(null);
    const res = await deleteFormation(id);
    if (res.error) setDeleteError(res.error);
    else { setFormations((f) => f.filter((x) => x.id !== id)); setSelected((s) => { const n = new Set(s); n.delete(id); return n; }); }
  };

  const handleBulkDelete = async () => {
    setBulkLoading(true);
    const ids = [...selected];
    const results = await Promise.all(ids.map((id) => deleteFormation(id)));
    const errors = results.filter((r) => r.error);
    if (errors.length === 0) {
      setFormations((f) => f.filter((x) => !selected.has(x.id)));
      setSelected(new Set());
    } else {
      setDeleteError(`${errors.length} formation(s) impossible(s) à supprimer (ont des inscriptions).`);
    }
    setBulkLoading(false);
  };

  const handleToggle = async (id: string, actif: boolean) => {
    setToggling(id);
    await toggleFormationActif(id, actif);
    setFormations((f) => f.map((x) => (x.id === id ? { ...x, actif } : x)));
    setToggling(null);
  };

  const filteredFormations = useMemo(() => {
    const q = search.toLowerCase();
    return formations.filter((f) => {
      const matchSearch = !q || f.nom.toLowerCase().includes(q) || (f.description ?? "").toLowerCase().includes(q);
      const matchCat    = filterCategorie === "ALL" || f.categorie === filterCategorie;
      const matchStatut = filterStatut    === "ALL"
        || (filterStatut === "ACTIVE"   && f.actif)
        || (filterStatut === "INACTIVE" && !f.actif);
      return matchSearch && matchCat && matchStatut;
    });
  }, [formations, search, filterCategorie, filterStatut]);

  const enfants = filteredFormations.filter((f) => f.categorie === "ENFANT");
  const adultes  = filteredFormations.filter((f) => f.categorie === "ADULTE");

  const toggleOne = (id: string) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected = filteredFormations.length > 0 && filteredFormations.every((f) => selected.has(f.id));
  const toggleAll = () => { if (allSelected) setSelected(new Set()); else setSelected(new Set(filteredFormations.map((f) => f.id))); };

  const inpCls = "rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";
  const inscriptionUrl = `${appUrl}/inscription`;

  return (
    <>
      {/* Modals */}
      {showQR && <QRModal url={inscriptionUrl} onClose={() => setShowQR(false)} />}
      {showCreate && <FormationModal onSuccess={reload} onClose={() => setShowCreate(false)} />}
      {editTarget && <FormationModal initial={editTarget} onSuccess={reload} onClose={() => setEditTarget(null)} />}

      <div className="space-y-5">
        {/* ── Header : titre + boutons ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Gestion des formations</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {formations.length} formation(s) — adultes et enfants
              {!isAdmin && " · En lecture seule (opérateur)"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="md" onClick={() => setShowQR(true)}>
              <IconQr /> Partager QR
            </Button>
            {isAdmin && (
              <Button size="md" onClick={() => setShowCreate(true)}>
                <IconPlus /> Ajouter une formation
              </Button>
            )}
          </div>
        </div>

        {/* ── Recherche & filtres ── */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une formation…"
              className="w-full rounded-xl border border-input bg-background pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
          </div>
          <select value={filterCategorie} onChange={(e) => setFilterCategorie(e.target.value)} className={inpCls}>
            <option value="ALL">Toutes catégories</option>
            <option value="ADULTE">Adulte</option>
            <option value="ENFANT">Enfant</option>
          </select>
          <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} className={inpCls}>
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {/* ── Actions groupées ── */}
        {isAdmin && filteredFormations.length > 0 && (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input type="checkbox" checked={allSelected}
                ref={(el) => { if (el) el.indeterminate = selected.size > 0 && !allSelected; }}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-input accent-primary cursor-pointer" />
              <span className="text-muted-foreground">
                {selected.size === 0 ? "Tout sélectionner" : `${selected.size} sélectionné(s)`}
              </span>
            </label>
            {selected.size > 0 && (
              <button onClick={handleBulkDelete} disabled={bulkLoading}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50">
                <IconTrash /> {bulkLoading ? "Suppression…" : `Supprimer ${selected.size}`}
              </button>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground -mt-1">
          {filteredFormations.length} formation(s){filteredFormations.length !== formations.length && ` sur ${formations.length}`}
        </p>

        {deleteError && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{deleteError}</div>
        )}

        {/* ── Grille par catégorie ── */}
        {[
          { label: "Formations Adultes", items: adultes },
          { label: "Formations Enfants", items: enfants },
        ].map(({ label, items }) => (
          <div key={label}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{label}</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((f) => (
                <div key={f.id}
                  className={`rounded-xl border bg-card p-4 space-y-2 transition-all cursor-default ${!f.actif ? "opacity-60" : ""} ${selected.has(f.id) ? "border-primary/50 bg-primary/5" : "border-border"}`}>
                  {/* Checkbox sélection */}
                  {isAdmin && (
                    <label className="flex items-center gap-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(f.id)} onChange={() => toggleOne(f.id)}
                        className="h-3.5 w-3.5 rounded border-input accent-primary" />
                      <span className="text-xs text-muted-foreground sr-only">Sélectionner</span>
                    </label>
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm leading-snug">{f.nom}</p>
                    <Badge variant={f.actif ? "success" : "outline"}>{f.actif ? "Active" : "Inactive"}</Badge>
                  </div>
                  {f.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{f.description}</p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {f.duree     && <span>⏱ {f.duree}</span>}
                    {f.prix      && <span>💰 {f.prix} {f.devise}</span>}
                    {f.frequence && <span>🔁 {f.frequence}</span>}
                    {f.jours     && <span>📅 {f.jours}</span>}
                    <span>📋 {f._count.inscriptions} inscription(s)</span>
                  </div>

                  <ShiftManager formation={f} isAdmin={isAdmin} />

                  {isAdmin && (
                    <div className="flex items-center gap-2 pt-2 flex-wrap border-t border-border mt-2">
                      <button onClick={() => setEditTarget(f)} className="text-xs px-3 py-1.5 rounded-lg border border-input hover:bg-secondary transition-colors">Modifier</button>
                      <button disabled={toggling === f.id} onClick={() => handleToggle(f.id, !f.actif)} className="text-xs px-3 py-1.5 rounded-lg border border-input hover:bg-secondary transition-colors disabled:opacity-50">
                        {f.actif ? "Désactiver" : "Activer"}
                      </button>
                      {f._count.inscriptions === 0 && (
                        <button onClick={() => handleDelete(f.id)} className="text-xs px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors">Supprimer</button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-full py-4">
                  {search || filterCategorie !== "ALL" || filterStatut !== "ALL"
                    ? "Aucune formation ne correspond aux filtres."
                    : "Aucune formation dans cette catégorie."}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function IconPlus() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>; }
function IconQr()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3" /><path d="M21 14v0" /><path d="M14 21h7" /><path d="M21 17v4" /></svg>; }
function IconTrash(){ return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>; }
