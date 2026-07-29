import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui";
import { NotificationsPush } from "@/components/livreur/NotificationsPush";
import { timeAgo, formatPrix } from "@/lib/utils";
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

        {commandes.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="Aucune notification"
            desc="Vos notifications apparaîtront ici à chaque nouvelle commande."
          />
        ) : (
          <div className="space-y-2">
            {commandes.map((c) => (
              <Link
                key={c.id}
                href="/livreur/commandes"
                className="card flex items-center gap-3 p-3 transition hover:bg-slate-50"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-xl">
                  🛵
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">
                    Nouvelle commande {c.reference}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {c.client_nom ?? "Client"} —{" "}
                    {c.restaurant?.nom ?? c.service_nom ?? "Course"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {timeAgo(c.created_at)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold text-slate-900">
                    {formatPrix(c.total)}
                  </p>
                  <div className="mt-1">
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
