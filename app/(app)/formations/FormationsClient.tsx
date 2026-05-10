"use client";

import { useActionState, useState, useEffect } from "react";
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
};

// ─── Formulaire création / édition formation ─────────────────────────────────

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

// ─── Gestion des créneaux d'une formation ────────────────────────────────────

function ShiftManager({ formation, isAdmin }: { formation: Formation; isAdmin: boolean }) {
  const [shifts, setShifts] = useState<Shift[]>(formation.shifts);
  const [label, setLabel]   = useState("Matin");
  const [debut, setDebut]   = useState("07H00");
  const [fin, setFin]       = useState("11H00");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const handleAdd = async () => {
    setError(null);
    setLoading(true);
    const res = await createShift(formation.id, label, debut, fin);
    if (res.error) { setError(res.error); setLoading(false); return; }
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

      {shifts.length === 0 && (
        <p className="text-xs text-muted-foreground italic">Aucun créneau défini.</p>
      )}

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
              <option>Matin</option>
              <option>Midi</option>
              <option>Soir</option>
              <option>Journée</option>
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

export function FormationsClient({ formations: initial, isAdmin }: Props) {
  const [formations, setFormations]   = useState(initial);
  const [showCreate, setShowCreate]   = useState(false);
  const [editId, setEditId]           = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toggling, setToggling]       = useState<string | null>(null);

  const reload = () => window.location.reload();

  const handleDelete = async (id: string) => {
    setDeleteError(null);
    const res = await deleteFormation(id);
    if (res.error) setDeleteError(res.error);
    else setFormations((f) => f.filter((x) => x.id !== id));
  };

  const handleToggle = async (id: string, actif: boolean) => {
    setToggling(id);
    await toggleFormationActif(id, actif);
    setFormations((f) => f.map((x) => (x.id === id ? { ...x, actif } : x)));
    setToggling(null);
  };

  const enfants = formations.filter((f) => f.categorie === "ENFANT");
  const adultes  = formations.filter((f) => f.categorie === "ADULTE");

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div>
          {showCreate ? (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold mb-4">Nouvelle formation</h3>
              <FormationForm onSuccess={reload} onCancel={() => setShowCreate(false)} />
            </div>
          ) : (
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              <IconPlus /> Ajouter une formation
            </button>
          )}
        </div>
      )}

      {deleteError && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{deleteError}</div>
      )}

      {[
        { label: "Formations Adultes", items: adultes },
        { label: "Formations Enfants", items: enfants },
      ].map(({ label, items }) => (
        <div key={label}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{label}</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((f) => (
              <div key={f.id} className={`rounded-xl border bg-card p-4 space-y-2 transition-opacity ${!f.actif ? "opacity-60" : ""}`}>
                {editId === f.id ? (
                  <FormationForm initial={f} onSuccess={reload} onCancel={() => setEditId(null)} />
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm leading-snug">{f.nom}</p>
                      <Badge variant={f.actif ? "success" : "outline"}>{f.actif ? "Active" : "Inactive"}</Badge>
                    </div>
                    {f.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{f.description}</p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {f.duree      && <span>⏱ {f.duree}</span>}
                      {f.prix       && <span>💰 {f.prix} {f.devise}</span>}
                      {f.frequence  && <span>🔁 {f.frequence}</span>}
                      {f.jours      && <span>📅 {f.jours}</span>}
                      <span>📋 {f._count.inscriptions} inscription(s)</span>
                    </div>

                    {/* Créneaux */}
                    <ShiftManager formation={f} isAdmin={isAdmin} />

                    {isAdmin && (
                      <div className="flex items-center gap-2 pt-2 flex-wrap border-t border-border mt-2">
                        <button onClick={() => setEditId(f.id)} className="text-xs px-3 py-1.5 rounded-lg border border-input hover:bg-secondary transition-colors">Modifier</button>
                        <button disabled={toggling === f.id} onClick={() => handleToggle(f.id, !f.actif)} className="text-xs px-3 py-1.5 rounded-lg border border-input hover:bg-secondary transition-colors disabled:opacity-50">
                          {f.actif ? "Désactiver" : "Activer"}
                        </button>
                        {f._count.inscriptions === 0 && (
                          <button onClick={() => handleDelete(f.id)} className="text-xs px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors">Supprimer</button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-full py-4">Aucune formation dans cette catégorie.</p>
            )}
          </div>
        </div>
      ))}
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
