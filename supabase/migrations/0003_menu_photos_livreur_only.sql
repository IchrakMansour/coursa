-- ============================================================
--  LivraPro — 0003
--  1. Photos du menu (le livreur photographie la carte du resto)
--  2. Plateforme centrée LIVREUR uniquement (plus d'espace resto)
-- ============================================================

-- ------------------------------------------------------------
--  1) PHOTOS DU MENU
--  Le livreur ajoute des photos de la carte du restaurant pour
--  avoir les prix sous les yeux au moment de prendre la commande.
-- ------------------------------------------------------------
create table if not exists menu_photos (
  id             uuid primary key default uuid_generate_v4(),
  restaurant_id  uuid not null references restaurants(id) on delete cascade,
  url            text not null,          -- URL publique du fichier
  storage_path   text,                   -- chemin dans le bucket (pour la suppression)
  legende        text,                   -- ex : « Pizzas », « Boissons »
  position       int not null default 0,
  created_at     timestamptz not null default now()
);
create index if not exists idx_menu_photos_restaurant on menu_photos(restaurant_id);

-- Helper : le livreur courant est-il partenaire accepté de ce restaurant ?
create or replace function est_partenaire(rid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from partenariats
    where restaurant_id = rid
      and livreur_id = auth.uid()
      and status = 'accepted'
  );
$$;

alter table menu_photos enable row level security;

create policy "menu_photos_public_read" on menu_photos for select using (true);
create policy "menu_photos_livreur_all" on menu_photos for all
  using (est_partenaire(restaurant_id)) with check (est_partenaire(restaurant_id));
create policy "menu_photos_admin_all" on menu_photos for all using (auth_role() = 'admin');

-- ------------------------------------------------------------
--  2) LE LIVREUR GÈRE LE MENU DE SES RESTAURANTS PARTENAIRES
--  Les restaurants n'ont plus de compte : c'est le livreur qui
--  saisit la carte. On ouvre donc le RLS aux partenaires.
-- ------------------------------------------------------------
create policy "restaurants_partenaire_update" on restaurants for update
  using (est_partenaire(id)) with check (est_partenaire(id));

create policy "menu_cat_partenaire_all" on menu_categories for all
  using (est_partenaire(restaurant_id)) with check (est_partenaire(restaurant_id));

create policy "produits_partenaire_all" on produits for all
  using (est_partenaire(restaurant_id)) with check (est_partenaire(restaurant_id));

-- ------------------------------------------------------------
--  2 bis) PLUS D'INVITATION À VALIDER
--  Le partenariat était « pending » tant que le restaurant (qui
--  avait un compte) n'avait pas répondu. Le livreur crée
--  lui-même ses fiches : un partenariat est actif d'emblée.
-- ------------------------------------------------------------
alter table partenariats alter column status set default 'accepted';
update partenariats set status = 'accepted' where status = 'pending';

-- ------------------------------------------------------------
--  3) BUCKET DE STOCKAGE « menus »
--  Lecture publique, écriture par le livreur dans son dossier.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('menus', 'menus', true)
on conflict (id) do nothing;

drop policy if exists "menus_read_public"  on storage.objects;
drop policy if exists "menus_insert_own"   on storage.objects;
drop policy if exists "menus_update_own"   on storage.objects;
drop policy if exists "menus_delete_own"   on storage.objects;

create policy "menus_read_public" on storage.objects for select
  using (bucket_id = 'menus');

create policy "menus_insert_own" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'menus'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "menus_update_own" on storage.objects for update to authenticated
  using (
    bucket_id = 'menus'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "menus_delete_own" on storage.objects for delete to authenticated
  using (
    bucket_id = 'menus'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ------------------------------------------------------------
--  4) PLUS DE COMPTE « RESTAURANT »
--  L'inscription ne propose plus que « livreur ». Les comptes
--  restaurant existants deviennent des comptes client (sans
--  espace dédié) ; les restaurants restent, sans propriétaire.
--  La valeur d'enum 'restaurant' est conservée (non supprimable
--  proprement en PostgreSQL) mais n'est plus jamais attribuée.
-- ------------------------------------------------------------
update restaurants set owner_id = null
 where owner_id in (select id from profiles where role = 'restaurant');

update profiles set role = 'client' where role = 'restaurant';

-- Un nouvel inscrit sans rôle explicite est désormais un livreur.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone, role, full_name)
  values (
    new.id,
    new.phone,
    case
      when (new.raw_user_meta_data->>'role') in ('admin', 'client')
        then (new.raw_user_meta_data->>'role')::user_role
      else 'livreur'::user_role
    end,
    new.raw_user_meta_data->>'full_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
