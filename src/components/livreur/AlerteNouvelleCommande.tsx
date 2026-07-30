"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { canalLivreur } from "@/lib/constants";
import { formatPrix } from "@/lib/utils";
import { changerStatut } from "@/app/livreur/(dashboard)/commandes/actions";

interface Alerte {
  id: string;
  reference: string;
  client_nom: string;
  cible: string;
  total: number;
}

// Alerte « nouvelle commande » façon Uber : plein écran, compte à rebours,
// sonnerie mélodique en boucle, et curseur « glisser pour accepter ».
// La sonnerie est générée par le navigateur (Web Audio), aucun fichier requis.
export function AlerteNouvelleCommande({ livreurId }: { livreurId: string }) {
  const router = useRouter();
  const [alerte, setAlerte] = useState<Alerte | null>(null);
  const [enCours, setEnCours] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const boucleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secuRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const contexte = useCallback(() => {
    if (!ctxRef.current) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AC) ctxRef.current = new AC();
    }
    return ctxRef.current;
  }, []);

  // Les navigateurs bloquent l'audio tant qu'il n'y a pas eu d'interaction :
  // on débloque le contexte audio dès la première interaction dans l'app.
  useEffect(() => {
    const debloquer = () => contexte()?.resume().catch(() => {});
    window.addEventListener("pointerdown", debloquer);
    window.addEventListener("keydown", debloquer);
    return () => {
      window.removeEventListener("pointerdown", debloquer);
      window.removeEventListener("keydown", debloquer);
    };
  }, [contexte]);

  // Une note « marimba » : attaque brève, extinction rapide + harmonique.
  const note = (ctx: AudioContext, freq: number, debut: number) => {
    const dur = 0.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, debut);
    gain.gain.exponentialRampToValueAtTime(0.55, debut + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, debut + dur);
    gain.connect(ctx.destination);
    [1, 2].forEach((mult, i) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = freq * mult;
      const g = ctx.createGain();
      g.gain.value = i === 0 ? 1 : 0.28;
      osc.connect(g);
      g.connect(gain);
      osc.start(debut);
      osc.stop(debut + dur);
    });
  };

  const arreter = useCallback(() => {
    if (boucleRef.current) clearInterval(boucleRef.current);
    if (secuRef.current) clearTimeout(secuRef.current);
    boucleRef.current = null;
    secuRef.current = null;
    try {
      navigator.vibrate?.(0);
    } catch {
      /* vibration non supportée */
    }
  }, []);

  const sonner = useCallback(() => {
    const ctx = contexte();
    if (!ctx) return;
    ctx.resume().catch(() => {});

    // Petit motif ascendant (do–mi–sol–do), esprit « alerte de course ».
    const motif = () => {
      const t = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, i) => note(ctx, f, t + i * 0.16));
      try {
        navigator.vibrate?.([200, 120, 200]);
      } catch {
        /* ignore */
      }
    };

    motif();
    if (boucleRef.current) clearInterval(boucleRef.current);
    boucleRef.current = setInterval(motif, 1600);
    // Sécurité : la sonnerie s'arrête seule au bout de 30 s.
    if (secuRef.current) clearTimeout(secuRef.current);
    secuRef.current = setTimeout(arreter, 30000);
  }, [contexte, arreter]);

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

  const ignorer = () => {
    arreter();
    setAlerte(null);
  };

  const accepter = async () => {
    if (!alerte || enCours) return;
    arreter();
    setEnCours(true);
    try {
      await changerStatut(alerte.id, "acceptee");
    } catch {
      /* on ferme quand même : le livreur verra la commande dans la liste */
    }
    setEnCours(false);
    setAlerte(null);
    router.push("/livreur/commandes");
    router.refresh();
  };

  if (!alerte) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-brand-950 p-6 text-white">
      {/* Compte à rebours */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
        <div key={alerte.id} className="animate-retrecir h-full bg-gold-500" />
      </div>

      {/* Détails de la commande */}
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="grid h-16 w-16 animate-bounce place-items-center rounded-full bg-gold-500 text-3xl">
          🛎️
        </div>
        <p className="mt-5 text-sm font-semibold uppercase tracking-widest text-white/60">
          Nouvelle commande
        </p>
        <p className="mt-3 text-5xl font-extrabold tracking-tight text-gold-400">
          {formatPrix(alerte.total)}
        </p>
        <p className="mt-4 text-xl font-bold">{alerte.client_nom}</p>
        <p className="text-sm text-white/70">{alerte.cible}</p>
        <p className="mt-1 text-xs text-white/40">{alerte.reference}</p>
      </div>

      {/* Curseur « glisser pour accepter » */}
      <GlisserAccepter onAccept={accepter} enCours={enCours} />
      <button
        onClick={ignorer}
        disabled={enCours}
        className="mt-3 py-2 text-sm font-medium text-white/60"
      >
        Ignorer
      </button>
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
      {/* Remplissage doré selon la progression */}
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
