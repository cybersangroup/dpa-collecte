"use client";

import { useActionState, useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { updateProfile, changePassword } from "./actions";
import type { ProfileState, PasswordState } from "./actions";

// ─── Icônes ──────────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

// ─── Feedback inline ─────────────────────────────────────────────────────────

function Feedback({ state }: { state: ProfileState | PasswordState }) {
  if (state.status === "idle") return null;
  const ok = state.status === "success";
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
        ok
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
          : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
      }`}
    >
      {ok ? <CheckIcon /> : <AlertIcon />}
      {ok
        ? "Enregistré avec succès."
        : (state as { status: "error"; message: string }).message}
    </div>
  );
}

// ─── Formulaire Profil ───────────────────────────────────────────────────────

type City = { id: string; nom: string; code: string };

function ProfileForm() {
  const { data: session, update } = useSession();
  const user = session?.user;

  const [cities, setCities]   = useState<City[]>([]);
  const [editing, setEditing] = useState(false);

  const [state, action, isPending] = useActionState<ProfileState, FormData>(
    updateProfile,
    { status: "idle" },
  );

  // Charger les villes
  useEffect(() => {
    fetch("/api/cities")
      .then((r) => r.json())
      .then(setCities)
      .catch(() => {});
  }, []);

  // Rafraîchir le token JWT après mise à jour réussie
  useEffect(() => {
    if (state.status === "success") {
      update({
        name:     state.nomComplet,
        username: state.username,
        cityCode: state.cityCode,
        cityName: state.cityName,
      });
      setEditing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function initialsFromName(name?: string | null) {
    if (!name) return "?";
    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  const currentCityId =
    cities.find((c) => c.code === (user as { cityCode?: string })?.cityCode)?.id ?? "";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Mon profil</CardTitle>
            <CardDescription>
              Nom, identifiant et site d&apos;affectation
            </CardDescription>
          </div>
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              Modifier
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-5">
          <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-semibold shrink-0">
            {initialsFromName(user?.name)}
          </div>
          <div>
            <p className="font-semibold">{user?.name ?? "—"}</p>
            <p className="text-sm text-muted-foreground">
              @{(user as { username?: string })?.username ?? "—"}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <Badge variant={user?.role === "ADMIN" ? "primary" : "default"}>
                {user?.role === "ADMIN" ? "Admin" : "Opérateur"}
              </Badge>
              {(user as { cityCode?: string })?.cityCode && (
                <Badge variant="outline">
                  {(user as { cityCode?: string }).cityCode}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Formulaire */}
        {editing ? (
          <form action={action} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nomComplet">Nom complet</Label>
                <Input
                  id="nomComplet"
                  name="nomComplet"
                  defaultValue={user?.name ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Nom d&apos;utilisateur</Label>
                <Input
                  id="username"
                  name="username"
                  defaultValue={(user as { username?: string })?.username ?? ""}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cityId">Site d&apos;affectation</Label>
              <select
                id="cityId"
                name="cityId"
                defaultValue={currentCityId}
                required
                className="h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">— Choisir une ville —</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} · {c.nom}
                  </option>
                ))}
              </select>
            </div>

            <Feedback state={state} />

            <div className="flex items-center justify-end gap-3 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditing(false)}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Nom complet</p>
              <p className="font-medium">{user?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Identifiant</p>
              <p className="font-medium">@{(user as { username?: string })?.username ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Rôle</p>
              <p className="font-medium">{user?.role === "ADMIN" ? "Administrateur" : "Opérateur"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Site</p>
              <p className="font-medium">
                {(user as { cityCode?: string; cityName?: string })?.cityName ?? "—"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Formulaire Mot de passe ─────────────────────────────────────────────────

function PasswordForm() {
  const [state, action, isPending] = useActionState<PasswordState, FormData>(
    changePassword,
    { status: "idle" },
  );

  // Ref pour reset les champs après succès
  const [key, setKey] = useState(0);
  useEffect(() => {
    if (state.status === "success") {
      setKey((k) => k + 1);
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sécurité</CardTitle>
        <CardDescription>
          Modifier votre mot de passe — recommandé tous les 90 jours
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form key={key} action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Mot de passe actuel</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="8 caractères min."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <Feedback state={state} />

          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Mise à jour…" : "Mettre à jour"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function ParametresPage() {
  const { data: session } = useSession();
  const user = session?.user;

  function initialsFromName(name?: string | null) {
    if (!name) return "?";
    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    <>
      <Topbar title="Paramètres" />

      <div className="flex-1 p-4 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Profil */}
          <ProfileForm />

          {/* Sécurité */}
          <PasswordForm />

          {/* Préférences */}
          <PreferencesCard />

          {/* À propos */}
          <Card>
            <CardHeader>
              <CardTitle>À propos</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                DPA Collecte · version 0.1.0{" "}
                <span className="text-muted-foreground/60">|</span>{" "}
                <span className="text-foreground">© Equipe Tech Cybersan</span>
              </p>
            </CardContent>
          </Card>

          {/* Session & déconnexion — essentiel sur mobile */}
          <Card className="border-destructive/30">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                  {initialsFromName(user?.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{user?.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{(user as { username?: string })?.username ?? "—"}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <Badge variant={user?.role === "ADMIN" ? "primary" : "default"}>
                      {user?.role === "ADMIN" ? "Admin" : "Opérateur"}
                    </Badge>
                    {(user as { cityCode?: string })?.cityCode && (
                      <Badge variant="outline">
                        {(user as { cityCode?: string }).cityCode}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() =>
                    signOut({ callbackUrl: `${window.location.origin}/connexion` })
                  }
                  className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Se déconnecter
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

// ─── Préférences ─────────────────────────────────────────────────────────────

function PreferencesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Préférences</CardTitle>
        <CardDescription>Personnalisez votre expérience DPA Collecte</CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        <ToggleRow
          title="Notifications de tournée"
          description="Recevoir un récapitulatif à la fin de chaque tournée"
          checked
        />
        <ToggleRow
          title="Mode hors-ligne"
          description="Active la sauvegarde locale en cas de perte de réseau"
          checked
        />
        <SelectRow
          title="Langue"
          description="Langue d'affichage de l'interface"
          value="Français"
        />
      </CardContent>
    </Card>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked?: boolean;
  onChange?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <label className="relative inline-flex shrink-0 cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={onChange ?? (() => {})}
          readOnly={!onChange}
        />
        <span className="h-6 w-11 rounded-full bg-secondary border border-border peer-checked:bg-primary peer-checked:border-primary transition-colors" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </label>
    </div>
  );
}

function SelectRow({
  title,
  description,
  value,
}: {
  title: string;
  description: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button className="h-9 px-3 rounded-lg border border-border bg-card text-sm hover:bg-secondary inline-flex items-center gap-2">
        {value}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>
  );
}
