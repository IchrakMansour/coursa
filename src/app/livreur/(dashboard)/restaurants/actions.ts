"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Le livreur ajoute un restaurant à son réseau.
// Crée le restaurant (sans propriétaire) + un partenariat accepté.
export async function ajouterRestaurant(formData: FormData) {
  const profile = await requireRole("livreur");
  const admin = createAdminClient();

  const nom = String(formData.get("nom") || "").trim();
  if (!nom) return;

  const { data: resto } = await admin
    .from("restaurants")
    .insert({
      nom,
      adresse: String(formData.get("adresse") || "") || null,
      telephone: String(formData.get("telephone") || "") || null,
      categorie: String(formData.get("categorie") || "") || null,
      status: "active",
    })
    .select("id")
    .single();

  if (resto) {
    await admin.from("partenariats").insert({
      livreur_id: profile.id,
      restaurant_id: resto.id,
      status: "accepted",
      prix_livraison: Number(formData.get("prix_livraison") || 0),
      initie_par: "livreur",
    });
  }

  revalidatePath("/livreur/restaurants");
}

export async function retirerPartenariat(partenariatId: string) {
  const profile = await requireRole("livreur");
  const supabase = await createClient();
  await supabase
    .from("partenariats")
    .delete()
    .eq("id", partenariatId)
    .eq("livreur_id", profile.id);
  revalidatePath("/livreur/restaurants");
}

export async function accepterInvitation(partenariatId: string) {
  const profile = await requireRole("livreur");
  const supabase = await createClient();
  await supabase
    .from("partenariats")
    .update({ status: "accepted" })
    .eq("id", partenariatId)
    .eq("livreur_id", profile.id);
  revalidatePath("/livreur/restaurants");
}
