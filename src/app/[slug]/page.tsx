import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { Vitrine } from "@/components/public/Vitrine";
import type {
  Livreur,
  Service,
  Restaurant,
  Produit,
  MenuCategorie,
  MenuPhoto,
} from "@/types/database";

// Réserve les routes système pour ne pas les traiter comme des slugs
const RESERVED = new Set([
  "livreur", "restaurant", "admin", "connexion", "deconnexion",
  "suivi", "api", "bienvenue", "favicon.ico",
]);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("livreurs")
    .select("nom_commercial, description")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return { title: "Page introuvable" };
  return {
    title: `${data.nom_commercial} — Commander`,
    description: data.description ?? `Commandez avec ${data.nom_commercial}`,
  };
}

export default async function VitrinePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (RESERVED.has(slug)) notFound();

  const supabase = createAdminClient();

  const { data: livreurData } = await supabase
    .from("livreurs")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!livreurData) notFound();
  const livreur = livreurData as Livreur;

  // Coordonnées WhatsApp du livreur
  const { data: prof } = await supabase
    .from("profiles")
    .select("whatsapp, phone")
    .eq("id", livreur.id)
    .single();

  const { data: servicesData } = await supabase
    .from("services")
    .select("*")
    .eq("livreur_id", livreur.id)
    .eq("actif", true);

  // Restaurants partenaires actifs
  const { data: partData } = await supabase
    .from("partenariats")
    .select("restaurant:restaurants(*), prix_livraison")
    .eq("livreur_id", livreur.id)
    .eq("status", "accepted");

  const partRows = (partData ?? []) as unknown as {
    restaurant: Restaurant | null;
    prix_livraison: number;
  }[];
  const restaurants: (Restaurant & { prix_livraison: number })[] = partRows
    .map((p) =>
      p.restaurant ? { ...p.restaurant, prix_livraison: p.prix_livraison } : null
    )
    .filter(Boolean) as (Restaurant & { prix_livraison: number })[];

  const restoIds = restaurants.map((r) => r.id);

  let categories: MenuCategorie[] = [];
  let produits: Produit[] = [];
  let photos: MenuPhoto[] = [];
  if (restoIds.length > 0) {
    const [{ data: catsData }, { data: prodsData }, { data: photosData }] =
      await Promise.all([
        supabase.from("menu_categories").select("*").in("restaurant_id", restoIds).order("position"),
        supabase
          .from("produits")
          .select("*")
          .in("restaurant_id", restoIds)
          .eq("disponible", true)
          .order("nom"),
        supabase
          .from("menu_photos")
          .select("*")
          .in("restaurant_id", restoIds)
          .order("position"),
      ]);
    categories = (catsData as MenuCategorie[]) ?? [];
    produits = (prodsData as Produit[]) ?? [];
    photos = (photosData as MenuPhoto[]) ?? [];
  }

  return (
    <Vitrine
      livreur={livreur}
      whatsapp={prof?.whatsapp || prof?.phone || null}
      services={(servicesData as Service[]) ?? []}
      restaurants={restaurants}
      categories={categories}
      produits={produits}
      photos={photos}
    />
  );
}
