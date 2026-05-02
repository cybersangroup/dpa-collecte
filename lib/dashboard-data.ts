import { db } from "@/lib/db";
import { StudentSource } from "@prisma/client";

export type ChartBar = { label: string; dkr: number; djib: number; other: number };

export type RecentRow = { who: string; what: string; when: string; site: string };

export type DashboardPayload = {
  firstName: string | null;
  kpis: {
    totalStudents: number;
    todayStudents: number;
    dkrCount: number;
    djibCount: number;
    activeTours: number;
  };
  chart7j: ChartBar[];
  chartLastMonth: ChartBar[];
  recent: RecentRow[];
};

function localDayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function timeAgoFr(d: Date) {
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 45) return "à l'instant";
  const min = Math.floor(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `il y a ${days} j`;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

function shortName(full: string | null | undefined) {
  if (!full) return "?";
  const p = full.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 8);
  return `${p[0][0]}. ${p[p.length - 1]}`;
}

function bump(bar: ChartBar, code: string) {
  if (code === "DJIB") bar.djib += 1;
  else if (code === "DKR") bar.dkr += 1;
  else bar.other += 1;
}

export async function loadDashboardData(userDisplayName: string | null): Promise<DashboardPayload> {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const sevenDaysStart = new Date(now);
  sevenDaysStart.setDate(sevenDaysStart.getDate() - 6);
  sevenDaysStart.setHours(0, 0, 0, 0);

  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const [
    totalStudents,
    todayStudents,
    activeTours,
    students7d,
    studentsPrevMonth,
    recentStudents,
    byCity,
  ] = await Promise.all([
    db.student.count(),
    db.student.count({ where: { createdAt: { gte: startOfToday } } }),
    db.campaign.count({
      where: { qrIsActive: true, endsAt: { gt: now } },
    }),
    db.student.findMany({
      where: { createdAt: { gte: sevenDaysStart } },
      select: { createdAt: true, city: { select: { code: true } } },
    }),
    db.student.findMany({
      where: { createdAt: { gte: prevMonthStart, lte: prevMonthEnd } },
      select: { createdAt: true, city: { select: { code: true } } },
    }),
    db.student.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        addedBy: { select: { nomComplet: true } },
        city: { select: { code: true } },
      },
      // nom + prenom remplacent nomComplet depuis la refonte Student
    }),
    db.student.groupBy({
      by: ["cityId"],
      _count: { _all: true },
    }),
  ]);

  const cities = await db.city.findMany({
    select: { id: true, code: true },
  });
  const cityIdToCode = new Map(cities.map((c) => [c.id, c.code]));
  let dkrCount = 0;
  let djibCount = 0;
  for (const row of byCity) {
    const code = cityIdToCode.get(row.cityId) ?? "";
    if (code === "DKR") dkrCount += row._count._all;
    else if (code === "DJIB") djibCount += row._count._all;
  }

  const chart7j: ChartBar[] = [];
  const keyToIdx = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const label = new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(d);
    chart7j.push({ label, dkr: 0, djib: 0, other: 0 });
    keyToIdx.set(localDayKey(d), chart7j.length - 1);
  }
  for (const s of students7d) {
    const k = localDayKey(new Date(s.createdAt));
    const idx = keyToIdx.get(k);
    if (idx === undefined) continue;
    bump(chart7j[idx], s.city.code);
  }

  const chartLastMonth: ChartBar[] = [
    { label: "S1", dkr: 0, djib: 0, other: 0 },
    { label: "S2", dkr: 0, djib: 0, other: 0 },
    { label: "S3", dkr: 0, djib: 0, other: 0 },
    { label: "S4", dkr: 0, djib: 0, other: 0 },
  ];
  const span = prevMonthEnd.getTime() - prevMonthStart.getTime() + 1;
  const q = span / 4;
  for (const s of studentsPrevMonth) {
    const t = new Date(s.createdAt).getTime() - prevMonthStart.getTime();
    const slot = Math.min(3, Math.max(0, Math.floor(t / q)));
    bump(chartLastMonth[slot], s.city.code);
  }

  const recent: RecentRow[] = recentStudents.map((s) => {
    const site = s.city.code;
    const when = timeAgoFr(s.createdAt);
    const fullName = `${s.nom} ${s.prenom}`.trim();
    if (s.source === StudentSource.QR_AUTO) {
      return {
        who: "QR public",
        what: `auto-inscription ${fullName}`,
        when,
        site,
      };
    }
    return {
      who: shortName(s.addedBy?.nomComplet) || "Opérateur",
      what: `a ajouté ${fullName}`,
      when,
      site,
    };
  });

  const firstName = userDisplayName?.trim().split(/\s+/)[0] ?? null;

  return {
    firstName,
    kpis: {
      totalStudents,
      todayStudents,
      dkrCount,
      djibCount,
      activeTours,
    },
    chart7j,
    chartLastMonth,
    recent,
  };
}
