"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/ui";
import { timeAgo, formatPrix } from "@/lib/utils";
import type { CommandeStatus } from "@/types/database";

export interface NotifItem {
  id: string;
  reference: string;
  clientNom: string;
  cible: string;
  total: number;
  status: CommandeStatus;
  createdAt: string;
}

// On retient dans le navigateur la date de la dernière notification déjà vue.
// Les commandes arrivées après sont considérées « non lues » et surlignées.
const CLE_VUES = "livrapro:notifs-vues";

export function HistoriqueNotifications({ items }: { items: NotifItem[] }) {
  const [seuil, setSeuil] = useState<number | null>(null);

  useEffect(() => {
    const plusRecent = items.reduce(
      (max, it) => Math.max(max, new Date(it.createdAt).getTime()),
      0
    );

    let vu: number;
    try {
      const stocke = localStorage.getItem(CLE_VUES);
      // Première visite : on prend la plus récente comme référence pour ne pas
      // tout surligner d'un coup ; ensuite, on compare à la dernière vue.
      vu = stocke ? Number(stocke) : plusRecent;
    } catch {
      vu = plusRecent;
    }
    setSeuil(vu);

    // Tout ce qui est affiché ici devient « lu » pour la prochaine visite.
    try {
      localStorage.setItem(CLE_VUES, String(Math.max(vu, plusRecent)));
    } catch {
      // Stockage indisponible (navigation privée) : sans conséquence.
    }
  }, [items]);

  return (
    <div className="space-y-2">
      {items.map((it) => {
        const nonLu =
          seuil !== null && new Date(it.createdAt).getTime() > seuil;
        return (
          <Link
            key={it.id}
            href="/livreur/commandes"
            className={`card flex items-center gap-3 p-3 transition hover:bg-slate-50 ${
              nonLu ? "border-brand-300 bg-brand-50/70" : ""
            }`}
          >
            <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-xl">
              🛵
              {nonLu && (
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-brand-600" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 truncate font-semibold text-slate-900">
                Nouvelle commande {it.reference}
                {nonLu && (
                  <span className="shrink-0 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Nouveau
                  </span>
                )}
              </p>
              <p className="truncate text-xs text-slate-500">
                {it.clientNom} — {it.cible}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {timeAgo(it.createdAt)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-semibold text-slate-900">
                {formatPrix(it.total)}
              </p>
              <div className="mt-1">
                <StatusBadge status={it.status} />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
