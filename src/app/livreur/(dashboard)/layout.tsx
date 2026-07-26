import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell, type NavItem } from "@/components/DashboardShell";

const NAV: NavItem[] = [
  { href: "/livreur", label: "Tableau de bord", icon: "📊" },
  { href: "/livreur/commandes", label: "Commandes", icon: "📦" },
  { href: "/livreur/restaurants", label: "Restaurants", icon: "🍽️" },
  { href: "/livreur/clients", label: "Clients", icon: "👥" },
  { href: "/livreur/profil", label: "Mon profil", icon: "🪪" },
  { href: "/livreur/partager", label: "Partager", icon: "🔗" },
  { href: "/livreur/abonnement", label: "Abonnement", icon: "💳" },
];

export default async function LivreurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("livreur");

  const supabase = await createClient();
  const { data: livreur } = await supabase
    .from("livreurs")
    .select("id")
    .eq("id", profile.id)
    .maybeSingle();

  if (!livreur) redirect("/livreur/bienvenue");

  return (
    <DashboardShell nav={NAV} espace="Espace livreur" userName={profile.full_name ?? "Livreur"}>
      {children}
    </DashboardShell>
  );
}
