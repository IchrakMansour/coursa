import QRCode from "qrcode";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { ShareTools } from "@/components/livreur/ShareTools";
import type { Livreur } from "@/types/database";

export default async function PartagerPage() {
  const profile = await requireRole("livreur");
  const supabase = await createClient();
  const { data } = await supabase
    .from("livreurs")
    .select("*")
    .eq("id", profile.id)
    .single();
  const livreur = data as Livreur;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const lien = `${appUrl}/${livreur.slug}`;

  const qrDataUrl = await QRCode.toDataURL(lien, {
    width: 400,
    margin: 2,
    color: { dark: "#1c6af1", light: "#ffffff" },
  });

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Partager ma page"
        desc="Votre lien unique de type Linktree à partager avec vos clients."
      />

      <div className="card p-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt="QR Code de votre page"
          className="mx-auto h-56 w-56 rounded-2xl border border-slate-100"
        />
        <p className="mt-4 text-sm text-slate-500">Scannez pour ouvrir votre vitrine</p>

        <ShareTools lien={lien} qrDataUrl={qrDataUrl} nom={livreur.nom_commercial} />
      </div>

      <div className="card mt-6 p-5">
        <h2 className="font-semibold text-slate-900">Comment l'utiliser ?</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li className="flex gap-2"><span>📲</span> Partagez le lien dans votre statut WhatsApp.</li>
          <li className="flex gap-2"><span>🖨️</span> Imprimez le QR code sur vos flyers ou votre véhicule.</li>
          <li className="flex gap-2"><span>📸</span> Ajoutez-le à votre bio Instagram / Facebook.</li>
        </ul>
      </div>
    </div>
  );
}
