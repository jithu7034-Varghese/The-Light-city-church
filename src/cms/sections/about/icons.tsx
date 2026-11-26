// Small line icons editors can pick for value / info cards (about + contact sections).
import { f } from "@/cms/fields";

export const iconField = (label = "Icon") =>
  f.select(
    label,
    [
      { value: "heart", label: "Heart" },
      { value: "star", label: "Star" },
      { value: "shield", label: "Shield" },
      { value: "users", label: "People" },
      { value: "clock", label: "Clock" },
      { value: "pin", label: "Map pin" },
      { value: "none", label: "No icon" },
    ] as const,
  );

export type IconName = "heart" | "star" | "shield" | "users" | "clock" | "pin" | "none";

export function Icon({ name, size = 24, strokeWidth = 2.5, className }: { name: IconName; size?: number; strokeWidth?: number; className?: string }) {
  if (name === "none") return null;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {name === "heart" && <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />}
      {name === "star" && <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />}
      {name === "shield" && <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />}
      {name === "users" && (
        <>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      )}
      {name === "clock" && (
        <>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </>
      )}
      {name === "pin" && (
        <>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </>
      )}
    </svg>
  );
}

/** Plain-text paragraphs: blank lines separate paragraphs. */
export function paragraphsOf(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
