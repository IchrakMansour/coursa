import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { majProfil, ajouterService, supprimerService } from "./actions";
import { ServiceChip } from "@/components/livreur/ServiceChip";
import type { Livreur, Service } from "@/types/database";

export default async function ProfilPage() {
  const profile = await requireRole("livreur");
  const supabase = await createClient();

  const [{ data: livreurData }, { data: servicesData }] = await Promise.all([
    supabase.from("livreurs").select("*").eq("id", profile.id).single(),
    supabase.from("services").select("*").eq("livreur_id", profile.id),
  ]);

  const livreur = livreurData as Livreur;
  const services: Service[] = (servicesData as Service[]) ?? [];

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Mon profil professionnel"
        desc="Ces informations apparaissent sur votre page publique."
      />

      <form action={majProfil} className="card space-y-5 p-5 sm:p-6">
        <div>
          <label className="label">Nom commercial</label>
          <input
            name="nom_commercial"
            className="input"
            defaultValue={livreur.nom_commercial}
            required
          />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            name="description"
            className="input min-h-[90px]"
            defaultValue={livreur.description ?? ""}
            placeholder="Livraison rapide Sousse centre…"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Ville</label>
            <input name="ville" className="input" defaultValue={livreur.ville ?? ""} />
          </div>
          <div>
            <label className="label">Type de véhicule</label>
            <select name="type_vehicule" className="input" defaultValue={livreur.type_vehicule ?? "moto"}>
              <option value="moto">🏍️ Moto</option>
              <option value="scooter">🛵 Scooter</option>
              <option value="velo">🚲 Vélo</option>
              <option value="voiture">🚗 Voiture</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Zone de livraison</label>
          <input
            name="zone_livraison"
            className="input"
            defaultValue={livreur.zone_livraison ?? ""}
            placeholder="Sousse centre, Khezama, Sahloul"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Ouverture</label>
            <input
              name="horaire_ouverture"
              type="time"
              className="input"
              defaultValue={livreur.horaire_ouverture ?? "12:00"}
            />
          </div>
          <div>
            <label className="label">Fermeture</label>
            <input
              name="horaire_fermeture"
              type="time"
              className="input"
              defaultValue={livreur.horaire_fermeture ?? "23:00"}
            />
          </div>
        </div>
        <div>
          <label className="label">WhatsApp</label>
          <input
            name="whatsapp"
            className="input"
            defaultValue={profile.whatsapp ?? ""}
            placeholder="+216 20 000 002"
          />
        </div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="is_published"
            defaultChecked={livreur.is_published}
            className="h-4 w-4 rounded border-slate-300"
          />
          <span className="text-sm text-slate-700">
            Page publique visible (les clients peuvent commander)
          </span>
        </label>
        <button className="btn-primary">Enregistrer</button>
      </form>

      {/* Services */}
      <div className="card mt-6 p-5 sm:p-6">
        <h2 className="font-semibold text-slate-900">Services proposés</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Courses, pharmacie, colis… affichés sur votre vitrine.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {services.map((s) => (
            <ServiceChip key={s.id} service={s} onDelete={supprimerService} />
          ))}
          {services.length === 0 && (
            <p className="text-sm text-slate-400">Aucun service ajouté.</p>
          )}
        </div>
        <form action={ajouterService} className="mt-4 flex gap-2">
          <input name="icone" className="input w-16 text-center" defaultValue="📦" maxLength={2} />
          <input name="nom" className="input flex-1" placeholder="Nom du service" required />
          <button className="btn-secondary">Ajouter</button>
        </form>
      </div>
    </div>
  );
}
