import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { majProfil, ajouterService, supprimerService } from "./actions";
import { ServiceChip } from "@/components/livreur/ServiceChip";
import { ChampTelephone } from "@/components/ChampTelephone";
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
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="min-w-0">
            <label className="label">Ouverture</label>
            <input
              name="horaire_ouverture"
              type="time"
              className="input min-w-0"
              defaultValue={livreur.horaire_ouverture ?? "12:00"}
            />
          </div>
          <div className="min-w-0">
            <label className="label">Fermeture</label>
            <input
              name="horaire_fermeture"
              type="time"
              className="input min-w-0"
              defaultValue={livreur.horaire_fermeture ?? "23:00"}
            />
          </div>
        </div>
        <div>
          <ChampTelephone
            name="whatsapp"
            label="WhatsApp"
            defaultValue={profile.whatsapp}
            aide="Le numéro que vos clients contacteront depuis votre page."
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
          Courses, pharmacie, colis… Vos clients peuvent les commander
          directement depuis votre page, en décrivant leur besoin.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {services.map((s) => (
            <ServiceChip key={s.id} service={s} onDelete={supprimerService} />
          ))}
          {services.length === 0 && (
            <p className="text-sm text-slate-400">Aucun service ajouté.</p>
          )}
        </div>
        <form action={ajouterService} className="mt-4 flex flex-wrap gap-2">
          <select
            name="icone"
            className="input w-full text-base sm:w-40"
            defaultValue="🛒"
            aria-label="Icône du service"
          >
            <option value="🛒">🛒 Courses</option>
            <option value="💊">💊 Pharmacie</option>
            <option value="📦">📦 Colis</option>
            <option value="🥖">🥖 Boulangerie</option>
            <option value="🍽️">🍽️ Plats</option>
            <option value="💧">💧 Eau</option>
            <option value="💐">💐 Fleurs</option>
            <option value="📄">📄 Documents</option>
            <option value="🎁">🎁 Cadeau</option>
            <option value="🧺">🧺 Autre</option>
          </select>
          <input
            name="nom"
            className="input min-w-0 flex-1 basis-40"
            placeholder="Nom du service"
            required
          />
          <input
            name="prix"
            type="number"
            step="0.5"
            min="0"
            inputMode="decimal"
            className="input w-full sm:w-28"
            placeholder="Prix DT"
            title="Frais de livraison — laissez vide pour « à convenir »"
          />
          <button className="btn-secondary w-full sm:w-auto">Ajouter</button>
        </form>
        <p className="mt-2 text-xs text-slate-400">
          Prix vide ou 0 : le tarif sera annoncé comme « à convenir ».
        </p>
      </div>
    </div>
  );
}
