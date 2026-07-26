"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatPrix, initiales } from "@/lib/utils";
import type {
  Livreur,
  Service,
  Restaurant,
  Produit,
  MenuCategorie,
} from "@/types/database";

type RestoWithFrais = Restaurant & { prix_livraison: number };

export function Vitrine({
  livreur,
  whatsapp,
  services,
  restaurants,
  categories,
  produits,
}: {
  livreur: Livreur;
  whatsapp: string | null;
  services: Service[];
  restaurants: RestoWithFrais[];
  categories: MenuCategorie[];
  produits: Produit[];
}) {
  const router = useRouter();
  const [restoActif, setRestoActif] = useState<RestoWithFrais | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [checkout, setCheckout] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const produitsById = useMemo(
    () => Object.fromEntries(produits.map((p) => [p.id, p])),
    [produits]
  );

  const items = Object.entries(cart)
    .filter(([, q]) => q > 0)
    .map(([id, q]) => ({ produit: produitsById[id], quantite: q }))
    .filter((x) => x.produit);

  const sousTotal = items.reduce(
    (s, it) => s + Number(it.produit.prix) * it.quantite,
    0
  );
  const frais = restoActif?.prix_livraison ?? 0;
  const total = sousTotal + Number(frais);
  const nbArticles = items.reduce((s, it) => s + it.quantite, 0);

  const choisirResto = (r: RestoWithFrais) => {
    if (restoActif && restoActif.id !== r.id && nbArticles > 0) {
      if (!confirm("Changer de restaurant videra votre panier. Continuer ?")) return;
      setCart({});
    }
    setRestoActif(r);
  };

  const setQty = (id: string, delta: number) =>
    setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) + delta) }));

  async function passerCommande(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    setEnvoi(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      slug: livreur.slug,
      restaurant_id: restoActif?.id,
      client_nom: fd.get("nom"),
      client_telephone: fd.get("telephone"),
      client_adresse: fd.get("adresse"),
      commentaire: fd.get("commentaire"),
      items: items.map((it) => ({
        produit_id: it.produit.id,
        nom_produit: it.produit.nom,
        prix_unitaire: Number(it.produit.prix),
        quantite: it.quantite,
      })),
    };
    const res = await fetch("/api/commandes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setEnvoi(false);
    if (!res.ok) {
      setErreur(data.error || "Une erreur est survenue.");
      return;
    }
    router.push(`/suivi/${data.id}`);
  }

  const catsDuResto = categories.filter((c) => c.restaurant_id === restoActif?.id);
  const ouvert = livreur.is_published;

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* En-tête profil */}
      <div className="bg-gradient-to-b from-brand-600 to-brand-500 px-5 pb-8 pt-10 text-center text-white">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white/20 text-2xl font-bold backdrop-blur">
          {livreur.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={livreur.photo_url} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            initiales(livreur.nom_commercial)
          )}
        </div>
        <h1 className="mt-3 text-xl font-bold">{livreur.nom_commercial}</h1>
        {livreur.description && (
          <p className="mx-auto mt-1 max-w-sm text-sm text-white/90">
            {livreur.description}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
          {livreur.ville && (
            <span className="rounded-full bg-white/20 px-3 py-1">📍 {livreur.ville}</span>
          )}
          <span className="rounded-full bg-white/20 px-3 py-1">
            🕐 {livreur.horaire_ouverture} - {livreur.horaire_fermeture}
          </span>
          <span className={`rounded-full px-3 py-1 font-medium ${ouvert ? "bg-green-400/90 text-green-950" : "bg-red-400/90"}`}>
            {ouvert ? "● Disponible" : "● Indisponible"}
          </span>
        </div>
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-brand-700"
          >
            💬 Contacter sur WhatsApp
          </a>
        )}
      </div>

      <div className="mx-auto max-w-lg px-4">
        {/* Services */}
        {services.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-2 text-sm font-semibold text-slate-500">Services</h2>
            <div className="flex flex-wrap gap-2">
              {services.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm"
                >
                  <span>{s.icone}</span> {s.nom}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Restaurants */}
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-slate-500">
            {restoActif ? "Restaurant sélectionné" : "Choisissez un restaurant"}
          </h2>
          {restaurants.length === 0 ? (
            <div className="card p-6 text-center text-sm text-slate-500">
              Aucun restaurant partenaire pour le moment.
            </div>
          ) : (
            <div className="space-y-2">
              {restaurants.map((r) => (
                <button
                  key={r.id}
                  onClick={() => choisirResto(r)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                    restoActif?.id === r.id
                      ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-xl">
                    🍽️
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{r.nom}</p>
                    <p className="truncate text-xs text-slate-500">
                      {r.categorie ?? "Restaurant"} · Livraison {formatPrix(r.prix_livraison)}
                    </p>
                  </div>
                  {restoActif?.id === r.id && <span className="text-brand-600">✓</span>}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Menu du restaurant sélectionné */}
        {restoActif && (
          <section className="mt-6">
            <h2 className="mb-2 text-sm font-semibold text-slate-500">
              Menu — {restoActif.nom}
            </h2>
            {catsDuResto.length === 0 ? (
              <div className="card p-6 text-center text-sm text-slate-500">
                Ce restaurant n'a pas encore de menu en ligne.
              </div>
            ) : (
              <div className="space-y-5">
                {catsDuResto.map((cat) => {
                  const prods = produits.filter((p) => p.categorie_id === cat.id);
                  if (prods.length === 0) return null;
                  return (
                    <div key={cat.id}>
                      <h3 className="mb-2 font-bold text-slate-800">{cat.nom}</h3>
                      <div className="space-y-2">
                        {prods.map((p) => (
                          <div
                            key={p.id}
                            className="card flex items-center justify-between gap-3 p-3"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900">{p.nom}</p>
                              {p.description && (
                                <p className="truncate text-xs text-slate-400">
                                  {p.description}
                                </p>
                              )}
                              <p className="mt-0.5 text-sm font-semibold text-brand-700">
                                {formatPrix(p.prix)}
                              </p>
                            </div>
                            {cart[p.id] > 0 ? (
                              <div className="flex shrink-0 items-center gap-2">
                                <button
                                  onClick={() => setQty(p.id, -1)}
                                  className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 font-bold"
                                >
                                  −
                                </button>
                                <span className="w-5 text-center font-semibold">
                                  {cart[p.id]}
                                </span>
                                <button
                                  onClick={() => setQty(p.id, 1)}
                                  className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 font-bold text-white"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setQty(p.id, 1)}
                                className="btn-secondary shrink-0 px-3 py-1.5"
                              >
                                + Ajouter
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Barre panier flottante */}
      {nbArticles > 0 && !checkout && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white p-4">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">{nbArticles} article{nbArticles > 1 ? "s" : ""}</p>
              <p className="font-bold">{formatPrix(total)}</p>
            </div>
            <button onClick={() => setCheckout(true)} className="btn-primary flex-1 py-3">
              Commander →
            </button>
          </div>
        </div>
      )}

      {/* Modale de commande */}
      {checkout && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-lg rounded-t-3xl bg-white p-5 sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Finaliser la commande</h2>
              <button onClick={() => setCheckout(false)} className="text-slate-400">✕</button>
            </div>

            {/* Récap */}
            <div className="mb-4 rounded-xl bg-slate-50 p-3 text-sm">
              {items.map((it) => (
                <div key={it.produit.id} className="flex justify-between py-0.5">
                  <span>{it.quantite}× {it.produit.nom}</span>
                  <span>{formatPrix(Number(it.produit.prix) * it.quantite)}</span>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-slate-500">
                <span>Frais de livraison</span>
                <span>{formatPrix(frais)}</span>
              </div>
              <div className="mt-1 flex justify-between font-bold text-slate-900">
                <span>Total</span>
                <span>{formatPrix(total)}</span>
              </div>
            </div>

            {erreur && (
              <div className="mb-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {erreur}
              </div>
            )}

            <form onSubmit={passerCommande} className="space-y-3">
              <input name="nom" className="input" placeholder="Votre nom" required />
              <input
                name="telephone"
                type="tel"
                className="input"
                placeholder="Téléphone (ex : +216 …)"
                required
              />
              <input name="adresse" className="input" placeholder="Adresse de livraison" required />
              <textarea
                name="commentaire"
                className="input min-h-[70px]"
                placeholder="Commentaire (optionnel)"
              />
              <button disabled={envoi} className="btn-primary w-full py-3">
                {envoi ? "Envoi…" : `Confirmer · ${formatPrix(total)}`}
              </button>
            </form>
          </div>
        </div>
      )}

      <footer className="mt-10 pb-4 text-center text-xs text-slate-400">
        Propulsé par LivraPro
      </footer>
    </div>
  );
}
