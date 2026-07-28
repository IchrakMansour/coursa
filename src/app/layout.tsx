import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LivraPro — Gérez votre activité de livraison",
  description:
    "La plateforme tout-en-un pour les livreurs indépendants : vitrine digitale, restaurants partenaires, commandes, clients et statistiques.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "LivraPro",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#1c6af1",
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
