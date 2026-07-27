import type { SupabaseClient } from "@supabase/supabase-js";
import { parserMenuTexte } from "@/lib/menu-texte";

// Enregistre un menu saisi en texte : crée les catégories manquantes,
// puis insère les produits. Renvoie le nombre de produits ajoutés.
export async function importerMenuTexte(
  admin: SupabaseClient,
  restaurantId: string,
  texte: string
): Promise<number> {
  const lignes = parserMenuTexte(texte);
  if (lignes.length === 0) return 0;

  // Catégories déjà présentes, indexées en minuscules pour éviter les
  // doublons du type « Pizzas » / « pizzas ».
  const { data: existantes } = await admin
    .from("menu_categories")
    .select("id, nom")
    .eq("restaurant_id", restaurantId);

  const parNom = new Map<string, string>();
  for (const c of (existantes as { id: string; nom: string }[]) ?? []) {
    parNom.set(c.nom.toLowerCase(), c.id);
  }

  const manquantes = [
    ...new Set(
      lignes
        .map((l) => l.categorie)
        .filter((n): n is string => !!n && !parNom.has(n.toLowerCase()))
        .map((n) => n.toLowerCase())
    ),
  ];

  if (manquantes.length > 0) {
    const noms = new Map<string, string>();
    for (const l of lignes) {
      if (l.categorie) noms.set(l.categorie.toLowerCase(), l.categorie);
    }
    const { data: creees } = await admin
      .from("menu_categories")
      .insert(
        manquantes.map((cle, i) => ({
          restaurant_id: restaurantId,
          nom: noms.get(cle) ?? cle,
          position: parNom.size + i,
        }))
      )
      .select("id, nom");
    for (const c of (creees as { id: string; nom: string }[]) ?? []) {
      parNom.set(c.nom.toLowerCase(), c.id);
    }
  }

  const { data: inseres } = await admin
    .from("produits")
    .insert(
      lignes.map((l) => ({
        restaurant_id: restaurantId,
        categorie_id: l.categorie ? parNom.get(l.categorie.toLowerCase()) ?? null : null,
        nom: l.nom,
        prix: l.prix,
        disponible: true,
      }))
    )
    .select("id");

  return inseres?.length ?? 0;
}
