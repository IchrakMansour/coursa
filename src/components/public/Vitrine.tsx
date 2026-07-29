"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatPrix,
  initiales,
  normaliserTelTunisien,
  telWhatsApp,
} from "@/lib/utils";
import { ChampTelephone } from "@/components/ChampTelephone";
import type {
  Livreur,
  Service,
  Restaurant,
  Produit,
  MenuCategorie,
  MenuPhoto,
} from "@/types/database";

type RestoWithFrais = Restaurant & { prix_livraison: number };

// La restauration a son propre parcours (liste des partenaires → menu).
// Un service nommé « Restaurant » ferait doublon dans la grille de choix et
// mènerait à une simple zone de texte : on ne l'affiche pas.
const SERVICE_RESTAURATION = /restaur/i;

export function Vitrine({
  livreur,
  whatsapp,
  services,
  restaurants,
  categories,
  produits,
  photos,
}: {
  livreur: Livreur;
  whatsapp: string | null;
  services: Service[];
  restaurants: RestoWithFrais[];
  categories: MenuCategorie[];
  produits: Produit[];
  photos: MenuPhoto[];
}) {
  const router = useRouter();
  const [restoActif, setRestoActif] = useState<RestoWithFrais | null>(null);
  // Le client commande soit dans un restaurant, soit un service (courses,
  // pharmacie, colis…) : les deux sont exclusifs.
  const [serviceActif, setServiceActif] = useState<Service | null>(null);
  const [modeRestauration, setModeRestauration] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [demandeLibre, setDemandeLibre] = useState("");
  const [telephone, setTelephone] = useState("");
  const [photoZoom, setPhotoZoom] = useState<MenuPhoto | null>(null);
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
  const frais = serviceActif
    ? Number(serviceActif.prix ?? 0)
    : Number(restoActif?.prix_livraison ?? 0);
  const total = sousTotal + frais;
  const nbArticles = items.reduce((s, it) => s + it.quantite, 0);
  const texteLibre = demandeLibre.trim();
  // Restaurant : produits cliqués et/ou texte. Service : texte uniquement.
  const commandePrete = serviceActif
    ? texteLibre.length > 0
    : nbArticles > 0 || texteLibre.length > 0;
  // Dès qu'il y a du texte libre, le livreur confirmera le montant exact.
  const totalIndicatif = texteLibre.length > 0;

  // Changer de cible vide la commande en cours.
  const reinitialiser = (question: string) => {
    if (commandePrete && !confirm(question)) return false;
    setCart({});
    setDemandeLibre("");
    return true;
  };

  // Le menu s'affiche plus bas : on y amène le client après son choix.
  const menuRef = useRef<HTMLElement>(null);
  const versLeMenu = () =>
    setTimeout(
      () => menuRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      50
    );

  const choisirResto = (r: RestoWithFrais) => {
    if (restoActif?.id === r.id) {
      versLeMenu();
      return;
    }
    if (!reinitialiser("Changer de restaurant videra votre commande. Continuer ?"))
      return;
    setRestoActif(r);
    versLeMenu();
  };

  // Entrer dans le parcours restauration : la liste des restaurants
  // partenaires s'ouvre, puis le menu de celui qui est choisi. Avec un seul
  // partenaire, on saute l'étape et on ouvre son menu directement.
  const choisirRestauration = () => {
    if (modeRestauration) return;
    if (!reinitialiser("Changer de service videra votre commande. Continuer ?"))
      return;
    setServiceActif(null);
    setModeRestauration(true);
    setRestoActif(restaurants.length === 1 ? restaurants[0] : null);
    if (restaurants.length === 1) versLeMenu();
  };

  const choisirService = (s: Service) => {
    if (serviceActif?.id === s.id) return;
    if (!reinitialiser("Changer de service videra votre commande. Continuer ?"))
      return;
    setModeRestauration(false);
    setRestoActif(null);
    setServiceActif(s);
  };

  const setQty = (id: string, delta: number) =>
    setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) + delta) }));

  async function passerCommande(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);

    const tel = normaliserTelTunisien(telephone);
    if (!tel) {
      setErreur(
        "Numéro de téléphone invalide : 8 chiffres commençant par 2, 3, 4, 5, 7 ou 9."
      );
      return;
    }

    setEnvoi(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      slug: livreur.slug,
      restaurant_id: restoActif?.id ?? null,
      service_id: serviceActif?.id ?? null,
      client_nom: fd.get("nom"),
      client_telephone: tel,
      client_adresse: fd.get("adresse"),
      commentaire: fd.get("commentaire"),
      demande_libre: texteLibre || null,
      items: items.map((it) => ({
        produit_id: it.produit.id,
        nom_produit: it.produit.nom,
        prix_unitaire: Number(it.produit.prix),
        quantite: it.quantite,
      })),
    };

    // Filet de sécurité réseau : sans délai maximum, une requête qui n'aboutit
    // pas (connexion instable d'un téléphone) laisserait le bouton figé sur
    // « Envoi… » indéfiniment. On borne l'attente et on réactive toujours le
    // bouton dans le `finally`.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    try {
      const res = await fetch("/api/commandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.error || "Une erreur est survenue.");
        return;
      }
      router.push(`/suivi/${data.id}`);
    } catch {
      setErreur(
        "L'envoi a échoué (connexion trop lente ou interrompue). Vérifiez votre réseau et réessayez."
      );
    } finally {
      clearTimeout(timer);
      setEnvoi(false);
    }
  }

  // Services proposés en plus de la restauration
  const autresServices =
    restaurants.length > 0
      ? services.filter((s) => !SERVICE_RESTAURATION.test(s.nom))
      : services;

  const photosDuResto = photos.filter((p) => p.restaurant_id === restoActif?.id);
  const produitsDuResto = produits.filter((p) => p.restaurant_id === restoActif?.id);

  // Le menu est groupé par catégorie, et les produits sans catégorie forment
  // un dernier groupe : sinon ils resteraient invisibles pour le client.
  const groupesMenu: { titre: string | null; produits: Produit[] }[] = [
    ...categories
      .filter((c) => c.restaurant_id === restoActif?.id)
      .map((c) => ({
        titre: c.nom,
        produits: produitsDuResto.filter((p) => p.categorie_id === c.id),
      })),
    {
      titre: null,
      produits: produitsDuResto.filter(
        (p) =>
          !p.categorie_id ||
          !categories.some((c) => c.id === p.categorie_id)
      ),
    },
  ].filter((g) => g.produits.length > 0);
  const ouvert = livreur.is_published;

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* En-tête profil */}
      <div className="bg-gradient-to-br from-brand-800 to-brand-900 px-5 pb-8 pt-10 text-center text-white">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white/15 text-2xl font-bold ring-2 ring-gold-400/80 backdrop-blur">
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
            href={`https://wa.me/${telWhatsApp(whatsapp) ?? whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-brand-700"
          >
            💬 Contacter sur WhatsApp
          </a>
        )}
      </div>

      <div className="mx-auto max-w-lg px-4">
        {/* Point d'entrée unique : restauration ou autre service */}
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-slate-500">
            Que souhaitez-vous ?
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {restaurants.length > 0 && (
              <button
                onClick={choisirRestauration}
                className={`rounded-2xl border p-3 text-left transition ${
                  modeRestauration
                    ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <span className="text-xl">🍽️</span>
                <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                  Restaurants
                </p>
                <p className="truncate text-xs text-slate-500">
                  {restaurants.length} partenaire{restaurants.length > 1 ? "s" : ""}
                </p>
              </button>
            )}
            {autresServices.map((s) => (
              <button
                key={s.id}
                onClick={() => choisirService(s)}
                className={`rounded-2xl border p-3 text-left transition ${
                  serviceActif?.id === s.id
                    ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <span className="text-xl">{s.icone}</span>
                <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                  {s.nom}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {Number(s.prix) > 0
                    ? `Livraison ${formatPrix(s.prix)}`
                    : "Prix à convenir"}
                </p>
              </button>
            ))}
          </div>
          {!modeRestauration && !serviceActif && (
            <p className="mt-3 text-center text-sm text-slate-400">
              Choisissez ci-dessus pour commencer votre commande.
            </p>
          )}
        </section>

        {/* Demande de service : pas de catalogue, le client décrit son besoin */}
        {serviceActif && (
          <section className="mt-6">
            <div className="card p-5">
              <h2 className="font-bold text-slate-900">
                {serviceActif.icone} {serviceActif.nom}
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Décrivez ce dont vous avez besoin, le livreur s&apos;en occupe et
                vous confirme le montant.
              </p>
              <label className="label mt-4" htmlFor="demande-service">
                Votre demande *
              </label>
              <textarea
                id="demande-service"
                value={demandeLibre}
                onChange={(e) => setDemandeLibre(e.target.value)}
                className="input min-h-[120px]"
                placeholder={
                  serviceActif.nom.toLowerCase().includes("colis")
                    ? "Ex : Récupérer un colis chez Ahmed, 12 rue de Palestine, et le livrer à mon adresse"
                    : serviceActif.nom.toLowerCase().includes("pharma")
                      ? "Ex : Doliprane 1000, sirop pour la toux — ordonnance en photo au livreur"
                      : "Ex : 2 kg de tomates, 1 pain, 6 œufs — au marché central"
                }
                maxLength={1000}
              />
              <p className="mt-1 text-xs text-slate-400">
                Soyez précis : adresse de récupération, quantités, marques…
              </p>
            </div>
          </section>
        )}

        {/* Restaurants partenaires — visibles une fois « Restaurants » choisi */}
        <section className={`mt-6 ${modeRestauration ? "" : "hidden"}`}>
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
                  <span className="shrink-0 text-sm font-medium text-brand-600">
                    {restoActif?.id === r.id ? "Voir le menu ↓" : "→"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Menu du restaurant sélectionné */}
        {restoActif && (
          <section ref={menuRef} className="mt-6 scroll-mt-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-500">
              Menu — {restoActif.nom}
            </h2>

            {/* La carte en photo : le client y lit les prix */}
            {photosDuResto.length > 0 && (
              <div className="card mb-4 p-4">
                <p className="mb-2 text-sm font-semibold text-slate-800">
                  📸 La carte du restaurant
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {photosDuResto.map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setPhotoZoom(photo)}
                      className="block"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.legende ?? "Carte du restaurant"}
                        className="h-24 w-full rounded-xl border border-slate-200 object-cover"
                      />
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Touchez une photo pour l&apos;agrandir et lire les prix.
                </p>
              </div>
            )}

            {photosDuResto.length === 0 && produitsDuResto.length === 0 ? (
              <div className="card p-6 text-center text-sm text-slate-500">
                Ce restaurant n&apos;a pas encore de menu en ligne. Écrivez
                directement ce que vous souhaitez ci-dessous.
              </div>
            ) : (
              <div className="space-y-5">
                {groupesMenu.map((groupe) => {
                  const prods = groupe.produits;
                  return (
                    <div key={groupe.titre ?? "sans-categorie"}>
                      {groupe.titre && (
                        <h3 className="mb-2 font-bold text-slate-800">
                          {groupe.titre}
                        </h3>
                      )}
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

            {/* Commande écrite librement, d'après la carte en photo */}
            <div className="card mt-4 p-4">
              <label className="label" htmlFor="demande-libre">
                ✍️ Écrivez votre commande
              </label>
              <textarea
                id="demande-libre"
                value={demandeLibre}
                onChange={(e) => setDemandeLibre(e.target.value)}
                className="input min-h-[90px]"
                placeholder={"Ex : 2 pizzas margherita, 1 coca 1L, sans oignons"}
                maxLength={1000}
              />
              <p className="mt-1 text-xs text-slate-400">
                Indiquez ce que vous voulez tel que vous le lisez sur la carte.
                Le livreur vous confirmera le montant exact.
              </p>
            </div>
          </section>
        )}
      </div>

      {/* Photo de la carte en plein écran */}
      {photoZoom && (
        <div
          onClick={() => setPhotoZoom(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
        >
          <div className="max-h-full max-w-3xl overflow-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoZoom.url}
              alt={photoZoom.legende ?? "Carte du restaurant"}
              className="w-full rounded-xl"
            />
          </div>
          <button
            onClick={() => setPhotoZoom(null)}
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white text-lg"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Barre panier flottante */}
      {commandePrete && !checkout && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white p-4">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">
                {nbArticles > 0
                  ? `${nbArticles} article${nbArticles > 1 ? "s" : ""}`
                  : "Commande écrite"}
                {nbArticles > 0 && texteLibre ? " + note" : ""}
              </p>
              <p className="font-bold">
                {totalIndicatif ? `dès ${formatPrix(total)}` : formatPrix(total)}
              </p>
            </div>
            <button onClick={() => setCheckout(true)} className="btn-accent flex-1 py-3">
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
              <p className="mb-1 font-semibold text-slate-800">
                {serviceActif
                  ? `${serviceActif.icone} ${serviceActif.nom}`
                  : `🍽️ ${restoActif?.nom ?? ""}`}
              </p>
              {items.map((it) => (
                <div key={it.produit.id} className="flex justify-between py-0.5">
                  <span>{it.quantite}× {it.produit.nom}</span>
                  <span>{formatPrix(Number(it.produit.prix) * it.quantite)}</span>
                </div>
              ))}
              {texteLibre && (
                <div className="whitespace-pre-line rounded-lg bg-white px-3 py-2 text-slate-700">
                  <span className="text-slate-400">Votre demande : </span>
                  {texteLibre}
                </div>
              )}
              <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-slate-500">
                <span>Frais de livraison</span>
                <span>{formatPrix(frais)}</span>
              </div>
              <div className="mt-1 flex justify-between font-bold text-slate-900">
                <span>{totalIndicatif ? "Total (hors demande écrite)" : "Total"}</span>
                <span>{formatPrix(total)}</span>
              </div>
              {totalIndicatif && (
                <p className="mt-2 text-xs text-slate-500">
                  Le montant de votre demande écrite sera confirmé par le livreur
                  avant la livraison.
                </p>
              )}
            </div>

            {erreur && (
              <div className="mb-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {erreur}
              </div>
            )}

            <form onSubmit={passerCommande} className="space-y-3">
              <input name="nom" className="input" placeholder="Votre nom" required />
              <ChampTelephone
                label={null}
                value={telephone}
                onChange={setTelephone}
                required
              />
              <input name="adresse" className="input" placeholder="Adresse de livraison" required />
              <textarea
                name="commentaire"
                className="input min-h-[70px]"
                placeholder="Commentaire (optionnel)"
              />
              <button disabled={envoi} className="btn-accent w-full py-3">
                {envoi
                  ? "Envoi…"
                  : totalIndicatif
                    ? "Envoyer ma commande"
                    : `Confirmer · ${formatPrix(total)}`}
              </button>
            </form>
          </div>
        </div>
      )}

      <footer className="mt-10 pb-4 text-center text-xs text-slate-400">
        Propulsé par Coursa
      </footer>
    </div>
  );
}
