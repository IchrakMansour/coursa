import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coursa — Gérez votre activité de livraison",
  description:
    "La plateforme tout-en-un pour les livreurs indépendants : vitrine digitale, restaurants partenaires, commandes, clients et statistiques.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Coursa",
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
