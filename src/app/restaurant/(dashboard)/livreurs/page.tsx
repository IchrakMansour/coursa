import { getMyRestaurant } from "@/lib/restaurant";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui";
import { LivreurRow } from "@/components/restaurant/LivreursUI";
import type { Partenariat } from "@/types/database";

export default async function LivreursPage() {
  const resto = await getMyRestaurant();
  const supabase = await createClient();

  const { data } = await supabase
    .from("partenariats")
    .select("*, livreur:livreurs(*)")
    .eq("restaurant_id", resto.id)
    .order("created_at", { ascending: false });

  const partenariats: Partenariat[] = (data as unknown as Partenariat[]) ?? [];
  const demandes = partenariats.filter((p) => p.status === "pending");
  const actifs = partenariats.filter((p) => p.status === "accepted");

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Livreurs partenaires"
        desc="Acceptez les livreurs qui souhaitent distribuer vos plats."
      />

      {demandes.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Demandes reçues ({demandes.length})
          </h2>
          <div className="space-y-3">
            {demandes.map((p) => (
              <LivreurRow key={p.id} partenariat={p} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Livreurs actifs ({actifs.length})
        </h2>
        {actifs.length === 0 ? (
          <EmptyState
            icon="🛵"
            title="Aucun livreur partenaire"
            desc="Les livreurs peuvent vous envoyer une demande de collaboration depuis leur espace."
          />
        ) : (
          <div className="space-y-3">
            {actifs.map((p) => (
              <LivreurRow key={p.id} partenariat={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
