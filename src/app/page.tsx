import Link from "next/link";
import { APP_NAME, PLANS } from "@/lib/constants";
import { formatPrix } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2 text-lg font-extrabold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
            🛵
          </span>
          <span>{APP_NAME}</span>
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/connexion" className="btn-ghost">
            Se connecter
          </Link>
          <Link href="/connexion?mode=inscription" className="btn-primary">
            Commencer
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-10 text-center sm:pt-20">
        <span className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          Pour les livreurs indépendants
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
          Devenez un{" "}
          <span className="text-brand-600">entrepreneur digital</span> de la
          livraison
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          Créez votre vitrine en ligne, connectez vos restaurants partenaires,
          gérez vos commandes et fidélisez vos clients — le tout depuis un seul
          lien à partager.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/connexion?mode=inscription" className="btn-primary px-6 py-3 text-base">
            Créer mon espace gratuitement
          </Link>
          <Link href="/ahmed-delivery" className="btn-secondary px-6 py-3 text-base">
            Voir une vitrine exemple →
          </Link>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Exemple : livrapro.app/<span className="font-semibold">votre-nom</span>
        </p>
      </section>

      {/* Fonctionnalités */}
      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: "🔗", t: "Page publique personnalisée", d: "Un lien unique de type Linktree pour partager vos services et prendre des commandes." },
            { icon: "🍕", t: "Restaurants partenaires", d: "Ajoutez vos restaurants et photographiez leur carte : les prix toujours sous les yeux." },
            { icon: "📦", t: "Gestion des commandes", d: "Suivez chaque commande, de « nouvelle » à « livrée », en temps réel." },
            { icon: "👥", t: "CRM clients", d: "Historique, adresses et fréquence de commande pour fidéliser votre clientèle." },
            { icon: "📊", t: "Statistiques", d: "Revenus, nombre de livraisons et performance au jour, à la semaine, au mois." },
            { icon: "💬", t: "Notifications WhatsApp", d: "Vos clients et vous êtes notifiés automatiquement à chaque étape." },
          ].map((f) => (
            <div key={f.t} className="card p-5">
              <span className="text-2xl">{f.icon}</span>
              <h3 className="mt-3 font-semibold text-slate-900">{f.t}</h3>
              <p className="mt-1 text-sm text-slate-500">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tarifs */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="text-center text-2xl font-bold text-slate-900">
          Des tarifs simples
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={`card p-6 ${p.id === "pro" ? "ring-2 ring-brand-500" : ""}`}
            >
              {p.id === "pro" && (
                <span className="mb-3 inline-flex rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                  Populaire
                </span>
              )}
              <h3 className="font-bold text-slate-900">{p.nom}</h3>
              <p className="mt-1 text-sm text-slate-500">{p.desc}</p>
              <p className="mt-4 text-3xl font-extrabold text-slate-900">
                {p.prix === 0 ? "Gratuit" : formatPrix(p.prix)}
                {p.prix > 0 && <span className="text-sm font-normal text-slate-400">/mois</span>}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {p.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2">
                    <span className="text-brand-600">✓</span> {feat}
                  </li>
                ))}
              </ul>
              <Link href="/connexion?mode=inscription" className="btn-primary mt-6 w-full">
                Choisir
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} {APP_NAME} — SaaS de gestion pour livreurs indépendants
      </footer>
    </div>
  );
}
