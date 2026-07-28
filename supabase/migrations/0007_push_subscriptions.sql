-- ============================================================
--  LivraPro — 0007
--  Notifications push (Web Push / VAPID)
--
--  Le livreur peut enregistrer un ou plusieurs appareils
--  (navigateurs) pour être prévenu à la création d'une commande,
--  même application fermée. L'envoi se fait côté serveur avec la
--  clé privée VAPID ; on ne stocke ici que l'abonnement du navigateur
--  (endpoint + clés publiques du client).
-- ============================================================

create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  livreur_id  uuid not null references profiles(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_livreur
  on push_subscriptions (livreur_id);

alter table push_subscriptions enable row level security;

-- Le livreur ne voit et ne gère que ses propres abonnements.
-- L'enregistrement et l'envoi côté serveur passent par la clé
-- service_role, qui contourne le RLS de façon contrôlée.
drop policy if exists "push_self_read"   on push_subscriptions;
drop policy if exists "push_self_insert" on push_subscriptions;
drop policy if exists "push_self_delete" on push_subscriptions;
create policy "push_self_read"   on push_subscriptions for select using (livreur_id = auth.uid());
create policy "push_self_insert" on push_subscriptions for insert with check (livreur_id = auth.uid());
create policy "push_self_delete" on push_subscriptions for delete using (livreur_id = auth.uid());
