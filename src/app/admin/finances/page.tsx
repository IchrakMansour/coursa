import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader, StatCard, EmptyState } from "@/components/ui";
import { formatPrix, formatDate } from "@/lib/utils";
import type { Paiement, Abonnement } from "@/types/database";

// Commission plateforme simulée sur les frais de livraison
const TAUX_COMMISSION = 0.1;

export default async function AdminFinances() {
  await requireRole("admin");
  const supabase = createAdminClient();

  const [{ data: paiementsData }, { data: abosData }, { data: commandes }] =
    await Promise.all([
      supabase
        .from("paiements")
        .select("*, livreur:livreurs(nom_commercial)")
        .order("created_at", { ascending: false }),
      supabase.from("abonnements").select("*").eq("status", "active"),
      supabase.from("commandes").select("frais_livraison, status").eq("status", "livree"),
    ]);

  const paiements = (paiementsData as unknown as (Paiement & {
    livreur?: { nom_commercial: string };
  })[]) ?? [];
  const abos = (abosData as Abonnement[]) ?? [];

  const revenusAbo = paiements
    .filter((p) => p.status === "paye")
    .reduce((s, p) => s + Number(p.montant), 0);

  const volumeLivraisons = (commandes ?? []).reduce(
    (s: number, c: { frais_livraison: number }) => s + Number(c.frais_livraison),
    0
  );
  const commissions = volumeLivraisons * TAUX_COMMISSION;

  const parPlan = abos.reduce<Record<string, number>>((acc, a) => {
    acc[a.plan] = (acc[a.plan] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <PageHeader title="Finances" desc="Abonnements, commissions et revenus." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Revenus abonnements"
          value={formatPrix(revenusAbo)}
          sub="Total encaissé"
          icon="💳"
        />
        <StatCard
          label="Commissions estimées"
          value={formatPrix(commissions)}
          sub={`${TAUX_COMMISSION * 100}% du volume de livraison`}
          icon="💰"
        />
        <StatCard
          label="Abonnements actifs"
          value={abos.length}
          sub={Object.entries(parPlan)
            .map(([p, n]) => `${n} ${p}`)
            .join(" · ")}
          icon="📊"
        />
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Historique des paiements
      </h2>
      {paiements.length === 0 ? (
        <EmptyState icon="💰" title="Aucun paiement enregistré" />
      ) : (
        <div className="card divide-y divide-slate-100">
          {paiements.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-slate-800">
                  {p.livreur?.nom_commercial ?? "—"}
                </p>
                <p className="text-xs capitalize text-slate-400">
                  {p.type} · {formatDate(p.created_at)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatPrix(p.montant)}</p>
                <p className="text-xs capitalize text-green-600">{p.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
