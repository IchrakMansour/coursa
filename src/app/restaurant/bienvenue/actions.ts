"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function creerRestaurant(formData: FormData) {
  const profile = await requireRole("restaurant");
  const supabase = await createClient();

  const nom = String(formData.get("nom") || "").trim();
  if (!nom) return;

  await supabase.from("restaurants").insert({
    owner_id: profile.id,
    nom,
    categorie: String(formData.get("categorie") || "") || null,
    ville: String(formData.get("ville") || "") || null,
    adresse: String(formData.get("adresse") || "") || null,
    telephone: String(formData.get("telephone") || "") || null,
    status: "active",
  });

  redirect("/restaurant");
}
