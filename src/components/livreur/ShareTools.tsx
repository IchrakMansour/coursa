"use client";

import { useState } from "react";

export function ShareTools({
  lien,
  qrDataUrl,
  nom,
}: {
  lien: string;
  qrDataUrl: string;
  nom: string;
}) {
  const [copied, setCopied] = useState(false);

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(lien);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const messageWa = encodeURIComponent(
    `Commandez chez ${nom} 🛵\n${lien}`
  );

  return (
    <div className="mt-5 space-y-3">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
        <span className="truncate px-2 text-sm text-slate-600">{lien}</span>
        <button onClick={copier} className="btn-primary ml-auto shrink-0">
          {copied ? "Copié ✓" : "Copier"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={`https://wa.me/?text=${messageWa}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary flex-1"
        >
          💬 Partager sur WhatsApp
        </a>
        <a href={qrDataUrl} download={`qr-${nom}.png`} className="btn-secondary flex-1">
          ⬇️ Télécharger le QR
        </a>
      </div>
    </div>
  );
}
