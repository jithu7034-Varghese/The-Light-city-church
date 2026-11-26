// Globals seed (navbar, footer, site settings, announcement), from old-site-content.json.
import old from "../old-site-content.json";

const st = old.site.serviceTimes[0];
const item = (id: string, label: string, href: string) => ({ id, label, href });

export const GLOBAL_SEED = {
  site: {
    name: old.site.name,
    tagline: old.site.tagline,
    serviceTimes: [{ id: "sunday", day: st.day, time: st.time, venue: st.venue, address: st.address }],
    // The current site showed info@thelightcitychurch.org, but it isn't confirmed (open question 4),
    // so it starts empty: the church adds it in Settings.
    email: "",
    phone: "",
    whatsapp: old.site.whatsapp,
    paypal: { business: old.site.giving.paypalBusiness, itemName: old.site.giving.itemName, currency: old.site.giving.currency },
    socials: [
      { id: "facebook", network: "facebook", url: old.site.social.facebook },
      { id: "instagram", network: "instagram", url: old.site.social.instagram },
      { id: "youtube", network: "youtube", url: old.site.social.youtube },
      { id: "x", network: "x", url: old.site.social.x },
      { id: "podcast", network: "podcast", url: old.site.podcast.rss },
    ],
  },
  navbar: {
    logoText: "City",
    logoAccent: "Light",
    logoImage: null,
    items: [
      item("home", "Home", "/"),
      item("about", "About", "/about"),
      item("devotionals", "Devotionals", "/devotionals"),
      item("freedom", "Freedom from Religion", "/freedom-from-religion"),
      item("loved-circle", "The Loved Circle", "/the-loved-circle"),
      item("contact", "Contact", "/contact"),
    ],
    cta: { label: "Get Involved", href: "/contact" },
  },
  footer: {
    ctaHeading: "Prayer",
    ctaText: (old.pages.home.sections.find((s) => s.kind === "cta") as { text: string }).text,
    ctaButton: { label: "SEND US YOUR PRAYER REQUEST", href: "/contact" },
    columns: [
      { id: "church", heading: "Church", links: [item("about", "About", "/about"), item("ministries", "Ministries", "/ministries"), item("gallery", "Gallery", "/gallery"), item("devotionals", "Devotionals", "/devotionals")] },
      { id: "connect", heading: "Connect", links: [item("contact", "Contact Us", "/contact"), item("freedom", "Freedom from Religion", "/freedom-from-religion"), item("loved-circle", "The Loved Circle", "/the-loved-circle"), item("give", "Partner with us", "/give")] },
      { id: "legal", heading: "Legal", links: [item("privacy", "Privacy Policy", "/privacy-policy")] },
    ],
    showContact: true,
    showSocials: true,
    copyright: `Copyright © ${new Date().getUTCFullYear()} The Light City Church - All Rights Reserved.`,
    brandText: "LIGHT CITY",
  },
  announcement: { enabled: false, text: "", link: { label: "", href: "" } },
} as const;

export type GlobalSeedKey = keyof typeof GLOBAL_SEED;
