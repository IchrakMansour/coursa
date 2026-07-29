import { requireRole } from "@/lib/auth";
import { DashboardShell, type NavItem } from "@/components/DashboardShell";

const NAV: NavItem[] = [
  { href: "/admin", label: "Tableau de bord", icon: "📊", short: "Accueil" },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: "👥", short: "Comptes" },
  { href: "/admin/commandes", label: "Commandes", icon: "📦", short: "Commandes" },
  { href: "/admin/finances", label: "Finances", icon: "💰", short: "Finances" },
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
