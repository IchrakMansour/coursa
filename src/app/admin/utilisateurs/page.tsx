import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader, EmptyState } from "@/components/ui";
import { UserRow } from "@/components/admin/UserRow";
import type { Profile } from "@/types/database";

export default async function UtilisateursPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  await requireRole("admin");
  const { role } = await searchParams;
  const supabase = createAdminClient();

  let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });
  if (role && ["livreur", "restaurant", "client", "admin"].includes(role)) {
    query = query.eq("role", role);
  }
  const { data } = await query;
  const users: Profile[] = (data as Profile[]) ?? [];

  const filtres = [
    { key: "", label: "Tous" },
    { key: "livreur", label: "Livreurs" },
    { key: "restaurant", label: "Restaurants" },
    { key: "client", label: "Clients" },
  ];

  return (
    <div>
      <PageHeader title="Utilisateurs" desc="Validez, suspendez ou supprimez des comptes." />

      <div className="mb-4 flex flex-wrap gap-2">
        {filtres.map((f) => (
          <a
            key={f.key}
            href={f.key ? `/admin/utilisateurs?role=${f.key}` : "/admin/utilisateurs"}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              (role ?? "") === f.key
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      {users.length === 0 ? (
        <EmptyState icon="👥" title="Aucun utilisateur" />
      ) : (
        <div className="card divide-y divide-slate-100">
          {users.map((u) => (
            <UserRow key={u.id} user={u} />
          ))}
        </div>
      )}
    </div>
  );
}
