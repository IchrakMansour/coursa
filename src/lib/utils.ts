import { DEVISE } from "./constants";

export function formatPrix(montant: number): string {
  const n = Number(montant);
  const s = Number.isInteger(n) ? n.toString() : n.toFixed(2);
  return `${s} ${DEVISE}`;
}

// Icône adaptée à un service. On respecte le choix explicite du livreur ;
// sinon (ou si l'icône est restée sur le 📦 par défaut) on la déduit du nom :
// pharmacie → 💊, colis → 📦, courses → 🛒, eau → 💧, etc.
export function iconeService(
  nom: string | null | undefined,
  icone?: string | null
): string {
  const n = (nom ?? "").toLowerCase();
  const paires: [RegExp, string][] = [
    [/pharma|m[ée]dic|ordonnance/, "💊"],
    [/colis|paquet/, "📦"],
    [/course|[ée]piceri|march[ée]|supermarch|aliment/, "🛒"],
    [/\beau\b|bonbonne/, "💧"],
    [/pain|boulanger|p[âa]tisser/, "🥖"],
    [/fleur/, "💐"],
    [/document|papier|dossier|administrat/, "📄"],
    [/cadeau/, "🎁"],
    [/plat|repas|food|nourritur|restau/, "🍽️"],
  ];
  const derive = paires.find(([re]) => re.test(n))?.[1];
  if (icone && icone !== "📦") return icone; // choix explicite conservé
  return derive ?? icone ?? "📦";
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.floor(h / 24);
  return `il y a ${j} j`;
}

// Génère un slug propre à partir d'un nom
export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // supprime les accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---- Numéros de téléphone tunisiens ----
// 8 chiffres, indicatif +216. Les préfixes en service commencent par
// 2/4/5/9 (mobiles), 3/7 (fixes) et 8 (numéros spéciaux, exclus ici).
const PREFIXES_TN = /^[234579]/;

// Renvoie le numéro au format international (+216XXXXXXXX), ou null s'il
// n'est pas un numéro tunisien valide. Accepte les saisies avec espaces,
// avec ou sans indicatif : « 20 123 456 », « +21620123456 », « 0021620123456 ».
export function normaliserTelTunisien(saisie: string): string | null {
  let chiffres = saisie.replace(/\D/g, "");
  if (chiffres.startsWith("00216")) chiffres = chiffres.slice(5);
  else if (chiffres.startsWith("216") && chiffres.length > 8) chiffres = chiffres.slice(3);
  if (chiffres.length !== 8 || !PREFIXES_TN.test(chiffres)) return null;
  return `+216${chiffres}`;
}

// Tous les numéros de la plateforme sont tunisiens : le +216 est l'indicatif
// par défaut, et le seul accepté.
export function telInternational(saisie: string): string | null {
  return normaliserTelTunisien(saisie);
}

// Même chose sans le « + » : format attendu par wa.me et l'API WhatsApp.
export function telWhatsApp(saisie: string): string | null {
  return telInternational(saisie)?.slice(1) ?? null;
}

// Les 8 chiffres locaux d'un numéro, quel que soit le format saisi ou stocké.
// Sert à pré-remplir les champs de saisie, qui n'affichent pas l'indicatif.
export function telLocal(saisie: string | null | undefined): string {
  let chiffres = (saisie ?? "").replace(/\D/g, "");
  if (chiffres.startsWith("00216")) chiffres = chiffres.slice(5);
  else if (chiffres.startsWith("216") && chiffres.length > 8) chiffres = chiffres.slice(3);
  return chiffres.slice(0, 8);
}

// Distance à vol d'oiseau entre deux points GPS, en mètres (formule de haversine)
export function distanceM(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  const R = 6371e3;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function initiales(nom?: string | null): string {
  if (!nom) return "?";
  return nom
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
