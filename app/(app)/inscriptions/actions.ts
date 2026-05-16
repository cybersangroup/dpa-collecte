"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// ─── Suppression (admin uniquement) ─────────────────────────────────────────

export async function deleteInscription(id: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return { ok: false, error: "Accès refusé." };
  try {
    await db.inscriptionEnfant.deleteMany({ where: { inscriptionId: id } });
    await db.inscription.delete({ where: { id } });
    revalidatePath("/inscriptions");
    return { ok: true };
  } catch {
    return { ok: false, error: "Suppression impossible." };
  }
}

// ─── Types ──────────────────────────────────────────────────────────────────

export type InscriptionFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

export type FormationFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

// ─── Client MinIO (compatible S3) ────────────────────────────────────────────

function getS3Client() {
  return new S3Client({
    endpoint:    process.env.MINIO_ENDPOINT,   // ex. http://minio:9000
    region:      "us-east-1",                  // valeur arbitraire pour MinIO
    credentials: {
      accessKeyId:     process.env.MINIO_ACCESS_KEY ?? "",
      secretAccessKey: process.env.MINIO_SECRET_KEY ?? "",
    },
    forcePathStyle: true,  // obligatoire avec MinIO
  });
}

// ─── Upload reçu ─────────────────────────────────────────────────────────────

async function uploadRecu(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;

  // En développement local sans MinIO configuré, on skippe silencieusement
  if (!process.env.MINIO_ENDPOINT || !process.env.MINIO_ACCESS_KEY) {
    console.warn("[uploadRecu] Variables MinIO non configurées — reçu non uploadé.");
    return null;
  }

  if (file.size > 10 * 1024 * 1024) throw new Error("Le reçu ne doit pas dépasser 10 Mo.");
  if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
    throw new Error("Le reçu doit être une image (JPG, PNG, WEBP) ou un PDF.");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const key = `recus/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const body = Buffer.from(await file.arrayBuffer());

  await getS3Client().send(new PutObjectCommand({
    Bucket:      process.env.MINIO_BUCKET ?? "recus",
    Key:         key,
    Body:        body,
    ContentType: file.type,
  }));

  return `${process.env.MINIO_PUBLIC_URL}/${process.env.MINIO_BUCKET ?? "recus"}/${key}`;
}

// ─── Inscription ─────────────────────────────────────────────────────────────

export async function createInscription(
  _prev: InscriptionFormState,
  formData: FormData,
): Promise<InscriptionFormState> {
  try {
    const type        = (formData.get("type") as "ADULTE" | "PARENT") ?? "ADULTE";
    // nomContact est utilisé pour le nom de l'adulte OU du parent
    const nomParent   = String(formData.get("nomContact") ?? "").trim() || null;
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

// ─── Statut inscription ──────────────────────────────────────────────────────

export async function updateStatutInscription(
  id: string,
  statut: "VALIDEE" | "REJETEE" | "EN_ATTENTE",
): Promise<{ error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { error: "Non authentifié." };
    await db.inscription.update({ where: { id }, data: { statut } });
    revalidatePath("/inscriptions");
    return {};
  } catch (err) {
    console.error("[updateStatutInscription]", err);
    return { error: "Impossible de mettre à jour le statut." };
  }
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
