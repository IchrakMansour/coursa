import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader, StatCard, StatusBadge } from "@/components/ui";
import { formatPrix, timeAgo } from "@/lib/utils";
import type { Commande } from "@/types/database";

export default async function AdminDashboard() {
  await requireRole("admin");
  const supabase = createAdminClient();

  const [
    { count: nbLivreurs },
    { count: nbRestaurants },
    { count: nbClients },
    { data: commandes },
    { data: paiements },
  ] = await Promise.all([
    supabase.from("livreurs").select("*", { count: "exact", head: true }),
    supabase.from("restaurants").select("*", { count: "exact", head: true }),
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase.from("commandes").select("*").order("created_at", { ascending: false }),
    supabase.from("paiements").select("montant").eq("status", "paye"),
  ]);

  const list: Commande[] = (commandes as Commande[]) ?? [];
  const caLivraisons = list
    .filter((c) => c.status === "livree")
    .reduce((s, c) => s + Number(c.frais_livraison), 0);
  const revenusAbo = (paiements ?? []).reduce(
    (s: number, p: { montant: number }) => s + Number(p.montant),
    0
  );

  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const cmdMois = list.filter((c) => new Date(c.created_at) >= startMonth);

  return (
    <div>
      <PageHeader title="Vue d'ensemble" desc="L'activité globale de la plateforme." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Livreurs actifs" value={nbLivreurs ?? 0} icon="🛵" />
        <StatCard label="Restaurants" value={nbRestaurants ?? 0} icon="🍽️" />
        <StatCard label="Clients" value={nbClients ?? 0} icon="👥" />
        <StatCard label="Commandes" value={list.length} icon="📦" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Revenus abonnements"
          value={formatPrix(revenusAbo)}
          sub="Total encaissé"
          icon="💳"
        />
        <StatCard
          label="Volume livraisons"
          value={formatPrix(caLivraisons)}
          sub="Frais de livraison cumulés"
          icon="💰"
        />
        <StatCard label="Commandes ce mois" value={cmdMois.length} sub="Croissance" icon="📈" />
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Dernières commandes
      </h2>
      <div className="card divide-y divide-slate-100">
        {list.slice(0, 8).map((c) => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-slate-800">
                {c.reference} · {c.client_nom ?? "Client"}
              </p>
              <p className="text-xs text-slate-400">{timeAgo(c.created_at)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">{formatPrix(c.total)}</span>
              <StatusBadge status={c.status} />
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <p className="p-4 text-sm text-slate-400">Aucune commande.</p>
        )}
      </div>
    </div>
  );
}
