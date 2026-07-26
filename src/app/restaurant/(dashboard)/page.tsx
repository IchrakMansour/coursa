import { getMyRestaurant } from "@/lib/restaurant";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState, StatCard } from "@/components/ui";
import { CommandeResto } from "@/components/restaurant/CommandeResto";
import type { Commande } from "@/types/database";

export default async function RestaurantCommandes() {
  const resto = await getMyRestaurant();
  const supabase = await createClient();

  const { data } = await supabase
    .from("commandes")
    .select("*, items:commande_items(*)")
    .eq("restaurant_id", resto.id)
    .order("created_at", { ascending: false });

  const commandes: Commande[] = (data as unknown as Commande[]) ?? [];
  const aTraiter = commandes.filter((c) =>
    ["nouvelle", "acceptee", "preparation"].includes(c.status)
  );
  const terminees = commandes.filter(
    (c) => !["nouvelle", "acceptee", "preparation"].includes(c.status)
  );

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const jour = commandes.filter((c) => new Date(c.created_at) >= startOfDay);

  return (
    <div>
      <PageHeader
        title={resto.nom}
        desc="Les commandes reçues via vos livreurs partenaires."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="À préparer" value={aTraiter.length} icon="👨‍🍳" />
        <StatCard label="Aujourd'hui" value={jour.length} icon="📦" />
        <StatCard label="Total commandes" value={commandes.length} icon="📊" />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          À préparer ({aTraiter.length})
        </h2>
        {aTraiter.length === 0 ? (
          <EmptyState
            icon="✅"
            title="Aucune commande en attente"
            desc="Les nouvelles commandes de vos livreurs apparaîtront ici."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {aTraiter.map((c) => (
              <CommandeResto key={c.id} commande={c} />
            ))}
          </div>
        )}
      </section>

      {terminees.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Historique ({terminees.length})
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {terminees.slice(0, 10).map((c) => (
              <CommandeResto key={c.id} commande={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
