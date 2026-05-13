"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export type StudentFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

type Source = "OPERATEUR" | "QR_AUTO";
type Profile = "ETUDIANT_ELEVE" | "PROF" | "SURVEILLANT" | "PARENT";

export async function createStudent(
  context: { cityId?: string; campaignId?: string; source: Source },
  _prev: StudentFormState,
  formData: FormData,
): Promise<StudentFormState> {
  try {
    const profileType = (formData.get("profileType") as Profile) ?? "ETUDIANT_ELEVE";
    const nom          = String(formData.get("nom")    ?? "").trim();
    const prenom       = String(formData.get("prenom") ?? "").trim();
    const genre        = String(formData.get("genre")  ?? "").trim() || null;
    const dateNaissance = String(formData.get("dateNaissance") ?? "").trim() || null;
    const telephone    = String(formData.get("telephone") ?? "").trim();
    const countryCode  = String(formData.get("countryCode") ?? "").trim() || null;

    const isEtudiant      = profileType === "ETUDIANT_ELEVE";
    const hasNiveau       = isEtudiant || profileType === "PROF";
    const hasNombreEleves = profileType === "SURVEILLANT" || profileType === "PARENT";
    const hasEtablissement = profileType !== "PARENT";

    // Pour ETUDIANT_ELEVE: niveauScolaire = catégorie (Lycée…), classe = classe précise
    // Pour PROF: niveauScolaire = description libre
    const niveauScolaire = hasNiveau
      ? String(formData.get("niveauScolaire") ?? "").trim() || null
      : null;
    const classe = isEtudiant
      ? String(formData.get("classe") ?? "").trim() || null
      : null;

    const nombreElevesRaw = hasNombreEleves ? formData.get("nombreEleves") : null;
    const nombreEleves    = nombreElevesRaw ? parseInt(String(nombreElevesRaw), 10) || null : null;
    const etablissement   = hasEtablissement
      ? String(formData.get("etablissement") ?? "").trim() || null
      : null;
    const adresse = String(formData.get("adresse") ?? "").trim() || null;

    if (!nom || !telephone) {
      return { status: "error", message: "Nom et téléphone sont obligatoires." };
    }

    let cityId   = context.cityId ?? null;
    const campaignId = context.campaignId ?? null;

    if (!cityId && context.source === "OPERATEUR") {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        const dbUser = await db.user.findUnique({
          where: { id: session.user.id },
          select: { cityId: true },
        });
        cityId = dbUser?.cityId ?? null;
      }
    }

    if (!cityId) {
      return { status: "error", message: "Impossible de déterminer la ville. Réessayez." };
    }

    const session2  = await getServerSession(authOptions);
    const addedById = context.source === "OPERATEUR" ? (session2?.user?.id ?? null) : null;

    await db.student.create({
      data: {
        profileType,
        nom,
        prenom,
        genre,
        dateNaissance,
        telephone,
        countryCode,
        niveauScolaire,
        classe,
        nombreEleves,
        etablissement,
        adresse,
        cityId,
        campaignId,
        addedById,
        source: context.source,
      },
    });

    revalidatePath("/collectes-donnees");
    return { status: "success" };
  } catch (err) {
    console.error("[createStudent]", err);
    return { status: "error", message: "Impossible d'enregistrer. Réessayez dans un instant." };
  }
}
