// Old site: /freedom-from-religion (wording verbatim from old-site-content.json).
import old from "../old-site-content.json";
import { article, button, img, paragraphs, type SeedPage } from "./helpers";

type S = { kind: string; [k: string]: unknown };
const sections = old.pages["freedom-from-religion"].sections as S[];
const find = (kind: string, n = 0): unknown => sections.filter((s) => s.kind === kind)[n];

const hero = find("hero") as { heading: string; subheading: string };
const body = find("rich_text") as { paragraphs: (string | { scripture: string; reference: string })[] };
const prayer = find("scripture") as { heading: string; text: string };
const congrats = find("text") as { heading: string; text: string };
const form = find("form") as { heading: string; subheading: string };
const visit = find("cta") as { heading: string; text: string; buttons: { label: string; href: string }[] };

export default {
  slug: "freedom-from-religion",
  title: "Freedom from Religion",
  seo: { title: "Be free from religion | The Light City Church", description: "Freedom and peace with God is free. The only requirement is faith in Jesus Christ. Pray the prayer of salvation today." },
  sections: [
    { type: "page_hero", data: { eyebrow: "", heading: hero.heading, subheading: hero.subheading, image: img("nature/meadow.jpg"), buttons: [] } },
    { type: "rich_text", data: { heading: "", body: article(body.paragraphs), align: "left" } },
    { type: "scripture", data: { heading: prayer.heading, text: prayer.text, reference: "", buttons: [], image: img("nature/meadow.jpg") } },
    { type: "rich_text", data: { heading: congrats.heading, body: paragraphs(congrats.text), align: "center" } },
    { type: "enquiry_form", data: { heading: form.heading, subheading: form.subheading, formSlug: "salvation", buttonLabel: "SEND" } },
    { type: "cta", data: { eyebrow: "", image: img("nature/twilight.jpg"), heading: visit.heading, text: visit.text, buttons: visit.buttons.map((b, i) => button(`visit-${i + 1}`, b.label, b.href)) } },
  ],
} satisfies SeedPage;
