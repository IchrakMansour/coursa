"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// Vérifie que le livreur connecté est bien partenaire (accepté) du restaurant,
// puis renvoie un client admin pour gérer le menu de CE restaurant.
// Les restaurants ajoutés par un livreur n'ont pas de propriétaire : c'est le
// livreur qui gère leur menu, d'où l'usage du client admin (contrôlé).
async function clientPourRestaurant(restaurantId: string) {
  const profile = await requireRole("livreur");
  const admin = createAdminClient();
  const { data } = await admin
    .from("partenariats")
    .select("id")
    .eq("livreur_id", profile.id)
    .eq("restaurant_id", restaurantId)
    .eq("status", "accepted")
    .maybeSingle();
  if (!data) throw new Error("Restaurant non autorisé pour ce livreur.");
  return admin;
}

export async function ajouterCategorie(restaurantId: string, formData: FormData) {
  const admin = await clientPourRestaurant(restaurantId);
  const nom = String(formData.get("nom") || "").trim();
  if (!nom) return;
  await admin.from("menu_categories").insert({ restaurant_id: restaurantId, nom });
  revalidatePath(`/livreur/restaurants/${restaurantId}/menu`);
}

export async function supprimerCategorie(restaurantId: string, id: string) {
  const admin = await clientPourRestaurant(restaurantId);
  await admin
    .from("menu_categories")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", restaurantId);
  revalidatePath(`/livreur/restaurants/${restaurantId}/menu`);
}

export async function ajouterProduit(restaurantId: string, formData: FormData) {
  const admin = await clientPourRestaurant(restaurantId);
  const nom = String(formData.get("nom") || "").trim();
  if (!nom) return;
  await admin.from("produits").insert({
    restaurant_id: restaurantId,
    categorie_id: String(formData.get("categorie_id") || "") || null,
    nom,
    description: String(formData.get("description") || "") || null,
    prix: Number(formData.get("prix") || 0),
    disponible: true,
  });
  revalidatePath(`/livreur/restaurants/${restaurantId}/menu`);
}

export async function basculerDisponibilite(
  restaurantId: string,
  id: string,
  disponible: boolean
) {
  const admin = await clientPourRestaurant(restaurantId);
  await admin
    .from("produits")
    .update({ disponible })
    .eq("id", id)
    .eq("restaurant_id", restaurantId);
  revalidatePath(`/livreur/restaurants/${restaurantId}/menu`);
}

export async function supprimerProduit(restaurantId: string, id: string) {
  const admin = await clientPourRestaurant(restaurantId);
  await admin.from("produits").delete().eq("id", id).eq("restaurant_id", restaurantId);
  revalidatePath(`/livreur/restaurants/${restaurantId}/menu`);
}
