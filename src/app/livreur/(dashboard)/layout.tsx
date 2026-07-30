import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell, type NavItem } from "@/components/DashboardShell";
import { AlerteNouvelleCommande } from "@/components/livreur/AlerteNouvelleCommande";

const NAV: NavItem[] = [
  { href: "/livreur", label: "Tableau de bord", icon: "home", short: "Accueil" },
  { href: "/livreur/commandes", label: "Commandes", icon: "orders", short: "Commandes" },
  { href: "/livreur/restaurants", label: "Restaurants", icon: "restaurants", short: "Restos" },
  { href: "/livreur/clients", label: "Clients", icon: "clients", short: "Clients" },
  { href: "/livreur/profil", label: "Mon profil", icon: "profile" },
  { href: "/livreur/partager", label: "Partager", icon: "share" },
  { href: "/livreur/abonnement", label: "Abonnement", icon: "billing" },
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
    <DashboardShell
      nav={NAV}
      espace="Espace livreur"
      userName={profile.full_name ?? "Livreur"}
      notificationsHref="/livreur/notifications"
    >
      <AlerteNouvelleCommande livreurId={profile.id} />
      {children}
    </DashboardShell>
  );
}
