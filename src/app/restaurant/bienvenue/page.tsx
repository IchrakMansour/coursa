import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { creerRestaurant } from "./actions";
import { APP_NAME } from "@/lib/constants";

export default async function RestaurantBienvenue() {
  const profile = await requireRole("restaurant");
  const supabase = await createClient();
  const { data: resto } = await supabase
    .from("restaurants")
    .select("id")
    .eq("owner_id", profile.id)
    .maybeSingle();
  if (resto) redirect("/restaurant");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-orange-50 to-white px-5 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <span className="text-4xl">🍽️</span>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">
            Bienvenue sur {APP_NAME}
          </h1>
          <p className="mt-1 text-slate-500">Configurons votre restaurant.</p>
        </div>
        <form action={creerRestaurant} className="card space-y-4 p-6 sm:p-8">
          <div>
            <label className="label">Nom du restaurant *</label>
            <input name="nom" className="input" placeholder="Pizza House" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Catégorie</label>
              <input name="categorie" className="input" placeholder="Pizza" />
            </div>
            <div>
              <label className="label">Ville</label>
              <input name="ville" className="input" placeholder="Sousse" />
            </div>
          </div>
          <div>
            <label className="label">Adresse</label>
            <input name="adresse" className="input" placeholder="Av. Habib Bourguiba" />
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input name="telephone" className="input" placeholder="+216 73 000 000" />
          </div>
          <button className="btn-primary w-full py-3">Créer mon restaurant →</button>
        </form>
      </div>
    </div>
  );
}
