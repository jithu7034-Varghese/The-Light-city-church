"use client";
import { useEffect, useRef, useState } from "react";
import { ExternalLink, Menu, X } from "lucide-react";
import { SidebarNav } from "./sidebar";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu, type ShellUser } from "./user-menu";
import { IdleTimeout } from "./idle-timeout";
import type { AdminTheme } from "../theme";

export function AdminShell({
  user,
  allowedNav,
  theme,
  children,
}: {
  user: ShellUser;
  allowedNav: string[];
  theme: AdminTheme;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDialogElement>(null);

  // Native <dialog> gives the drawer a focus trap, Escape-to-close and an inert page behind it.
  useEffect(() => {
    const el = drawerRef.current;
    if (!el) return;
    if (drawerOpen && !el.open) el.showModal();
    if (!drawerOpen && el.open) el.close();
  }, [drawerOpen]);

  return (
    <div className="min-h-dvh lg:pl-64">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-sm">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-surface lg:block">
        <SidebarNav allowed={allowedNav} />
      </aside>

      {/* Mobile drawer */}
      <dialog
        ref={drawerRef}
        onClose={() => setDrawerOpen(false)}
        onClick={(e) => e.target === drawerRef.current && setDrawerOpen(false)}
        aria-label="Navigation"
        className="m-0 h-dvh max-h-none w-72 max-w-[85vw] border-r border-border bg-surface p-0 text-fg lg:hidden"
      >
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="absolute right-3 top-4 rounded-md p-1.5 text-muted hover:bg-subtle hover:text-fg"
          aria-label="Close navigation"
        >
          <X className="size-5" />
        </button>
        <SidebarNav allowed={allowedNav} onNavigate={() => setDrawerOpen(false)} />
      </dialog>

      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur sm:px-6">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="-ml-1 rounded-md p-2 text-muted hover:bg-subtle hover:text-fg lg:hidden"
          aria-label="Open navigation"
          aria-expanded={drawerOpen}
        >
          <Menu className="size-5" />
        </button>
        <div className="flex-1" />
        <a
          href="/"
          target="_blank"
          rel="noopener"
          className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted hover:bg-subtle hover:text-fg sm:flex"
        >
          View site <ExternalLink className="size-3.5" aria-hidden />
        </a>
        <ThemeToggle initial={theme} />
        <UserMenu user={user} />
      </header>

      <main id="main" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        {children}
      </main>

      <IdleTimeout />
    </div>
  );
}
