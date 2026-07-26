import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Restaurant } from "@/types/database";

// Retourne le restaurant du propriétaire connecté, ou redirige vers l'onboarding
export async function getMyRestaurant(): Promise<Restaurant> {
  const profile = await requireRole("restaurant");
  const supabase = await createClient();
  const { data } = await supabase
    .from("restaurants")
    .select("*")
    .eq("owner_id", profile.id)
    .maybeSingle();
  if (!data) redirect("/restaurant/bienvenue");
  return data as Restaurant;
}
