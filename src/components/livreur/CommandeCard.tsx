"use client";

import { useTransition } from "react";
import { StatusBadge } from "@/components/ui";
import { formatPrix, timeAgo } from "@/lib/utils";
import { NEXT_STATUS, STATUS_LABELS } from "@/lib/constants";
import { changerStatut, refuserCommande } from "@/app/livreur/(dashboard)/commandes/actions";
import type { Commande } from "@/types/database";

export function CommandeCard({ commande }: { commande: Commande }) {
  const [pending, startTransition] = useTransition();
  const suivant = NEXT_STATUS[commande.status];

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">{commande.reference}</span>
            <StatusBadge status={commande.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">{timeAgo(commande.created_at)}</p>
        </div>
        <span className="shrink-0 text-lg font-bold text-slate-900">
          {formatPrix(commande.total)}
        </span>
      </div>

      {/* Détails */}
      <div className="mt-3 space-y-1.5 rounded-xl bg-slate-50 p-3 text-sm">
        {commande.restaurant?.nom ? (
          <p>
            <span className="text-slate-400">Restaurant :</span>{" "}
            <span className="font-medium">{commande.restaurant.nom}</span>
          </p>
        ) : (
          commande.service_nom && (
            <p>
              <span className="text-slate-400">Service :</span>{" "}
              <span className="font-medium">{commande.service_nom}</span>
            </p>
          )
        )}
        <p>
          <span className="text-slate-400">Client :</span>{" "}
          <span className="font-medium">{commande.client_nom ?? "—"}</span>
          {commande.client_telephone && (
            <a href={`tel:${commande.client_telephone}`} className="ml-2 text-brand-600">
              📞 {commande.client_telephone}
            </a>
          )}
        </p>
        {commande.client_adresse && (
          <p>
            <span className="text-slate-400">Adresse :</span>{" "}
            <span className="font-medium">{commande.client_adresse}</span>
          </p>
        )}
        {commande.commentaire && (
          <p className="text-slate-500 italic">« {commande.commentaire} »</p>
        )}
      </div>

      {/* Commande écrite par le client : à confirmer au téléphone */}
      {commande.demande_libre && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            ✍️ Demande écrite du client — montant à confirmer
          </p>
          <p className="mt-1 whitespace-pre-line text-sm text-amber-900">
            {commande.demande_libre}
          </p>
        </div>
      )}

      {/* Articles */}
      {commande.items && commande.items.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {commande.items.map((it) => (
            <li key={it.id} className="flex justify-between">
              <span>
                {it.quantite}× {it.nom_produit}
              </span>
              <span className="text-slate-500">
                {formatPrix(it.prix_unitaire * it.quantite)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Actions */}
      {commande.status !== "livree" && commande.status !== "annulee" && (
        <div className="mt-4 flex flex-wrap gap-2">
          {commande.status === "nouvelle" ? (
            <>
              <button
                disabled={pending}
                onClick={() => startTransition(() => changerStatut(commande.id, "acceptee"))}
                className="btn-primary flex-1"
              >
                ✓ Accepter
              </button>
              <button
                disabled={pending}
                onClick={() => startTransition(() => refuserCommande(commande.id))}
                className="btn-danger"
              >
                Refuser
              </button>
            </>
          ) : (
            suivant && (
              <button
                disabled={pending}
                onClick={() => startTransition(() => changerStatut(commande.id, suivant))}
                className="btn-primary flex-1"
              >
                {pending ? "…" : `Marquer : ${STATUS_LABELS[suivant]}`}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
