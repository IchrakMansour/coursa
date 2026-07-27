"use client";

import { useTransition } from "react";
import { formatPrix } from "@/lib/utils";
import type { Service } from "@/types/database";

export function ServiceChip({
  service,
  onDelete,
}: {
  service: Service;
  onDelete: (id: string) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm">
      <span>{service.icone}</span>
      {service.nom}
      <span className="text-xs text-slate-400">
        {Number(service.prix) > 0 ? formatPrix(service.prix) : "à convenir"}
      </span>
      <button
        disabled={pending}
        onClick={() => startTransition(() => onDelete(service.id))}
        className="text-slate-400 hover:text-red-500"
        aria-label="Supprimer"
      >
        ✕
      </button>
    </span>
  );
}
