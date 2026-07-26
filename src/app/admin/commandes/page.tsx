import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader, StatCard, StatusBadge, EmptyState } from "@/components/ui";
import { formatPrix, formatDateTime } from "@/lib/utils";
import type { Commande } from "@/types/database";

export default async function AdminCommandes() {
  await requireRole("admin");
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("commandes")
    .select("*, livreur:livreurs(nom_commercial), restaurant:restaurants(nom)")
    .order("created_at", { ascending: false });

  const commandes = (data as unknown as (Commande & {
    livreur?: { nom_commercial: string };
    restaurant?: { nom: string };
  })[]) ?? [];

  const enCours = commandes.filter(
    (c) => !["livree", "annulee"].includes(c.status)
  ).length;
  const terminees = commandes.filter((c) => c.status === "livree").length;
  const annulees = commandes.filter((c) => c.status === "annulee").length;

  return (
    <div>
      <PageHeader title="Commandes" desc="Vue globale de toutes les commandes." />

      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard label="En cours" value={enCours} icon="🛵" />
        <StatCard label="Terminées" value={terminees} icon="✅" />
        <StatCard label="Annulées" value={annulees} icon="❌" />
      </div>

      {commandes.length === 0 ? (
        <EmptyState icon="📦" title="Aucune commande" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Référence</th>
                <th className="px-4 py-3">Livreur</th>
                <th className="px-4 py-3">Restaurant</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {commandes.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{c.reference}</td>
                  <td className="px-4 py-3">{c.livreur?.nom_commercial ?? "—"}</td>
                  <td className="px-4 py-3">{c.restaurant?.nom ?? "—"}</td>
                  <td className="px-4 py-3">{c.client_nom ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold">{formatPrix(c.total)}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-slate-400">{formatDateTime(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
