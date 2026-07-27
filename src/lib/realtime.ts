// ============================================================
//  Diffusion serveur → navigateurs (Supabase Realtime)
//
//  Les changements de statut d'une commande partent sur le canal
//  de suivi, comme la position du livreur. On passe par l'API HTTP
//  de Realtime plutôt que par un WebSocket : sur une fonction
//  serverless, la connexion serait fermée avant l'envoi.
//
//  Pourquoi pas `postgres_changes` : le client qui suit sa commande
//  n'est pas authentifié, et le RLS de `commandes` lui interdit —
//  à raison — de lire la table. Le canal nommé d'après l'id de la
//  commande reste donc le seul chemin.
// ============================================================

export async function diffuser(
  topic: string,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !cle) return;

  try {
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: cle,
        Authorization: `Bearer ${cle}`,
      },
      body: JSON.stringify({ messages: [{ topic, event, payload }] }),
    });
  } catch {
    // La diffusion est un confort : son échec ne doit jamais faire
    // échouer le changement de statut lui-même.
  }
}
