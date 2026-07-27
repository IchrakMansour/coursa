"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsApp, msgConfirmationClient } from "@/lib/whatsapp";
import { STATUTS_EN_COURSE, canalSuivi } from "@/lib/constants";
import { diffuser } from "@/lib/realtime";
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

  // Pousse le nouveau statut vers la page de suivi du client
  await diffuser(canalSuivi(commandeId), "statut", { status: statut });

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

// Mémorise la dernière position connue du livreur sur ses commandes en
// cours. Appelée environ une fois par minute seulement : le direct passe
// par Realtime Broadcast, ceci ne sert qu'à afficher un point de départ
// quand le client ouvre la page de suivi.
export async function enregistrerPosition(
  commandeIds: string[],
  lat: number,
  lng: number
) {
  const profile = await requireRole("livreur");
  if (commandeIds.length === 0) return;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return;

  const supabase = await createClient();
  await supabase
    .from("commandes")
    .update({
      livreur_lat: lat,
      livreur_lng: lng,
      position_maj: new Date().toISOString(),
    })
    .in("id", commandeIds)
    .eq("livreur_id", profile.id)
    .in("status", STATUTS_EN_COURSE);
}

export async function effacerPosition(commandeIds: string[]) {
  const profile = await requireRole("livreur");
  if (commandeIds.length === 0) return;

  const supabase = await createClient();
  await supabase
    .from("commandes")
    .update({ livreur_lat: null, livreur_lng: null, position_maj: null })
    .in("id", commandeIds)
    .eq("livreur_id", profile.id);
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
