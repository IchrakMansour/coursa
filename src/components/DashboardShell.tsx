"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@/lib/constants";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  // Libellé court pour la barre d'onglets mobile (sinon on tronque le label).
  short?: string;
}

// Déconnexion par formulaire POST, jamais par un lien : Next.js préfetche
// les liens visibles en production, ce qui déconnectait l'utilisateur sans
// qu'il ait cliqué.
function BoutonDeconnexion({ className = "" }: { className?: string }) {
  return (
    <form action="/deconnexion" method="post" className={className}>
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
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
  notificationsHref?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== nav[0]?.href && pathname.startsWith(href));

  // Barre d'onglets mobile : jusqu'à 4 items principaux + un onglet « Plus »
  // qui ouvre le reste et la déconnexion (façon Uber).
  const tabs = nav.slice(0, 4);
  const plus = nav.slice(4);

  // Menu latéral (desktop) et liste du panneau « Plus »
  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <nav className="space-y-1">
      {nav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClick}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            isActive(item.href)
              ? "bg-brand-900 text-white"
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
      {/* Barre supérieure mobile : logo + notifications */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2 font-extrabold">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="" className="h-8 w-8 rounded-lg" />
          {APP_NAME}
        </div>
        {notificationsHref && (
          <Link
            href={notificationsHref}
            aria-label="Notifications"
            className={`btn-ghost px-3 py-2 text-lg ${
              isActive(notificationsHref) ? "text-brand-900" : ""
            }`}
          >
            🔔
          </Link>
        )}
      </div>

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
                  isActive(notificationsHref) ? "text-brand-900" : ""
                }`}
              >
                🔔
              </Link>
            </header>
          )}

          <main className="min-w-0 flex-1 p-5 pb-24 sm:p-8 sm:pb-24 lg:p-10 lg:pb-10">
            {children}
          </main>
        </div>
      </div>

      {/* Barre d'onglets mobile (bas d'écran, façon Uber) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        {tabs.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
              isActive(item.href) ? "text-brand-900" : "text-slate-500"
            }`}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className="max-w-full truncate px-1">
              {item.short ?? item.label}
            </span>
          </Link>
        ))}
        <button
          onClick={() => setOpen(true)}
          className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
            open ? "text-brand-900" : "text-slate-500"
          }`}
          aria-label="Plus"
        >
          <span className="text-xl leading-none">⋯</span>
          <span>Plus</span>
        </button>
      </nav>

      {/* Panneau « Plus » (reste du menu + déconnexion) */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200" />
            <p className="px-1 pb-2 text-sm font-semibold text-slate-800">
              {userName}
            </p>
            {plus.length > 0 && (
              <nav className="space-y-1">
                {plus.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive(item.href)
                        ? "bg-brand-900 text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}
            <BoutonDeconnexion className="mt-1" />
          </div>
        </div>
      )}
    </div>
  );
}
