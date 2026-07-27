"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { photosDepuisFormulaire } from "@/lib/menu-photos-server";
import { telInternational } from "@/lib/utils";
import { importerMenuTexte } from "@/lib/menu-import";

// Le livreur ajoute un restaurant à son réseau.
// Crée le restaurant (sans propriétaire) + un partenariat accepté,
// et enregistre les photos du menu prises par le livreur.
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
      telephone: telInternational(String(formData.get("telephone") || "")),
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

    const photos = photosDepuisFormulaire(formData, profile.id, resto.id);
    if (photos.length > 0) {
      await admin.from("menu_photos").insert(photos);
    }

    // Menu tapé directement dans le formulaire, une ligne par produit
    const menuTexte = String(formData.get("menu_texte") || "").trim();
    if (menuTexte) {
      await importerMenuTexte(admin, resto.id, menuTexte);
    }

    // Un restaurant sans menu n'est pas commandable : on emmène directement
    // le livreur sur la saisie de la carte.
    revalidatePath("/livreur/restaurants");
    redirect(`/livreur/restaurants/${resto.id}/menu`);
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

