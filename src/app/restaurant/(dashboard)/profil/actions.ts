"use server";

import { revalidatePath } from "next/cache";
import { getMyRestaurant } from "@/lib/restaurant";
import { createClient } from "@/lib/supabase/server";

export async function majRestaurant(formData: FormData) {
  const resto = await getMyRestaurant();
  const supabase = await createClient();
  await supabase
    .from("restaurants")
    .update({
      nom: String(formData.get("nom") || "").trim(),
      categorie: String(formData.get("categorie") || "") || null,
      adresse: String(formData.get("adresse") || "") || null,
      telephone: String(formData.get("telephone") || "") || null,
      ville: String(formData.get("ville") || "") || null,
      horaires: String(formData.get("horaires") || "") || null,
    })
    .eq("id", resto.id);
  revalidatePath("/restaurant/profil");
  revalidatePath("/restaurant");
}
