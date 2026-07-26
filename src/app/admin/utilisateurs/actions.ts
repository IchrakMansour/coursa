"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AccountStatus } from "@/types/database";

export async function changerStatutUtilisateur(
  profileId: string,
  status: AccountStatus
) {
  await requireRole("admin");
  const admin = createAdminClient();
  await admin.from("profiles").update({ status }).eq("id", profileId);
  revalidatePath("/admin/utilisateurs");
}

export async function supprimerUtilisateur(profileId: string) {
  await requireRole("admin");
  const admin = createAdminClient();
  // Supprime l'utilisateur auth (cascade sur profiles, livreurs, etc.)
  await admin.auth.admin.deleteUser(profileId);
  revalidatePath("/admin/utilisateurs");
}
