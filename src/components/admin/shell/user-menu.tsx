"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { signOut, signOutEverywhere } from "@/app/(admin)/admin/(auth)/actions";

export type ShellUser = {
  name: string;
  email: string;
  roleLabel: string;
  mfaOn: boolean;
};

function initials(name: string, email: string) {
  const source = name.trim() || email;
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function UserMenu({ user }: { user: ShellUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const itemCls = "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-fg hover:bg-subtle";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-subtle"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
          {initials(user.name, user.email)}
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block max-w-40 truncate text-sm font-medium text-fg">{user.name || user.email}</span>
          <span className="block text-xs text-muted">{user.roleLabel}</span>
        </span>
        <ChevronDown className="size-4 text-muted" aria-hidden />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-border bg-surface p-1.5 shadow-lg">
          <div className="border-b border-border px-2.5 pb-2.5 pt-1.5">
            <p className="truncate text-sm font-medium text-fg">{user.name || "No name set"}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
            <p className="mt-1.5 flex items-center gap-1 text-xs text-muted">
              <ShieldCheck className="size-3.5" aria-hidden /> 2FA {user.mfaOn ? "on" : "off"}
            </p>
          </div>
          <form action={signOutEverywhere} className="pt-1.5">
            <button type="submit" role="menuitem" className={itemCls}>
              <MonitorSmartphone className="size-4 text-muted" aria-hidden /> Sign out of all devices
            </button>
          </form>
          <form action={signOut}>
            <button type="submit" role="menuitem" className={itemCls}>
              <LogOut className="size-4 text-muted" aria-hidden /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
