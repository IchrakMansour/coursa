-- ============================================================
--  LivraPro — 0004
--  Suivi de la position du livreur en temps réel
--
--  La position circule par Realtime Broadcast sur un canal nommé
--  d'après l'id de la commande (UUID impossible à deviner) : seul
--  le porteur du lien de suivi peut l'écouter, et rien n'est écrit
--  en base à chaque point GPS.
--
--  On conserve seulement la DERNIÈRE position connue sur la
--  commande, rafraîchie environ une fois par minute, pour que la
--  carte ne soit pas vide quand le client ouvre la page.
-- ============================================================

alter table commandes
  add column if not exists livreur_lat  double precision,
  add column if not exists livreur_lng  double precision,
  add column if not exists position_maj timestamptz;

-- La position n'a de sens que pendant une course : on l'efface dès
-- que la commande est livrée ou annulée.
create or replace function effacer_position_si_terminee()
returns trigger language plpgsql as $$
begin
  if new.status in ('livree', 'annulee') then
    new.livreur_lat  = null;
    new.livreur_lng  = null;
    new.position_maj = null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_commandes_position on commandes;
create trigger trg_commandes_position
  before update on commandes
  for each row execute function effacer_position_si_terminee();
