"use client";

import { useRef, useState, useTransition } from "react";
import { formatPrix } from "@/lib/utils";
import {
  ajouterProduit,
  importerMenu,
  modifierProduit,
  basculerDisponibilite,
  supprimerProduit,
  supprimerCategorie,
} from "@/app/livreur/(dashboard)/restaurants/[id]/menu/actions";
import type { MenuCategorie, Produit } from "@/types/database";

const LISTE_CATEGORIES = "liste-categories";

// Champs d'un produit, partagés par l'ajout et la modification.
function ChampsProduit({
  produit,
  categorieNom,
  categories,
}: {
  produit?: Produit;
  categorieNom?: string;
  categories: MenuCategorie[];
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
        <div>
          <label className="label">Nom du produit *</label>
          <input
            name="nom"
            className="input"
            placeholder="Pizza Margherita"
            defaultValue={produit?.nom ?? ""}
            required
            autoComplete="off"
          />
        </div>
        <div>
          <label className="label">Prix (DT) *</label>
          <input
            name="prix"
            type="number"
            step="0.1"
            min="0"
            inputMode="decimal"
            className="input"
            placeholder="12"
            defaultValue={produit ? String(produit.prix) : ""}
            required
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Catégorie</label>
          <input
            name="categorie"
            className="input"
            list={LISTE_CATEGORIES}
            placeholder="Pizzas, Boissons…"
            defaultValue={categorieNom ?? ""}
            autoComplete="off"
          />
          <datalist id={LISTE_CATEGORIES}>
            {categories.map((c) => (
              <option key={c.id} value={c.nom} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="label">Description</label>
          <input
            name="description"
            className="input"
            placeholder="Tomate, mozzarella, basilic"
            defaultValue={produit?.description ?? ""}
            autoComplete="off"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          name="disponible"
          defaultChecked={produit ? produit.disponible : true}
          className="h-4 w-4 rounded border-slate-300"
        />
        Disponible à la commande
      </label>
    </>
  );
}

// Saisie rapide : le formulaire reste ouvert et se vide après chaque ajout,
// pour enchaîner tout le menu sans quitter le clavier.
export function AjoutProduitForm({
  restaurantId,
  categories,
}: {
  restaurantId: string;
  categories: MenuCategorie[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [ajoutes, setAjoutes] = useState(0);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        // La catégorie est reconduite d'un produit à l'autre : on saisit en
        // général toutes les pizzas, puis toutes les boissons.
        const categorie = String(fd.get("categorie") || "");
        await ajouterProduit(restaurantId, fd);
        formRef.current?.reset();
        const champCat = formRef.current?.elements.namedItem("categorie");
        if (champCat instanceof HTMLInputElement) champCat.value = categorie;
        const champNom = formRef.current?.elements.namedItem("nom");
        if (champNom instanceof HTMLInputElement) champNom.focus();
        setAjoutes((n) => n + 1);
      }}
      className="card mb-6 space-y-3 p-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-900">➕ Ajouter un produit</h2>
        {ajoutes > 0 && (
          <span className="text-sm text-green-600">
            {ajoutes} produit{ajoutes > 1 ? "s" : ""} ajouté{ajoutes > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <ChampsProduit categories={categories} />

      <button className="btn-primary w-full sm:w-auto">Ajouter au menu</button>
      <p className="text-xs text-slate-400">
        Le formulaire reste ouvert : enchaînez vos produits. La catégorie se crée
        toute seule si elle n&apos;existe pas encore.
      </p>
    </form>
  );
}

// Saisie du menu en bloc : le livreur recopie la carte d'un coup.
export function ImportMenuTexte({ restaurantId }: { restaurantId: string }) {
  const [ouvert, setOuvert] = useState(false);

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="btn-secondary mb-6 text-sm"
      >
        📝 Saisir le menu en texte
      </button>
    );
  }

  return (
    <form
      action={async (fd) => {
        await importerMenu(restaurantId, fd);
        setOuvert(false);
      }}
      className="card mb-6 space-y-3 p-5"
    >
      <h2 className="font-bold text-slate-900">📝 Saisir le menu en texte</h2>
      <textarea
        name="menu_texte"
        className="input min-h-[180px] font-mono text-sm"
        placeholder={`Pizzas
Margherita 12
4 Fromages 18,5

Boissons
Coca 33cl 3`}
        required
      />
      <p className="text-xs text-slate-400">
        Une ligne par produit, le prix à la fin. Une ligne sans prix devient un
        titre de catégorie pour les lignes suivantes.
      </p>
      <div className="flex gap-2">
        <button className="btn-primary">Ajouter au menu</button>
        <button type="button" onClick={() => setOuvert(false)} className="btn-secondary">
          Annuler
        </button>
      </div>
    </form>
  );
}

function ProduitRow({
  restaurantId,
  produit,
  categorieNom,
  categories,
}: {
  restaurantId: string;
  produit: Produit;
  categorieNom?: string;
  categories: MenuCategorie[];
}) {
  const [pending, startTransition] = useTransition();
  const [edition, setEdition] = useState(false);

  if (edition) {
    return (
      <form
        action={async (fd) => {
          await modifierProduit(restaurantId, produit.id, fd);
          setEdition(false);
        }}
        className="my-2 space-y-3 rounded-xl bg-slate-50 p-3"
      >
        <ChampsProduit
          produit={produit}
          categorieNom={categorieNom}
          categories={categories}
        />
        <div className="flex gap-2">
          <button className="btn-primary">Enregistrer</button>
          <button
            type="button"
            onClick={() => setEdition(false)}
            className="btn-secondary"
          >
            Annuler
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-800">{produit.nom}</p>
        {produit.description && (
          <p className="truncate text-sm text-slate-400">{produit.description}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="font-semibold">{formatPrix(produit.prix)}</span>
        <button
          disabled={pending}
          onClick={() =>
            startTransition(() =>
              basculerDisponibilite(restaurantId, produit.id, !produit.disponible)
            )
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
          onClick={() => setEdition(true)}
          className="text-slate-400 hover:text-brand-600"
          aria-label="Modifier"
        >
          ✏️
        </button>
        <button
          disabled={pending}
          onClick={() => {
            if (confirm(`Supprimer « ${produit.nom} » ?`))
              startTransition(() => supprimerProduit(restaurantId, produit.id));
          }}
          className="text-slate-400 hover:text-red-500"
          aria-label="Supprimer"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

// Un bloc de menu : une catégorie, ou les produits sans catégorie.
export function CategorieCard({
  restaurantId,
  categorie,
  produits,
  categories,
}: {
  restaurantId: string;
  categorie: MenuCategorie | null;
  produits: Produit[];
  categories: MenuCategorie[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900">
          {categorie ? categorie.nom : "Sans catégorie"}
        </h3>
        {categorie && (
          <button
            disabled={pending}
            onClick={() => {
              if (
                confirm(
                  `Supprimer la catégorie « ${categorie.nom} » ? Ses produits resteront au menu.`
                )
              )
                startTransition(() =>
                  supprimerCategorie(restaurantId, categorie.id)
                );
            }}
            className="text-sm text-slate-400 hover:text-red-500"
          >
            Supprimer la catégorie
          </button>
        )}
      </div>

      <div className="mt-2 divide-y divide-slate-100">
        {produits.map((p) => (
          <ProduitRow
            key={p.id}
            restaurantId={restaurantId}
            produit={p}
            categorieNom={categorie?.nom}
            categories={categories}
          />
        ))}
      </div>
    </div>
  );
}
