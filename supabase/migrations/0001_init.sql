-- ============================================================
--  LivraPro — Schéma initial de la base de données
--  Plateforme SaaS de gestion pour livreurs indépendants
-- ============================================================

-- Extensions utiles
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
--  TYPES ÉNUMÉRÉS
-- ------------------------------------------------------------
create type user_role as enum ('livreur', 'restaurant', 'client', 'admin');
create type account_status as enum ('active', 'pending', 'suspended');
create type partenariat_status as enum ('pending', 'accepted', 'refused');
create type commande_status as enum (
  'nouvelle',        -- Nouvelle commande
  'acceptee',        -- Acceptée par le livreur
  'preparation',     -- En préparation (restaurant)
  'prete',           -- Prête au restaurant
  'recuperation',    -- Récupération restaurant
  'en_livraison',    -- En livraison
  'livree',          -- Livrée
  'annulee'          -- Annulée
);
create type abonnement_plan as enum ('free', 'pro', 'premium');
create type abonnement_status as enum ('active', 'expired', 'cancelled', 'trialing');
create type paiement_status as enum ('paye', 'en_attente', 'echoue', 'rembourse');
create type initiateur as enum ('livreur', 'restaurant');

-- ------------------------------------------------------------
--  PROFILES  (une ligne par utilisateur authentifié)
-- ------------------------------------------------------------
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null default 'client',
  full_name   text,
  phone       text,
  whatsapp    text,
  status      account_status not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
--  LIVREURS  (profil professionnel + vitrine publique)
-- ------------------------------------------------------------
create table livreurs (
  id                 uuid primary key references profiles(id) on delete cascade,
  slug               text unique not null,
  nom_commercial     text not null,
  description        text,
  photo_url          text,
  ville              text,
  zone_livraison     text,
  horaire_ouverture  text default '12:00',
  horaire_fermeture  text default '23:00',
  type_vehicule      text default 'moto',
  is_published       boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index idx_livreurs_slug on livreurs(slug);

-- ------------------------------------------------------------
--  SERVICES du livreur (Courses, Pharmacie, Colis...)
-- ------------------------------------------------------------
create table services (
  id          uuid primary key default uuid_generate_v4(),
  livreur_id  uuid not null references livreurs(id) on delete cascade,
  nom         text not null,
  icone       text default '📦',
  actif       boolean not null default true,
  created_at  timestamptz not null default now()
);
create index idx_services_livreur on services(livreur_id);

-- ------------------------------------------------------------
--  RESTAURANTS
-- ------------------------------------------------------------
create table restaurants (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid references profiles(id) on delete set null,
  nom         text not null,
  logo_url    text,
  adresse     text,
  telephone   text,
  categorie   text,
  horaires    text,
  ville       text,
  status      account_status not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_restaurants_owner on restaurants(owner_id);

-- ------------------------------------------------------------
--  PARTENARIATS  (livreur <-> restaurant)
-- ------------------------------------------------------------
create table partenariats (
  id             uuid primary key default uuid_generate_v4(),
  livreur_id     uuid not null references livreurs(id) on delete cascade,
  restaurant_id  uuid not null references restaurants(id) on delete cascade,
  status         partenariat_status not null default 'pending',
  prix_livraison numeric(8,2) default 0,
  initie_par     initiateur not null default 'livreur',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (livreur_id, restaurant_id)
);
create index idx_partenariats_livreur on partenariats(livreur_id);
create index idx_partenariats_restaurant on partenariats(restaurant_id);

-- ------------------------------------------------------------
--  MENU : catégories + produits
-- ------------------------------------------------------------
create table menu_categories (
  id             uuid primary key default uuid_generate_v4(),
  restaurant_id  uuid not null references restaurants(id) on delete cascade,
  nom            text not null,
  position       int not null default 0,
  created_at     timestamptz not null default now()
);
create index idx_menu_categories_restaurant on menu_categories(restaurant_id);

create table produits (
  id             uuid primary key default uuid_generate_v4(),
  restaurant_id  uuid not null references restaurants(id) on delete cascade,
  categorie_id   uuid references menu_categories(id) on delete set null,
  nom            text not null,
  description    text,
  prix           numeric(8,2) not null default 0,
  image_url      text,
  disponible     boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_produits_restaurant on produits(restaurant_id);
create index idx_produits_categorie on produits(categorie_id);

-- ------------------------------------------------------------
--  CLIENTS (CRM propre à chaque livreur)
-- ------------------------------------------------------------
create table clients (
  id          uuid primary key default uuid_generate_v4(),
  livreur_id  uuid not null references livreurs(id) on delete cascade,
  nom         text,
  telephone   text not null,
  adresse     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (livreur_id, telephone)
);
create index idx_clients_livreur on clients(livreur_id);

-- ------------------------------------------------------------
--  COMMANDES
-- ------------------------------------------------------------
create table commandes (
  id                uuid primary key default uuid_generate_v4(),
  reference         text unique not null default ('CMD-' || upper(substr(md5(random()::text), 1, 6))),
  livreur_id        uuid not null references livreurs(id) on delete cascade,
  restaurant_id     uuid references restaurants(id) on delete set null,
  client_id         uuid references clients(id) on delete set null,
  client_nom        text,
  client_telephone  text,
  client_adresse    text,
  commentaire       text,
  status            commande_status not null default 'nouvelle',
  sous_total        numeric(10,2) not null default 0,
  frais_livraison   numeric(8,2) not null default 0,
  total             numeric(10,2) not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index idx_commandes_livreur on commandes(livreur_id);
create index idx_commandes_restaurant on commandes(restaurant_id);
create index idx_commandes_status on commandes(status);
create index idx_commandes_created on commandes(created_at desc);

create table commande_items (
  id             uuid primary key default uuid_generate_v4(),
  commande_id    uuid not null references commandes(id) on delete cascade,
  produit_id     uuid references produits(id) on delete set null,
  nom_produit    text not null,
  prix_unitaire  numeric(8,2) not null default 0,
  quantite       int not null default 1
);
create index idx_commande_items_commande on commande_items(commande_id);

-- ------------------------------------------------------------
--  ABONNEMENTS & PAIEMENTS
-- ------------------------------------------------------------
create table abonnements (
  id          uuid primary key default uuid_generate_v4(),
  livreur_id  uuid not null references livreurs(id) on delete cascade,
  plan        abonnement_plan not null default 'free',
  status      abonnement_status not null default 'active',
  started_at  timestamptz not null default now(),
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index idx_abonnements_livreur on abonnements(livreur_id);

create table paiements (
  id             uuid primary key default uuid_generate_v4(),
  livreur_id     uuid references livreurs(id) on delete set null,
  abonnement_id  uuid references abonnements(id) on delete set null,
  montant        numeric(10,2) not null default 0,
  type           text default 'abonnement',
  status         paiement_status not null default 'paye',
  created_at     timestamptz not null default now()
);
create index idx_paiements_livreur on paiements(livreur_id);

-- ------------------------------------------------------------
--  TRIGGERS : updated_at automatique
-- ------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated    before update on profiles    for each row execute function set_updated_at();
create trigger trg_livreurs_updated    before update on livreurs    for each row execute function set_updated_at();
create trigger trg_restaurants_updated before update on restaurants for each row execute function set_updated_at();
create trigger trg_partenariats_updated before update on partenariats for each row execute function set_updated_at();
create trigger trg_produits_updated    before update on produits    for each row execute function set_updated_at();
create trigger trg_clients_updated     before update on clients     for each row execute function set_updated_at();
create trigger trg_commandes_updated   before update on commandes   for each row execute function set_updated_at();

-- ------------------------------------------------------------
--  TRIGGER : création automatique du profil à l'inscription
-- ------------------------------------------------------------
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone, role, full_name)
  values (
    new.id,
    new.phone,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'client'),
    new.raw_user_meta_data->>'full_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
