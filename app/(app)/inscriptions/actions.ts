"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ─── Types ──────────────────────────────────────────────────────────────────

export type InscriptionFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

export type FormationFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

// ─── Inscription publique ────────────────────────────────────────────────────

export async function createInscription(
  _prev: InscriptionFormState,
  formData: FormData,
): Promise<InscriptionFormState> {
  try {
    const type        = (formData.get("type") as "ADULTE" | "PARENT") ?? "ADULTE";
    const telephone   = String(formData.get("telephone") ?? "").trim();
    const countryCode = String(formData.get("countryCode") ?? "").trim() || null;
    const adresse     = String(formData.get("adresse") ?? "").trim() || null;
    const formationId = String(formData.get("formationId") ?? "").trim();

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

    // Enfants (uniquement pour type PARENT)
    const enfantsData: { nom: string }[] = [];
    if (type === "PARENT") {
      const nombreEnfants = parseInt(String(formData.get("nombreEnfants") ?? "0"), 10) || 0;
      for (let i = 0; i < nombreEnfants; i++) {
        const nomEnfant = String(formData.get(`enfant_${i}`) ?? "").trim();
        if (nomEnfant) enfantsData.push({ nom: nomEnfant });
      }
    }

    await db.inscription.create({
      data: {
        type,
        telephone,
        countryCode,
        adresse,
        formationId,
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
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Accès refusé.");
  }
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

    if (!nom) return { status: "error", message: "Le nom est obligatoire." };

    await db.formation.create({ data: { nom, description, categorie, duree, prix, actif: true } });
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
    const actif       = formData.get("actif") === "true";

    if (!nom) return { status: "error", message: "Le nom est obligatoire." };

    await db.formation.update({ where: { id }, data: { nom, description, categorie, duree, prix, actif } });
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
    if (count > 0) {
      return { error: `Impossible de supprimer : ${count} inscription(s) liée(s).` };
    }
    await db.formation.delete({ where: { id } });
    revalidatePath("/formations");
    return {};
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Accès refusé.") return { error: "Accès refusé." };
    console.error("[deleteFormation]", err);
    return { error: "Impossible de supprimer." };
  }
}
