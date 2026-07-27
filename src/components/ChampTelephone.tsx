"use client";

import { useState } from "react";
import { telLocal } from "@/lib/utils";

// Champ téléphone unique de la plateforme : indicatif +216 fixe, 8 chiffres.
// La valeur postée ne contient que les 8 chiffres ; le serveur y ajoute
// l'indicatif avant l'enregistrement.
// Utilisable tel quel dans un formulaire (non contrôlé) ou piloté par le
// parent via `value` / `onChange`.
export function ChampTelephone({
  name = "telephone",
  label = "Téléphone",
  defaultValue,
  value,
  onChange,
  required = false,
  aide = "8 chiffres, sans l'indicatif.",
}: {
  name?: string;
  label?: string | null;
  defaultValue?: string | null;
  value?: string;
  onChange?: (valeur: string) => void;
  required?: boolean;
  aide?: string | null;
}) {
  const [interne, setInterne] = useState(() => telLocal(defaultValue));
  const controle = value !== undefined;
  const valeur = controle ? value : interne;

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="flex">
        <span className="grid shrink-0 place-items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-500">
          +216
        </span>
        <input
          name={name}
          type="tel"
          inputMode="numeric"
          className="input rounded-l-none"
          placeholder="20 123 456"
          pattern="[234579][0-9]{7}"
          maxLength={8}
          title="8 chiffres, commençant par 2, 3, 4, 5, 7 ou 9"
          value={valeur}
          onChange={(e) => {
            const propre = e.target.value.replace(/\D/g, "").slice(0, 8);
            if (controle) onChange?.(propre);
            else setInterne(propre);
          }}
          required={required}
        />
      </div>
      {aide && <p className="mt-1 text-xs text-slate-400">{aide}</p>}
    </div>
  );
}
