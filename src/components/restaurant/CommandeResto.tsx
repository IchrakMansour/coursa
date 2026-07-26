"use client";

import { useTransition } from "react";
import { StatusBadge } from "@/components/ui";
import { formatPrix, timeAgo } from "@/lib/utils";
import { majEtatCommande } from "@/app/restaurant/(dashboard)/actions";
import type { Commande } from "@/types/database";

export function CommandeResto({ commande }: { commande: Commande }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{commande.reference}</span>
            <StatusBadge status={commande.status} />
          </div>
          <p className="mt-1 text-xs text-slate-400">{timeAgo(commande.created_at)}</p>
        </div>
        <span className="font-bold">{formatPrix(commande.sous_total)}</span>
      </div>

      {commande.items && (
        <ul className="mt-3 space-y-1 rounded-xl bg-slate-50 p-3 text-sm">
          {commande.items.map((it) => (
            <li key={it.id} className="flex justify-between">
              <span className="font-medium">
                {it.quantite}× {it.nom_produit}
              </span>
            </li>
          ))}
        </ul>
      )}

      {commande.commentaire && (
        <p className="mt-2 text-sm italic text-slate-500">« {commande.commentaire} »</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {["nouvelle", "acceptee"].includes(commande.status) && (
          <button
            disabled={pending}
            onClick={() => startTransition(() => majEtatCommande(commande.id, "preparation"))}
            className="btn-primary flex-1"
          >
            👨‍🍳 En préparation
          </button>
        )}
        {commande.status === "preparation" && (
          <button
            disabled={pending}
            onClick={() => startTransition(() => majEtatCommande(commande.id, "prete"))}
            className="btn-primary flex-1"
          >
            ✅ Commande prête
          </button>
        )}
        {["prete", "recuperation", "en_livraison", "livree"].includes(commande.status) && (
          <p className="text-sm text-slate-400">Prise en charge par le livreur.</p>
        )}
      </div>
    </div>
  );
}
