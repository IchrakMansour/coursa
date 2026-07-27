-- ============================================================
--  LivraPro — Données de démonstration (seed)
--  À exécuter APRÈS les migrations, en local (supabase db reset)
--  ou dans le SQL Editor de votre projet Supabase.
--
--  Crée : 1 admin, 1 livreur (Ahmed), 2 fiches restaurant avec
--         menus, des clients, et quelques commandes.
--  Les restaurants n'ont PAS de compte : ce sont des fiches
--  créées et gérées par le livreur.
-- ============================================================

-- UUID fixes pour la démo
-- admin      : 11111111-1111-1111-1111-111111111111
-- livreur    : 22222222-2222-2222-2222-222222222222

-- ------------------------------------------------------------
--  Utilisateurs auth (identités de démo — connexion OTP par téléphone)
-- ------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, phone, phone_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '+21620000001', now(), now(), now(), '{"provider":"phone","providers":["phone"]}', '{"role":"admin","full_name":"Administrateur"}'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '+21620000002', now(), now(), now(), '{"provider":"phone","providers":["phone"]}', '{"role":"livreur","full_name":"Ahmed Ben Ali"}')
on conflict (id) do nothing;

-- Les profils sont normalement créés par le trigger on_auth_user_created.
-- On force ici au cas où le trigger n'existerait pas encore lors du seed.
insert into profiles (id, role, full_name, phone, whatsapp, status) values
  ('11111111-1111-1111-1111-111111111111', 'admin', 'Administrateur', '+21620000001', '+21620000001', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'livreur', 'Ahmed Ben Ali', '+21620000002', '+21620000002', 'active')
on conflict (id) do update set role = excluded.role, full_name = excluded.full_name;

-- ------------------------------------------------------------
--  Livreur : Ahmed Delivery
-- ------------------------------------------------------------
insert into livreurs (id, slug, nom_commercial, description, ville, zone_livraison, horaire_ouverture, horaire_fermeture, type_vehicule, is_published)
values (
  '22222222-2222-2222-2222-222222222222',
  'ahmed-delivery',
  'Ahmed Delivery',
  'Livraison rapide Sousse centre. Restaurants, courses et pharmacie.',
  'Sousse',
  'Sousse centre, Khezama, Sahloul',
  '12:00', '23:00', 'moto', true
) on conflict (id) do nothing;

insert into services (livreur_id, nom, icone) values
  ('22222222-2222-2222-2222-222222222222', 'Courses', '🛒'),
  ('22222222-2222-2222-2222-222222222222', 'Pharmacie', '💊'),
  ('22222222-2222-2222-2222-222222222222', 'Colis', '📦')
on conflict do nothing;

insert into abonnements (livreur_id, plan, status, expires_at) values
  ('22222222-2222-2222-2222-222222222222', 'pro', 'active', now() + interval '25 days')
on conflict do nothing;

-- ------------------------------------------------------------
--  Restaurants (fiches sans compte, ajoutées par le livreur)
-- ------------------------------------------------------------
insert into restaurants (id, owner_id, nom, adresse, telephone, categorie, horaires, ville, status) values
  ('aaaaaaaa-0000-0000-0000-000000000001', null, 'Pizza House', 'Av. Habib Bourguiba, Sousse', '+21673000001', 'Pizza', '11:00 - 23:30', 'Sousse', 'active'),
  ('aaaaaaaa-0000-0000-0000-000000000002', null, 'Burger Time', 'Rue de la Corniche, Sousse', '+21673000002', 'Burger', '11:00 - 00:00', 'Sousse', 'active')
on conflict (id) do nothing;

-- Partenariats acceptés
insert into partenariats (livreur_id, restaurant_id, status, prix_livraison, initie_par) values
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-0000-0000-0000-000000000001', 'accepted', 3.0, 'livreur'),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-0000-0000-0000-000000000002', 'accepted', 2.5, 'livreur')
on conflict do nothing;

-- Menu Pizza House
insert into menu_categories (id, restaurant_id, nom, position) values
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Pizzas', 1),
  ('cccccccc-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'Boissons', 2)
on conflict (id) do nothing;

insert into produits (restaurant_id, categorie_id, nom, description, prix, disponible) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'Pizza Margherita', 'Sauce tomate, mozzarella, basilic', 14.0, true),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'Pizza 4 Fromages', 'Mozzarella, gorgonzola, chèvre, parmesan', 18.0, true),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'Pizza Pepperoni', 'Sauce tomate, mozzarella, pepperoni', 17.0, true),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000002', 'Coca-Cola 33cl', 'Canette fraîche', 3.0, true)
on conflict do nothing;

-- Menu Burger Time
insert into menu_categories (id, restaurant_id, nom, position) values
  ('cccccccc-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000002', 'Burgers', 1),
  ('cccccccc-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000002', 'Accompagnements', 2)
on conflict (id) do nothing;

insert into produits (restaurant_id, categorie_id, nom, description, prix, disponible) values
  ('aaaaaaaa-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000003', 'Cheeseburger', 'Steak, cheddar, salade, sauce maison', 15.0, true),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000003', 'Double Bacon', 'Double steak, bacon, cheddar', 19.0, true),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000004', 'Frites maison', 'Portion généreuse', 5.0, true)
on conflict do nothing;

-- ------------------------------------------------------------
--  Clients (CRM d'Ahmed)
-- ------------------------------------------------------------
insert into clients (id, livreur_id, nom, telephone, adresse) values
  ('dddddddd-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Mohamed Trabelsi', '+21698111222', 'Rue de Palestine, Sousse'),
  ('dddddddd-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Sarra Gharbi', '+21697333444', 'Khezama Ouest, Sousse')
on conflict (id) do nothing;

-- ------------------------------------------------------------
--  Commandes de démonstration
-- ------------------------------------------------------------
insert into commandes (id, reference, livreur_id, restaurant_id, client_id, client_nom, client_telephone, client_adresse, status, sous_total, frais_livraison, total, created_at) values
  ('eeeeeeee-0000-0000-0000-000000000001', 'CMD-A1B2C3', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001', 'Mohamed Trabelsi', '+21698111222', 'Rue de Palestine, Sousse', 'livree', 17.0, 3.0, 20.0, now() - interval '3 hours'),
  ('eeeeeeee-0000-0000-0000-000000000002', 'CMD-D4E5F6', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-0000-0000-0000-000000000002', 'dddddddd-0000-0000-0000-000000000002', 'Sarra Gharbi', '+21697333444', 'Khezama Ouest, Sousse', 'en_livraison', 20.0, 2.5, 22.5, now() - interval '30 minutes'),
  ('eeeeeeee-0000-0000-0000-000000000003', 'CMD-G7H8I9', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001', 'Mohamed Trabelsi', '+21698111222', 'Rue de Palestine, Sousse', 'nouvelle', 14.0, 3.0, 17.0, now() - interval '5 minutes')
on conflict (id) do nothing;

insert into commande_items (commande_id, nom_produit, prix_unitaire, quantite) values
  ('eeeeeeee-0000-0000-0000-000000000001', 'Pizza Pepperoni', 17.0, 1),
  ('eeeeeeee-0000-0000-0000-000000000002', 'Double Bacon', 19.0, 1),
  ('eeeeeeee-0000-0000-0000-000000000002', 'Frites maison', 5.0, 1),
  ('eeeeeeee-0000-0000-0000-000000000003', 'Pizza Margherita', 14.0, 1)
on conflict do nothing;

insert into paiements (livreur_id, montant, type, status, created_at) values
  ('22222222-2222-2222-2222-222222222222', 29.0, 'abonnement', 'paye', now() - interval '5 days');
