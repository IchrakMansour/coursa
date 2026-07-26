-- ============================================================
--  LivraPro — Row Level Security (RLS)
--  Politiques d'accès pour les 4 rôles
-- ============================================================

-- Helper : rôle de l'utilisateur courant (SECURITY DEFINER pour éviter la récursion)
create or replace function auth_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

-- Helper : le restaurant appartient-il à l'utilisateur courant ?
create or replace function owns_restaurant(rid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from restaurants where id = rid and owner_id = auth.uid());
$$;

-- Activer RLS partout
alter table profiles         enable row level security;
alter table livreurs         enable row level security;
alter table services         enable row level security;
alter table restaurants      enable row level security;
alter table partenariats     enable row level security;
alter table menu_categories  enable row level security;
alter table produits         enable row level security;
alter table clients          enable row level security;
alter table commandes        enable row level security;
alter table commande_items   enable row level security;
alter table abonnements      enable row level security;
alter table paiements        enable row level security;

-- ------------------------------------------------------------
--  PROFILES
-- ------------------------------------------------------------
create policy "profiles_self_read"   on profiles for select using (id = auth.uid());
create policy "profiles_admin_read"  on profiles for select using (auth_role() = 'admin');
create policy "profiles_self_update" on profiles for update using (id = auth.uid());
create policy "profiles_admin_all"   on profiles for all using (auth_role() = 'admin');

-- ------------------------------------------------------------
--  LIVREURS  — vitrine publique lisible par tous
-- ------------------------------------------------------------
create policy "livreurs_public_read" on livreurs for select using (is_published = true);
create policy "livreurs_self_all"    on livreurs for all using (id = auth.uid()) with check (id = auth.uid());
create policy "livreurs_admin_all"   on livreurs for all using (auth_role() = 'admin');

-- ------------------------------------------------------------
--  SERVICES — publics en lecture, gérés par le livreur
-- ------------------------------------------------------------
create policy "services_public_read" on services for select using (true);
create policy "services_owner_all"   on services for all using (livreur_id = auth.uid()) with check (livreur_id = auth.uid());

-- ------------------------------------------------------------
--  RESTAURANTS — publics en lecture (pour la vitrine)
-- ------------------------------------------------------------
create policy "restaurants_public_read" on restaurants for select using (status = 'active');
create policy "restaurants_owner_all"   on restaurants for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "restaurants_admin_all"   on restaurants for all using (auth_role() = 'admin');

-- ------------------------------------------------------------
--  PARTENARIATS — visibles par le livreur ou le resto concerné
-- ------------------------------------------------------------
create policy "partenariats_public_read" on partenariats for select using (status = 'accepted');
create policy "partenariats_livreur"   on partenariats for all
  using (livreur_id = auth.uid()) with check (livreur_id = auth.uid());
create policy "partenariats_resto"     on partenariats for all
  using (owns_restaurant(restaurant_id)) with check (owns_restaurant(restaurant_id));
create policy "partenariats_admin"     on partenariats for all using (auth_role() = 'admin');

-- ------------------------------------------------------------
--  MENU (catégories + produits) — publics en lecture
-- ------------------------------------------------------------
create policy "menu_cat_public_read" on menu_categories for select using (true);
create policy "menu_cat_owner_all"   on menu_categories for all
  using (owns_restaurant(restaurant_id)) with check (owns_restaurant(restaurant_id));

create policy "produits_public_read" on produits for select using (true);
create policy "produits_owner_all"   on produits for all
  using (owns_restaurant(restaurant_id)) with check (owns_restaurant(restaurant_id));

-- ------------------------------------------------------------
--  CLIENTS (CRM) — uniquement le livreur propriétaire
-- ------------------------------------------------------------
create policy "clients_owner_all" on clients for all
  using (livreur_id = auth.uid()) with check (livreur_id = auth.uid());
create policy "clients_admin"     on clients for select using (auth_role() = 'admin');

-- ------------------------------------------------------------
--  COMMANDES — livreur concerné + resto concerné + admin
-- ------------------------------------------------------------
create policy "commandes_livreur" on commandes for all
  using (livreur_id = auth.uid()) with check (livreur_id = auth.uid());
create policy "commandes_resto"   on commandes for select
  using (owns_restaurant(restaurant_id));
create policy "commandes_resto_update" on commandes for update
  using (owns_restaurant(restaurant_id));
create policy "commandes_admin"   on commandes for all using (auth_role() = 'admin');

create policy "commande_items_via_commande" on commande_items for all
  using (exists (
    select 1 from commandes c
    where c.id = commande_id
      and (c.livreur_id = auth.uid() or owns_restaurant(c.restaurant_id) or auth_role() = 'admin')
  ));

-- ------------------------------------------------------------
--  ABONNEMENTS & PAIEMENTS
-- ------------------------------------------------------------
create policy "abonnements_owner" on abonnements for all
  using (livreur_id = auth.uid()) with check (livreur_id = auth.uid());
create policy "abonnements_admin" on abonnements for all using (auth_role() = 'admin');

create policy "paiements_owner" on paiements for select using (livreur_id = auth.uid());
create policy "paiements_admin" on paiements for all using (auth_role() = 'admin');

-- ============================================================
--  NOTE : les commandes créées par un CLIENT non authentifié
--  (parcours public) passent par une API serveur utilisant la
--  clé service_role, qui contourne le RLS de façon contrôlée.
-- ============================================================
