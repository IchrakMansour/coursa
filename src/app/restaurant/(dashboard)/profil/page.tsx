import { getMyRestaurant } from "@/lib/restaurant";
import { PageHeader } from "@/components/ui";
import { majRestaurant } from "./actions";

export default async function RestaurantProfil() {
  const resto = await getMyRestaurant();

  return (
    <div className="max-w-2xl">
      <PageHeader title="Mon restaurant" desc="Les informations de votre établissement." />

      <form action={majRestaurant} className="card space-y-5 p-5 sm:p-6">
        <div>
          <label className="label">Nom du restaurant</label>
          <input name="nom" className="input" defaultValue={resto.nom} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Catégorie</label>
            <input name="categorie" className="input" defaultValue={resto.categorie ?? ""} />
          </div>
          <div>
            <label className="label">Ville</label>
            <input name="ville" className="input" defaultValue={resto.ville ?? ""} />
          </div>
        </div>
        <div>
          <label className="label">Adresse</label>
          <input name="adresse" className="input" defaultValue={resto.adresse ?? ""} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Téléphone</label>
            <input name="telephone" className="input" defaultValue={resto.telephone ?? ""} />
          </div>
          <div>
            <label className="label">Horaires</label>
            <input
              name="horaires"
              className="input"
              defaultValue={resto.horaires ?? ""}
              placeholder="11:00 - 23:30"
            />
          </div>
        </div>
        <button className="btn-primary">Enregistrer</button>
      </form>
    </div>
  );
}
