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
export function NotificationsPush() {
  const [supporte, setSupporte] = useState(false);
  const [actif, setActif] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    const ok =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window &&
      !!VAPID_PUBLIC;
    setSupporte(ok);
    if (!ok) return;

    // Reflète l'état réel : cet appareil est-il déjà abonné ?
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setActif(!!sub))
      .catch(() => {});
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

  if (!supporte) return null;

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
