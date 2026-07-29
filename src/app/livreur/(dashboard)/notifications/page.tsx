import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui";
import { NotificationsPush } from "@/components/livreur/NotificationsPush";
import {
  HistoriqueNotifications,
  type NotifItem,
} from "@/components/livreur/HistoriqueNotifications";
import type { Commande } from "@/types/database";

export default async function NotificationsPage() {
  const profile = await requireRole("livreur");
  const supabase = await createClient();

  // L'historique des notifications = les commandes reçues, de la plus récente
  // à la plus ancienne. Chaque nouvelle commande a déclenché une notification.
  const { data } = await supabase
    .from("commandes")
    .select(
      "id, reference, client_nom, service_nom, total, status, created_at, restaurant:restaurants(nom)"
    )
    .eq("livreur_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const commandes = (data as unknown as Commande[]) ?? [];

  const items: NotifItem[] = commandes.map((c) => ({
    id: c.id,
    reference: c.reference,
    clientNom: c.client_nom ?? "Client",
    cible: c.restaurant?.nom ?? c.service_nom ?? "Course",
    total: c.total,
    status: c.status,
    createdAt: c.created_at,
  }));

  return (
    <div>
      <PageHeader
        title="Notifications"
        desc="Vos alertes de nouvelles commandes, de la plus récente à la plus ancienne."
      />

      <NotificationsPush />

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Historique
        </h2>

        {items.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="Aucune notification"
            desc="Vos notifications apparaîtront ici à chaque nouvelle commande."
          />
        ) : (
          <HistoriqueNotifications items={items} />
        )}
      </section>
    </div>
  );
}
