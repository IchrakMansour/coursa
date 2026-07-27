import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader, EmptyState } from "@/components/ui";
import {
  AjoutProduitForm,
  CategorieCard,
  ImportMenuTexte,
} from "@/components/livreur/MenuEditor";
import { MenuPhotos } from "@/components/livreur/MenuPhotos";
import type {
  MenuCategorie,
  MenuPhoto,
  Produit,
  Restaurant,
} from "@/types/database";

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

  const [{ data: catsData }, { data: prodsData }, { data: photosData }] =
    await Promise.all([
      admin
        .from("menu_categories")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("position"),
      admin.from("produits").select("*").eq("restaurant_id", restaurantId).order("nom"),
      admin
        .from("menu_photos")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("position"),
    ]);

  const categories: MenuCategorie[] = (catsData as MenuCategorie[]) ?? [];
  const produits: Produit[] = (prodsData as Produit[]) ?? [];
  const photos: MenuPhoto[] = (photosData as MenuPhoto[]) ?? [];
  const sansCategorie = produits.filter(
    (p) => !p.categorie_id || !categories.some((c) => c.id === p.categorie_id)
  );

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
        desc="Saisissez les produits que vos clients pourront commander."
      />

      <ImportMenuTexte restaurantId={restaurantId} />

      <AjoutProduitForm restaurantId={restaurantId} categories={categories} />

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Le menu ({produits.length} produit{produits.length > 1 ? "s" : ""})
      </h2>

      {produits.length === 0 ? (
        <EmptyState
          icon="📋"
          title="Ce menu est vide"
          desc="Ajoutez votre premier produit ci-dessus. Tant que le menu est vide, vos clients ne voient rien à commander."
        />
      ) : (
        <div className="space-y-4">
          {categories
            .filter((cat) => produits.some((p) => p.categorie_id === cat.id))
            .map((cat) => (
              <CategorieCard
                key={cat.id}
                restaurantId={restaurantId}
                categorie={cat}
                categories={categories}
                produits={produits.filter((p) => p.categorie_id === cat.id)}
              />
            ))}

          {/* Les produits sans catégorie restent visibles, ici comme sur la vitrine */}
          {sansCategorie.length > 0 && (
            <CategorieCard
              restaurantId={restaurantId}
              categorie={null}
              categories={categories}
              produits={sansCategorie}
            />
          )}
        </div>
      )}

      <div className="mt-8">
        <MenuPhotos restaurantId={restaurantId} photos={photos} />
      </div>
    </div>
  );
}
