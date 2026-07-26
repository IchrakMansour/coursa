"use server";

import { revalidatePath } from "next/cache";
import { getMyRestaurant } from "@/lib/restaurant";
import { createClient } from "@/lib/supabase/server";

export async function ajouterCategorie(formData: FormData) {
  const resto = await getMyRestaurant();
  const supabase = await createClient();
  const nom = String(formData.get("nom") || "").trim();
  if (!nom) return;
  await supabase.from("menu_categories").insert({ restaurant_id: resto.id, nom });
  revalidatePath("/restaurant/menu");
}

export async function supprimerCategorie(id: string) {
  const resto = await getMyRestaurant();
  const supabase = await createClient();
  await supabase
    .from("menu_categories")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", resto.id);
  revalidatePath("/restaurant/menu");
}

export async function ajouterProduit(formData: FormData) {
  const resto = await getMyRestaurant();
  const supabase = await createClient();
  const nom = String(formData.get("nom") || "").trim();
  if (!nom) return;
  await supabase.from("produits").insert({
    restaurant_id: resto.id,
    categorie_id: String(formData.get("categorie_id") || "") || null,
    nom,
    description: String(formData.get("description") || "") || null,
    prix: Number(formData.get("prix") || 0),
    disponible: true,
  });
  revalidatePath("/restaurant/menu");
}

export async function basculerDisponibilite(id: string, disponible: boolean) {
  const resto = await getMyRestaurant();
  const supabase = await createClient();
  await supabase
    .from("produits")
    .update({ disponible })
    .eq("id", id)
    .eq("restaurant_id", resto.id);
  revalidatePath("/restaurant/menu");
}

export async function supprimerProduit(id: string) {
  const resto = await getMyRestaurant();
  const supabase = await createClient();
  await supabase.from("produits").delete().eq("id", id).eq("restaurant_id", resto.id);
  revalidatePath("/restaurant/menu");
}
