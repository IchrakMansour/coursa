"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { canalLivreur } from "@/lib/constants";
import { formatPrix } from "@/lib/utils";
import {
  changerStatut,
  refuserCommande,
} from "@/app/livreur/(dashboard)/commandes/actions";

interface Alerte {
  id: string;
  reference: string;
  client_nom: string;
  cible: string;
  total: number;
}

// Alerte « nouvelle commande » façon Uber : plein écran, sonnerie en boucle
// (fichier public/sonnerie.mp3) jusqu'à ce que le livreur accepte (glisser à
// droite) ou refuse.
export function AlerteNouvelleCommande({ livreurId }: { livreurId: string }) {
  const router = useRouter();
  const [alerte, setAlerte] = useState<Alerte | null>(null);
  const [enCours, setEnCours] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const vibreRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Prépare la sonnerie et débloque la lecture dès la première interaction
  // (les navigateurs interdisent l'audio automatique sans geste utilisateur).
  useEffect(() => {
    const audio = new Audio("/sonnerie.mp3");
    audio.loop = true;
    audio.preload = "auto";
    audioRef.current = audio;

    const debloquer = () => {
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
        })
        .catch(() => {});
    };
    window.addEventListener("pointerdown", debloquer, { once: true });
    window.addEventListener("keydown", debloquer, { once: true });
    return () => {
      window.removeEventListener("pointerdown", debloquer);
      window.removeEventListener("keydown", debloquer);
      audio.pause();
    };
  }, []);

  const arreter = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    if (vibreRef.current) clearInterval(vibreRef.current);
    vibreRef.current = null;
    try {
      navigator.vibrate?.(0);
    } catch {
      /* vibration non supportée */
    }
  }, []);

  const sonner = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.loop = true;
      audio.play().catch(() => {});
    }
    // Vibration répétée en parallèle (Android).
    if (vibreRef.current) clearInterval(vibreRef.current);
    const vibrer = () => {
      try {
        navigator.vibrate?.([300, 150, 300]);
      } catch {
        /* ignore */
      }
    };
    vibrer();
    vibreRef.current = setInterval(vibrer, 1500);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel(canalLivreur(livreurId))
      .on("broadcast", { event: "nouvelle_commande" }, ({ payload }) => {
        setAlerte(payload as Alerte);
        sonner();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
      arreter();
    };
  }, [livreurId, sonner, arreter]);

  const accepter = async () => {
    if (!alerte || enCours) return;
    arreter();
    setEnCours(true);
    try {
      await changerStatut(alerte.id, "acceptee");
    } catch {
      /* on ferme quand même : la commande reste dans la liste */
    }
    setEnCours(false);
    setAlerte(null);
    router.push("/livreur/commandes");
    router.refresh();
  };

  const refuser = async () => {
    if (!alerte || enCours) return;
    arreter();
    setEnCours(true);
    try {
      await refuserCommande(alerte.id);
    } catch {
      /* ignore */
    }
    setEnCours(false);
    setAlerte(null);
    router.refresh();
  };

  if (!alerte) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-stretch justify-center bg-brand-950 sm:items-center sm:bg-brand-950/85 sm:p-6 sm:backdrop-blur-sm">
      {/* Plein écran sur mobile, grande carte centrée sur écran large */}
      <div className="flex w-full flex-col overflow-y-auto p-6 text-white sm:max-h-[92vh] sm:min-h-[560px] sm:max-w-md sm:rounded-3xl sm:bg-brand-900 sm:shadow-2xl sm:ring-1 sm:ring-white/10">
        {/* Détails de la commande */}
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <div className="grid h-16 w-16 animate-bounce place-items-center rounded-full bg-gold-500 text-3xl sm:h-20 sm:w-20 sm:text-4xl">
            🛎️
          </div>
          <p className="mt-5 text-sm font-semibold uppercase tracking-widest text-white/60">
            Nouvelle commande
          </p>
          <p className="mt-3 text-5xl font-extrabold tracking-tight text-gold-400 sm:text-6xl">
            {formatPrix(alerte.total)}
          </p>
          <p className="mt-4 text-xl font-bold sm:text-2xl">{alerte.client_nom}</p>
          <p className="text-sm text-white/70 sm:text-base">{alerte.cible}</p>
          <p className="mt-1 text-xs text-white/40">{alerte.reference}</p>
        </div>

        {/* Curseur « glisser pour accepter » */}
        <GlisserAccepter onAccept={accepter} enCours={enCours} />
        <button
          onClick={refuser}
          disabled={enCours}
          className="mt-3 py-2 text-sm font-semibold text-red-300"
        >
          Refuser
        </button>
      </div>
    </div>
  );
}

// Curseur à glisser vers la droite pour accepter (façon Uber).
function GlisserAccepter({
  onAccept,
  enCours,
}: {
  onAccept: () => void;
  enCours: boolean;
}) {
  const pisteRef = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(0);
  const [drag, setDrag] = useState(false);
  const KNOB = 56;
  const PAD = 6;

  const maxX = () => {
    const w = pisteRef.current?.clientWidth ?? 0;
    return Math.max(0, w - KNOB - PAD * 2);
  };

  const onDown = (e: React.PointerEvent) => {
    if (enCours) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDrag(true);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag || !pisteRef.current) return;
    const rect = pisteRef.current.getBoundingClientRect();
    const pos = e.clientX - rect.left - PAD - KNOB / 2;
    setX(Math.min(maxX(), Math.max(0, pos)));
  };
  const onUp = () => {
    if (!drag) return;
    setDrag(false);
    if (x >= maxX() * 0.9) {
      setX(maxX());
      onAccept();
    } else {
      setX(0);
    }
  };

  const progres = maxX() > 0 ? x / maxX() : 0;

  return (
    <div
      ref={pisteRef}
      className="relative h-16 w-full select-none overflow-hidden rounded-full bg-white/10"
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-gold-500/30"
        style={{ width: x + KNOB + PAD * 2 }}
      />
      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-semibold text-white/70"
        style={{ opacity: 1 - progres }}
      >
        {enCours ? "Acceptation…" : "Glissez pour accepter →"}
      </span>
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{ transform: `translateX(${x}px)`, left: PAD }}
        className={`absolute top-1/2 grid h-[56px] w-[56px] -translate-y-1/2 cursor-grab touch-none place-items-center rounded-full bg-gold-500 text-2xl text-brand-900 shadow-lg ${
          drag ? "" : "transition-transform"
        }`}
      >
        →
      </div>
    </div>
  );
}
