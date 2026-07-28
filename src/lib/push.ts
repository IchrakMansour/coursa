import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

// ============================================================
//  Envoi de notifications push (Web Push / VAPID) — côté serveur.
//
//  Tant que les clés VAPID ne sont pas configurées (VAPID_PUBLIC_KEY /
//  VAPID_PRIVATE_KEY), l'envoi est simplement ignoré : l'application
//  continue de fonctionner sans push.
// ============================================================

const PUBLIC = process.env.VAPID_PUBLIC_KEY;
const PRIVATE = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:contact@livrapro.app";

let configure = false;
function assurerConfig(): boolean {
  if (!PUBLIC || !PRIVATE) return false;
  if (!configure) {
    webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE);
    configure = true;
  }
  return true;
}

// Borne chaque envoi : un service de push lent ne doit jamais bloquer la
// réponse (l'appel se fait déjà hors chemin critique côté commande).
function avecDelai<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
  ]);
}

export async function envoyerPushLivreur(
  livreurId: string,
  notif: { title: string; body: string; url?: string }
): Promise<void> {
  if (!assurerConfig()) return;

  const supabase = createAdminClient();
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("livreur_id", livreurId);

  if (!subs || subs.length === 0) return;

  const payload = JSON.stringify({
    title: notif.title,
    body: notif.body,
    url: notif.url ?? "/livreur/commandes",
    tag: "commande",
  });

  const perimes: string[] = [];

  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await avecDelai(
          webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
            { TTL: 3600 }
          ),
          6000
        );
      } catch (e: unknown) {
        // 404/410 : l'abonnement n'existe plus (désinstallé, désinscrit).
        const code = (e as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) perimes.push(s.id);
      }
    })
  );

  if (perimes.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", perimes);
  }
}
