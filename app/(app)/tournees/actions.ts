"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

function parseLocalDateTime(value: string): Date | null {
  const v = value.trim();
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export async function createCampaign(formData: FormData) {
  const titre = String(formData.get("titre") ?? "").trim();
  const cityId = String(formData.get("cityId") ?? "").trim();
  const startsAtRaw = String(formData.get("startsAt") ?? "").trim();
  const endsAtRaw = String(formData.get("endsAt") ?? "").trim();

  if (!titre || !cityId || !startsAtRaw || !endsAtRaw) {
    redirect("/tournees/nouvelle?erreur=champs");
  }

  const startsAt = parseLocalDateTime(startsAtRaw);
  const endsAt = parseLocalDateTime(endsAtRaw);
  if (!startsAt || !endsAt) {
    redirect("/tournees/nouvelle?erreur=dates");
  }

  if (endsAt <= startsAt) {
    redirect("/tournees/nouvelle?erreur=ordre");
  }

  const city = await db.city.findFirst({
    where: { id: cityId, actif: true },
    select: { id: true },
  });
  if (!city) {
    redirect("/tournees/nouvelle?erreur=ville");
  }

  const session = await getServerSession(authOptions);
  const createdById = session?.user?.id ?? null;

  const qrToken = `camp_${randomBytes(8).toString("hex")}`;

  try {
    await db.campaign.create({
      data: {
        titre,
        cityId,
        startsAt,
        endsAt,
        qrToken,
        createdById,
      },
    });
  } catch {
    redirect("/tournees/nouvelle?erreur=db");
  }

  revalidatePath("/tournees");
  redirect("/tournees");
}
