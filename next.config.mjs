/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permet de compiler dans un dossier séparé (NEXT_DIST_DIR=.next-verify)
  // sans perturber un « next dev » en cours. Non défini en production.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Test depuis un téléphone via un tunnel https (localtunnel, ngrok) :
  // sans ça, Next bloque les requêtes de développement d'une autre origine.
  allowedDevOrigins: ["*.loca.lt", "*.ngrok-free.app", "*.trycloudflare.com"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
};

export default nextConfig;
