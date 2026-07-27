-- ============================================================
--  LivraPro — 0005
--  Commande écrite librement par le client
--
--  Beaucoup de restaurants n'ont que leur carte en photo : le
--  client lit les prix sur l'image et écrit ce qu'il veut.
--  Le livreur confirme ensuite le montant exact.
-- ============================================================

alter table commandes
  add column if not exists demande_libre text;

comment on column commandes.demande_libre is
  'Commande saisie en texte libre par le client (lecture du menu en photo). Le montant est confirmé par le livreur.';
