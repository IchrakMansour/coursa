import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui";
import { formatPrix, initiales, formatDate } from "@/lib/utils";
import type { Client, Commande } from "@/types/database";

export default async function ClientsPage() {
  const profile = await requireRole("livreur");
  const supabase = await createClient();

  const [{ data: clientsData }, { data: commandesData }] = await Promise.all([
    supabase.from("clients").select("*").eq("livreur_id", profile.id),
    supabase
      .from("commandes")
      .select("id, client_id, total, created_at, restaurant:restaurants(nom)")
      .eq("livreur_id", profile.id),
  ]);

  const clients: Client[] = (clientsData as Client[]) ?? [];
  const commandes = (commandesData as unknown as (Commande & { restaurant?: { nom: string } })[]) ?? [];

  const stats = (clientId: string) => {
    const cmds = commandes.filter((c) => c.client_id === clientId);
    const total = cmds.reduce((s, c) => s + Number(c.total), 0);
    const restos = new Set(cmds.map((c) => c.restaurant?.nom).filter(Boolean));
    const derniere = cmds.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
    return { count: cmds.length, total, restos: [...restos], derniere };
  };

  return (
    <div>
      <PageHeader
        title="Clients"
        desc="Votre fichier client : historique, adresses et fidélité."
      />

      {clients.length === 0 ? (
        <EmptyState
          icon="👥"
          title="Aucun client enregistré"
          desc="Vos clients sont ajoutés automatiquement lorsqu'ils passent commande."
        />
      ) : (
        <div className="card divide-y divide-slate-100">
          {clients.map((client) => {
            const s = stats(client.id);
            return (
              <div key={client.id} className="flex flex-wrap items-center gap-4 p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-100 font-semibold text-brand-700">
                  {initiales(client.nom)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">
                    {client.nom ?? "Client"}
                  </p>
                  <p className="text-sm text-slate-500">
                    <a href={`tel:${client.telephone}`} className="text-brand-600">
                      {client.telephone}
                    </a>
                    {client.adresse ? ` · ${client.adresse}` : ""}
                  </p>
                  {s.restos.length > 0 && (
                    <p className="mt-0.5 text-xs text-slate-400">
                      Préfère : {s.restos.join(", ")}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">{s.count} cmd</p>
                  <p className="text-xs text-slate-500">{formatPrix(s.total)}</p>
                  {s.derniere && (
                    <p className="text-xs text-slate-400">
                      Dernière : {formatDate(s.derniere.created_at)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
