"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useMemo, useState } from "react";
import type { ChartBar, DashboardPayload, RecentRow } from "@/lib/dashboard-data";

type ChartPeriod = "7j" | "lastMonth";

export function TableauDeBordClient({ data }: { data: DashboardPayload }) {
  const [period, setPeriod] = useState<ChartPeriod>("7j");
  const chartData = period === "7j" ? data.chart7j : data.chartLastMonth;
  const { kpis, firstName, recent } = data;

  const dkrPct =
    kpis.totalStudents > 0
      ? Math.round((kpis.dkrCount / kpis.totalStudents) * 100)
      : 0;
  const djibPct =
    kpis.totalStudents > 0
      ? Math.round((kpis.djibCount / kpis.totalStudents) * 100)
      : 0;

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Bonjour {firstName ?? "équipe"} 👋
        </p>
        <h2 className="text-2xl font-semibold tracking-tight mt-1">
          Voici les chiffres de la collecte
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Étudiants collectés"
          value={String(kpis.totalStudents)}
          trend={
            kpis.todayStudents > 0
              ? `+${kpis.todayStudents} aujourd’hui`
              : "Aucune saisie aujourd’hui"
          }
          trendVariant={kpis.todayStudents > 0 ? "success" : "default"}
        />
        <KpiCard
          label="Site DKR"
          value={String(kpis.dkrCount)}
          trend={kpis.totalStudents > 0 ? `${dkrPct} % du total` : "—"}
          trendVariant="default"
        />
        <KpiCard
          label="Site DJIB"
          value={String(kpis.djibCount)}
          trend={kpis.totalStudents > 0 ? `${djibPct} % du total` : "—"}
          trendVariant="default"
        />
        <KpiCard
          label="Tournées actives"
          value={String(kpis.activeTours)}
          trend={kpis.activeTours > 0 ? "QR ouverts" : "Aucune tournée active"}
          trendVariant="primary"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 pb-4">
            <div className="space-y-1">
              <CardTitle>
                Inscriptions par jour ({period === "7j" ? "7 derniers jours" : "mois dernier"})
              </CardTitle>
              <CardDescription>
                Répartition des étudiants enregistrés par site (codes DKR / DJIB / autres)
              </CardDescription>
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
              <p className="text-sm text-muted-foreground py-4">
                Aucune inscription pour l’instant.
              </p>
            ) : (
              recent.map((a, i) => <ActivityRow key={i} a={a} />)
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ActivityRow({ a }: { a: RecentRow }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="h-7 w-7 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-semibold">
        {a.who
          .split(/\s+/)
          .map((s) => s[0])
          .join("")
          .slice(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-foreground">
          <span className="font-medium">{a.who}</span>{" "}
          <span className="text-muted-foreground">{a.what}</span>
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
          <span>{a.when}</span>
          <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/40" />
          <Badge variant={a.site === "DKR" ? "primary" : a.site === "DJIB" ? "warning" : "outline"}>
            {a.site}
          </Badge>
        </p>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  trend,
  trendVariant,
}: {
  label: string;
  value: string;
  trend: string;
  trendVariant: "success" | "primary" | "default";
}) {
  return (
    <Card className="min-h-[150px]">
      <CardContent className="h-full p-5 flex flex-col justify-center gap-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </p>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        <Badge variant={trendVariant} className="w-fit">
          {trend}
        </Badge>
      </CardContent>
    </Card>
  );
}

function PeriodToggle({
  period,
  onChange,
}: {
  period: ChartPeriod;
  onChange: (next: ChartPeriod) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-secondary/40 p-1">
      <button
        type="button"
        onClick={() => onChange("7j")}
        className={`h-8 rounded-md px-3 text-xs font-medium transition-colors ${
          period === "7j" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        7 derniers jours
      </button>
      <button
        type="button"
        onClick={() => onChange("lastMonth")}
        className={`h-8 rounded-md px-3 text-xs font-medium transition-colors ${
          period === "lastMonth"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Mois dernier
      </button>
    </div>
  );
}

function BarChart({ data }: { data: ChartBar[] }) {
  const max = useMemo(
    () => Math.max(...data.map((d) => d.dkr + d.djib + d.other), 1),
    [data],
  );

  return (
    <div className="flex items-end gap-3 h-48 pt-2">
      {data.map((d) => {
        const total = d.dkr + d.djib + d.other;
        const dkrH = total > 0 ? (d.dkr / max) * 100 : 0;
        const djibH = total > 0 ? (d.djib / max) * 100 : 0;
        const otherH = total > 0 ? (d.other / max) * 100 : 0;
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex flex-col-reverse rounded-md overflow-hidden bg-secondary/40 h-full">
              {otherH > 0 && (
                <div
                  className="bg-muted-foreground/50"
                  style={{ height: `${otherH}%` }}
                  title={`Autres : ${d.other}`}
                />
              )}
              <div
                className="bg-primary"
                style={{ height: `${dkrH}%` }}
                title={`DKR : ${d.dkr}`}
              />
              <div
                className="bg-emerald-500"
                style={{ height: `${djibH}%` }}
                title={`DJIB : ${d.djib}`}
              />
            </div>
            <span className="text-xs text-muted-foreground">{d.label}</span>
          </div>
        );
      })}

      <div className="ml-2 flex flex-col gap-2 text-xs text-muted-foreground shrink-0">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-primary" /> DKR
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-emerald-500" /> DJIB
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-muted-foreground/50" /> Autres
        </span>
      </div>
    </div>
  );
}
