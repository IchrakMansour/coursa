import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { creerVitrine } from "./actions";
import { APP_NAME } from "@/lib/constants";

export default async function BienvenuePage() {
  const profile = await requireRole("livreur");

  // Si la vitrine existe déjà, aller au dashboard
  const supabase = await createClient();
  const { data: livreur } = await supabase
    .from("livreurs")
    .select("id")
    .eq("id", profile.id)
    .maybeSingle();
  if (livreur) redirect("/livreur");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-white px-5 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <span className="text-4xl">🎉</span>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">
            Bienvenue sur {APP_NAME} !
          </h1>
          <p className="mt-1 text-slate-500">
            Créons votre vitrine digitale en quelques secondes.
          </p>
        </div>

        <form action={creerVitrine} className="card space-y-4 p-6 sm:p-8">
          <div>
            <label className="label">Nom commercial *</label>
            <input
              name="nom_commercial"
              className="input"
              placeholder="Ahmed Delivery"
              required
            />
            <p className="mt-1 text-xs text-slate-400">
              Le nom affiché sur votre page publique.
            </p>
          </div>
          <div>
            <label className="label">Ville</label>
            <input name="ville" className="input" placeholder="Sousse" />
          </div>
          <div>
            <label className="label">Zone de livraison</label>
            <input
              name="zone_livraison"
              className="input"
              placeholder="Sousse centre, Khezama, Sahloul"
            />
          </div>
          <button className="btn-primary w-full py-3">
            Créer ma vitrine →
          </button>
        </form>
      </div>
    </div>
  );
}
