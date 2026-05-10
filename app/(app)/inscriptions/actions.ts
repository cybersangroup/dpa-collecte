"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { put } from "@vercel/blob";

// ─── Types ──────────────────────────────────────────────────────────────────

export type InscriptionFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

export type FormationFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

// ─── Upload reçu ─────────────────────────────────────────────────────────────

async function uploadRecu(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn("[uploadRecu] BLOB_READ_WRITE_TOKEN non configuré — reçu non uploadé.");
    return null;
  }
  if (file.size > 5 * 1024 * 1024) throw new Error("Le reçu ne doit pas dépasser 5 Mo.");
  if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
    throw new Error("Le reçu doit être une image (JPG, PNG, WEBP) ou un PDF.");
  }
  const ext  = file.name.split(".").pop() ?? "jpg";
  const name = `recus/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const blob = await put(name, file, { access: "public" });
  return blob.url;
}

// ─── Inscription ─────────────────────────────────────────────────────────────

export async function createInscription(
  _prev: InscriptionFormState,
  formData: FormData,
): Promise<InscriptionFormState> {
  try {
    const type        = (formData.get("type") as "ADULTE" | "PARENT") ?? "ADULTE";
    const nomParent   = type === "PARENT" ? String(formData.get("nomParent") ?? "").trim() || null : null;
    const telephone   = String(formData.get("telephone") ?? "").trim();
    const countryCode = String(formData.get("countryCode") ?? "").trim() || null;
    const adresse     = String(formData.get("adresse") ?? "").trim() || null;
    const formationId = String(formData.get("formationId") ?? "").trim();
    const shiftId     = String(formData.get("shiftId") ?? "").trim() || null;
    const modeFormation = String(formData.get("modeFormation") ?? "").trim() || null;

    if (!telephone) {
      return { status: "error", message: "Le numéro de téléphone est obligatoire." };
    }
    if (!formationId) {
      return { status: "error", message: "Veuillez sélectionner une formation." };
    }

    const formation = await db.formation.findUnique({ where: { id: formationId } });
    if (!formation || !formation.actif) {
      return { status: "error", message: "Formation introuvable ou inactive." };
    }

    // Upload reçu
    let recuUrl: string | null = null;
    try {
      recuUrl = await uploadRecu(formData.get("recu") as File | null);
    } catch (uploadErr) {
      if (uploadErr instanceof Error) return { status: "error", message: uploadErr.message };
    }

    // Enfants (PARENT uniquement)
    const enfantsData: { nom: string }[] = [];
    if (type === "PARENT") {
      const n = parseInt(String(formData.get("nombreEnfants") ?? "0"), 10) || 0;
      for (let i = 0; i < n; i++) {
        const nom = String(formData.get(`enfant_${i}`) ?? "").trim();
        if (nom) enfantsData.push({ nom });
      }
    }

    const session   = await getServerSession(authOptions);
    const addedById = session?.user?.id ?? null;

    await db.inscription.create({
      data: {
        type,
        nomParent,
        telephone,
        countryCode,
        adresse,
        formationId,
        shiftId:       shiftId || null,
        modeFormation: modeFormation || null,
        recuUrl,
        addedById,
        enfants: enfantsData.length > 0 ? { create: enfantsData } : undefined,
      },
    });

    revalidatePath("/inscriptions");
    return { status: "success" };
  } catch (err) {
    console.error("[createInscription]", err);
    return { status: "error", message: "Impossible d'enregistrer. Réessayez dans un instant." };
  }
}

// ─── CRUD Formations (admin uniquement) ─────────────────────────────────────

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Accès refusé.");
  return session;
}

export async function createFormation(
  _prev: FormationFormState,
  formData: FormData,
): Promise<FormationFormState> {
  try {
    await requireAdmin();
    const nom         = String(formData.get("nom") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim() || null;
    const categorie   = (formData.get("categorie") as "ENFANT" | "ADULTE") ?? "ADULTE";
    const duree       = String(formData.get("duree") ?? "").trim() || null;
    const prix        = String(formData.get("prix") ?? "").trim() || null;
    const devise      = String(formData.get("devise") ?? "FCFA").trim();
    const frequence   = String(formData.get("frequence") ?? "").trim() || null;
    const jours       = String(formData.get("jours") ?? "").trim() || null;

    if (!nom) return { status: "error", message: "Le nom est obligatoire." };

    await db.formation.create({ data: { nom, description, categorie, duree, prix, devise, frequence, jours, actif: true } });
    revalidatePath("/formations");
    return { status: "success" };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Accès refusé.") return { status: "error", message: "Accès refusé." };
    console.error("[createFormation]", err);
    return { status: "error", message: "Impossible de créer la formation." };
  }
}

export async function updateFormation(
  id: string,
  _prev: FormationFormState,
  formData: FormData,
): Promise<FormationFormState> {
  try {
    await requireAdmin();
    const nom         = String(formData.get("nom") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim() || null;
    const categorie   = (formData.get("categorie") as "ENFANT" | "ADULTE") ?? "ADULTE";
    const duree       = String(formData.get("duree") ?? "").trim() || null;
    const prix        = String(formData.get("prix") ?? "").trim() || null;
    const devise      = String(formData.get("devise") ?? "FCFA").trim();
    const frequence   = String(formData.get("frequence") ?? "").trim() || null;
    const jours       = String(formData.get("jours") ?? "").trim() || null;
    const actif       = formData.get("actif") === "true";

    if (!nom) return { status: "error", message: "Le nom est obligatoire." };

    await db.formation.update({ where: { id }, data: { nom, description, categorie, duree, prix, devise, frequence, jours, actif } });
    revalidatePath("/formations");
    return { status: "success" };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Accès refusé.") return { status: "error", message: "Accès refusé." };
    console.error("[updateFormation]", err);
    return { status: "error", message: "Impossible de modifier la formation." };
  }
}

export async function toggleFormationActif(id: string, actif: boolean): Promise<void> {
  await requireAdmin();
  await db.formation.update({ where: { id }, data: { actif } });
  revalidatePath("/formations");
}

export async function deleteFormation(id: string): Promise<{ error?: string }> {
  try {
    await requireAdmin();
    const count = await db.inscription.count({ where: { formationId: id } });
    if (count > 0) return { error: `Impossible de supprimer : ${count} inscription(s) liée(s).` };
    await db.formation.delete({ where: { id } });
    revalidatePath("/formations");
    return {};
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Accès refusé.") return { error: "Accès refusé." };
    console.error("[deleteFormation]", err);
    return { error: "Impossible de supprimer." };
  }
}

// ─── CRUD Shifts ─────────────────────────────────────────────────────────────

export async function createShift(
  formationId: string,
  label: string,
  heureDebut: string,
  heureFin: string,
): Promise<{ error?: string }> {
  try {
    await requireAdmin();
    if (!label || !heureDebut || !heureFin) return { error: "Label et horaires obligatoires." };
    await db.formationShift.create({ data: { formationId, label: label.trim(), heureDebut: heureDebut.trim(), heureFin: heureFin.trim() } });
    revalidatePath("/formations");
    return {};
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Accès refusé.") return { error: "Accès refusé." };
    return { error: "Impossible de créer le créneau." };
  }
}

export async function deleteShift(id: string): Promise<{ error?: string }> {
  try {
    await requireAdmin();
    await db.formationShift.delete({ where: { id } });
    revalidatePath("/formations");
    return {};
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Accès refusé.") return { error: "Accès refusé." };
    return { error: "Impossible de supprimer." };
  }
}
