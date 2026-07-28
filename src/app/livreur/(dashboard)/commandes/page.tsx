import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui";
import { CommandeCard } from "@/components/livreur/CommandeCard";
import { PartagePosition } from "@/components/livreur/PartagePosition";
import { NotificationsPush } from "@/components/livreur/NotificationsPush";
import { STATUTS_EN_COURSE } from "@/lib/constants";
import type { Commande } from "@/types/database";

export default async function CommandesPage() {
  const profile = await requireRole("livreur");
  const supabase = await createClient();

  const { data } = await supabase
    .from("commandes")
    .select("*, items:commande_items(*), restaurant:restaurants(nom)")
    .eq("livreur_id", profile.id)
    .order("created_at", { ascending: false });

  const commandes: Commande[] = (data as unknown as Commande[]) ?? [];

  const actives = commandes.filter(
    (c) => !["livree", "annulee"].includes(c.status)
  );
  const terminees = commandes.filter((c) =>
    ["livree", "annulee"].includes(c.status)
  );

  return (
    <div>
      <PageHeader title="Commandes" desc="Gérez vos livraisons en temps réel." />

      <NotificationsPush />

      <PartagePosition
        commandes={commandes
          .filter((c) => STATUTS_EN_COURSE.includes(c.status))
          .map((c) => ({ id: c.id, reference: c.reference }))}
      />

      {commandes.length === 0 ? (
        <EmptyState
          icon="📦"
          title="Aucune commande"
          desc="Vos commandes apparaîtront ici dès qu'un client passe commande via votre page."
        />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              En cours ({actives.length})
            </h2>
            {actives.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune commande en cours.</p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {actives.map((c) => (
                  <CommandeCard key={c.id} commande={c} />
                ))}
              </div>
            )}
          </section>

          {terminees.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Historique ({terminees.length})
              </h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {terminees.map((c) => (
                  <CommandeCard key={c.id} commande={c} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
