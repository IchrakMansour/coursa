// ============================================================
//  Saisie d'un menu en texte libre
//
//  Le livreur recopie la carte telle qu'il la lit, une ligne par
//  produit. Une ligne sans prix est comprise comme une catégorie,
//  et s'applique aux lignes suivantes :
//
//    Pizzas
//    Margherita 12
//    4 Fromages - 18,5
//
//    Boissons
//    Coca 33cl : 3 DT
// ============================================================

export interface LigneMenu {
  categorie: string | null;
  nom: string;
  prix: number;
}

// Prix en fin de ligne, précédé au choix d'un tiret, d'un deux-points
// ou d'espaces, et suivi éventuellement de l'unité.
const PRIX_FIN = /^(.*?)[\s.:–—-]*(\d+(?:[.,]\d{1,3})?)\s*(?:dt|dinars?|tnd)?$/i;

export function parserMenuTexte(texte: string): LigneMenu[] {
  const lignes: LigneMenu[] = [];
  let categorie: string | null = null;

  for (const brute of texte.split("\n")) {
    const ligne = brute.trim();
    if (!ligne) continue;

    const m = ligne.match(PRIX_FIN);
    const nom = m?.[1]?.trim().replace(/[.:–—-]+$/, "").trim();

    if (m && nom) {
      lignes.push({
        categorie,
        nom: nom.slice(0, 120),
        prix: Number(m[2].replace(",", ".")),
      });
    } else {
      // Ligne sans prix : c'est un titre de catégorie.
      categorie = ligne.replace(/[:•\-–—]+$/, "").trim().slice(0, 60) || null;
    }
  }

  return lignes;
}
