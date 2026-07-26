"use client";

import { useState, useTransition } from "react";
import { formatPrix } from "@/lib/utils";
import {
  ajouterProduit,
  basculerDisponibilite,
  supprimerProduit,
  supprimerCategorie,
} from "@/app/restaurant/(dashboard)/menu/actions";
import type { MenuCategorie, Produit } from "@/types/database";

export function ProduitRow({ produit }: { produit: Produit }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-800">{produit.nom}</p>
        {produit.description && (
          <p className="truncate text-sm text-slate-400">{produit.description}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="font-semibold">{formatPrix(produit.prix)}</span>
        <button
          disabled={pending}
          onClick={() =>
            startTransition(() => basculerDisponibilite(produit.id, !produit.disponible))
          }
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            produit.disponible
              ? "bg-green-100 text-green-700"
              : "bg-slate-200 text-slate-500"
          }`}
        >
          {produit.disponible ? "Disponible" : "Épuisé"}
        </button>
        <button
          disabled={pending}
          onClick={() => startTransition(() => supprimerProduit(produit.id))}
          className="text-slate-400 hover:text-red-500"
          aria-label="Supprimer"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

export function CategorieCard({
  categorie,
  produits,
}: {
  categorie: MenuCategorie;
  produits: Produit[];
}) {
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900">{categorie.nom}</h3>
        <button
          disabled={pending}
          onClick={() => startTransition(() => supprimerCategorie(categorie.id))}
          className="text-sm text-slate-400 hover:text-red-500"
        >
          Supprimer
        </button>
      </div>

      <div className="mt-2 divide-y divide-slate-100">
        {produits.length === 0 ? (
          <p className="py-3 text-sm text-slate-400">Aucun produit.</p>
        ) : (
          produits.map((p) => <ProduitRow key={p.id} produit={p} />)
        )}
      </div>

      {adding ? (
        <form
          action={async (fd) => {
            fd.set("categorie_id", categorie.id);
            await ajouterProduit(fd);
            setAdding(false);
          }}
          className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3"
        >
          <input name="nom" className="input" placeholder="Nom du produit" required />
          <input name="description" className="input" placeholder="Description (optionnel)" />
          <div className="flex gap-2">
            <input
              name="prix"
              type="number"
              step="0.5"
              className="input"
              placeholder="Prix (DT)"
              required
            />
            <button className="btn-primary">Ajouter</button>
            <button type="button" onClick={() => setAdding(false)} className="btn-secondary">
              ✕
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} className="btn-ghost mt-2 text-brand-600">
          + Ajouter un produit
        </button>
      )}
    </div>
  );
}
