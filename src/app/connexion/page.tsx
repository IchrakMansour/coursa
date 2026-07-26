"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/constants";
import type { UserRole } from "@/types/database";

const ROLES: { id: UserRole; label: string; icon: string; desc: string }[] = [
  { id: "livreur", label: "Livreur", icon: "🛵", desc: "Je livre des commandes" },
  { id: "restaurant", label: "Restaurant", icon: "🍽️", desc: "Je gère un restaurant" },
];

function homeForRole(role: UserRole | undefined) {
  return role === "admin"
    ? "/admin"
    : role === "restaurant"
      ? "/restaurant"
      : "/livreur";
}

function ConnexionInner() {
  const router = useRouter();
  const params = useSearchParams();
  const inscription = params.get("mode") === "inscription";
  const next = params.get("next");

  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [role, setRole] = useState<UserRole>("livreur");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function redirigerSelonRole() {
    if (next) {
      router.push(next);
      router.refresh();
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    let dest = "/livreur";
    if (userData.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();
      dest = homeForRole(profile?.role as UserRole | undefined);
    }
    router.push(dest);
    router.refresh();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    if (inscription) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role, full_name: nom } },
      });
      if (error) {
        setLoading(false);
        setError(error.message);
        return;
      }
      // Si la confirmation d'e-mail est désactivée, une session est créée
      // immédiatement → on redirige. Sinon, on invite à confirmer l'e-mail.
      if (data.session) {
        await redirigerSelonRole();
      } else {
        setLoading(false);
        setInfo(
          "Compte créé ! Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous."
        );
      }
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }
    await redirigerSelonRole();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-white px-5 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 text-lg font-extrabold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">🛵</span>
          {APP_NAME}
        </Link>

        <div className="card p-6 sm:p-8">
          <h1 className="text-xl font-bold text-slate-900">
            {inscription ? "Créer votre espace" : "Connexion"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {inscription
              ? "Renseignez vos informations pour créer votre compte."
              : "Connectez-vous avec votre e-mail et mot de passe."}
          </p>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {info && (
            <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
              {info}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            {inscription && (
              <>
                <div>
                  <label className="label">Nom complet</label>
                  <input
                    className="input"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Ahmed Ben Ali"
                    required
                  />
                </div>
                <div>
                  <label className="label">Je suis un…</label>
                  <div className="grid grid-cols-2 gap-3">
                    {ROLES.map((r) => (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => setRole(r.id)}
                        className={`rounded-xl border p-3 text-left transition ${
                          role === r.id
                            ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-xl">{r.icon}</span>
                        <p className="mt-1 text-sm font-semibold">{r.label}</p>
                        <p className="text-xs text-slate-500">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="label">E-mail</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={inscription ? "new-password" : "current-password"}
                minLength={6}
                required
              />
              {inscription && (
                <p className="mt-1 text-xs text-slate-400">6 caractères minimum.</p>
              )}
            </div>
            <button className="btn-primary w-full" disabled={loading}>
              {loading
                ? "Veuillez patienter…"
                : inscription
                  ? "Créer mon espace"
                  : "Se connecter"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-slate-500">
          {inscription ? (
            <>
              Déjà un compte ?{" "}
              <Link href="/connexion" className="font-semibold text-brand-600">
                Se connecter
              </Link>
            </>
          ) : (
            <>
              Pas encore de compte ?{" "}
              <Link href="/connexion?mode=inscription" className="font-semibold text-brand-600">
                Créer un espace
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-400">Chargement…</div>}>
      <ConnexionInner />
    </Suspense>
  );
}
