// Service worker Coursa — notifications push du livreur.
// Reçoit un message push (envoyé par le serveur à la création d'une commande)
// et affiche une notification, même quand l'application est fermée.

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {};
  }

  const title = data.title || "Nouvelle commande";
  const options = {
    body: data.body || "Vous avez reçu une nouvelle commande.",
    tag: data.tag || "commande",
    renotify: true,
    data: { url: data.url || "/livreur/commandes" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Au clic : on met au premier plan un onglet déjà ouvert sur la page cible,
// sinon on en ouvre un nouveau.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url =
    (event.notification.data && event.notification.data.url) ||
    "/livreur/commandes";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((liste) => {
        for (const client of liste) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
      })
  );
});
