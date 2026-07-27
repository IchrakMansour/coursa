"use client";

import { createClient } from "@/lib/supabase/client";
import { MENU_BUCKET, TAILLE_MAX } from "@/lib/menu-photos.shared";

export { MENU_BUCKET, TAILLE_MAX };

export interface PhotoTeleversee {
  url: string;
  path: string;
}

function extension(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext && /^[a-z0-9]{1,5}$/.test(ext) ? ext : "jpg";
}

// Nom de fichier unique. `crypto.randomUUID` n'est disponible qu'en contexte
// sécurisé (https ou localhost) : sur un téléphone qui ouvre le dev server en
// http://192.168.x.x il est absent, d'où les solutions de repli.
function identifiantUnique() {
  const c = globalThis.crypto;
  if (typeof c?.randomUUID === "function") return c.randomUUID();
  if (typeof c?.getRandomValues === "function") {
    const octets = c.getRandomValues(new Uint8Array(16));
    return Array.from(octets, (o) => o.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Téléverse les photos directement depuis le navigateur vers Supabase Storage.
// Passer par le navigateur (et non par une server action) évite la limite de
// taille du corps des server actions et garde l'upload rapide sur mobile.
export async function televerserPhotosMenu(
  fichiers: File[]
): Promise<PhotoTeleversee[]> {
  if (fichiers.length === 0) return [];

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Session expirée, reconnectez-vous.");

  const resultats: PhotoTeleversee[] = [];

  for (const file of fichiers) {
    if (!file.type.startsWith("image/")) {
      throw new Error(`« ${file.name} » n'est pas une image.`);
    }
    if (file.size > TAILLE_MAX) {
      throw new Error(`« ${file.name} » dépasse 8 Mo.`);
    }

    // Le dossier doit porter l'id du livreur : c'est ce que vérifie le RLS.
    const path = `${user.id}/${identifiantUnique()}.${extension(file)}`;
    const { error } = await supabase.storage
      .from(MENU_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from(MENU_BUCKET).getPublicUrl(path);
    resultats.push({ url: data.publicUrl, path });
  }

  return resultats;
}
