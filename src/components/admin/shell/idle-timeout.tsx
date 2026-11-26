"use client";
// Signs the user out after IDLE_TIMEOUT_MINUTES without activity in any admin tab
// (last activity is shared between tabs through localStorage), with a warning first.
import { useEffect } from "react";
import { toast } from "sonner";
import { IDLE_TIMEOUT_MINUTES } from "@/lib/auth/gate";

const KEY = "admin-last-activity";
const WARN_BEFORE_MS = 2 * 60_000;
const EVENTS = ["pointerdown", "keydown", "scroll", "pointermove"] as const;

function readLast(fallback: number): number {
  try {
    return Number(localStorage.getItem(KEY)) || fallback;
  } catch {
    return fallback;
  }
}

export function IdleTimeout({ minutes = IDLE_TIMEOUT_MINUTES }: { minutes?: number }) {
  useEffect(() => {
    const limit = minutes * 60_000;
    let last = Date.now();
    let warned = false;
    let lastWrite = 0;

    const touch = () => {
      last = Date.now();
      if (warned) {
        toast.dismiss("idle-warning");
        warned = false;
      }
      if (last - lastWrite > 15_000) {
        lastWrite = last;
        try { localStorage.setItem(KEY, String(last)); } catch { /* storage unavailable: per-tab only */ }
      }
    };
    touch();

    const timer = window.setInterval(() => {
      const latest = Math.max(last, readLast(last));
      const idle = Date.now() - latest;
      if (idle >= limit) {
        // Full page load (not router.push) so the route handler can clear the auth cookies.
        window.location.assign(new URL("/api/auth/signout?reason=idle", window.location.origin).href);
      } else if (idle >= limit - WARN_BEFORE_MS && !warned) {
        warned = true;
        toast.warning("You'll be signed out in 2 minutes", {
          id: "idle-warning",
          description: "Move the mouse or press a key to stay signed in.",
          duration: WARN_BEFORE_MS,
        });
      }
    }, 15_000);

    EVENTS.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    return () => {
      window.clearInterval(timer);
      EVENTS.forEach((e) => window.removeEventListener(e, touch));
    };
  }, [minutes]);

  return null;
}
