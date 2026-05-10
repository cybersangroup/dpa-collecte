"use client";

import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function ParametresPage() {
  return (
    <>
      <Topbar title="Paramètres" />

      <div className="flex-1 p-4 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Profil */}
          <Card>
            <CardHeader>
              <CardTitle>Mon profil</CardTitle>
              <CardDescription>
                Informations visibles dans la sidebar et l&apos;audit log
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-semibold">
                  AD
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm">
                    Changer l&apos;avatar
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    PNG / JPG · 200 ko max
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom complet</Label>
                  <Input id="nom" defaultValue="Aminata Diop" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Nom d&apos;utilisateur</Label>
                  <Input id="username" defaultValue="aminata.diop" disabled />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rôle</Label>
                  <div className="h-11 px-3.5 rounded-lg border border-border bg-secondary/40 flex items-center">
                    <Badge variant="primary">Admin</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Site d&apos;affectation</Label>
                  <div className="h-11 px-3.5 rounded-lg border border-border bg-secondary/40 flex items-center">
                    <Badge variant="default">DKR · Dakar</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sécurité */}
          <Card>
            <CardHeader>
              <CardTitle>Sécurité</CardTitle>
              <CardDescription>
                Modifier votre mot de passe — recommandé tous les 90 jours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="oldpwd">Mot de passe actuel</Label>
                  <Input id="oldpwd" type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newpwd">Nouveau mot de passe</Label>
                  <Input id="newpwd" type="password" placeholder="••••••••" />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button>Mettre à jour</Button>
              </div>
            </CardContent>
          </Card>

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
        </div>
      </div>
    </>
  );
}

function PreferencesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Préférences</CardTitle>
        <CardDescription>
          Personnalisez votre expérience DPA Collecte
        </CardDescription>
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
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>
  );
}
