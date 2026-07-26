import { createClient } from "@supabase/supabase-js";

// Client à privilèges élevés (service_role) — UNIQUEMENT côté serveur.
// Utilisé pour les actions qui contournent le RLS de façon contrôlée :
// création de commande par un client non authentifié, actions admin, etc.
// NE JAMAIS importer ce fichier dans un composant client.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}
