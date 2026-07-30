import type { CommandeStatus } from "@/types/database";

export const APP_NAME = "Coursa";

// Ordre et libellés des statuts de commande (parcours livreur)
export const COMMANDE_FLOW: CommandeStatus[] = [
  "nouvelle",
  "acceptee",
  "recuperation",
  "en_livraison",
  "livree",
];

export const STATUS_LABELS: Record<CommandeStatus, string> = {
  nouvelle: "Nouvelle commande",
  acceptee: "Acceptée",
  preparation: "En préparation",
  prete: "Prête",
  recuperation: "Récupération restaurant",
  en_livraison: "En livraison",
  livree: "Livrée",
  annulee: "Annulée",
};

export const STATUS_COLORS: Record<CommandeStatus, string> = {
  nouvelle: "bg-amber-100 text-amber-800 border-amber-200",
  acceptee: "bg-blue-100 text-blue-800 border-blue-200",
  preparation: "bg-indigo-100 text-indigo-800 border-indigo-200",
  prete: "bg-cyan-100 text-cyan-800 border-cyan-200",
  recuperation: "bg-purple-100 text-purple-800 border-purple-200",
  en_livraison: "bg-orange-100 text-orange-800 border-orange-200",
  livree: "bg-green-100 text-green-800 border-green-200",
  annulee: "bg-red-100 text-red-800 border-red-200",
};

// Étape suivante logique pour un livreur
export const NEXT_STATUS: Partial<Record<CommandeStatus, CommandeStatus>> = {
  nouvelle: "acceptee",
  acceptee: "recuperation",
  recuperation: "en_livraison",
  en_livraison: "livree",
};

export const DEVISE = "DT";

// ---- Suivi de position en direct ----

// Statuts pendant lesquels le livreur est en course : c'est la seule
// fenêtre où sa position est partagée.
export const STATUTS_EN_COURSE: CommandeStatus[] = [
  "acceptee",
  "preparation",
  "prete",
  "recuperation",
  "en_livraison",
];

// Canal Realtime dédié à une commande. Le nom contient l'UUID de la
// commande : impossible à deviner, donc seul le porteur du lien de
// suivi peut écouter la position du livreur.
export function canalSuivi(commandeId: string) {
  return `suivi-${commandeId}`;
}

// Canal Realtime privé du livreur : reçoit une alerte à chaque nouvelle
// commande (sonnerie + fenêtre) tant que l'application est ouverte.
export function canalLivreur(livreurId: string) {
  return `livreur-${livreurId}`;
}

// Cadence d'émission de la position
export const POSITION_INTERVALLE_MS = 10_000; // 1 point toutes les 10 s max
export const POSITION_DISTANCE_M = 25; // ou dès 25 m parcourus
export const POSITION_PERSIST_MS = 60_000; // sauvegarde en base 1×/min

export const PLANS = [
  { id: "free", nom: "Gratuit", prix: 0, desc: "Pour démarrer", features: ["Page publique", "Jusqu'à 2 restaurants", "10 commandes/mois"] },
  { id: "pro", nom: "Pro", prix: 29, desc: "Le plus populaire", features: ["Restaurants illimités", "Commandes illimitées", "CRM clients", "Notifications WhatsApp", "Statistiques avancées"] },
  { id: "premium", nom: "Premium", prix: 59, desc: "Pour les pros", features: ["Tout le plan Pro", "QR code personnalisé", "Support prioritaire", "Multi-zones"] },
] as const;
