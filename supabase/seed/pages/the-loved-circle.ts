// Old site: /the-loved-circle (wording verbatim from old-site-content.json).
import old from "../old-site-content.json";
import { button, img, paragraphs, type SeedPage } from "./helpers";

type S = { kind: string; [k: string]: unknown };
const sections = old.pages["the-loved-circle"].sections as S[];
const find = (kind: string, n = 0): unknown => sections.filter((s) => s.kind === kind)[n];

const intro = find("text_image") as { heading: string; paragraphs: string[] };
const quote = find("scripture", 0) as { text: string; buttons: { label: string; href: string }[] };
const pod = find("podcast") as { heading: string; subheading: string; text: string; rss: string; episodes: { title: string; date?: string; duration?: string }[] };
const form = find("form") as { heading: string; subheading: string };
const verse = find("scripture", 1) as { text: string; reference: string };

const fmtDate = (d?: string) => (d ? new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "");

export default {
  slug: "the-loved-circle",
  title: "The Loved Circle",
  seo: { title: "The Loved Circle | The Light City Church", description: "A circle of sisterhood that helps you on a journey of self-discovery, healing, wellness, success and above all love." },
  sections: [
    { type: "page_hero", data: { eyebrow: "The Loved Circle", heading: intro.heading, subheading: "", image: img("nature/lake.jpg"), buttons: [] } },
    { type: "text_image", data: { heading: "", body: paragraphs(...intro.paragraphs), image: img("ronnyandanna.jpeg"), imageSide: "right", buttons: [] } },
    { type: "scripture", data: { image: img("nature/hills.jpg"), heading: "", text: quote.text, reference: "", buttons: quote.buttons.map((b, i) => button(`quote-${i + 1}`, b.label, b.href)) } },
    {
      type: "podcast",
      data: {
        heading: pod.heading,
        subheading: pod.subheading,
        text: pod.text,
        link: { label: "Listen to the podcast", href: pod.rss },
        episodes: pod.episodes.map((e, i) => ({ id: `ep-${i + 1}`, title: e.title, date: fmtDate(e.date), duration: e.duration ?? "" })),
      },
    },
    { type: "enquiry_form", data: { heading: form.heading, subheading: form.subheading, formSlug: "loved-circle", buttonLabel: "SEND" } },
    { type: "scripture", data: { heading: "", text: verse.text, reference: verse.reference, buttons: [], image: img("nature/lake.jpg") } },
  ],
} satisfies SeedPage;
