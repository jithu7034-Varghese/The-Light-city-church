// Privacy policy from supabase/seed/privacy-policy.md (a DRAFT the church must review and
// complete: its [bracketed] items show on the page until edited in the admin).
import fs from "node:fs";
import path from "node:path";
import { markdown, type SeedPage } from "./helpers";

const md = fs.readFileSync(path.resolve(import.meta.dirname, "../privacy-policy.md"), "utf8").replace(/^#\s+Privacy Policy\s*$/m, ""); // the page heading shows the title

export default {
  slug: "privacy-policy",
  title: "Privacy Policy",
  seo: { title: "Privacy Policy | The Light City Church", description: "How The Light City Church collects, uses and protects your personal information." },
  sections: [
    { type: "page_hero", data: { eyebrow: "", heading: "Privacy Policy", subheading: "", image: null, buttons: [] } },
    { type: "rich_text", data: { heading: "", body: markdown(md), align: "left" } },
  ],
} satisfies SeedPage;
