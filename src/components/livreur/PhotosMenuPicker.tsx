"use client";

import { useRef, useState } from "react";
import { televerserPhotosMenu, type PhotoTeleversee } from "@/lib/menu-photos";

// Sélecteur de photos de la carte du restaurant.
// Les fichiers partent vers Supabase Storage dès leur sélection ; les URL
// obtenues sont ensuite postées avec le formulaire parent (champs cachés).
export function PhotosMenuPicker({
  label = "Photos du menu (avec les prix)",
  aide = "Prenez la carte en photo — vous aurez les prix sous les yeux pour chaque commande.",
  onChange,
}: {
  label?: string;
  aide?: string;
  onChange?: (photos: PhotoTeleversee[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PhotoTeleversee[]>([]);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  function maj(suivant: PhotoTeleversee[]) {
    setPhotos(suivant);
    onChange?.(suivant);
  }

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const fichiers = Array.from(e.target.files ?? []);
    if (inputRef.current) inputRef.current.value = "";
    if (fichiers.length === 0) return;

    setErreur(null);
    setEnCours(true);
    try {
      const nouvelles = await televerserPhotosMenu(fichiers);
      maj([...photos, ...nouvelles]);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Téléversement impossible.");
    } finally {
      setEnCours(false);
    }
  }

  function retirer(path: string) {
    maj(photos.filter((p) => p.path !== path));
  }

  return (
    <div>
      <label className="label">{label}</label>

      <div className="flex flex-wrap gap-3">
        {photos.map((p) => (
          <div key={p.path} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt="Photo du menu"
              className="h-24 w-24 rounded-xl border border-slate-200 object-cover"
            />
            <button
              type="button"
              onClick={() => retirer(p.path)}
              className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-white text-xs shadow ring-1 ring-slate-200 hover:text-red-600"
              aria-label="Retirer la photo"
            >
              ✕
            </button>
            <input type="hidden" name="photo_url" value={p.url} />
            <input type="hidden" name="photo_path" value={p.path} />
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={enCours}
          className="grid h-24 w-24 place-items-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-brand-400 hover:text-brand-500 disabled:opacity-50"
        >
          {enCours ? (
            <span className="text-xs">Envoi…</span>
          ) : (
            <span className="text-center text-xs leading-tight">
              <span className="block text-xl">📷</span>
              Ajouter
            </span>
          )}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onFiles}
        className="hidden"
      />

      {erreur ? (
        <p className="mt-1 text-xs text-red-600">{erreur}</p>
      ) : (
        <p className="mt-1 text-xs text-slate-400">{aide}</p>
      )}
    </div>
  );
}
