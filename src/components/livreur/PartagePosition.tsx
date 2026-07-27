"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { distanceM } from "@/lib/utils";
import {
  canalSuivi,
  POSITION_DISTANCE_M,
  POSITION_INTERVALLE_MS,
  POSITION_PERSIST_MS,
} from "@/lib/constants";
import {
  enregistrerPosition,
  effacerPosition,
} from "@/app/livreur/(dashboard)/commandes/actions";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface CommandeEnCours {
  id: string;
  reference: string;
}

// On mémorise que le livreur a activé le partage, pour le reprendre après une
// actualisation de la page au lieu de lui redemander d'activer à chaque fois.
const CLE_PARTAGE = "livrapro:partage-position";

function memoriserIntention(actif: boolean) {
  try {
    if (actif) localStorage.setItem(CLE_PARTAGE, "1");
    else localStorage.removeItem(CLE_PARTAGE);
  } catch {
    // Stockage indisponible (navigation privée) : on continue sans mémoire.
  }
}

function intentionMemorisee(): boolean {
  try {
    return localStorage.getItem(CLE_PARTAGE) === "1";
  } catch {
    return false;
  }
}

// Partage de la position du livreur pendant ses courses.
// Chaque point part en Realtime Broadcast sur le canal de la commande
// (personne d'autre que le porteur du lien de suivi ne peut l'écouter),
// et la dernière position est sauvegardée en base une fois par minute.
export function PartagePosition({
  commandes,
}: {
  commandes: CommandeEnCours[];
}) {
  const [actif, setActif] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [derniereMaj, setDerniereMaj] = useState<Date | null>(null);

  const watchRef = useRef<number | null>(null);
  const canauxRef = useRef<RealtimeChannel[]>([]);
  const dernierPointRef = useRef<{ lat: number; lng: number; t: number } | null>(
    null
  );
  const dernierePersistRef = useRef(0);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);

  // Les ids changent quand une commande est livrée : on les garde dans une ref
  // pour ne pas relancer le suivi à chaque re-render.
  const idsRef = useRef<string[]>([]);
  idsRef.current = commandes.map((c) => c.id);

  const arreter = useCallback(async () => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    const supabase = createClient();
    canauxRef.current.forEach((ch) => supabase.removeChannel(ch));
    canauxRef.current = [];
    dernierPointRef.current = null;
    dernierePersistRef.current = 0;

    await wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;

    memoriserIntention(false);
    setActif(false);
    setDerniereMaj(null);
  }, []);

  const demarrer = useCallback(async () => {
    setErreur(null);

    if (!("geolocation" in navigator)) {
      setErreur("Votre navigateur ne gère pas la géolocalisation.");
      return;
    }
    if (!window.isSecureContext) {
      setErreur(
        "La géolocalisation exige une connexion sécurisée (https). Ouvrez l'application depuis son adresse https."
      );
      return;
    }

    const supabase = createClient();
    canauxRef.current = idsRef.current.map((id) => {
      const ch = supabase.channel(canalSuivi(id), {
        config: { broadcast: { self: false } },
      });
      ch.subscribe();
      return ch;
    });

    // Garde l'écran allumé : un navigateur en veille cesse d'émettre.
    try {
      const wl = (
        navigator as Navigator & {
          wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> };
        }
      ).wakeLock;
      if (wl) wakeLockRef.current = await wl.request("screen");
    } catch {
      // Sans Wake Lock on continue : le livreur devra garder l'écran actif.
    }

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy, heading } = pos.coords;
        const maintenant = Date.now();
        const precedent = dernierPointRef.current;

        // On n'émet que si le livreur a bougé, ou après le délai maximal.
        if (precedent) {
          const dt = maintenant - precedent.t;
          const dm = distanceM(precedent.lat, precedent.lng, lat, lng);
          if (dt < POSITION_INTERVALLE_MS && dm < POSITION_DISTANCE_M) return;
        }
        dernierPointRef.current = { lat, lng, t: maintenant };

        const payload = {
          lat,
          lng,
          precision: accuracy ?? null,
          cap: heading ?? null,
          horodatage: maintenant,
        };
        canauxRef.current.forEach((ch) =>
          ch.send({ type: "broadcast", event: "position", payload })
        );
        setDerniereMaj(new Date(maintenant));

        if (maintenant - dernierePersistRef.current > POSITION_PERSIST_MS) {
          dernierePersistRef.current = maintenant;
          enregistrerPosition(idsRef.current, lat, lng).catch(() => {});
        }
      },
      (err) => {
        setErreur(
          err.code === err.PERMISSION_DENIED
            ? "Accès à la position refusé. Autorisez la localisation dans les réglages de votre navigateur."
            : "Position indisponible pour le moment."
        );
        arreter();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );

    memoriserIntention(true);
    setActif(true);
  }, [arreter]);

  // Reprise après une actualisation : si le livreur avait activé le partage et
  // qu'il a encore des courses, on relance automatiquement — mais uniquement si
  // la permission de localisation est déjà accordée, pour ne pas afficher une
  // demande inattendue au chargement de la page.
  const repriseTenteeRef = useRef(false);
  useEffect(() => {
    if (repriseTenteeRef.current) return;
    if (commandes.length === 0 || !intentionMemorisee()) return;
    repriseTenteeRef.current = true;

    const perms = (navigator as Navigator).permissions;
    if (!perms?.query) return; // Sans l'API Permissions, on laisse activer à la main.
    perms
      .query({ name: "geolocation" as PermissionName })
      .then((res) => {
        if (res.state === "granted") demarrer();
      })
      .catch(() => {});
  }, [commandes.length, demarrer]);

  // Plus de course en cours : on coupe et on efface la position affichée.
  useEffect(() => {
    if (actif && commandes.length === 0) {
      const anciens = idsRef.current;
      arreter().then(() => effacerPosition(anciens).catch(() => {}));
    }
  }, [actif, commandes.length, arreter]);

  // Nettoyage au démontage (changement de page, fermeture de l'onglet)
  useEffect(() => {
    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      const supabase = createClient();
      canauxRef.current.forEach((ch) => supabase.removeChannel(ch));
      wakeLockRef.current?.release().catch(() => {});
    };
  }, []);

  if (commandes.length === 0) return null;

  return (
    <div className="card mb-6 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-900">
            📍 Partager ma position {actif && <span className="text-brand-600">— en direct</span>}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {actif
              ? `Vos ${commandes.length} client${commandes.length > 1 ? "s" : ""} en cours voient votre position se déplacer.`
              : "Vos clients suivront votre trajet sur leur page de suivi."}
          </p>
        </div>
        <button
          onClick={() => (actif ? arreter() : demarrer())}
          className={actif ? "btn-secondary" : "btn-primary"}
        >
          {actif ? "Arrêter le partage" : "Activer"}
        </button>
      </div>

      {erreur && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {erreur}
        </p>
      )}

      {actif && (
        <p className="mt-3 text-xs text-slate-400">
          {derniereMaj
            ? `Dernier point envoyé à ${derniereMaj.toLocaleTimeString("fr-FR")}.`
            : "Recherche du signal GPS…"}{" "}
          Gardez cette page ouverte : le partage s&apos;arrête si le navigateur
          passe en veille. Il se coupe tout seul à la dernière livraison.
        </p>
      )}
    </div>
  );
}
