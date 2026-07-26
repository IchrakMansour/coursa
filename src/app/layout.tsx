import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LivraPro — Gérez votre activité de livraison",
  description:
    "La plateforme tout-en-un pour les livreurs indépendants : vitrine digitale, restaurants partenaires, commandes, clients et statistiques.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
