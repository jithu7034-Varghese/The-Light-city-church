// Old site: /partner-with-us (wording verbatim from old-site-content.json).
import old from "../old-site-content.json";
import { paragraphs, type SeedPage } from "./helpers";

type S = { kind: string; [k: string]: unknown };
const sections = old.pages.give.sections as S[];
const find = (kind: string): unknown => sections.find((s) => s.kind === kind);

const why = find("text") as { heading: string; paragraphs: string[] };
const giving = find("giving") as { buttonLabel: string };
const proverb = find("scripture") as { text: string; reference: string };
const tithes = (old.pages.home.sections as S[]).find((s) => s.kind === "giving") as unknown as { heading: string; text: string };

export default {
  slug: "give",
  title: "Partner with us",
  seo: { title: "Partner with us | The Light City Church", description: "Monthly partners are an essential part of this ministry. Give online through PayPal." },
  sections: [
    { type: "page_hero", data: { eyebrow: "Give", heading: "Partner with us", subheading: "", image: null, buttons: [] } },
    { type: "rich_text", data: { heading: why.heading, body: paragraphs(...why.paragraphs), align: "left" } },
    { type: "giving", data: { heading: tithes.heading, text: tithes.text, buttonLabel: giving.buttonLabel } },
    { type: "scripture", data: { heading: "", text: proverb.text, reference: proverb.reference, buttons: [] } },
  ],
} satisfies SeedPage;
