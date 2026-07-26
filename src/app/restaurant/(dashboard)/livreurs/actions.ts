"use server";

import { revalidatePath } from "next/cache";
import { getMyRestaurant } from "@/lib/restaurant";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendWhatsApp,
  msgCollaborationAcceptee,
} from "@/lib/whatsapp";

export async function repondreDemande(
  partenariatId: string,
  reponse: "accepted" | "refused"
) {
  const resto = await getMyRestaurant();
  const supabase = await createClient();

  const { data: part } = await supabase
    .from("partenariats")
    .update({ status: reponse })
    .eq("id", partenariatId)
    .eq("restaurant_id", resto.id)
    .select("livreur_id")
    .single();

  // Notifie le livreur si accepté
  if (part && reponse === "accepted") {
    const admin = createAdminClient();
    const { data: prof } = await admin
      .from("profiles")
      .select("full_name, whatsapp, phone")
      .eq("id", part.livreur_id)
      .single();
    const numero = prof?.whatsapp || prof?.phone;
    if (numero) {
      await sendWhatsApp(
        numero,
        msgCollaborationAcceptee(prof?.full_name ?? "Livreur", resto.nom)
      );
    }
  }

  revalidatePath("/restaurant/livreurs");
}

export async function retirerLivreur(partenariatId: string) {
  const resto = await getMyRestaurant();
  const supabase = await createClient();
  await supabase
    .from("partenariats")
    .delete()
    .eq("id", partenariatId)
    .eq("restaurant_id", resto.id);
  revalidatePath("/restaurant/livreurs");
}
