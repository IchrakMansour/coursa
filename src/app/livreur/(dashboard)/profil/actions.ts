"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { telInternational } from "@/lib/utils";

export async function majProfil(formData: FormData) {
  const profile = await requireRole("livreur");
  const supabase = await createClient();

  await supabase
    .from("livreurs")
    .update({
      nom_commercial: String(formData.get("nom_commercial") || "").trim(),
      description: String(formData.get("description") || "") || null,
      ville: String(formData.get("ville") || "") || null,
      zone_livraison: String(formData.get("zone_livraison") || "") || null,
      horaire_ouverture: String(formData.get("horaire_ouverture") || "12:00"),
      horaire_fermeture: String(formData.get("horaire_fermeture") || "23:00"),
      type_vehicule: String(formData.get("type_vehicule") || "moto"),
      is_published: formData.get("is_published") === "on",
    })
    .eq("id", profile.id);

  // WhatsApp du profil, stocké au format international (+216 par défaut)
  const saisie = String(formData.get("whatsapp") || "").trim();
  await supabase
    .from("profiles")
    .update({ whatsapp: saisie ? telInternational(saisie) ?? saisie : null })
    .eq("id", profile.id);

  revalidatePath("/livreur/profil");
  revalidatePath("/livreur");
}

export async function ajouterService(formData: FormData) {
  const profile = await requireRole("livreur");
  const supabase = await createClient();
  const nom = String(formData.get("nom") || "").trim();
  if (!nom) return;
  await supabase.from("services").insert({
    livreur_id: profile.id,
    nom,
    icone: String(formData.get("icone") || "📦"),
    // 0 = prix à convenir avec le client
    prix: Number(String(formData.get("prix") || "0").replace(",", ".")) || 0,
  });
  revalidatePath("/livreur/profil");
}

export async function supprimerService(id: string) {
  const profile = await requireRole("livreur");
  const supabase = await createClient();
  await supabase.from("services").delete().eq("id", id).eq("livreur_id", profile.id);
  revalidatePath("/livreur/profil");
}
