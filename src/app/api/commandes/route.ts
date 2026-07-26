import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendWhatsApp,
  msgNouvelleCommandeLivreur,
  msgConfirmationClient,
} from "@/lib/whatsapp";

interface ItemInput {
  produit_id: string;
  quantite: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, restaurant_id, client_nom, client_telephone, client_adresse, commentaire } = body;
    const itemsInput: ItemInput[] = Array.isArray(body.items) ? body.items : [];

    if (!slug || !restaurant_id || !client_nom || !client_telephone || !client_adresse) {
      return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
    }
    if (itemsInput.length === 0) {
      return NextResponse.json({ error: "Votre panier est vide." }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1) Livreur
    const { data: livreur } = await supabase
      .from("livreurs")
      .select("id, nom_commercial")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (!livreur) {
      return NextResponse.json({ error: "Livreur introuvable." }, { status: 404 });
    }

    // 2) Vérifie le partenariat actif + frais de livraison
    const { data: partenariat } = await supabase
      .from("partenariats")
      .select("prix_livraison")
      .eq("livreur_id", livreur.id)
      .eq("restaurant_id", restaurant_id)
      .eq("status", "accepted")
      .maybeSingle();
    if (!partenariat) {
      return NextResponse.json(
        { error: "Ce restaurant n'est pas disponible chez ce livreur." },
        { status: 400 }
      );
    }

    // 3) Recalcule les prix côté serveur (ne jamais faire confiance au client)
    const ids = itemsInput.map((i) => i.produit_id);
    const { data: produits } = await supabase
      .from("produits")
      .select("id, nom, prix, disponible, restaurant_id")
      .in("id", ids);

    const items = itemsInput
      .map((i) => {
        const p = produits?.find((x) => x.id === i.produit_id);
        if (!p || !p.disponible || p.restaurant_id !== restaurant_id) return null;
        const q = Math.max(1, Math.floor(Number(i.quantite) || 1));
        return { produit_id: p.id, nom_produit: p.nom, prix_unitaire: Number(p.prix), quantite: q };
      })
      .filter(Boolean) as {
      produit_id: string;
      nom_produit: string;
      prix_unitaire: number;
      quantite: number;
    }[];

    if (items.length === 0) {
      return NextResponse.json({ error: "Produits indisponibles." }, { status: 400 });
    }

    const sousTotal = items.reduce((s, it) => s + it.prix_unitaire * it.quantite, 0);
    const frais = Number(partenariat.prix_livraison) || 0;
    const total = sousTotal + frais;

    // 4) Enregistre / met à jour le client dans le CRM du livreur
    const { data: client } = await supabase
      .from("clients")
      .upsert(
        {
          livreur_id: livreur.id,
          nom: client_nom,
          telephone: client_telephone,
          adresse: client_adresse,
        },
        { onConflict: "livreur_id,telephone" }
      )
      .select("id")
      .single();

    // 5) Crée la commande
    const { data: commande, error: cmdErr } = await supabase
      .from("commandes")
      .insert({
        livreur_id: livreur.id,
        restaurant_id,
        client_id: client?.id ?? null,
        client_nom,
        client_telephone,
        client_adresse,
        commentaire: commentaire || null,
        status: "nouvelle",
        sous_total: sousTotal,
        frais_livraison: frais,
        total,
      })
      .select("*")
      .single();

    if (cmdErr || !commande) {
      return NextResponse.json({ error: "Impossible de créer la commande." }, { status: 500 });
    }

    // 6) Insère les articles
    await supabase.from("commande_items").insert(
      items.map((it) => ({ ...it, commande_id: commande.id }))
    );

    // 7) Notifications WhatsApp
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const { data: resto } = await supabase
      .from("restaurants")
      .select("nom")
      .eq("id", restaurant_id)
      .single();
    const { data: livreurProfile } = await supabase
      .from("profiles")
      .select("whatsapp, phone")
      .eq("id", livreur.id)
      .single();

    const numLivreur = livreurProfile?.whatsapp || livreurProfile?.phone;
    if (numLivreur) {
      await sendWhatsApp(
        numLivreur,
        msgNouvelleCommandeLivreur({
          restoNom: resto?.nom ?? "Restaurant",
          clientNom: client_nom,
          adresse: client_adresse,
          lien: `${appUrl}/livreur/commandes`,
        })
      );
    }

    await sendWhatsApp(
      client_telephone,
      msgConfirmationClient({
        reference: commande.reference,
        lienSuivi: `${appUrl}/suivi/${commande.id}`,
      })
    );

    return NextResponse.json({ id: commande.id, reference: commande.reference });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
