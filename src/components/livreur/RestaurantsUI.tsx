"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatPrix } from "@/lib/utils";
import { retirerPartenariat } from "@/app/livreur/(dashboard)/restaurants/actions";
import { PhotosMenuPicker } from "@/components/livreur/PhotosMenuPicker";
import { ChampTelephone } from "@/components/ChampTelephone";
import type { Partenariat } from "@/types/database";

export function AddRestaurantForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">
        + Ajouter un restaurant
      </button>
    );
  }

  return (
    <form
      action={async (fd) => {
        await action(fd);
        setOpen(false);
      }}
      className="card space-y-4 p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Nom du restaurant *</label>
          <input name="nom" className="input" placeholder="Pizza House" required />
        </div>
        <div>
          <label className="label">Catégorie</label>
          <input name="categorie" className="input" placeholder="Pizza, Burger…" />
        </div>
        <div>
          <label className="label">Adresse</label>
          <input name="adresse" className="input" placeholder="Av. Habib Bourguiba" />
        </div>
        <ChampTelephone
          name="telephone"
          label="Téléphone du restaurant"
          aide={null}
        />
        <div>
          <label className="label">Prix de livraison convenu (DT)</label>
          <input
            name="prix_livraison"
            type="number"
            step="0.5"
            className="input"
            placeholder="3"
          />
        </div>
      </div>

      <div>
        <label className="label">Menu — une ligne par produit</label>
        <textarea
          name="menu_texte"
          className="input min-h-[150px] font-mono text-sm"
          placeholder={`Pizzas
Margherita 12
4 Fromages 18,5

Boissons
Coca 33cl 3`}
        />
        <p className="mt-1 text-xs text-slate-400">
          Le prix va en fin de ligne. Une ligne sans prix devient un titre de
          catégorie pour les lignes qui suivent. Vous pourrez tout corriger
          ensuite.
        </p>
      </div>

      <PhotosMenuPicker />

      <div className="flex gap-2">
        <button className="btn-primary flex-1">Ajouter</button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
          Annuler
        </button>
      </div>
    </form>
  );
}

export function RestaurantRow({
  partenariat,
  nbProduits = 0,
}: {
  partenariat: Partenariat;
  nbProduits?: number;
}) {
  const [pending, startTransition] = useTransition();
  const r = partenariat.restaurant;

  return (
    <div className="card flex items-center justify-between gap-3 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-xl">
          🍽️
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{r?.nom}</p>
          <p className="truncate text-sm text-slate-500">
            {r?.categorie ?? "Restaurant"}
            {r?.adresse ? ` · ${r.adresse}` : ""}
          </p>
          {nbProduits === 0 ? (
            <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              ⚠️ Menu vide — rien à commander
            </span>
          ) : (
            <span className="mt-1 inline-flex text-xs text-slate-400">
              {nbProduits} produit{nbProduits > 1 ? "s" : ""} au menu
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="hidden text-sm font-medium text-slate-600 sm:block">
          {formatPrix(partenariat.prix_livraison)} / livraison
        </span>
        {r && (
          <Link
            href={`/livreur/restaurants/${r.id}/menu`}
            className="btn-secondary text-sm"
          >
            🍔 Menu
          </Link>
        )}
        <button
          disabled={pending}
          onClick={() => startTransition(() => retirerPartenariat(partenariat.id))}
          className="btn-ghost text-red-600"
          aria-label="Retirer"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
