"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { createUser, type CreateUserState } from "./actions";
import { useCities } from "./useCities";

export default function AjouterUtilisateurPage() {
  const router  = useRouter();
  const cities  = useCities();
  const [state, formAction, isPending] = useActionState(createUser, { status: "idle" } as CreateUserState);

  useEffect(() => {
    if (state.status === "success") {
      setTimeout(() => router.push("/utilisateurs"), 1200);
    }
  }, [state, router]);

  const inp = "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";
  const lbl = "block text-sm font-medium text-foreground mb-1.5";

  return (
    <>
      <Topbar title="Ajouter un opérateur" />

      <div className="flex-1 p-4 sm:p-6">
        <div className="max-w-lg mx-auto space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Nouvel utilisateur</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Créez un compte opérateur ou administrateur.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm">
            <form action={formAction} className="space-y-4">
              <div>
                <label className={lbl}>Nom complet <span className="text-destructive">*</span></label>
                <input name="nomComplet" required placeholder="Prénom Nom" className={inp} />
              </div>
              <div>
                <label className={lbl}>Nom d'utilisateur <span className="text-destructive">*</span></label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                  <input name="username" required placeholder="prenom.nom" className={inp + " pl-7"} />
                </div>
              </div>
              <div>
                <label className={lbl}>Mot de passe <span className="text-destructive">*</span></label>
                <input type="password" name="password" required placeholder="Min. 8 caractères" className={inp} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Rôle</label>
                  <select name="role" className={inp}>
                    <option value="OPERATEUR">Opérateur</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>Site <span className="text-destructive">*</span></label>
                  <select name="cityId" required className={inp}>
                    <option value="">— Choisir —</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>{c.nom} ({c.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {state.status === "error" && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  {state.message}
                </div>
              )}
              {state.status === "success" && (
                <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                  Utilisateur créé avec succès ! Redirection…
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-60">
                  {isPending ? "Création…" : "Créer l'utilisateur"}
                </button>
                <button type="button" onClick={() => router.push("/utilisateurs")}
                  className="px-5 py-2.5 rounded-xl border border-input bg-background text-sm hover:bg-secondary transition-colors">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
