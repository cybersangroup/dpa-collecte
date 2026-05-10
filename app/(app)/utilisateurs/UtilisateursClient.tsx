"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { toggleUserActif, changeUserPassword } from "./actions";

type User = {
  id: string;
  nomComplet: string;
  username: string;
  role: "ADMIN" | "OPERATEUR";
  actif: boolean;
  city: { code: string; nom: string };
  _count: { studentsAdded: number };
};

// ─── Modal changement de mot de passe ────────────────────────────────────────

function PasswordModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [pwd, setPwd]         = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [ok, setOk]           = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await changeUserPassword(user.id, pwd);
    setLoading(false);
    if (res.ok) {
      setOk(true);
      setTimeout(onClose, 1200);
    } else {
      setError(res.message ?? "Erreur");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card shadow-xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Changer le mot de passe</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          Nouveau mot de passe pour <span className="font-medium text-foreground">@{user.username}</span>
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="Nouveau mot de passe (8 car. min)"
            minLength={8}
            required
            autoFocus
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          {ok && <p className="text-xs text-green-600">Mot de passe mis à jour !</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Annuler</Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? "Enregistrement…" : "Confirmer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Dropdown utilisateur avec position fixe ─────────────────────────────────

function UserDropdown({ user, onToggleActif, onChangePassword }: {
  user: User;
  onToggleActif: (id: string, actif: boolean) => void;
  onChangePassword: (user: User) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState<{ top: number; right: number } | null>(null);
  const btnRef          = useRef<HTMLButtonElement>(null);

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

  const menu = open && pos ? createPortal(
    <div
      style={{ position: "fixed", top: pos.top, right: pos.right, zIndex: 9999 }}
      className="w-52 rounded-xl border border-border bg-card shadow-xl py-1 text-sm"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => { setOpen(false); onToggleActif(user.id, !user.actif); }}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary transition-colors text-left",
          user.actif ? "text-destructive" : "text-green-700 dark:text-green-400",
        )}>
        {user.actif ? <><IconLock /> Bloquer</> : <><IconUnlock /> Débloquer</>}
      </button>
      <button
        onClick={() => { setOpen(false); onChangePassword(user); }}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary transition-colors text-left">
        <IconKey /> Changer le mot de passe
      </button>
    </div>,
    document.body,
  ) : null;

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors"
        aria-label="Plus d'actions"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" />
        </svg>
      </button>
      {menu}
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

export function UtilisateursClient({ users: initial }: { users: User[] }) {
  const [users, setUsers]       = useState(initial);
  const [pwdTarget, setPwdTarget] = useState<User | null>(null);
  const [toast, setToast]       = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleActif = async (id: string, actif: boolean) => {
    const res = await toggleUserActif(id, actif);
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, actif } : u));
      showToast("success", actif ? "Utilisateur débloqué." : "Utilisateur bloqué.");
    } else {
      showToast("error", res.message ?? "Erreur");
    }
  };

  return (
    <>
      {pwdTarget && (
        <PasswordModal user={pwdTarget} onClose={() => setPwdTarget(null)} />
      )}

      {toast && (
        <div className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl border px-4 py-3 text-sm shadow-lg flex items-center gap-2",
          toast.type === "success"
            ? "border-emerald-400/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
            : "border-destructive/40 bg-destructive/10 text-destructive",
        )}>
          {toast.type === "success"
            ? <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            : <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>}
          {toast.message}
        </div>
      )}

      {users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Aucun utilisateur trouvé.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((m) => (
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
                  <p className="text-xs text-muted-foreground truncate">@{m.username}</p>
                </div>
                <UserDropdown
                  user={m}
                  onToggleActif={handleToggleActif}
                  onChangePassword={setPwdTarget}
                />
              </div>

              <div className="flex flex-wrap gap-1.5 mt-4">
                <Badge variant={m.role === "ADMIN" ? "primary" : "default"}>
                  {m.role === "ADMIN" ? "Admin" : "Opérateur"}
                </Badge>
                <Badge variant="outline">{m.city.code} · {m.city.nom}</Badge>
                {!m.actif && <Badge variant="outline">Bloqué</Badge>}
                {m.actif && (
                  <Badge variant="success">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1" />
                    Actif
                  </Badge>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-border text-sm">
                <p className="text-xs text-muted-foreground">Étudiants ajoutés</p>
                <p className="font-semibold tabular-nums mt-0.5">{m._count.studentsAdded}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function IconLock() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>; }
function IconUnlock() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></svg>; }
function IconKey() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="5.5" /><path d="M21 2l-9.6 9.6" /><path d="M15.5 7.5l3 3L22 7l-3-3" /></svg>; }
