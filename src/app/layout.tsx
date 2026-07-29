import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Police géométrique nette, façon Uber (« Uber Move » étant propriétaire).
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

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
  themeColor: "#0f1e35",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
