"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";

// ─── Mise à jour du profil ────────────────────────────────────────────────────

export type ProfileState =
  | { status: "idle" }
  | { status: "success"; nomComplet: string; username: string; cityCode: string; cityName: string }
  | { status: "error"; message: string };

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { status: "error", message: "Non authentifié." };
    }

    const nomComplet = String(formData.get("nomComplet") ?? "").trim();
    const username   = String(formData.get("username")   ?? "").trim().toLowerCase();
    const cityId     = String(formData.get("cityId")     ?? "").trim();

    if (!nomComplet || !username || !cityId) {
      return { status: "error", message: "Tous les champs sont obligatoires." };
    }
    if (username.length < 3) {
      return { status: "error", message: "Le nom d'utilisateur doit faire au moins 3 caractères." };
    }

    // Vérifier l'unicité du username (sauf si c'est le sien)
    const existing = await db.user.findFirst({
      where: { username, id: { not: session.user.id } },
    });
    if (existing) {
      return { status: "error", message: `Le nom d'utilisateur "@${username}" est déjà pris.` };
    }

    // Récupérer la ville pour retourner les infos de session
    const city = await db.city.findUnique({ where: { id: cityId } });
    if (!city) {
      return { status: "error", message: "Ville introuvable." };
    }

    await db.user.update({
      where: { id: session.user.id },
      data:  { nomComplet, username, cityId },
    });

    return {
      status:   "success",
      nomComplet,
      username,
      cityCode: city.code,
      cityName: city.nom,
    };
  } catch (err) {
    console.error("[updateProfile]", err);
    return { status: "error", message: "Impossible de mettre à jour le profil." };
  }
}

// ─── Changement de mot de passe ───────────────────────────────────────────────

export type PasswordState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export async function changePassword(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { status: "error", message: "Non authentifié." };
    }

    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword     = String(formData.get("newPassword")     ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      return { status: "error", message: "Tous les champs sont obligatoires." };
    }
    if (newPassword.length < 8) {
      return { status: "error", message: "Le nouveau mot de passe doit faire au moins 8 caractères." };
    }
    if (newPassword !== confirmPassword) {
      return { status: "error", message: "Les deux nouveaux mots de passe ne correspondent pas." };
    }

    // Vérifier le mot de passe actuel
    const user = await db.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return { status: "error", message: "Utilisateur introuvable." };
    }
    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return { status: "error", message: "Mot de passe actuel incorrect." };
    }
    if (currentPassword === newPassword) {
      return { status: "error", message: "Le nouveau mot de passe doit être différent de l'actuel." };
    }

    await db.user.update({
      where: { id: session.user.id },
      data:  { passwordHash: hashPassword(newPassword) },
    });

    return { status: "success" };
  } catch (err) {
    console.error("[changePassword]", err);
    return { status: "error", message: "Impossible de changer le mot de passe." };
  }
}
