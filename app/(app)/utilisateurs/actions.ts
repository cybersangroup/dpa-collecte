"use server";

import { createHash } from "crypto";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") throw new Error("Accès refusé");
  return session;
}

export async function toggleUserActif(
  id: string,
  actif: boolean,
): Promise<{ ok: boolean; message?: string }> {
  try {
    await requireAdmin();
    await db.user.update({ where: { id }, data: { actif } });
    revalidatePath("/utilisateurs");
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function changeUserPassword(
  id: string,
  newPassword: string,
): Promise<{ ok: boolean; message?: string }> {
  try {
    await requireAdmin();
    if (!newPassword || newPassword.length < 8) {
      return { ok: false, message: "Mot de passe trop court (8 car. min)." };
    }
    const passwordHash = createHash("sha256").update(newPassword).digest("hex");
    await db.user.update({ where: { id }, data: { passwordHash } });
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Erreur" };
  }
}
