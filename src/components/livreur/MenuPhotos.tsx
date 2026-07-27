"use client";

import { useState, useTransition } from "react";
import { PhotosMenuPicker } from "@/components/livreur/PhotosMenuPicker";
import {
  ajouterPhotosMenu,
  supprimerPhotoMenu,
} from "@/app/livreur/(dashboard)/restaurants/[id]/menu/actions";
import type { MenuPhoto } from "@/types/database";

// Galerie des photos de la carte : le livreur les consulte pendant qu'il
// prend une commande au téléphone, pour lire les prix.
export function MenuPhotos({
  restaurantId,
  photos,
}: {
  restaurantId: string;
  photos: MenuPhoto[];
}) {
  const [pending, startTransition] = useTransition();
  const [ajout, setAjout] = useState(false);
  const [zoom, setZoom] = useState<MenuPhoto | null>(null);
  const [nbPretes, setNbPretes] = useState(0);

  return (
    <section className="card mb-6 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-bold text-slate-900">📸 Photos du menu</h2>
          <p className="text-sm text-slate-500">
            La carte en photo, avec les prix — consultable en un coup d&apos;œil.
          </p>
        </div>
        {!ajout && (
          <button onClick={() => setAjout(true)} className="btn-secondary text-sm">
            + Ajouter des photos
          </button>
        )}
      </div>

      {ajout && (
        <form
          action={async (fd) => {
            await ajouterPhotosMenu(restaurantId, fd);
            setAjout(false);
            setNbPretes(0);
          }}
          className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4"
        >
          <PhotosMenuPicker
            label="Nouvelles photos"
            aide="Une photo par page de la carte, bien lisible."
            onChange={(p) => setNbPretes(p.length)}
          />
          <input
            name="legende"
            className="input"
            placeholder="Légende (optionnel) — ex : Carte des pizzas"
          />
          <div className="flex gap-2">
            <button className="btn-primary" disabled={nbPretes === 0}>
              Enregistrer {nbPretes > 0 ? `(${nbPretes})` : ""}
            </button>
            <button
              type="button"
              onClick={() => {
                setAjout(false);
                setNbPretes(0);
              }}
              className="btn-secondary"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {photos.length === 0 ? (
        !ajout && (
          <p className="mt-4 text-sm text-slate-400">
            Aucune photo pour le moment. Photographiez la carte du restaurant
            pour retrouver les prix instantanément.
          </p>
        )
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative">
              <button
                type="button"
                onClick={() => setZoom(photo)}
                className="block w-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.legende ?? "Photo du menu"}
                  className="h-32 w-full rounded-xl border border-slate-200 object-cover transition group-hover:opacity-90"
                />
              </button>
              {photo.legende && (
                <p className="mt-1 truncate text-xs text-slate-500">
                  {photo.legende}
                </p>
              )}
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (confirm("Supprimer cette photo ?"))
                    startTransition(() =>
                      supprimerPhotoMenu(restaurantId, photo.id)
                    );
                }}
                className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-xs shadow ring-1 ring-slate-200 hover:text-red-600"
                aria-label="Supprimer la photo"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Vue plein écran pour lire les prix */}
      {zoom && (
        <div
          onClick={() => setZoom(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <div className="max-h-full max-w-4xl overflow-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoom.url}
              alt={zoom.legende ?? "Photo du menu"}
              className="w-full rounded-xl"
            />
          </div>
          <button
            onClick={() => setZoom(null)}
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white text-lg"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
      )}
    </section>
  );
}
