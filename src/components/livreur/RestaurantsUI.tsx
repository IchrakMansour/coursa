"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatPrix } from "@/lib/utils";
import { retirerPartenariat, accepterInvitation } from "@/app/livreur/(dashboard)/restaurants/actions";
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
        <div>
          <label className="label">Téléphone</label>
          <input name="telephone" className="input" placeholder="+216 73 000 000" />
        </div>
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
      <div className="flex gap-2">
        <button className="btn-primary flex-1">Ajouter</button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
          Annuler
        </button>
      </div>
    </form>
  );
}

export function RestaurantRow({ partenariat }: { partenariat: Partenariat }) {
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
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {partenariat.status === "accepted" && (
          <span className="hidden text-sm font-medium text-slate-600 sm:block">
            {formatPrix(partenariat.prix_livraison)} / livraison
          </span>
        )}
        {partenariat.status === "accepted" && r && (
          <Link
            href={`/livreur/restaurants/${r.id}/menu`}
            className="btn-secondary text-sm"
          >
            🍔 Menu
          </Link>
        )}
        {partenariat.status === "pending" ? (
          <button
            disabled={pending}
            onClick={() => startTransition(() => accepterInvitation(partenariat.id))}
            className="btn-primary"
          >
            Accepter
          </button>
        ) : (
          <button
            disabled={pending}
            onClick={() => startTransition(() => retirerPartenariat(partenariat.id))}
            className="btn-ghost text-red-600"
            aria-label="Retirer"
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
}
