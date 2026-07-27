# 🛵 LivraPro — SaaS de gestion pour livreurs indépendants

Plateforme SaaS qui permet aux livreurs indépendants de digitaliser leur activité :
vitrine publique de type Linktree, restaurants partenaires, gestion des commandes,
CRM clients, statistiques et notifications WhatsApp.

Chaque livreur dispose d'un lien unique à partager avec ses clients :
`https://votre-domaine.app/nom-du-livreur`

---

## 🧱 Stack technique

| Couche | Technologie |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript |
| Style | Tailwind CSS (mobile-first) |
| Backend / BDD | Supabase (PostgreSQL, Auth, Realtime, Storage) |
| Auth | OTP par téléphone (SMS) |
| Notifications | WhatsApp Cloud API (Meta) |
| Hébergement recommandé | Vercel (frontend) + Supabase (backend) |

---

## 👥 Les espaces

L'inscription est **réservée aux livreurs** : eux seuls ont un compte.
Les restaurants sont des *fiches* créées et gérées par le livreur
(coordonnées, photos de la carte, produits) — ils ne se connectent pas.

1. **Livreur** — dashboard, profil, page publique, restaurants (fiches +
   photos du menu), commandes, CRM, abonnement, QR code
2. **Client** — accès sans compte via le lien du livreur, commande et suivi en temps réel
3. **Admin** — utilisateurs, commandes globales, finances, statistiques

---

## 🚀 Installation

### 1. Prérequis
- Node.js 18+
- Un compte [Supabase](https://supabase.com) (gratuit)

### 2. Installer les dépendances
```bash
npm install
```

### 3. Créer le projet Supabase
1. Créez un nouveau projet sur https://supabase.com
2. Dans **SQL Editor**, exécutez dans l'ordre :
   - `supabase/migrations/0001_init.sql` (tables, types, triggers)
   - `supabase/migrations/0002_rls.sql` (sécurité RLS)
   - `supabase/seed.sql` (données de démonstration — optionnel)

> 💡 Ou, avec la [CLI Supabase](https://supabase.com/docs/guides/cli) :
> `supabase db reset` applique automatiquement les migrations + le seed.

### 4. Variables d'environnement
Copiez `.env.example` en `.env.local` et remplissez :

```bash
cp .env.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` :
  Supabase → **Project Settings → API**
- `SUPABASE_SERVICE_ROLE_KEY` : même page (⚠️ secret, jamais côté client)
- `NEXT_PUBLIC_APP_URL` : l'URL publique (ex. `http://localhost:3000` en dev)

### 5. Activer l'authentification par SMS
Dans Supabase → **Authentication → Providers → Phone**, activez le provider
et connectez un fournisseur SMS (Twilio, MessageBird, Vonage…).
Sans cela, l'envoi du code OTP ne fonctionnera pas.

> En développement, vous pouvez aussi créer des utilisateurs de test
> directement (le `seed.sql` en fournit — voir plus bas).

### 6. Lancer le projet
```bash
npm run dev
```
Ouvrez http://localhost:3000

---

## 💬 Notifications WhatsApp

Le helper `src/lib/whatsapp.ts` utilise l'[API WhatsApp Cloud](https://developers.facebook.com/docs/whatsapp/cloud-api).

- Tant que `WHATSAPP_ENABLED` n'est pas `true`, les messages sont **affichés dans
  la console** au lieu d'être envoyés (mode simulation, pratique en dev).
- Pour activer l'envoi réel, renseignez `WHATSAPP_PHONE_NUMBER_ID`,
  `WHATSAPP_ACCESS_TOKEN` et passez `WHATSAPP_ENABLED=true`.

Messages automatiques : collaboration acceptée, nouvelle commande (livreur),
confirmation + lien de suivi (client).

---

## 🧪 Comptes de démonstration (seed)

Le fichier `seed.sql` crée ces identités (connexion par téléphone + OTP) :

| Rôle | Téléphone | Détails |
|---|---|---|
| Livreur | `+21620000002` | Ahmed Delivery — vitrine `/ahmed-delivery` |
| Admin | `+21620000001` | Administrateur |

Vitrine publique de démo : **http://localhost:3000/ahmed-delivery**

---

## 📁 Structure du projet

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── connexion/            # Connexion / inscription (OTP)
│   ├── [slug]/               # Page publique du livreur (vitrine)
│   ├── suivi/[id]/           # Suivi de commande client (temps réel)
│   ├── api/commandes/        # Création de commande (client non authentifié)
│   ├── livreur/              # Espace livreur (restaurants, commandes, CRM…)
│   └── admin/                # Espace administration
├── components/               # UI réutilisable + composants par espace
├── lib/
│   ├── supabase/             # Clients (browser, server, admin, middleware)
│   ├── auth.ts               # Helpers de session / rôles
│   ├── menu-photos.ts        # Téléversement des photos de carte (navigateur)
│   ├── whatsapp.ts           # Notifications WhatsApp
│   ├── constants.ts          # Statuts, plans, libellés
│   └── utils.ts              # Formatage prix/dates, slug…
├── types/database.ts         # Types TypeScript du schéma
└── middleware.ts             # Rafraîchissement de session + protection des routes
supabase/
├── migrations/               # Schéma SQL + RLS
└── seed.sql                  # Données de démo
```

---

## ✅ Fonctionnalités du MVP

**Livreur** : création de compte, vitrine publique, ajout de restaurants avec
**photos du menu** (pour avoir les prix sous les yeux), saisie des produits,
gestion des commandes (statuts), statistiques, CRM, QR code, abonnement.
**Client** : accès via lien, consultation du menu, commande, suivi en temps réel.
**Admin** : gestion des utilisateurs, commandes globales, finances, statistiques.

## 🔭 Évolutions prévues
Tracking GPS temps réel · paiement en ligne · app mobile client ·
marketplace publique · système de notation · programme de fidélité ·
optimisation des tournées · IA.

---

## ☁️ Déploiement (Vercel)
1. Poussez le code sur GitHub.
2. Importez le repo sur [Vercel](https://vercel.com).
3. Ajoutez les variables d'environnement (mêmes que `.env.local`).
4. Déployez. Pensez à mettre `NEXT_PUBLIC_APP_URL` sur votre domaine de production.

---

Développé comme MVP à partir du cahier des charges « Plateforme SaaS de gestion
pour livreurs indépendants ».
