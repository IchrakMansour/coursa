// ============================================================
//  Helper WhatsApp Cloud API (Meta)
//  https://developers.facebook.com/docs/whatsapp/cloud-api
//
//  En dev (WHATSAPP_ENABLED != "true"), les messages sont
//  simplement affichés dans la console au lieu d'être envoyés.
// ============================================================

import { telWhatsApp } from "@/lib/utils";

const ENABLED = process.env.WHATSAPP_ENABLED === "true";
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

// WhatsApp attend le format international sans « + ». Un numéro tunisien
// saisi sans indicatif se voit ajouter le +216.
function normalizePhone(phone: string): string {
  return telWhatsApp(phone) ?? phone.replace(/[^0-9]/g, "");
}

export async function sendWhatsApp(to: string, message: string): Promise<boolean> {
  const destinataire = normalizePhone(to);

  if (!ENABLED || !PHONE_ID || !TOKEN) {
    // Mode simulation (développement)
    console.log("──────── [WhatsApp simulé] ────────");
    console.log(`À : +${destinataire}`);
    console.log(message);
    console.log("───────────────────────────────────");
    return true;
  }

  try {
    // Délai maximum : l'API Meta peut être lente ou ne jamais répondre (ex.
    // numéro hors liste de destinataires autorisés en mode test). Sans borne,
    // l'appel resterait bloqué et figerait la commande côté client.
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: destinataire,
          type: "text",
          text: { body: message },
        }),
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!res.ok) {
      console.error("Erreur WhatsApp:", await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("Exception WhatsApp:", e);
    return false;
  }
}

// -------- Modèles de messages (d'après le cahier des charges) --------

export function msgCollaborationAcceptee(livreurNom: string, restoNom: string): string {
  return `Bonjour ${livreurNom},\n\nLe restaurant ${restoNom} a accepté votre demande de collaboration.\n\nVous pouvez maintenant recevoir des commandes. 🎉`;
}

export function msgNouvelleCommandeLivreur(params: {
  restoNom: string;
  clientNom: string;
  adresse: string;
  lien: string;
}): string {
  return `🛵 Nouvelle livraison disponible\n\nRestaurant : ${params.restoNom}\nClient : ${params.clientNom}\nAdresse : ${params.adresse}\n\nVoir la commande :\n${params.lien}`;
}

export function msgConfirmationClient(params: {
  reference: string;
  lienSuivi: string;
}): string {
  return `✅ Votre commande ${params.reference} est confirmée.\n\nSuivre votre livraison :\n${params.lienSuivi}`;
}
