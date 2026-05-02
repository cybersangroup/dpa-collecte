"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileType, StudentSource } from "@prisma/client";

export type StudentFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

export async function createStudent(
  context: { cityId?: string; campaignId?: string; source: StudentSource },
  _prev: StudentFormState,
  formData: FormData,
): Promise<StudentFormState> {
  try {
    const profileType = (formData.get("profileType") as ProfileType) ?? ProfileType.ETUDIANT_ELEVE;
    const nom = String(formData.get("nom") ?? "").trim();
    const prenom = String(formData.get("prenom") ?? "").trim();
    const genre = String(formData.get("genre") ?? "").trim() || null;
    const ageRaw = formData.get("age");
    const age = ageRaw ? parseInt(String(ageRaw), 10) || null : null;
    const telephone = String(formData.get("telephone") ?? "").trim();
    const countryCode = String(formData.get("countryCode") ?? "").trim() || null;

    const hasNiveau = profileType === ProfileType.ETUDIANT_ELEVE || profileType === ProfileType.PROF;
    const hasNombreEleves = profileType === ProfileType.SURVEILLANT || profileType === ProfileType.PARENT;
    const hasEtablissement = profileType !== ProfileType.PARENT;

    const niveauScolaire = hasNiveau
      ? String(formData.get("niveauScolaire") ?? "").trim() || null
      : null;
    const nombreElevesRaw = hasNombreEleves ? formData.get("nombreEleves") : null;
    const nombreEleves = nombreElevesRaw ? parseInt(String(nombreElevesRaw), 10) || null : null;
    const etablissement = hasEtablissement
      ? String(formData.get("etablissement") ?? "").trim() || null
      : null;

    if (!nom || !prenom || !telephone) {
      return { status: "error", message: "Nom, prénom et téléphone sont obligatoires." };
    }

    let cityId = context.cityId ?? null;
    let campaignId = context.campaignId ?? null;

    if (!cityId) {
      if (context.source === StudentSource.OPERATEUR) {
        const session = await getServerSession(authOptions);
        const user = session?.user;
        if (user?.id) {
          const dbUser = await db.user.findUnique({
            where: { id: user.id },
            select: { cityId: true },
          });
          cityId = dbUser?.cityId ?? null;
        }
      }
    }

    if (!cityId) {
      return { status: "error", message: "Impossible de déterminer la ville. Réessayez." };
    }

    const session = await getServerSession(authOptions);
    const addedById = context.source === StudentSource.OPERATEUR
      ? (session?.user?.id ?? null)
      : null;

    await db.student.create({
      data: {
        profileType,
        nom,
        prenom,
        genre,
        age,
        telephone,
        countryCode,
        niveauScolaire,
        nombreEleves,
        etablissement,
        cityId,
        campaignId,
        addedById,
        source: context.source,
      },
    });

    revalidatePath("/etudiants");
    return { status: "success" };
  } catch (err) {
    console.error("[createStudent]", err);
    return { status: "error", message: "Impossible d'enregistrer. Réessayez dans un instant." };
  }
}
