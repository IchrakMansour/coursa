import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { formatPrix, formatDate } from "@/lib/utils";
import { PLANS } from "@/lib/constants";
import { changerPlan } from "./actions";
import type { Abonnement, Paiement } from "@/types/database";

export default async function AbonnementPage() {
  const profile = await requireRole("livreur");
  const supabase = await createClient();

  const [{ data: aboData }, { data: paiementsData }] = await Promise.all([
    supabase
      .from("abonnements")
      .select("*")
      .eq("livreur_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("paiements")
      .select("*")
      .eq("livreur_id", profile.id)
      .order("created_at", { ascending: false }),
  ]);

  const abo = aboData as Abonnement | null;
  const paiements: Paiement[] = (paiementsData as Paiement[]) ?? [];
  const planActuel = abo?.plan ?? "free";

  return (
    <div className="max-w-3xl">
      <PageHeader title="Abonnement" desc="Gérez votre offre et vos paiements." />

      {/* Abonnement actuel */}
      <div className="card mb-6 flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-slate-500">Offre actuelle</p>
          <p className="text-2xl font-bold capitalize text-slate-900">
            {PLANS.find((p) => p.id === planActuel)?.nom ?? planActuel}
          </p>
          {abo?.expires_at && (
            <p className="mt-1 text-sm text-slate-500">
              Expire le {formatDate(abo.expires_at)}
            </p>
          )}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            abo?.status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {abo?.status === "active" ? "Actif" : abo?.status ?? "—"}
        </span>
      </div>

      {/* Offres */}
      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((p) => (
          <div
            key={p.id}
            className={`card p-5 ${p.id === planActuel ? "ring-2 ring-brand-500" : ""}`}
          >
            <h3 className="font-bold text-slate-900">{p.nom}</h3>
            <p className="mt-1 text-2xl font-extrabold">
              {p.prix === 0 ? "Gratuit" : formatPrix(p.prix)}
              {p.prix > 0 && <span className="text-sm font-normal text-slate-400">/mois</span>}
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
              {p.features.map((f) => (
                <li key={f} className="flex gap-1.5">
                  <span className="text-brand-600">✓</span> {f}
                </li>
              ))}
            </ul>
            {p.id === planActuel ? (
              <button disabled className="btn-secondary mt-4 w-full opacity-60">
                Offre actuelle
              </button>
            ) : (
              <form action={changerPlan}>
                <input type="hidden" name="plan" value={p.id} />
                <button className="btn-primary mt-4 w-full">Choisir</button>
              </form>
            )}
          </div>
        ))}
      </div>

      {/* Historique paiements */}
      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Historique des paiements
      </h2>
      {paiements.length === 0 ? (
        <p className="text-sm text-slate-400">Aucun paiement pour l'instant.</p>
      ) : (
        <div className="card divide-y divide-slate-100">
          {paiements.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium capitalize text-slate-800">{p.type}</p>
                <p className="text-xs text-slate-400">{formatDate(p.created_at)}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatPrix(p.montant)}</p>
                <p className="text-xs capitalize text-green-600">{p.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 rounded-xl bg-slate-100 p-4 text-xs text-slate-500">
        💡 Le paiement en ligne (carte / e-Dinar) sera intégré dans une prochaine
        version. Pour l'instant, le changement d'offre est enregistré et un paiement
        de démonstration est créé.
      </p>
    </div>
  );
}
