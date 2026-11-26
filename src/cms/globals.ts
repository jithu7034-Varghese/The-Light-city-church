// Site-wide content ("globals" table): navbar, footer, site settings, announcement bar.
// Same field builders as sections, so the same generic editor edits them.
import { f, schemaOf, specsOf, type FieldSpec, type Fields, type FieldsValue } from "./fields";

const linkItem = { label: f.text("Label", { max: 60 }), href: f.text("Link (/page, https://…, mailto:…)", { max: 500 }) };

export const SOCIAL_NETWORKS = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "x", label: "X (Twitter)" },
  { value: "tiktok", label: "TikTok" },
  { value: "podcast", label: "Podcast" },
  { value: "whatsapp", label: "WhatsApp" },
] as const;

const siteFields = {
  name: f.text("Church name", { max: 120 }),
  tagline: f.textarea("Tagline", { max: 300 }),
  serviceTimes: f.list(
    "Service times",
    "Service",
    {
      day: f.text("Day", { max: 40, placeholder: "Sunday" }),
      time: f.text("Time", { max: 40, placeholder: "10:30am" }),
      venue: f.text("Venue", { max: 120 }),
      address: f.textarea("Address", { max: 300 }),
    },
    { max: 10, titleKey: "day" },
  ),
  email: f.text("Contact email", { max: 200, help: "Shown on the contact page and footer. Leave empty to hide." }),
  phone: f.text("Phone", { max: 40, help: "Leave empty to hide." }),
  whatsapp: f.text("WhatsApp link", { max: 200, placeholder: "https://wa.me/44…" }),
  paypal: f.group("PayPal giving", {
    business: f.text("PayPal account email or merchant ID", { max: 200, help: "Where gifts go. Confirm with the church treasurer." }),
    itemName: f.text("Item name shown in PayPal", { max: 100 }),
    currency: f.select("Currency", [{ value: "GBP", label: "GBP (£)" }, { value: "EUR", label: "EUR (€)" }, { value: "USD", label: "USD ($)" }] as const),
  }),
  socials: f.list(
    "Social media",
    "Profile",
    { network: f.select("Network", SOCIAL_NETWORKS), url: f.text("Profile link", { max: 300 }) },
    { max: 10, titleKey: "network" },
  ),
  sectionBackground: f.image("Section background image", {
    help: "The standard nature photo behind photo sections (page headings, scripture, service times, prayer, calls to action) whenever a section has no photo of its own. Also the footer scene if the footer has none. Leave empty for a plain dark gradient.",
  }),
  devotionals: f.group(
    "Devotionals pages",
    {
      heroEyebrow: f.text("Heading: small text above the title (optional)", { max: 80, help: "e.g. DAILY DEVOTIONAL. Leave empty to hide it." }),
      heroTitle: f.text("Heading: title", { max: 120, default: "Daily Light Devotionals" }),
      heroText: f.textarea("Heading: text under the title", {
        max: 400,
        default: "Grow in the accurate teaching of the Gospel of grace. Read, reflect and pray with Pastor Ronnie Dube.",
      }),
      allLabel: f.text("Filter button for all devotionals", { max: 40, default: "All" }),
      loadingText: f.text("Text while the list loads", { max: 80, default: "Loading devotionals…" }),
      emptyText: f.text("Text when there are no devotionals yet", { max: 160, default: "New devotionals are coming soon." }),
      unknownCategoryText: f.text("Text for a category that doesn't exist", { max: 160, default: "That category doesn't exist." }),
      seeAllLabel: f.text("Link back to all devotionals", { max: 60, default: "See all devotionals" }),
      emptyPageText: f.text("Text for a page number past the end", { max: 160, default: "No devotionals on this page." }),
      backToLatestLabel: f.text("Link back to the first page", { max: 60, default: "Back to the latest" }),
      newerLabel: f.text("Newer page button", { max: 40, default: "← Newer" }),
      olderLabel: f.text("Older page button", { max: 40, default: "Older →" }),
      pageStatus: f.text("Page counter", { max: 60, default: "Page {page} of {pages}", help: "{page} and {pages} are replaced by the numbers." }),
      fallbackCategory: f.text("Label for devotionals without a category", { max: 40, default: "Devotional" }),
      backLabel: f.text("Devotional page: link back to the list", { max: 60, default: "← All devotionals" }),
      relatedHeading: f.text("Devotional page: heading above more devotionals", { max: 80, default: "More devotionals" }),
      heroImage: f.image("Heading photo", { help: "Nature photo behind the heading of the devotionals list. A devotional's own featured image is used on its page. Leave empty to use the Section background image above." }),
    },
    { help: "Wording and the heading photo for /devotionals and each devotional page." },
  ),
};

const navbarFields = {
  logoImage: f.image("Logo image (optional)", { help: "The crown logo, shown in front of the logo text in the header and footer." }),
  logoText: f.text("Logo text (bold part)", { max: 30, default: "City" }),
  logoAccent: f.text("Logo text (light part)", { max: 30, default: "Light" }),
  items: f.list("Menu items", "Menu item", linkItem, { max: 10, titleKey: "label" }),
  cta: f.link("Button on the right"),
};

const footerFields = {
  taglineAccent: f.text("Tagline: first part, in amber (optional)", { max: 60, help: "Shown top right, e.g. CHRIST IN YOU. Leave both tagline parts empty to hide it." }),
  tagline: f.text("Tagline: rest, in white (optional)", { max: 80, help: "e.g. THE HOPE OF GLORY." }),
  ctaHeading: f.text("Call-to-action heading", { max: 160 }),
  ctaText: f.textarea("Call-to-action text", { max: 600 }),
  ctaButton: f.link("Call-to-action button"),
  columns: f.list(
    "Link columns",
    "Column",
    { heading: f.text("Column heading", { max: 60 }), links: f.list("Links", "Link", linkItem, { max: 12, titleKey: "label" }) },
    { max: 5, titleKey: "heading" },
  ),
  showSocials: f.boolean("Show social media links (from Site settings)", { default: true }),
  socialsHeading: f.text("Heading above the social links (optional)", { max: 40, help: "e.g. SOCIALS. Leave empty for no heading." }),
  showContact: f.boolean("Show email, WhatsApp and service times (from Site settings)", { default: true }),
  visitHeading: f.text("Heading above the service times (optional)", { max: 40, help: "e.g. VISIT. Leave empty for no heading." }),
  whatsappLabel: f.text("WhatsApp link text", { max: 40, default: "WhatsApp" }),
  copyright: f.text("Copyright line", { max: 200 }),
  brandText: f.text("Large brand text", { max: 30, default: "LIGHT CITY" }),
  sceneImage: f.image("Scene photo at the top of the footer", {
    help: "A wide evening/nature photo that fades into the dark footer. Leave empty to use the Section background image from Site settings.",
  }),
};

const announcementFields = {
  enabled: f.boolean("Show the announcement bar"),
  text: f.text("Message", { max: 200 }),
  link: f.link("Link (optional)"),
};

export type GlobalKey = "navbar" | "footer" | "site" | "announcement";

function defineGlobal<F extends Fields>(key: GlobalKey, label: string, module: "globals" | "settings", fields: F) {
  const schema = schemaOf(fields);
  return {
    key,
    label,
    /** Permission module (site settings use "settings", like the DB's publish_global). */
    module,
    specs: specsOf(fields) as Record<string, FieldSpec>,
    parse: (data: unknown): FieldsValue<F> => {
      const r = schema.safeParse(data ?? {});
      return r.success ? r.data : schema.parse({});
    },
    validate: (data: unknown) => {
      const r = schema.safeParse(data);
      if (r.success) return { ok: true as const, data: r.data };
      const i = r.error.issues[0];
      return { ok: false as const, error: `${i?.path.join(" → ") || key}: ${i?.message ?? "invalid"}` };
    },
  };
}

export const GLOBALS = {
  navbar: defineGlobal("navbar", "Navbar", "globals", navbarFields),
  footer: defineGlobal("footer", "Footer", "globals", footerFields),
  site: defineGlobal("site", "Site settings", "settings", siteFields),
  announcement: defineGlobal("announcement", "Announcement bar", "globals", announcementFields),
};

export type NavbarData = FieldsValue<typeof navbarFields>;
export type FooterData = FieldsValue<typeof footerFields>;
export type SiteData = FieldsValue<typeof siteFields>;
export type AnnouncementData = FieldsValue<typeof announcementFields>;
