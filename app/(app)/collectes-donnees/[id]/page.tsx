import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { Topbar } from "@/components/layout/Topbar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const profileLabels: Record<string, { label: string; color: "primary" | "warning" | "outline" | "success" }> = {
  ETUDIANT_ELEVE: { label: "Étudiant / Élève", color: "primary" },
  PROF:           { label: "Professeur",        color: "success" },
  SURVEILLANT:    { label: "Surveillant",        color: "warning" },
  PARENT:         { label: "Parent",             color: "outline" },
};

export default async function CollecteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  noStore();
  const { id } = await params;

  const s = await db.student.findUnique({
    where: { id },
    include: {
      city: true,
      addedBy: { select: { nomComplet: true, username: true } },
      campaign: {
        include: {
          city: true,
          createdBy: { select: { nomComplet: true, username: true } },
        },
      },
    },
  });

  if (!s) notFound();

  const profil = profileLabels[s.profileType] ?? profileLabels.ETUDIANT_ELEVE;
  const initials = `${s.nom[0] ?? ""}${s.prenom?.[0] ?? ""}`.toUpperCase();
  const fullName = `${s.nom}${s.prenom ? " " + s.prenom : ""}`;

  return (
    <>
      <Topbar title="Détail de l'enregistrement" />

      <div className="flex-1 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto w-full space-y-5">

          <Link href="/collectes-donnees">
            <Button variant="ghost" size="md" className="gap-2 -ml-2 text-muted-foreground">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              Retour à la liste
            </Button>
          </Link>

          {/* En-tête identité */}
          <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
            <div className="h-14 w-14 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold">{fullName}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant={profil.color}>{profil.label}</Badge>
                <Badge variant={s.city.code === "DKR" ? "primary" : "warning"}>{s.city.nom}</Badge>
                <Badge variant={s.source === "QR_AUTO" ? "success" : "outline"}>
                  {s.source === "QR_AUTO" ? "Auto QR" : "Opérateur"}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground shrink-0 hidden sm:block">
              {formatDate(s.createdAt)}
            </p>
          </div>

          {/* Informations personnelles */}
          <Section title="Informations personnelles">
            <Row label="Nom complet"       value={s.nom} />
            <Row label="Prénom"            value={s.prenom || "—"} />
            <Row label="Genre"             value={genreLabel(s.genre)} />
            <Row label="Date de naissance" value={s.dateNaissance ? formatDateSimple(s.dateNaissance) : "—"} />
            <Row label="Téléphone"         value={`${s.countryCode ?? ""} ${s.telephone}`.trim()} />
            <Row label="Adresse"           value={s.adresse || "—"} />
          </Section>

          {/* Scolarité / Professionnel */}
          {(s.niveauScolaire || s.classe || s.nombreEleves != null || s.etablissement) && (
            <Section title="Scolarité & Établissement">
              {(s.niveauScolaire || s.classe) && (
                <Row
                  label="Niveau / Classe"
                  value={[s.niveauScolaire, s.classe].filter(Boolean).join(" — ")}
                />
              )}
              {s.nombreEleves != null && (
                <Row label="Nombre d'élèves" value={String(s.nombreEleves)} />
              )}
              {s.etablissement && (
                <Row label="Établissement" value={s.etablissement} />
              )}
            </Section>
          )}

          {/* Source de l'enregistrement */}
          <Section title="Source de l'enregistrement">
            {s.source === "QR_AUTO" ? (
              <>
                <Row label="Mode"          value="Auto-inscription via QR code" />
                {s.campaign && (
                  <>
                    <Row label="Tournée"          value={s.campaign.titre} />
                    <Row label="Ville tournée"    value={s.campaign.city.nom} />
                    <Row label="QR créé par"      value={s.campaign.createdBy?.nomComplet ?? "—"} />
                    <Row label="Username opérateur" value={s.campaign.createdBy ? `@${s.campaign.createdBy.username}` : "—"} />
                    <Row label="Période"          value={`${formatDate(s.campaign.startsAt)} → ${formatDate(s.campaign.endsAt)}`} />
                  </>
                )}
              </>
            ) : (
              <>
                <Row label="Mode"       value="Saisie manuelle par opérateur" />
                <Row label="Ajouté par" value={s.addedBy?.nomComplet ?? "—"} />
                <Row label="Username"   value={s.addedBy ? `@${s.addedBy.username}` : "—"} />
              </>
            )}
            <Row label="Date d'enregistrement" value={formatDateTime(s.createdAt)} />
          </Section>

        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-secondary/30">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      </div>
      <dl className="divide-y divide-border">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start px-4 py-3 gap-4">
      <dt className="text-sm text-muted-foreground w-40 shrink-0">{label}</dt>
      <dd className="text-sm font-medium flex-1">{value || "—"}</dd>
    </div>
  );
}

function genreLabel(g: string | null) {
  if (g === "M") return "Masculin";
  if (g === "F") return "Féminin";
  return "—";
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(d);
}

function formatDateSimple(s: string) {
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(d);
}

function formatDateTime(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(d);
}
