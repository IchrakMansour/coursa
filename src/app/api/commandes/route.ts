import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normaliserTelTunisien } from "@/lib/utils";
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
    const {
      slug,
      restaurant_id,
      service_id,
      client_nom,
      client_telephone,
      client_adresse,
      commentaire,
    } = body;
    const itemsInput: ItemInput[] = Array.isArray(body.items) ? body.items : [];
    // Commande écrite en toutes lettres (carte en photo, ou demande de service)
    const demandeLibre = String(body.demande_libre ?? "").trim().slice(0, 1000);

    if (!slug || !client_nom || !client_telephone || !client_adresse) {
      return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
    }
    // Restauration ou service : il faut l'un ou l'autre, jamais les deux.
    if (!restaurant_id === !service_id) {
      return NextResponse.json(
        { error: "Choisissez un restaurant ou un service." },
        { status: 400 }
      );
    }

    // Un numéro tunisien valide : c'est par là que passent le suivi WhatsApp
    // et l'appel du livreur, on ne l'accepte pas approximatif.
    const telephone = normaliserTelTunisien(String(client_telephone));
    if (!telephone) {
      return NextResponse.json(
        { error: "Numéro de téléphone tunisien invalide (8 chiffres)." },
        { status: 400 }
      );
    }
    if (itemsInput.length === 0 && !demandeLibre) {
      return NextResponse.json(
        { error: "Ajoutez un produit ou écrivez votre commande." },
        { status: 400 }
      );
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

    // 2) Cible de la commande : restaurant partenaire, ou service du livreur.
    //    Dans les deux cas, c'est le serveur qui fixe les frais de livraison.
    let frais = 0;
    let serviceNom: string | null = null;

    if (restaurant_id) {
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
      frais = Number(partenariat.prix_livraison) || 0;
    } else {
      const { data: service } = await supabase
        .from("services")
        .select("nom, prix, actif")
        .eq("id", service_id)
        .eq("livreur_id", livreur.id)
        .maybeSingle();
      if (!service || !service.actif) {
        return NextResponse.json(
          { error: "Ce service n'est pas proposé par ce livreur." },
          { status: 400 }
        );
      }
      // Un service n'a pas de catalogue : la demande écrite est indispensable.
      if (!demandeLibre) {
        return NextResponse.json(
          { error: "Décrivez ce dont vous avez besoin." },
          { status: 400 }
        );
      }
      frais = Number(service.prix) || 0;
      serviceNom = service.nom;
    }

    // 3) Recalcule les prix côté serveur (ne jamais faire confiance au client)
    const ids = itemsInput.map((i) => i.produit_id);
    const { data: produits } = ids.length
      ? await supabase
          .from("produits")
          .select("id, nom, prix, disponible, restaurant_id")
          .in("id", ids)
      : { data: [] };

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

    // Sans demande écrite, il faut au moins un produit valide.
    if (items.length === 0 && !demandeLibre) {
      return NextResponse.json({ error: "Produits indisponibles." }, { status: 400 });
    }

    const sousTotal = items.reduce((s, it) => s + it.prix_unitaire * it.quantite, 0);
    const total = sousTotal + frais;

    // 4) Enregistre / met à jour le client dans le CRM du livreur
    const { data: client } = await supabase
      .from("clients")
      .upsert(
        {
          livreur_id: livreur.id,
          nom: client_nom,
          telephone,
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
        restaurant_id: restaurant_id ?? null,
        service_id: service_id ?? null,
        service_nom: serviceNom,
        client_id: client?.id ?? null,
        client_nom,
        client_telephone: telephone,
        client_adresse,
        commentaire: commentaire || null,
        demande_libre: demandeLibre || null,
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
    if (items.length > 0) {
      await supabase.from("commande_items").insert(
        items.map((it) => ({ ...it, commande_id: commande.id }))
      );
    }

    // 7) Notifications WhatsApp — la commande est déjà enregistrée, ces envois
    //    ne doivent pas retarder ni bloquer la réponse au client. On les lance
    //    en parallèle et chaque appel est borné dans le temps (voir
    //    sendWhatsApp) : un destinataire injoignable (ex. numéro hors liste de
    //    test WhatsApp) ne peut plus figer la commande sur « Envoi… ».
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const [{ data: resto }, { data: livreurProfile }] = await Promise.all([
      restaurant_id
        ? supabase.from("restaurants").select("nom").eq("id", restaurant_id).single()
        : Promise.resolve({ data: null }),
      supabase
        .from("profiles")
        .select("whatsapp, phone")
        .eq("id", livreur.id)
        .single(),
    ]);

    const numLivreur = livreurProfile?.whatsapp || livreurProfile?.phone;
    await Promise.allSettled([
      numLivreur
        ? sendWhatsApp(
            numLivreur,
            msgNouvelleCommandeLivreur({
              restoNom: resto?.nom ?? serviceNom ?? "Course",
              clientNom: client_nom,
              adresse: client_adresse,
              lien: `${appUrl}/livreur/commandes`,
            })
          )
        : Promise.resolve(),
      sendWhatsApp(
        telephone,
        msgConfirmationClient({
          reference: commande.reference,
          lienSuivi: `${appUrl}/suivi/${commande.id}`,
        })
      ),
    ]);

    return NextResponse.json({ id: commande.id, reference: commande.reference });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
