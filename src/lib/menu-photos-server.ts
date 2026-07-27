import { MENU_BUCKET } from "@/lib/menu-photos.shared";

export interface PhotoAInserer {
  restaurant_id: string;
  url: string;
  storage_path: string;
  position: number;
}

// Lit les photos téléversées côté navigateur (champs cachés du formulaire).
// On revalide que chaque fichier vient bien du bucket public « menus » et du
// dossier de CE livreur : le formulaire pourrait sinon poster n'importe quelle URL.
export function photosDepuisFormulaire(
  formData: FormData,
  livreurId: string,
  restaurantId: string,
  positionDepart = 0
): PhotoAInserer[] {
  const prefixeUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${MENU_BUCKET}/`;
  const urls = formData.getAll("photo_url").map(String);
  const paths = formData.getAll("photo_path").map(String);

  return urls
    .map((url, i) => ({ url, storage_path: paths[i] ?? "" }))
    .filter(
      (p) =>
        p.url.startsWith(prefixeUrl) && p.storage_path.startsWith(`${livreurId}/`)
    )
    .map((p, i) => ({
      restaurant_id: restaurantId,
      url: p.url,
      storage_path: p.storage_path,
      position: positionDepart + i,
    }));
}
