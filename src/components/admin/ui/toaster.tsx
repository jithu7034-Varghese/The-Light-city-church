"use client";
import { useSyncExternalStore } from "react";
import { Toaster as Sonner } from "sonner";
import { parseTheme } from "../theme";

export { toast } from "sonner";

// Follow <html data-theme> (set by the inline script and the theme toggle).
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

export function Toaster() {
  const theme = useSyncExternalStore(
    subscribe,
    () => parseTheme(document.documentElement.dataset.theme),
    () => "system" as const,
  );
  return <Sonner theme={theme} position="top-right" richColors closeButton />;
}
