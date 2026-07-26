import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types/database";

// Retourne le profil de l'utilisateur connecté, ou null
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return (data as Profile) ?? null;
}

// Exige une session avec un rôle précis, sinon redirige
export async function requireRole(role: UserRole): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/connexion");
  if (profile.role !== role) {
    // Redirige vers l'espace correspondant au rôle réel
    const home =
      profile.role === "admin"
        ? "/admin"
        : profile.role === "restaurant"
          ? "/restaurant"
          : "/livreur";
    redirect(home);
  }
  return profile;
}
