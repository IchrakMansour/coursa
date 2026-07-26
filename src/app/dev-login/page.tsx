"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/constants";

// ============================================================
//  Connexion développeur SANS SMS
//  Activée seulement si NEXT_PUBLIC_ENABLE_DEV_LOGIN=true
//  Nécessite d'avoir exécuté supabase/dev_login.sql
// ============================================================

const COMPTES = [
  { label: "Ahmed — Livreur", phone: "+21620000002", dest: "/livreur", icon: "🛵", desc: "Vitrine, commandes, CRM, stats" },
  { label: "Pizza House — Restaurant", phone: "+21620000003", dest: "/restaurant", icon: "🍽️", desc: "Menu, livreurs, commandes" },
  { label: "Administrateur", phone: "+21620000001", dest: "/admin", icon: "🛠️", desc: "Utilisateurs, finances, stats" },
];

export default function DevLoginPage() {
  const enabled = process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === "true";
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function login(phone: string, dest: string) {
    setError(null);
    setLoading(phone);
    const { error } = await supabase.auth.signInWithPassword({
      phone,
      password: "livrapro-dev",
    });
    setLoading(null);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(dest);
    router.refresh();
  }

  if (!enabled) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5 text-center">
        <div>
          <p className="text-4xl">🔒</p>
          <h1 className="mt-3 text-lg font-bold text-slate-900">
            Accès développeur désactivé
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Ajoutez <code>NEXT_PUBLIC_ENABLE_DEV_LOGIN=true</code> dans votre
            <code> .env.local</code> pour l'activer (développement uniquement).
          </p>
          <Link href="/" className="btn-secondary mt-4 inline-flex">← Accueil</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-amber-50 to-white px-5 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 text-lg font-extrabold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">🛵</span>
          {APP_NAME}
        </Link>

        <div className="card p-6">
          <div className="mb-4 rounded-xl bg-amber-100 px-4 py-2.5 text-center text-sm font-medium text-amber-800">
            🧪 Mode développeur — connexion sans SMS
          </div>

          <h1 className="text-lg font-bold text-slate-900">Se connecter comme…</h1>
          <p className="mt-1 text-sm text-slate-500">
            Comptes de démonstration (données déjà remplies).
          </p>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-4 space-y-2">
            {COMPTES.map((c) => (
              <button
                key={c.phone}
                onClick={() => login(c.phone, c.dest)}
                disabled={loading !== null}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:bg-slate-50 disabled:opacity-50"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-xl">
                  {c.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{c.label}</p>
                  <p className="truncate text-xs text-slate-500">{c.desc}</p>
                </div>
                <span className="text-sm text-brand-600">
                  {loading === c.phone ? "…" : "→"}
                </span>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          À désactiver en production (retirez la variable d'environnement).
        </p>
      </div>
    </div>
  );
}
