import type { CommandeStatus } from "@/types/database";

export const APP_NAME = "LivraPro";

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

export const PLANS = [
  { id: "free", nom: "Gratuit", prix: 0, desc: "Pour démarrer", features: ["Page publique", "Jusqu'à 2 restaurants", "10 commandes/mois"] },
  { id: "pro", nom: "Pro", prix: 29, desc: "Le plus populaire", features: ["Restaurants illimités", "Commandes illimitées", "CRM clients", "Notifications WhatsApp", "Statistiques avancées"] },
  { id: "premium", nom: "Premium", prix: 59, desc: "Pour les pros", features: ["Tout le plan Pro", "QR code personnalisé", "Support prioritaire", "Multi-zones"] },
] as const;
