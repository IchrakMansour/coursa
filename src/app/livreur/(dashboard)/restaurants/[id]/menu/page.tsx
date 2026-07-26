import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader, EmptyState } from "@/components/ui";
import { AddCategorieForm, CategorieCard } from "@/components/livreur/MenuEditor";
import type { MenuCategorie, Produit, Restaurant } from "@/types/database";

export default async function LivreurMenuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireRole("livreur");
  const { id: restaurantId } = await params;
  const admin = createAdminClient();

  // Le restaurant doit être un partenaire accepté de ce livreur.
  const { data: partenariat } = await admin
    .from("partenariats")
    .select("id, restaurant:restaurants(*)")
    .eq("livreur_id", profile.id)
    .eq("restaurant_id", restaurantId)
    .eq("status", "accepted")
    .maybeSingle();

  if (!partenariat) notFound();
  const resto = (partenariat as unknown as { restaurant: Restaurant | null }).restaurant;
  if (!resto) notFound();

  const [{ data: catsData }, { data: prodsData }] = await Promise.all([
    admin
      .from("menu_categories")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("position"),
    admin.from("produits").select("*").eq("restaurant_id", restaurantId).order("nom"),
  ]);

  const categories: MenuCategorie[] = (catsData as MenuCategorie[]) ?? [];
  const produits: Produit[] = (prodsData as Produit[]) ?? [];

  return (
    <div className="max-w-3xl">
      <Link
        href="/livreur/restaurants"
        className="mb-4 inline-flex text-sm text-slate-500 hover:text-brand-600"
      >
        ← Restaurants
      </Link>

      <PageHeader
        title={`Menu — ${resto.nom}`}
        desc="Créez les catégories et les produits de ce restaurant."
      />

      <AddCategorieForm restaurantId={restaurantId} />

      {categories.length === 0 ? (
        <EmptyState
          icon="📋"
          title="Ce menu est vide"
          desc="Commencez par créer une catégorie, puis ajoutez-y des produits."
        />
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => (
            <CategorieCard
              key={cat.id}
              restaurantId={restaurantId}
              categorie={cat}
              produits={produits.filter((p) => p.categorie_id === cat.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
