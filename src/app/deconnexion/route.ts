import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Déconnexion en POST uniquement.
// En GET, le prefetch des liens de Next.js (actif en production) appelait
// cette route sans action de l'utilisateur et fermait sa session.
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // 303 : le navigateur repasse en GET pour suivre la redirection
  return NextResponse.redirect(new URL("/connexion", request.url), 303);
}
