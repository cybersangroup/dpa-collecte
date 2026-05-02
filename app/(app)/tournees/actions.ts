"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export type CampaignFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

function parseLocalDateTime(value: string): Date | null {
  const v = value.trim();
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export async function createCampaign(
  _prev: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  try {
    const titre = String(formData.get("titre") ?? "").trim();
    const cityId = String(formData.get("cityId") ?? "").trim();
    const startsAtRaw = String(formData.get("startsAt") ?? "").trim();
    const endsAtRaw = String(formData.get("endsAt") ?? "").trim();

    if (!titre || !cityId || !startsAtRaw || !endsAtRaw) {
      return { status: "error", message: "Merci de remplir tous les champs obligatoires." };
    }

    const startsAt = parseLocalDateTime(startsAtRaw);
    const endsAt = parseLocalDateTime(endsAtRaw);

    if (!startsAt || !endsAt) {
      return { status: "error", message: "Les dates de début et de fin ne sont pas valides." };
    }

    if (endsAt <= startsAt) {
      return { status: "error", message: "La date de fin doit être postérieure à la date de début." };
    }

    const city = await db.city.findFirst({
      where: { id: cityId, actif: true },
      select: { id: true },
    });

    if (!city) {
      return { status: "error", message: "La ville sélectionnée est invalide ou inactive." };
    }

    const session = await getServerSession(authOptions);
    const createdById = session?.user?.id ?? null;
    const qrToken = `camp_${randomBytes(8).toString("hex")}`;

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

    revalidatePath("/tournees");
    return { status: "success" };
  } catch (err) {
    console.error("[createCampaign]", err);
    return { status: "error", message: "Impossible d'enregistrer la tournée. Réessayez dans un instant." };
  }
}

export async function deleteCampaigns(ids: string[]): Promise<{ ok: boolean; message?: string }> {
  if (!ids || ids.length === 0) return { ok: false, message: "Aucune tournée sélectionnée." };

  try {
    // Supprimer d'abord les étudiants liés pour respecter les contraintes FK
    await db.student.updateMany({
      where: { campaignId: { in: ids } },
      data: { campaignId: null },
    });

    await db.campaign.deleteMany({
      where: { id: { in: ids } },
    });

    revalidatePath("/tournees");
    return { ok: true };
  } catch (err) {
    console.error("[deleteCampaigns]", err);
    return { ok: false, message: "Erreur lors de la suppression. Réessayez." };
  }
}
