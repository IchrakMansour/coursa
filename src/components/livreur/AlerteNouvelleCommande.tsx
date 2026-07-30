"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { canalLivreur } from "@/lib/constants";
import { formatPrix } from "@/lib/utils";

interface Alerte {
  id: string;
  reference: string;
  client_nom: string;
  cible: string;
  total: number;
}

// Alerte « nouvelle commande » façon app de livraison : sonnerie en boucle +
// fenêtre plein écran, tant que le livreur n'a pas touché « Voir » ou « Fermer ».
// La sonnerie est générée par le navigateur (Web Audio), aucun fichier requis.
export function AlerteNouvelleCommande({ livreurId }: { livreurId: string }) {
  const router = useRouter();
  const [alerte, setAlerte] = useState<Alerte | null>(null);

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

  // Les navigateurs bloquent l'audio tant que l'utilisateur n'a pas interagi :
  // on débloque le contexte audio à la première interaction dans l'app.
  useEffect(() => {
    const debloquer = () => contexte()?.resume().catch(() => {});
    window.addEventListener("pointerdown", debloquer);
    window.addEventListener("keydown", debloquer);
    return () => {
      window.removeEventListener("pointerdown", debloquer);
      window.removeEventListener("keydown", debloquer);
    };
  }, [contexte]);

  const bip = (ctx: AudioContext, freq: number, debut: number, duree: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, debut);
    gain.gain.linearRampToValueAtTime(0.5, debut + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, debut + duree);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(debut);
    osc.stop(debut + duree);
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

    const motif = () => {
      const t = ctx.currentTime;
      bip(ctx, 880, t, 0.18); // ding
      bip(ctx, 660, t + 0.22, 0.3); // dong
      try {
        navigator.vibrate?.([200, 120, 200]);
      } catch {
        /* ignore */
      }
    };

    motif();
    if (boucleRef.current) clearInterval(boucleRef.current);
    boucleRef.current = setInterval(motif, 1300);
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

  const fermer = () => {
    arreter();
    setAlerte(null);
  };
  const voir = () => {
    arreter();
    setAlerte(null);
    router.push("/livreur/commandes");
    router.refresh();
  };

  if (!alerte) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-brand-950/80 p-5 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white text-center shadow-2xl">
        <div className="bg-brand-900 px-6 py-7 text-white">
          <div className="mx-auto grid h-16 w-16 animate-bounce place-items-center rounded-full bg-gold-500 text-3xl">
            🛎️
          </div>
          <h2 className="mt-4 text-xl font-extrabold tracking-tight">
            Nouvelle commande !
          </h2>
          <p className="mt-1 text-sm text-white/70">{alerte.reference}</p>
        </div>

        <div className="px-6 py-5">
          <p className="text-lg font-bold text-slate-900">{alerte.client_nom}</p>
          <p className="text-sm text-slate-500">{alerte.cible}</p>
          <p className="mt-2 text-2xl font-extrabold text-gold-600">
            {formatPrix(alerte.total)}
          </p>

          <div className="mt-6 space-y-2">
            <button onClick={voir} className="btn-accent w-full py-3.5">
              Voir la commande
            </button>
            <button onClick={fermer} className="btn-ghost w-full">
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
