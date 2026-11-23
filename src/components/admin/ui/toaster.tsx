"use client";
import { Toaster as Sonner } from "sonner";
import type { AdminTheme } from "../theme";

export { toast } from "sonner";

export function Toaster({ theme }: { theme: AdminTheme }) {
  return <Sonner theme={theme} position="top-right" richColors closeButton />;
}
