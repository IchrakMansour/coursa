import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { SuiviClient } from "@/components/public/SuiviClient";
import type { Commande } from "@/types/database";

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
