"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@/lib/constants";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

// Déconnexion par formulaire POST, jamais par un lien : Next.js préfetche
// les liens visibles en production, ce qui déconnectait l'utilisateur sans
// qu'il ait cliqué.
function BoutonDeconnexion({ className = "" }: { className?: string }) {
  return (
    <form action="/deconnexion" method="post" className={className}>
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
      >
        <span className="text-lg">🚪</span> Déconnexion
      </button>
    </form>
  );
}

export function DashboardShell({
  nav,
  espace,
  userName,
  notificationsHref,
  children,
}: {
  nav: NavItem[];
  espace: string;
  userName: string;
  // Si fourni, une cloche 🔔 apparaît dans la barre du haut (raccourci mobile
  // vers la page des notifications).
  notificationsHref?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== nav[0]?.href && pathname.startsWith(href));

  const NavLinks = () => (
    <nav className="space-y-1">
      {nav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            isActive(item.href)
              ? "bg-brand-600 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span className="text-lg">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Barre supérieure mobile */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2 font-extrabold">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="" className="h-8 w-8 rounded-lg" />
          {APP_NAME}
        </div>
        <div className="flex items-center gap-1">
          {notificationsHref && (
            <Link
              href={notificationsHref}
              onClick={() => setOpen(false)}
              aria-label="Notifications"
              className={`btn-ghost px-3 py-2 text-lg ${
                isActive(notificationsHref) ? "text-brand-600" : ""
              }`}
            >
              🔔
            </Link>
          )}
          <button onClick={() => setOpen(!open)} className="btn-ghost px-3 py-2" aria-label="Menu">
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Menu mobile déroulant */}
      {open && (
        <div className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <NavLinks />
          <BoutonDeconnexion className="mt-2" />
        </div>
      )}

      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar desktop */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-4 lg:flex">
          <div className="mb-6 flex items-center gap-2 px-2 text-lg font-extrabold">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.png" alt="" className="h-9 w-9 rounded-xl" />
            {APP_NAME}
          </div>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {espace}
          </p>
          <NavLinks />
          <div className="mt-auto border-t border-slate-100 pt-3">
            <div className="px-3 py-2 text-sm">
              <p className="font-semibold text-slate-800">{userName}</p>
            </div>
            <BoutonDeconnexion />
          </div>
        </aside>

        {/* Colonne de contenu */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Barre supérieure desktop : raccourci notifications à droite */}
          {notificationsHref && (
            <header className="sticky top-0 z-20 hidden items-center justify-end border-b border-slate-200 bg-white px-8 py-3 lg:flex">
              <Link
                href={notificationsHref}
                aria-label="Notifications"
                title="Notifications"
                className={`btn-ghost px-3 py-2 text-xl ${
                  isActive(notificationsHref) ? "text-brand-600" : ""
                }`}
              >
                🔔
              </Link>
            </header>
          )}

          <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
