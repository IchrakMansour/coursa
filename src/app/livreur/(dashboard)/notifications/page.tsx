import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { NotificationsPush } from "@/components/livreur/NotificationsPush";

export default async function NotificationsPage() {
  await requireRole("livreur");

  return (
    <div>
      <PageHeader
        title="Notifications"
        desc="Soyez prévenu à chaque nouvelle commande, même l'application fermée."
      />

      <NotificationsPush />

      <div className="card p-5 text-sm text-slate-500">
        <p className="mb-2 font-semibold text-slate-700">Bon à savoir</p>
        <ul className="space-y-1.5">
          <li>
            • L&apos;activation se fait <strong>appareil par appareil</strong> :
            activez sur chaque téléphone où vous voulez recevoir les alertes.
          </li>
          <li>
            • Sur <strong>iPhone</strong>, ajoutez d&apos;abord l&apos;application
            à l&apos;écran d&apos;accueil <em>depuis Safari</em>, puis ouvrez-la
            depuis l&apos;icône avant d&apos;activer.
          </li>
          <li>
            • Sur <strong>Android</strong> et ordinateur, l&apos;activation
            fonctionne directement.
          </li>
        </ul>
      </div>
    </div>
  );
}
