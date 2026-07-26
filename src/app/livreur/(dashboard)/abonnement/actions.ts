"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PLANS } from "@/lib/constants";
import type { AbonnementPlan } from "@/types/database";

export async function changerPlan(formData: FormData) {
  const profile = await requireRole("livreur");
  const supabase = await createClient();
  const plan = String(formData.get("plan") || "free") as AbonnementPlan;
  const planInfo = PLANS.find((p) => p.id === plan);

  const expires = new Date();
  expires.setMonth(expires.getMonth() + 1);

  // Met à jour (ou crée) l'abonnement
  const { data: existing } = await supabase
    .from("abonnements")
    .select("id")
    .eq("livreur_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("abonnements")
      .update({
        plan,
        status: "active",
        expires_at: plan === "free" ? null : expires.toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("abonnements").insert({
      livreur_id: profile.id,
      plan,
      status: "active",
      expires_at: plan === "free" ? null : expires.toISOString(),
    });
  }

  // Paiement de démonstration pour les offres payantes
  if (planInfo && planInfo.prix > 0) {
    await supabase.from("paiements").insert({
      livreur_id: profile.id,
      montant: planInfo.prix,
      type: "abonnement",
      status: "paye",
    });
  }

  revalidatePath("/livreur/abonnement");
}
