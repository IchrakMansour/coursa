import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell, type NavItem } from "@/components/DashboardShell";

const NAV: NavItem[] = [
  { href: "/restaurant", label: "Commandes", icon: "📦" },
  { href: "/restaurant/menu", label: "Menu", icon: "📋" },
  { href: "/restaurant/livreurs", label: "Livreurs", icon: "🛵" },
  { href: "/restaurant/profil", label: "Mon restaurant", icon: "🏪" },
];

export default async function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("restaurant");
  const supabase = await createClient();
  const { data: resto } = await supabase
    .from("restaurants")
    .select("id")
    .eq("owner_id", profile.id)
    .maybeSingle();
  if (!resto) redirect("/restaurant/bienvenue");

  return (
    <DashboardShell nav={NAV} espace="Espace restaurant" userName={profile.full_name ?? "Restaurant"}>
      {children}
    </DashboardShell>
  );
}
