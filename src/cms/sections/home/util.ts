// Small helpers shared by the home sections.
import { f, type LinkValue } from "@/cms/fields";

export const buttonFields = { label: f.text("Button label", { max: 80 }), link: f.link("Button link") };

/** Buttons that have a link and some label; empty ones are skipped. */
export function shownButtons(items: { id: string; label: string; link: LinkValue }[]) {
  return items
    .filter((b) => (b.label || b.link.label) && b.link.href)
    .map((b) => ({ id: b.id, label: b.label || b.link.label, href: b.link.href }));
}

/** External links open in a new tab. */
export function externalProps(href: string) {
  return /^https?:/i.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {};
}

/** A YouTube video id (11 chars), pulled out of a pasted URL if needed; "" if not valid. */
export function youtubeId(input: string): string {
  const s = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  const m = /(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/.exec(s);
  return m ? m[1] : "";
}

export const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/London" });
