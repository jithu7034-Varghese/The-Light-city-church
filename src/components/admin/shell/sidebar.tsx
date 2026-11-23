"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Church } from "lucide-react";
import { cn } from "../ui/cn";
import { NAV, isActive } from "./nav";

/** Sidebar contents, shared by the desktop rail and the mobile drawer. */
export function SidebarNav({ allowed, onNavigate }: { allowed: string[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const allowedSet = new Set(allowed);

  return (
    <div className="flex h-full flex-col">
      <Link href="/admin" onClick={onNavigate} className="flex h-16 shrink-0 items-center gap-2.5 px-5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-fg">
          <Church className="size-4.5" aria-hidden />
        </span>
        <span className="text-sm font-semibold leading-tight text-fg">
          The Light City
          <span className="block text-xs font-normal text-muted">Admin</span>
        </span>
      </Link>

      <nav aria-label="Admin" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {NAV.map((group) => {
          const items = group.items.filter((i) => allowedSet.has(i.key));
          if (items.length === 0) return null;
          return (
            <div key={group.label}>
              <p className="px-2 pb-1.5 text-xs font-medium uppercase tracking-wide text-muted">{group.label}</p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(pathname, item.href);
                  const base = "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors";
                  if (!item.ready) {
                    return (
                      <li key={item.key}>
                        <span aria-disabled className={cn(base, "cursor-default text-muted/70")}>
                          <Icon className="size-4 shrink-0" aria-hidden />
                          <span className="flex-1">{item.label}</span>
                          <span className="rounded bg-subtle px-1.5 py-0.5 text-[10px] font-semibold uppercase">Soon</span>
                        </span>
                      </li>
                    );
                  }
                  return (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(base, active ? "bg-primary/10 text-primary" : "text-fg hover:bg-subtle")}
                      >
                        <Icon className="size-4 shrink-0" aria-hidden />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
