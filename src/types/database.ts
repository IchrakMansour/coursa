// ============================================================
//  Types partagés — reflètent le schéma Supabase
// ============================================================

// La plateforme est centrée livreur : seuls les livreurs s'inscrivent.
// Les restaurants sont des fiches créées par le livreur, sans compte.
export type UserRole = "livreur" | "client" | "admin";
export type AccountStatus = "active" | "pending" | "suspended";
export type PartenariatStatus = "pending" | "accepted" | "refused";
export type CommandeStatus =
  | "nouvelle"
  | "acceptee"
  | "preparation"
  | "prete"
  | "recuperation"
  | "en_livraison"
  | "livree"
  | "annulee";
export type AbonnementPlan = "free" | "pro" | "premium";
export type AbonnementStatus = "active" | "expired" | "cancelled" | "trialing";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface Livreur {
  id: string;
  slug: string;
  nom_commercial: string;
  description: string | null;
  photo_url: string | null;
  ville: string | null;
  zone_livraison: string | null;
  horaire_ouverture: string | null;
  horaire_fermeture: string | null;
  type_vehicule: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  livreur_id: string;
  nom: string;
  icone: string;
  // Frais de livraison indicatifs (0 = à convenir avec le client)
  prix: number;
  actif: boolean;
}

export interface Restaurant {
  id: string;
  owner_id: string | null;
  nom: string;
  logo_url: string | null;
  adresse: string | null;
  telephone: string | null;
  categorie: string | null;
  horaires: string | null;
  ville: string | null;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface Partenariat {
  id: string;
  livreur_id: string;
  restaurant_id: string;
  status: PartenariatStatus;
  prix_livraison: number;
  initie_par: "livreur" | "restaurant";
  created_at: string;
  restaurant?: Restaurant;
  livreur?: Livreur;
}

export interface MenuCategorie {
  id: string;
  restaurant_id: string;
  nom: string;
  position: number;
}

export interface Produit {
  id: string;
  restaurant_id: string;
  categorie_id: string | null;
  nom: string;
  description: string | null;
  prix: number;
  image_url: string | null;
  disponible: boolean;
}

// Photo de la carte du restaurant, prise par le livreur
export interface MenuPhoto {
  id: string;
  restaurant_id: string;
  url: string;
  storage_path: string | null;
  legende: string | null;
  position: number;
  created_at: string;
}

export interface Client {
  id: string;
  livreur_id: string;
  nom: string | null;
  telephone: string;
  adresse: string | null;
  created_at: string;
}

export interface CommandeItem {
  id: string;
  commande_id: string;
  produit_id: string | null;
  nom_produit: string;
  prix_unitaire: number;
  quantite: number;
}

export interface Commande {
  id: string;
  reference: string;
  livreur_id: string;
  // Une commande vise soit un restaurant, soit un service (courses, colis…)
  restaurant_id: string | null;
  service_id: string | null;
  service_nom: string | null;
  client_id: string | null;
  client_nom: string | null;
  client_telephone: string | null;
  client_adresse: string | null;
  commentaire: string | null;
  // Commande écrite en toutes lettres par le client (menu en photo)
  demande_libre: string | null;
  status: CommandeStatus;
  sous_total: number;
  frais_livraison: number;
  total: number;
  // Dernière position connue du livreur (effacée à la livraison)
  livreur_lat: number | null;
  livreur_lng: number | null;
  position_maj: string | null;
  created_at: string;
  updated_at: string;
  items?: CommandeItem[];
  restaurant?: Restaurant;
}

// Position diffusée en direct sur le canal Realtime de la commande
export interface PositionLivreur {
  lat: number;
  lng: number;
  precision?: number | null;
  cap?: number | null;
  horodatage: number;
}

export interface Abonnement {
  id: string;
  livreur_id: string;
  plan: AbonnementPlan;
  status: AbonnementStatus;
  started_at: string;
  expires_at: string | null;
}

export interface Paiement {
  id: string;
  livreur_id: string | null;
  abonnement_id: string | null;
  montant: number;
  type: string;
  status: string;
  created_at: string;
}
