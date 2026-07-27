import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { SuiviClient } from "@/components/public/SuiviClient";
import type { Commande } from "@/types/database";

// Page de suivi d'une commande : elle est ouverte juste après la création de
// la commande et son statut évolue en temps réel. Sans rendu dynamique, Next
// /Vercel pourrait servir un 404 en cache (commande pas encore vue) ou un
// statut périmé selon l'appareil. On force donc un rendu à chaque requête.
export const dynamic = "force-dynamic";

export default async function SuiviPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("commandes")
    .select("*, items:commande_items(*), restaurant:restaurants(nom)")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  return <SuiviClient commande={data as unknown as Commande} />;
}
