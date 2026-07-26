"use server";

import { revalidatePath } from "next/cache";
import { getMyRestaurant } from "@/lib/restaurant";
import { createClient } from "@/lib/supabase/server";
import type { CommandeStatus } from "@/types/database";

// Le restaurant met à jour l'état de préparation d'une commande le concernant
export async function majEtatCommande(commandeId: string, statut: CommandeStatus) {
  const resto = await getMyRestaurant();
  const supabase = await createClient();
  await supabase
    .from("commandes")
    .update({ status: statut })
    .eq("id", commandeId)
    .eq("restaurant_id", resto.id);
  revalidatePath("/restaurant");
}
