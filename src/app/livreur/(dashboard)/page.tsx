import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatCard, PageHeader, StatusBadge, EmptyState } from "@/components/ui";
import { formatPrix, timeAgo } from "@/lib/utils";
import type { Commande } from "@/types/database";

export default async function LivreurDashboard() {
  const profile = await requireRole("livreur");
  const supabase = await createClient();

  const { data: livreur } = await supabase
    .from("livreurs")
    .select("*")
    .eq("id", profile.id)
    .single();

  const { data: commandes } = await supabase
    .from("commandes")
    .select("*")
    .eq("livreur_id", profile.id)
    .order("created_at", { ascending: false });

  const list: Commande[] = commandes ?? [];

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const inRange = (c: Commande, from: Date) => new Date(c.created_at) >= from;
  const livree = (c: Commande) => c.status === "livree";

  const jour = list.filter((c) => inRange(c, startOfDay));
  const semaine = list.filter((c) => inRange(c, startOfWeek));
  const mois = list.filter((c) => inRange(c, startOfMonth));

  const revenus = (arr: Commande[]) =>
    arr.filter(livree).reduce((s, c) => s + Number(c.frais_livraison), 0);

  const nouvelles = list.filter((c) => c.status === "nouvelle");
  const enCours = list.filter((c) =>
    ["acceptee", "recuperation", "en_livraison"].includes(c.status)
  );

  return (
    <div>
      <PageHeader
        title={`Bonjour, ${livreur?.nom_commercial ?? profile.full_name} 👋`}
        desc="Voici l'activité de votre journée."
        action={
          <Link href="/livreur/partager" className="btn-secondary">
            🔗 Partager ma page
          </Link>
        }
      />

      {/* Alertes commandes */}
      {nouvelles.length > 0 && (
        <Link
          href="/livreur/commandes"
          className="mb-6 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 transition hover:bg-amber-100"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div>
              <p className="font-semibold text-amber-900">
                {nouvelles.length} nouvelle{nouvelles.length > 1 ? "s" : ""} commande
                {nouvelles.length > 1 ? "s" : ""}
              </p>
              <p className="text-sm text-amber-700">Appuyez pour les traiter</p>
            </div>
          </div>
          <span className="text-amber-700">→</span>
        </Link>
      )}

      {/* Stats du jour */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Aujourd'hui
      </h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Commandes" value={jour.length} icon="📦" />
        <StatCard
          label="Livraisons réalisées"
          value={jour.filter(livree).length}
          icon="✅"
        />
        <StatCard label="Revenus (frais)" value={formatPrix(revenus(jour))} icon="💰" />
        <StatCard label="En cours" value={enCours.length} icon="🛵" />
      </div>

      {/* Semaine / Mois */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Cette semaine
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold">{semaine.length}</p>
              <p className="text-xs text-slate-500">commandes</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{formatPrix(revenus(semaine))}</p>
              <p className="text-xs text-slate-500">revenus livraison</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Ce mois
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold">{mois.filter(livree).length}</p>
              <p className="text-xs text-slate-500">livraisons</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{formatPrix(revenus(mois))}</p>
              <p className="text-xs text-slate-500">chiffre d'affaires</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dernières commandes */}
      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Dernières commandes
      </h2>
      {list.length === 0 ? (
        <EmptyState
          icon="📦"
          title="Aucune commande pour l'instant"
          desc="Partagez votre page publique pour recevoir vos premières commandes."
          action={
            <Link href="/livreur/partager" className="btn-primary">
              Partager ma page
            </Link>
          }
        />
      ) : (
        <div className="card divide-y divide-slate-100">
          {list.slice(0, 6).map((c) => (
            <Link
              key={c.id}
              href="/livreur/commandes"
              className="flex items-center justify-between px-4 py-3 transition hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">
                  {c.client_nom ?? "Client"} · {c.reference}
                </p>
                <p className="text-xs text-slate-400">{timeAgo(c.created_at)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">{formatPrix(c.total)}</span>
                <StatusBadge status={c.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
