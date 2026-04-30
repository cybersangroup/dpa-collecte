 "use client";

import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useMemo, useState } from "react";

type ChartPeriod = "7j" | "lastMonth";

export default function TableauDeBordPage() {
  const [period, setPeriod] = useState<ChartPeriod>("7j");

  return (
    <>
      <Topbar title="Tableau de bord" />

      <div className="flex-1 p-4 sm:p-6 space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">
            Bonjour Aminata 👋
          </p>
          <h2 className="text-2xl font-semibold tracking-tight mt-1">
            Voici les chiffres de la collecte
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Étudiants collectés"
            value="312"
            trend="+18 aujourd'hui"
            trendVariant="success"
          />
          <KpiCard
            label="Site DKR"
            value="201"
            trend="64 % du total"
            trendVariant="default"
          />
          <KpiCard
            label="Site DJIB"
            value="111"
            trend="36 % du total"
            trendVariant="default"
          />
          <KpiCard
            label="Tournées actives"
            value="3"
            trend="2 QR ouverts"
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
                  Répartition des étudiants enregistrés par site
                </CardDescription>
              </div>
              <PeriodToggle period={period} onChange={setPeriod} />
            </CardHeader>
            <CardContent className="pt-0">
              <FakeBarChart period={period} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Activité récente</CardTitle>
              <CardDescription>
                5 dernières actions opérateurs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {[
                { who: "Aminata D.", what: "a ajouté Mariam Ndiaye", when: "il y a 2 min", site: "DKR" },
                { who: "Yacine M.", what: "a ajouté Omar Faye", when: "il y a 12 min", site: "DKR" },
                { who: "QR public", what: "auto-inscription Awa Sow", when: "il y a 24 min", site: "DKR" },
                { who: "Said O.", what: "a ajouté Ahmed Ali", when: "il y a 47 min", site: "DJIB" },
                { who: "Said O.", what: "a ajouté Fatouma A.", when: "il y a 1h", site: "DJIB" },
              ].map((a, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <div className="h-7 w-7 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-semibold">
                    {a.who.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground">
                      <span className="font-medium">{a.who}</span>{" "}
                      <span className="text-muted-foreground">{a.what}</span>
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>{a.when}</span>
                      <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/40" />
                      <Badge variant={a.site === "DKR" ? "primary" : "warning"}>
                        {a.site}
                      </Badge>
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
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

function FakeBarChart({ period }: { period: ChartPeriod }) {
  const data = useMemo(
    () =>
      period === "7j"
        ? [
            { d: "Lun", dkr: 22, djib: 8 },
            { d: "Mar", dkr: 28, djib: 12 },
            { d: "Mer", dkr: 35, djib: 14 },
            { d: "Jeu", dkr: 24, djib: 18 },
            { d: "Ven", dkr: 41, djib: 22 },
            { d: "Sam", dkr: 30, djib: 19 },
            { d: "Dim", dkr: 21, djib: 18 },
          ]
        : [
            { d: "S1", dkr: 82, djib: 41 },
            { d: "S2", dkr: 95, djib: 48 },
            { d: "S3", dkr: 74, djib: 52 },
            { d: "S4", dkr: 88, djib: 57 },
          ],
    [period],
  );

  const max = Math.max(...data.map((d) => d.dkr + d.djib));

  return (
    <div className="flex items-end gap-3 h-48 pt-2">
      {data.map((d) => {
        const dkrH = (d.dkr / max) * 100;
        const djibH = (d.djib / max) * 100;
        return (
          <div key={d.d} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex flex-col-reverse rounded-md overflow-hidden bg-secondary/40 h-full">
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
            <span className="text-xs text-muted-foreground">{d.d}</span>
          </div>
        );
      })}

      <div className="ml-2 flex flex-col gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-primary" /> DKR
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-emerald-500" /> DJIB
        </span>
      </div>
    </div>
  );
}
