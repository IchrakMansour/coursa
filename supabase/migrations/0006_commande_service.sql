-- ============================================================
--  LivraPro — 0006
--  Commander un service, pas seulement un restaurant
--
--  Le livreur ne fait pas que de la restauration : pharmacie,
--  courses, colis… Le client choisit un service, décrit sa
--  demande en toutes lettres, et le livreur confirme le prix.
-- ============================================================

-- Frais de livraison indicatifs du service (0 = à convenir)
alter table services
  add column if not exists prix numeric(8,2) not null default 0;

-- Une commande vise soit un restaurant, soit un service.
alter table commandes
  add column if not exists service_id  uuid references services(id) on delete set null,
  add column if not exists service_nom text;

create index if not exists idx_commandes_service on commandes(service_id);

comment on column commandes.service_nom is
  'Nom du service au moment de la commande : reste lisible même si le livreur le supprime ensuite.';
