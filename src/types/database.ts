// ============================================================
//  Types partagés — reflètent le schéma Supabase
// ============================================================

export type UserRole = "livreur" | "restaurant" | "client" | "admin";
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
  restaurant_id: string | null;
  client_id: string | null;
  client_nom: string | null;
  client_telephone: string | null;
  client_adresse: string | null;
  commentaire: string | null;
  status: CommandeStatus;
  sous_total: number;
  frais_livraison: number;
  total: number;
  created_at: string;
  updated_at: string;
  items?: CommandeItem[];
  restaurant?: Restaurant;
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
