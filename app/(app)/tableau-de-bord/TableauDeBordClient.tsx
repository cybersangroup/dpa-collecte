"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useMemo, useState } from "react";
import type { ChartBar, DashboardPayload, RecentRow, ProfileStat, OperatorQrRow } from "@/lib/dashboard-data";

type ChartPeriod = "7j" | "lastMonth";

export function TableauDeBordClient({ data }: { data: DashboardPayload }) {
  const [period, setPeriod] = useState<ChartPeriod>("7j");
  const chartData           = period === "7j" ? data.chart7j : data.chartLastMonth;
  const { kpis, firstName, recent, profileStats, genreStats, operatorQrStats } = data;

  const dkrPct  = kpis.totalStudents > 0 ? Math.round((kpis.dkrCount  / kpis.totalStudents) * 100) : 0;
  const djibPct = kpis.totalStudents > 0 ? Math.round((kpis.djibCount / kpis.totalStudents) * 100) : 0;
  const qrPct   = kpis.totalStudents > 0 ? Math.round((kpis.qrAutoCount / kpis.totalStudents) * 100) : 0;

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">

      {/* En-tête */}
      <div>
        <p className="text-sm text-muted-foreground">Bonjour {firstName ?? "équipe"} 👋</p>
        <h2 className="text-2xl font-semibold tracking-tight mt-1">Voici les chiffres de la collecte</h2>
      </div>

      {/* ── KPI principaux ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total enregistrés" value={String(kpis.totalStudents)}
          trend={kpis.todayStudents > 0 ? `+${kpis.todayStudents} aujourd'hui` : "Aucune saisie aujourd'hui"}
          trendVariant={kpis.todayStudents > 0 ? "success" : "default"} />
        <KpiCard label="Site DKR"  value={String(kpis.dkrCount)}
          trend={kpis.totalStudents > 0 ? `${dkrPct} % du total` : "—"} trendVariant="default" />
        <KpiCard label="Site DJIB" value={String(kpis.djibCount)}
          trend={kpis.totalStudents > 0 ? `${djibPct} % du total` : "—"} trendVariant="default" />
        <KpiCard label="Tournées actives" value={String(kpis.activeTours)}
          trend={kpis.activeTours > 0 ? "QR ouverts" : "Aucune tournée active"} trendVariant="primary" />
      </div>

      {/* ── Source d'inscription ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="min-h-[110px]">
          <CardContent className="p-5 h-full flex items-center gap-4">
            <div className="h-12 w-12 shrink-0 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3" /><path d="M21 14v0" /><path d="M14 21h7" /><path d="M21 17v4" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Via QR code</p>
              <p className="text-3xl font-semibold">{kpis.qrAutoCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{qrPct} % des inscriptions</p>
            </div>
          </CardContent>
        </Card>
        <Card className="min-h-[110px]">
          <CardContent className="p-5 h-full flex items-center gap-4">
            <div className="h-12 w-12 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Par opérateur</p>
              <p className="text-3xl font-semibold">{kpis.operateurCount}</p>
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
            <CardDescription>Nombre d'inscriptions selon le type de personne</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {profileStats.map((p) => {
                const pct = kpis.totalStudents > 0 ? Math.round((p.count / kpis.totalStudents) * 100) : 0;
                return (
                  <div key={p.type} className="rounded-xl border border-border bg-secondary/30 p-4 space-y-2">
                    <div className="h-2 rounded-full bg-border overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                    </div>
                    <p className="text-2xl font-semibold">{p.count}</p>
                    <div>
                      <p className="text-xs font-medium">{p.label}</p>
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
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 pb-4">
            <div className="space-y-1">
              <CardTitle>
                Inscriptions par jour ({period === "7j" ? "7 derniers jours" : "mois dernier"})
              </CardTitle>
              <CardDescription>Répartition par site (DKR / DJIB / autres)</CardDescription>
            </div>
            <PeriodToggle period={period} onChange={setPeriod} />
          </CardHeader>
          <CardContent className="pt-0">
            <BarChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
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
            <CardDescription>Nombre d'auto-inscriptions générées via le QR code de chaque opérateur</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="text-left py-2 pr-4 font-semibold">Opérateur</th>
                    <th className="text-left py-2 pr-4 font-semibold">Username</th>
                    <th className="text-center py-2 pr-4 font-semibold">Tournées</th>
                    <th className="text-right py-2 font-semibold">Inscriptions QR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {operatorQrStats.map((op) => (
                    <tr key={op.username} className="hover:bg-secondary/30">
                      <td className="py-3 pr-4 font-medium">{op.name}</td>
                      <td className="py-3 pr-4 text-muted-foreground">@{op.username}</td>
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
                  <div key={g.genre} className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 px-4 py-3 min-w-[140px]">
                    <div>
                      <p className="text-2xl font-semibold">{g.count}</p>
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
        <p className="text-foreground">
          <span className="font-medium">{a.who}</span>{" "}
          <span className="text-muted-foreground">{a.what}</span>
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
          <span>{a.when}</span>
          <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/40" />
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
    <Card className="min-h-[140px]">
      <CardContent className="h-full p-5 flex flex-col justify-center gap-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        <Badge variant={trendVariant} className="w-fit">{trend}</Badge>
      </CardContent>
    </Card>
  );
}

function PeriodToggle({ period, onChange }: { period: ChartPeriod; onChange: (n: ChartPeriod) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-secondary/40 p-1 shrink-0">
      {(["7j", "lastMonth"] as const).map((v) => (
        <button key={v} type="button" onClick={() => onChange(v)}
          className={`h-8 rounded-md px-3 text-xs font-medium transition-colors ${
            period === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}>
          {v === "7j" ? "7 derniers jours" : "Mois dernier"}
        </button>
      ))}
    </div>
  );
}

function BarChart({ data }: { data: ChartBar[] }) {
  const max = useMemo(() => Math.max(...data.map((d) => d.dkr + d.djib + d.other), 1), [data]);
  return (
    <div className="flex items-end gap-3 h-48 pt-2">
      {data.map((d) => {
        const total = d.dkr + d.djib + d.other;
        const dkrH  = total > 0 ? (d.dkr  / max) * 100 : 0;
        const djibH = total > 0 ? (d.djib / max) * 100 : 0;
        const othH  = total > 0 ? (d.other / max) * 100 : 0;
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex flex-col-reverse rounded-md overflow-hidden bg-secondary/40 h-full">
              {othH  > 0 && <div className="bg-muted-foreground/50" style={{ height: `${othH}%`  }} title={`Autres : ${d.other}`} />}
              <div className="bg-primary"       style={{ height: `${dkrH}%`  }} title={`DKR : ${d.dkr}`} />
              <div className="bg-emerald-500"   style={{ height: `${djibH}%` }} title={`DJIB : ${d.djib}`} />
            </div>
            <span className="text-xs text-muted-foreground">{d.label}</span>
          </div>
        );
      })}
      <div className="ml-2 flex flex-col gap-2 text-xs text-muted-foreground shrink-0">
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
  if (g === "Autre") return "Autre";
  return g;
}
