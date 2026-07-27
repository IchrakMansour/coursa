"use client";

import { useTransition } from "react";
import { initiales, formatDate } from "@/lib/utils";
import {
  changerStatutUtilisateur,
  supprimerUtilisateur,
} from "@/app/admin/utilisateurs/actions";
import type { Profile } from "@/types/database";

const ROLE_LABELS: Record<string, string> = {
  livreur: "Livreur",
  client: "Client",
  admin: "Admin",
};

const STATUT_STYLE: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  suspended: "bg-red-100 text-red-700",
};

export function UserRow({ user }: { user: Profile }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-3 p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 font-semibold text-slate-600">
        {initiales(user.full_name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">
          {user.full_name ?? "—"}
        </p>
        <p className="text-xs text-slate-400">
          {user.phone ?? "—"} · Inscrit le {formatDate(user.created_at)}
        </p>
      </div>

      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
        {ROLE_LABELS[user.role]}
      </span>
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUT_STYLE[user.status]}`}>
        {user.status}
      </span>

      <div className="flex gap-1">
        {user.status !== "active" && (
          <button
            disabled={pending}
            onClick={() => startTransition(() => changerStatutUtilisateur(user.id, "active"))}
            className="btn-ghost px-2 py-1 text-xs text-green-600"
            title="Valider / réactiver"
          >
            Valider
          </button>
        )}
        {user.status === "active" && user.role !== "admin" && (
          <button
            disabled={pending}
            onClick={() => startTransition(() => changerStatutUtilisateur(user.id, "suspended"))}
            className="btn-ghost px-2 py-1 text-xs text-amber-600"
            title="Suspendre"
          >
            Suspendre
          </button>
        )}
        {user.role !== "admin" && (
          <button
            disabled={pending}
            onClick={() => {
              if (confirm("Supprimer définitivement cet utilisateur ?"))
                startTransition(() => supprimerUtilisateur(user.id));
            }}
            className="btn-ghost px-2 py-1 text-xs text-red-600"
            title="Supprimer"
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
}
