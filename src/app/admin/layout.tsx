import { requireRole } from "@/lib/auth";
import { DashboardShell, type NavItem } from "@/components/DashboardShell";

const NAV: NavItem[] = [
  { href: "/admin", label: "Tableau de bord", icon: "📊" },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: "👥" },
  { href: "/admin/commandes", label: "Commandes", icon: "📦" },
  { href: "/admin/finances", label: "Finances", icon: "💰" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("admin");
  return (
    <DashboardShell nav={NAV} espace="Administration" userName={profile.full_name ?? "Admin"}>
      {children}
    </DashboardShell>
  );
}
