"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrix } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/constants";
import type { Commande, CommandeStatus } from "@/types/database";

// Étapes visibles côté client
const ETAPES: { status: CommandeStatus; label: string; icon: string }[] = [
  { status: "nouvelle", label: "Commande reçue", icon: "📝" },
  { status: "acceptee", label: "Acceptée par le livreur", icon: "✅" },
  { status: "recuperation", label: "Récupération au restaurant", icon: "🏪" },
  { status: "en_livraison", label: "En livraison", icon: "🛵" },
  { status: "livree", label: "Livrée", icon: "🎉" },
];

// Index d'avancement pour un statut donné
const ORDRE: Record<string, number> = {
  nouvelle: 0,
  acceptee: 1,
  preparation: 1,
  prete: 2,
  recuperation: 2,
  en_livraison: 3,
  livree: 4,
};

export function SuiviClient({ commande: initial }: { commande: Commande }) {
  const [commande, setCommande] = useState(initial);
  const annulee = commande.status === "annulee";
  const etapeActuelle = ORDRE[commande.status] ?? 0;

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`commande-${commande.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "commandes",
          filter: `id=eq.${commande.id}`,
        },
        (payload) => {
          setCommande((c) => ({ ...c, ...(payload.new as Commande) }));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [commande.id]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="text-center">
          <span className="text-4xl">🛵</span>
          <h1 className="mt-2 text-xl font-bold text-slate-900">
            Suivi de commande
          </h1>
          <p className="text-sm text-slate-500">{commande.reference}</p>
        </div>

        {annulee ? (
          <div className="card mt-6 p-6 text-center">
            <span className="text-3xl">❌</span>
            <p className="mt-2 font-semibold text-red-600">Commande annulée</p>
          </div>
        ) : (
          <div className="card mt-6 p-5">
            <p className="mb-4 text-center text-sm font-medium text-brand-700">
              {STATUS_LABELS[commande.status]}
            </p>
            <ol className="relative space-y-1">
              {ETAPES.map((etape, i) => {
                const done = i <= etapeActuelle;
                const active = i === etapeActuelle;
                return (
                  <li key={etape.status} className="flex items-center gap-3">
                    <div
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm transition ${
                        done
                          ? "bg-brand-600 text-white"
                          : "bg-slate-100 text-slate-400"
                      } ${active ? "ring-4 ring-brand-100" : ""}`}
                    >
                      {done ? etape.icon : i + 1}
                    </div>
                    <span
                      className={`text-sm ${
                        done ? "font-semibold text-slate-900" : "text-slate-400"
                      }`}
                    >
                      {etape.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {/* Détails */}
        <div className="card mt-4 p-5">
          <h2 className="mb-2 font-semibold text-slate-900">Détails</h2>
          {commande.restaurant?.nom && (
            <p className="text-sm text-slate-600">
              Restaurant : <span className="font-medium">{commande.restaurant.nom}</span>
            </p>
          )}
          <p className="text-sm text-slate-600">
            Adresse : <span className="font-medium">{commande.client_adresse}</span>
          </p>
          {commande.items && (
            <ul className="mt-3 space-y-1 text-sm">
              {commande.items.map((it) => (
                <li key={it.id} className="flex justify-between">
                  <span>{it.quantite}× {it.nom_produit}</span>
                  <span>{formatPrix(it.prix_unitaire * it.quantite)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 font-bold">
            <span>Total</span>
            <span>{formatPrix(commande.total)}</span>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Cette page se met à jour automatiquement.
        </p>
      </div>
    </div>
  );
}
