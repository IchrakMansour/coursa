"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { photosDepuisFormulaire } from "@/lib/menu-photos-server";
import { MENU_BUCKET } from "@/lib/menu-photos.shared";
import { importerMenuTexte } from "@/lib/menu-import";

// Vérifie que le livreur connecté est bien partenaire (accepté) du restaurant,
// puis renvoie un client admin pour gérer le menu de CE restaurant.
// Les restaurants ajoutés par un livreur n'ont pas de propriétaire : c'est le
// livreur qui gère leur menu, d'où l'usage du client admin (contrôlé).
async function accesRestaurant(restaurantId: string) {
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
  return { admin, profile };
}

async function clientPourRestaurant(restaurantId: string) {
  const { admin } = await accesRestaurant(restaurantId);
  return admin;
}

type Admin = Awaited<ReturnType<typeof clientPourRestaurant>>;

// La catégorie est facultative et se crée à la volée : le livreur tape son nom
// dans le formulaire du produit, pas besoin de la préparer avant.
async function categorieId(
  admin: Admin,
  restaurantId: string,
  nom: string
): Promise<string | null> {
  const propre = nom.trim();
  if (!propre) return null;

  const { data: existante } = await admin
    .from("menu_categories")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .ilike("nom", propre)
    .maybeSingle();
  if (existante) return existante.id as string;

  const { count } = await admin
    .from("menu_categories")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurantId);

  const { data: creee } = await admin
    .from("menu_categories")
    .insert({ restaurant_id: restaurantId, nom: propre, position: count ?? 0 })
    .select("id")
    .single();
  return (creee?.id as string) ?? null;
}

// Champs communs aux formulaires d'ajout et de modification d'un produit
function champsProduit(formData: FormData) {
  const nom = String(formData.get("nom") || "").trim();
  const prix = Number(String(formData.get("prix") || "0").replace(",", "."));
  return {
    nom,
    prix: Number.isFinite(prix) && prix >= 0 ? prix : 0,
    description: String(formData.get("description") || "").trim() || null,
    // Une case décochée n'est pas envoyée : son absence vaut « épuisé ».
    disponible: formData.get("disponible") === "on",
  };
}

export async function ajouterProduit(restaurantId: string, formData: FormData) {
  const admin = await clientPourRestaurant(restaurantId);
  const champs = champsProduit(formData);
  if (!champs.nom) return;

  const categorie = await categorieId(
    admin,
    restaurantId,
    String(formData.get("categorie") || "")
  );

  await admin.from("produits").insert({
    restaurant_id: restaurantId,
    categorie_id: categorie,
    ...champs,
  });
  revalidatePath(`/livreur/restaurants/${restaurantId}/menu`);
}

// Saisie du menu en bloc : une ligne par produit, les lignes sans prix
// servant de titres de catégorie.
export async function importerMenu(restaurantId: string, formData: FormData) {
  const admin = await clientPourRestaurant(restaurantId);
  const texte = String(formData.get("menu_texte") || "").trim();
  if (!texte) return;
  await importerMenuTexte(admin, restaurantId, texte);
  revalidatePath(`/livreur/restaurants/${restaurantId}/menu`);
}

export async function modifierProduit(
  restaurantId: string,
  produitId: string,
  formData: FormData
) {
  const admin = await clientPourRestaurant(restaurantId);
  const champs = champsProduit(formData);
  if (!champs.nom) return;

  const categorie = await categorieId(
    admin,
    restaurantId,
    String(formData.get("categorie") || "")
  );

  await admin
    .from("produits")
    .update({ categorie_id: categorie, ...champs })
    .eq("id", produitId)
    .eq("restaurant_id", restaurantId);
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

// Supprime la catégorie ; ses produits restent au menu, sans catégorie.
export async function supprimerCategorie(restaurantId: string, id: string) {
  const admin = await clientPourRestaurant(restaurantId);
  await admin
    .from("menu_categories")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", restaurantId);
  revalidatePath(`/livreur/restaurants/${restaurantId}/menu`);
}

// ------------------------------------------------------------
//  Photos de la carte (prises par le livreur)
// ------------------------------------------------------------
export async function ajouterPhotosMenu(restaurantId: string, formData: FormData) {
  const { admin, profile } = await accesRestaurant(restaurantId);

  const { count } = await admin
    .from("menu_photos")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurantId);

  const photos = photosDepuisFormulaire(
    formData,
    profile.id,
    restaurantId,
    count ?? 0
  );
  if (photos.length === 0) return;

  const legende = String(formData.get("legende") || "").trim();
  await admin
    .from("menu_photos")
    .insert(photos.map((p) => ({ ...p, legende: legende || null })));

  revalidatePath(`/livreur/restaurants/${restaurantId}/menu`);
}

export async function supprimerPhotoMenu(restaurantId: string, photoId: string) {
  const admin = await clientPourRestaurant(restaurantId);

  const { data: photo } = await admin
    .from("menu_photos")
    .select("storage_path")
    .eq("id", photoId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  await admin
    .from("menu_photos")
    .delete()
    .eq("id", photoId)
    .eq("restaurant_id", restaurantId);

  // Le fichier n'est plus référencé : on le retire aussi du stockage.
  const path = (photo as { storage_path: string | null } | null)?.storage_path;
  if (path) await admin.storage.from(MENU_BUCKET).remove([path]);

  revalidatePath(`/livreur/restaurants/${restaurantId}/menu`);
}
