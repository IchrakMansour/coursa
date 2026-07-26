"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export async function creerVitrine(formData: FormData) {
  const profile = await requireRole("livreur");
  const supabase = await createClient();

  const nom = String(formData.get("nom_commercial") || "").trim();
  const ville = String(formData.get("ville") || "").trim();
  const zone = String(formData.get("zone_livraison") || "").trim();

  if (!nom) return;

  // Génère un slug unique
  const base = slugify(nom) || "livreur";
  let slug = base;
  let n = 1;
  while (true) {
    const { data: exists } = await supabase
      .from("livreurs")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!exists) break;
    slug = `${base}-${n++}`;
  }

  await supabase.from("livreurs").insert({
    id: profile.id,
    slug,
    nom_commercial: nom,
    ville,
    zone_livraison: zone,
  });

  // Abonnement d'essai gratuit
  await supabase.from("abonnements").insert({
    livreur_id: profile.id,
    plan: "free",
    status: "active",
  });

  redirect("/livreur");
}
