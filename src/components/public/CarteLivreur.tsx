"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Carte OpenStreetMap centrée sur le livreur.
// Chargée dynamiquement (sans SSR) : Leaflet a besoin du DOM.
export function CarteLivreur({
  lat,
  lng,
  cap,
}: {
  lat: number;
  lng: number;
  cap?: number | null;
}) {
  const conteneurRef = useRef<HTMLDivElement>(null);
  const carteRef = useRef<L.Map | null>(null);
  const marqueurRef = useRef<L.Marker | null>(null);

  // Création de la carte, une seule fois
  useEffect(() => {
    if (!conteneurRef.current || carteRef.current) return;

    const carte = L.map(conteneurRef.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView([lat, lng], 15);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(carte);

    // Icône en HTML : évite les images par défaut de Leaflet, que les
    // bundlers résolvent mal.
    const icone = L.divIcon({
      className: "",
      html: `<div style="display:grid;place-items:center;width:40px;height:40px;border-radius:9999px;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.25);font-size:22px">🛵</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    marqueurRef.current = L.marker([lat, lng], { icon: icone }).addTo(carte);
    carteRef.current = carte;

    return () => {
      carte.remove();
      carteRef.current = null;
      marqueurRef.current = null;
    };
    // Volontairement sans dépendances : les mises à jour passent par l'effet suivant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Déplacement du marqueur à chaque nouvelle position
  useEffect(() => {
    if (!carteRef.current || !marqueurRef.current) return;
    marqueurRef.current.setLatLng([lat, lng]);
    carteRef.current.panTo([lat, lng], { animate: true });
  }, [lat, lng, cap]);

  return (
    <div
      ref={conteneurRef}
      className="h-64 w-full overflow-hidden rounded-2xl border border-slate-200"
      role="img"
      aria-label="Carte de la position du livreur"
    />
  );
}
