"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useMemo, useState } from "react";
import type { ChartBar, DashboardPayload, RecentRow } from "@/lib/dashboard-data";

type ChartPeriod = "7j" | "lastMonth";

export function TableauDeBordClient({ data }: { data: DashboardPayload }) {
  const [period, setPeriod] = useState<ChartPeriod>("7j");
  const chartData           = period === "7j" ? data.chart7j : data.chartLastMonth;
  const { kpis, firstName, recent, profileStats, genreStats, operatorQrStats } = data;

  const dkrPct  = kpis.totalStudents > 0 ? Math.round((kpis.dkrCount  / kpis.totalStudents) * 100) : 0;
  const djibPct = kpis.totalStudents > 0 ? Math.round((kpis.djibCount / kpis.totalStudents) * 100) : 0;
  const qrPct   = kpis.totalStudents > 0 ? Math.round((kpis.qrAutoCount / kpis.totalStudents) * 100) : 0;

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-5">

      {/* En-tête */}
      <div>
        <p className="text-sm text-muted-foreground">Bonjour {firstName ?? "équipe"} 👋</p>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight mt-1">Voici les chiffres de la collecte</h2>
      </div>

      {/* ── KPI principaux — 2 colonnes sur mobile, 4 sur desktop ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Total enregistrés" value={String(kpis.totalStudents)}
          trend={kpis.todayStudents > 0 ? `+${kpis.todayStudents} auj.` : "Aucun aujourd'hui"}
          trendVariant={kpis.todayStudents > 0 ? "success" : "default"} />
        <KpiCard label="Site DKR"  value={String(kpis.dkrCount)}
          trend={kpis.totalStudents > 0 ? `${dkrPct} %` : "—"} trendVariant="default" />
        <KpiCard label="Site DJIB" value={String(kpis.djibCount)}
          trend={kpis.totalStudents > 0 ? `${djibPct} %` : "—"} trendVariant="default" />
        <KpiCard label="Tournées actives" value={String(kpis.activeTours)}
          trend={kpis.activeTours > 0 ? "QR ouverts" : "Aucune active"} trendVariant="primary" />
      </div>

      {/* ── Source d'inscription ── */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center gap-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3" /><path d="M21 14v0" /><path d="M14 21h7" /><path d="M21 17v4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Via QR code</p>
              <p className="text-2xl sm:text-3xl font-semibold">{kpis.qrAutoCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{qrPct} % des inscriptions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center gap-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Par opérateur</p>
              <p className="text-2xl sm:text-3xl font-semibold">{kpis.operateurCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{100 - qrPct} % des inscriptions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Répartition par profil ── */}
      {profileStats.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Répartition par profil</CardTitle>
            <CardDescription>Inscriptions selon le type de personne</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {profileStats.map((p) => {
                const pct = kpis.totalStudents > 0 ? Math.round((p.count / kpis.totalStudents) * 100) : 0;
                return (
                  <div key={p.type} className="rounded-xl border border-border bg-secondary/30 p-3 sm:p-4 space-y-2">
                    <div className="h-1.5 rounded-full bg-border overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                    </div>
                    <p className="text-xl sm:text-2xl font-semibold">{p.count}</p>
                    <div>
                      <p className="text-xs font-medium leading-tight">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{pct} %</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Graphique + Activité récente ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          {/* Header empilé sur mobile */}
          <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:space-y-0">
            <div className="space-y-1 min-w-0">
              <CardTitle className="text-base leading-snug">
                Inscriptions par jour
              </CardTitle>
              <CardDescription>
                {period === "7j" ? "7 derniers jours" : "Mois précédent"} · DKR / DJIB / autres
              </CardDescription>
            </div>
            <PeriodToggle period={period} onChange={setPeriod} />
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <BarChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>5 dernières inscriptions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Aucune inscription pour l'instant.</p>
            ) : (
              recent.map((a, i) => <ActivityRow key={i} a={a} />)
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Performance QR par opérateur ── */}
      {operatorQrStats.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Performance QR par opérateur</CardTitle>
            <CardDescription>Auto-inscriptions via QR code</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm min-w-[400px]">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="text-left py-2 pr-4 font-semibold whitespace-nowrap">Opérateur</th>
                    <th className="text-left py-2 pr-4 font-semibold whitespace-nowrap">Username</th>
                    <th className="text-center py-2 pr-4 font-semibold whitespace-nowrap">Tournées</th>
                    <th className="text-right py-2 font-semibold whitespace-nowrap">Inscrip. QR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {operatorQrStats.map((op) => (
                    <tr key={op.username} className="hover:bg-secondary/30">
                      <td className="py-3 pr-4 font-medium whitespace-nowrap">{op.name}</td>
                      <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">@{op.username}</td>
                      <td className="py-3 pr-4 text-center">
                        <Badge variant="outline">{op.campaigns}</Badge>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-lg font-semibold text-primary">{op.qrCount}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Répartition par genre ── */}
      {genreStats.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Répartition par genre</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {genreStats.map((g) => {
                const pct = kpis.totalStudents > 0 ? Math.round((g.count / kpis.totalStudents) * 100) : 0;
                return (
                  <div key={g.genre} className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 px-4 py-3 flex-1 min-w-[120px]">
                    <div>
                      <p className="text-xl sm:text-2xl font-semibold">{g.count}</p>
                      <p className="text-xs text-muted-foreground">{genreLabel(g.genre)} · {pct} %</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ─── Composants internes ─── */

function ActivityRow({ a }: { a: RecentRow }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="h-7 w-7 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-semibold">
        {a.who.split(/\s+/).map((s) => s[0]).join("").slice(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-foreground leading-snug">
          <span className="font-medium">{a.who}</span>{" "}
          <span className="text-muted-foreground text-xs">{a.what}</span>
        </p>
        <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
          <span>{a.when}</span>
          <Badge variant={a.site === "DKR" ? "primary" : a.site === "DJIB" ? "warning" : "outline"}>{a.site}</Badge>
        </p>
      </div>
    </div>
  );
}

function KpiCard({ label, value, trend, trendVariant }: {
  label: string; value: string; trend: string;
  trendVariant: "success" | "primary" | "default";
}) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-5 flex flex-col gap-1.5 sm:gap-2">
        <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-medium leading-tight">{label}</p>
        <p className="text-2xl sm:text-3xl font-semibold tracking-tight">{value}</p>
        <Badge variant={trendVariant} className="w-fit text-[10px] sm:text-xs">{trend}</Badge>
      </CardContent>
    </Card>
  );
}

function PeriodToggle({ period, onChange }: { period: ChartPeriod; onChange: (n: ChartPeriod) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-secondary/40 p-0.5 sm:p-1 shrink-0 self-start">
      {(["7j", "lastMonth"] as const).map((v) => (
        <button key={v} type="button" onClick={() => onChange(v)}
          className={`h-7 sm:h-8 rounded-md px-2 sm:px-3 text-xs font-medium transition-colors whitespace-nowrap ${
            period === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}>
          {v === "7j" ? "7 jours" : "Ce mois"}
        </button>
      ))}
    </div>
  );
}

function BarChart({ data }: { data: ChartBar[] }) {
  const max = useMemo(() => Math.max(...data.map((d) => d.dkr + d.djib + d.other), 1), [data]);

  // Pour le mois (>10 barres), rendre le graphe scrollable horizontalement
  const isMany = data.length > 10;

  const bars = (
    <div className={`flex items-end gap-1 sm:gap-2 h-40 sm:h-48 pt-2 ${isMany ? "min-w-[500px]" : "w-full"}`}>
      {data.map((d) => {
        const total = d.dkr + d.djib + d.other;
        const dkrH  = total > 0 ? (d.dkr  / max) * 100 : 0;
        const djibH = total > 0 ? (d.djib / max) * 100 : 0;
        const othH  = total > 0 ? (d.other / max) * 100 : 0;
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col-reverse rounded-sm overflow-hidden bg-secondary/40 h-full">
              {othH  > 0 && <div className="bg-muted-foreground/50" style={{ height: `${othH}%`  }} title={`Autres : ${d.other}`} />}
              <div className="bg-primary"     style={{ height: `${dkrH}%`  }} title={`DKR : ${d.dkr}`} />
              <div className="bg-emerald-500" style={{ height: `${djibH}%` }} title={`DJIB : ${d.djib}`} />
            </div>
            <span className="text-[9px] sm:text-xs text-muted-foreground whitespace-nowrap">{d.label}</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-3">
      {isMany ? (
        <div className="overflow-x-auto scrollbar-thin pb-1">{bars}</div>
      ) : bars}
      {/* Légende */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-primary" /> DKR</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> DJIB</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-muted-foreground/50" /> Autres</span>
      </div>
    </div>
  );
}

function genreLabel(g: string) {
  if (g === "M") return "Masculin";
  if (g === "F") return "Féminin";
  return "Autre";
}
