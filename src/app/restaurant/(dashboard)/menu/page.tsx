import { getMyRestaurant } from "@/lib/restaurant";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui";
import { CategorieCard } from "@/components/restaurant/MenuUI";
import { ajouterCategorie } from "./actions";
import type { MenuCategorie, Produit } from "@/types/database";

export default async function MenuPage() {
  const resto = await getMyRestaurant();
  const supabase = await createClient();

  const [{ data: catsData }, { data: prodsData }] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("*")
      .eq("restaurant_id", resto.id)
      .order("position"),
    supabase.from("produits").select("*").eq("restaurant_id", resto.id).order("nom"),
  ]);

  const categories: MenuCategorie[] = (catsData as MenuCategorie[]) ?? [];
  const produits: Produit[] = (prodsData as Produit[]) ?? [];

  return (
    <div className="max-w-3xl">
      <PageHeader title="Menu" desc="Créez vos catégories et vos produits." />

      <form action={ajouterCategorie} className="card mb-6 flex gap-2 p-4">
        <input
          name="nom"
          className="input flex-1"
          placeholder="Nouvelle catégorie (ex : Pizzas, Boissons)"
          required
        />
        <button className="btn-primary">Ajouter</button>
      </form>

      {categories.length === 0 ? (
        <EmptyState
          icon="📋"
          title="Votre menu est vide"
          desc="Commencez par créer une catégorie, puis ajoutez-y des produits."
        />
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => (
            <CategorieCard
              key={cat.id}
              categorie={cat}
              produits={produits.filter((p) => p.categorie_id === cat.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
