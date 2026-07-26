"use client";

import { useTransition } from "react";
import { initiales } from "@/lib/utils";
import {
  repondreDemande,
  retirerLivreur,
} from "@/app/restaurant/(dashboard)/livreurs/actions";
import type { Partenariat } from "@/types/database";

export function LivreurRow({ partenariat }: { partenariat: Partenariat }) {
  const [pending, startTransition] = useTransition();
  const l = partenariat.livreur;

  return (
    <div className="card flex items-center justify-between gap-3 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-orange-100 font-semibold text-orange-700">
          {initiales(l?.nom_commercial)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">
            {l?.nom_commercial ?? "Livreur"}
          </p>
          <p className="truncate text-sm text-slate-500">
            {l?.ville ?? ""} {l?.zone_livraison ? `· ${l.zone_livraison}` : ""}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        {partenariat.status === "pending" ? (
          <>
            <button
              disabled={pending}
              onClick={() => startTransition(() => repondreDemande(partenariat.id, "accepted"))}
              className="btn-primary"
            >
              Accepter
            </button>
            <button
              disabled={pending}
              onClick={() => startTransition(() => repondreDemande(partenariat.id, "refused"))}
              className="btn-danger"
            >
              Refuser
            </button>
          </>
        ) : (
          <button
            disabled={pending}
            onClick={() => startTransition(() => retirerLivreur(partenariat.id))}
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
