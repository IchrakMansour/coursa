import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui";
import { formatPrix } from "@/lib/utils";
import { ajouterRestaurant } from "./actions";
import { RestaurantRow, AddRestaurantForm } from "@/components/livreur/RestaurantsUI";
import type { Partenariat } from "@/types/database";

export default async function RestaurantsPage() {
  const profile = await requireRole("livreur");
  const supabase = await createClient();

  const { data } = await supabase
    .from("partenariats")
    .select("*, restaurant:restaurants(*)")
    .eq("livreur_id", profile.id)
    .order("created_at", { ascending: false });

  // Tous les restaurants sont ajoutés par le livreur : pas d'invitation à valider.
  const actifs: Partenariat[] = (data as unknown as Partenariat[]) ?? [];

  // Nombre de produits par restaurant : un menu vide n'est pas commandable,
  // il faut que ça se voie tout de suite dans la liste.
  const restoIds = actifs.map((p) => p.restaurant_id);
  const { data: prods } = restoIds.length
    ? await supabase.from("produits").select("restaurant_id").in("restaurant_id", restoIds)
    : { data: [] };
  const nbProduits: Record<string, number> = {};
  for (const p of (prods as { restaurant_id: string }[]) ?? []) {
    nbProduits[p.restaurant_id] = (nbProduits[p.restaurant_id] ?? 0) + 1;
  }

  return (
    <div>
      <PageHeader
        title="Restaurants partenaires"
        desc="Gérez les restaurants avec lesquels vous collaborez."
      />

      <AddRestaurantForm action={ajouterRestaurant} />

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Restaurants actifs ({actifs.length})
        </h2>
        {actifs.length === 0 ? (
          <EmptyState
            icon="🍽️"
            title="Aucun restaurant partenaire"
            desc="Ajoutez votre premier restaurant ci-dessus pour commencer à recevoir des commandes."
          />
        ) : (
          <div className="space-y-3">
            {actifs.map((p) => (
              <RestaurantRow
                key={p.id}
                partenariat={p}
                nbProduits={nbProduits[p.restaurant_id] ?? 0}
              />
            ))}
          </div>
        )}
      </section>

      <p className="mt-6 text-xs text-slate-400">
        Frais de livraison moyens convenus :{" "}
        {actifs.length > 0
          ? formatPrix(
              actifs.reduce((s, p) => s + Number(p.prix_livraison), 0) /
                actifs.length
            )
          : "—"}
      </p>
    </div>
  );
}
