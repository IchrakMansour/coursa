"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsApp, msgConfirmationClient } from "@/lib/whatsapp";
import type { CommandeStatus } from "@/types/database";

export async function changerStatut(commandeId: string, statut: CommandeStatus) {
  const profile = await requireRole("livreur");
  const supabase = await createClient();

  const { data: commande } = await supabase
    .from("commandes")
    .update({ status: statut })
    .eq("id", commandeId)
    .eq("livreur_id", profile.id)
    .select("*")
    .single();

  // Notifie le client au moment de la mise en livraison
  if (commande && statut === "en_livraison" && commande.client_telephone) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await sendWhatsApp(
      commande.client_telephone,
      msgConfirmationClient({
        reference: commande.reference,
        lienSuivi: `${appUrl}/suivi/${commande.id}`,
      })
    );
  }

  revalidatePath("/livreur/commandes");
  revalidatePath("/livreur");
}

export async function refuserCommande(commandeId: string) {
  const profile = await requireRole("livreur");
  const supabase = await createClient();
  await supabase
    .from("commandes")
    .update({ status: "annulee" })
    .eq("id", commandeId)
    .eq("livreur_id", profile.id);
  revalidatePath("/livreur/commandes");
  revalidatePath("/livreur");
}
