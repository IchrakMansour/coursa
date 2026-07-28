"use client";

import { useCallback, useEffect, useState } from "react";
import {
  enregistrerPush,
  supprimerPush,
} from "@/app/livreur/(dashboard)/commandes/actions";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// La clé publique VAPID est en base64url : PushManager attend un Uint8Array.
function base64urlToUint8Array(base64url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const brut = atob(base64);
  const arr = new Uint8Array(brut.length);
  for (let i = 0; i < brut.length; i++) arr[i] = brut.charCodeAt(i);
  return arr;
}

// Permet au livreur de recevoir une notification à chaque nouvelle commande,
// même l'application fermée. S'affiche seulement si l'appareil sait le faire.
// - "cache"        : appareil incapable de push → on n'affiche rien.
// - "ios-installer": iPhone/iPad dans Safari → le push n'est possible qu'une
//                    fois l'app ajoutée à l'écran d'accueil ; on l'explique.
// - "non-configure": l'appareil sait recevoir des push mais la clé VAPID
//                    publique manque dans le déploiement → message clair.
// - "pret"         : le push est disponible → bouton Activer/Désactiver.
type EtatPush = "cache" | "ios-installer" | "non-configure" | "pret";

export function NotificationsPush() {
  const [etat, setEtat] = useState<EtatPush>("cache");
  const [actif, setActif] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    const pushOk =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    if (pushOk) {
      // L'appareil sait recevoir des push : reste à savoir si le serveur est
      // configuré (clé VAPID publique présente au build).
      if (!VAPID_PUBLIC) {
        setEtat("non-configure");
        return;
      }
      setEtat("pret");
      // Reflète l'état réel : cet appareil est-il déjà abonné ?
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => setActif(!!sub))
        .catch(() => {});
      return;
    }

    // Sur iPhone/iPad, PushManager n'existe que dans l'app installée à
    // l'écran d'accueil : on guide l'utilisateur au lieu de nous cacher.
    const iOS =
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      // iPad récent se présente comme un Mac tactile
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const installee =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;
    if (iOS && !installee) setEtat("ios-installer");
  }, []);

  const activer = useCallback(async () => {
    setErreur(null);
    setOccupe(true);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setErreur(
          "Notifications refusées. Autorisez-les pour cette page dans les réglages de votre navigateur."
        );
        return;
      }

      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64urlToUint8Array(VAPID_PUBLIC!) as BufferSource,
        }));

      const json = sub.toJSON();
      if (!json.keys?.p256dh || !json.keys?.auth) {
        setErreur("Abonnement invalide, réessayez.");
        return;
      }
      await enregistrerPush({
        endpoint: sub.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      });
      setActif(true);
    } catch {
      setErreur(
        "Impossible d'activer les notifications sur cet appareil. Sur iPhone, ajoutez d'abord l'application à l'écran d'accueil."
      );
    } finally {
      setOccupe(false);
    }
  }, []);

  const desactiver = useCallback(async () => {
    setErreur(null);
    setOccupe(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supprimerPush(sub.endpoint);
        await sub.unsubscribe();
      }
      setActif(false);
    } catch {
      // Sans conséquence : on laisse le livreur réessayer.
    } finally {
      setOccupe(false);
    }
  }, []);

  if (etat === "cache") return null;

  // Appareil compatible mais clé VAPID absente du déploiement.
  if (etat === "non-configure") {
    return (
      <div className="card mb-6 p-5">
        <h2 className="font-bold text-slate-900">🔔 Notifications de commande</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Les notifications ne sont pas encore activées sur le serveur.
          Réessayez après la prochaine mise à jour.
        </p>
      </div>
    );
  }

  // iPhone/iPad dans Safari : on explique comment débloquer les notifications.
  if (etat === "ios-installer") {
    return (
      <div className="card mb-6 p-5">
        <h2 className="font-bold text-slate-900">🔔 Notifications de commande</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Sur iPhone, les notifications ne sont possibles qu&apos;en ajoutant
          l&apos;application à l&apos;écran d&apos;accueil :
        </p>
        <ol className="mt-3 space-y-1 text-sm text-slate-600">
          <li>
            1. Touchez <span className="font-semibold">Partager</span>{" "}
            (l&apos;icône <span className="font-semibold">⬆️</span> en bas de
            Safari).
          </li>
          <li>
            2. Choisissez{" "}
            <span className="font-semibold">
              « Sur l&apos;écran d&apos;accueil »
            </span>
            .
          </li>
          <li>
            3. Ouvrez LivraPro depuis la nouvelle icône, puis revenez ici : le
            bouton <span className="font-semibold">« Activer »</span>{" "}
            apparaîtra.
          </li>
        </ol>
      </div>
    );
  }

  return (
    <div className="card mb-6 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-900">
            🔔 Notifications de commande{" "}
            {actif && <span className="text-brand-600">— activées</span>}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {actif
              ? "Vous serez prévenu sur cet appareil à chaque nouvelle commande."
              : "Recevez une alerte à chaque nouvelle commande, même l'application fermée."}
          </p>
        </div>
        <button
          onClick={() => (actif ? desactiver() : activer())}
          disabled={occupe}
          className={actif ? "btn-secondary" : "btn-primary"}
        >
          {occupe ? "…" : actif ? "Désactiver" : "Activer"}
        </button>
      </div>

      {erreur && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {erreur}
        </p>
      )}
    </div>
  );
}
