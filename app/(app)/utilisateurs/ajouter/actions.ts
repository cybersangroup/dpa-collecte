"use server";

import { createHash } from "crypto";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export type CreateUserState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

export async function createUser(
  _prev: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return { status: "error", message: "Accès refusé. Seuls les admins peuvent créer des utilisateurs." };
    }

    const nomComplet = String(formData.get("nomComplet") ?? "").trim();
    const username   = String(formData.get("username") ?? "").trim().toLowerCase();
    const password   = String(formData.get("password") ?? "").trim();
    const role       = (formData.get("role") as "ADMIN" | "OPERATEUR") ?? "OPERATEUR";
    const cityId     = String(formData.get("cityId") ?? "").trim();

    if (!nomComplet || !username || !password || !cityId) {
      return { status: "error", message: "Tous les champs sont obligatoires." };
    }
    if (password.length < 8) {
      return { status: "error", message: "Le mot de passe doit faire au moins 8 caractères." };
    }
    const exists = await db.user.findUnique({ where: { username } });
    if (exists) {
      return { status: "error", message: `Le nom d'utilisateur "@${username}" est déjà pris.` };
    }

    const passwordHash = createHash("sha256").update(password).digest("hex");

    await db.user.create({
      data: { nomComplet, username, passwordHash, role, cityId, actif: true },
    });

    revalidatePath("/utilisateurs");
    return { status: "success" };
  } catch (err) {
    console.error("[createUser]", err);
    return { status: "error", message: "Impossible de créer l'utilisateur." };
  }
}
