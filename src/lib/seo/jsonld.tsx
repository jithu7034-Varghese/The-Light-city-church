// JSON-LD structured data (schema.org). Builders are pure (unit-tested); <JsonLd> escapes "<" so
// CMS text can never close the <script> tag.
import type { SiteData } from "@/cms/globals";
import { absoluteUrl, siteUrl } from "./site";

type Json = Record<string, unknown>;

// U+2028 / U+2029 are valid in JSON but end a line in JavaScript, so they're escaped too.
const LINE_SEPARATORS = new RegExp(`[${String.fromCharCode(0x2028)}${String.fromCharCode(0x2029)}]`, "g");

export function serializeJsonLd(data: Json): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(LINE_SEPARATORS, (c) => `\\u${c.charCodeAt(0).toString(16)}`);
}

export function JsonLd({ data }: { data: Json }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}

const nonEmpty = <T,>(v: T | "" | null | undefined): v is T => v !== "" && v !== null && v !== undefined;

/** The church (schema.org/Church), from Site settings. */
export function churchJsonLd(site: SiteData, opts: { logoUrl?: string } = {}): Json {
  const service = site.serviceTimes[0];
  const sameAs = site.socials.map((s) => s.url).filter((u) => /^https?:\/\//.test(u));
  return {
    "@context": "https://schema.org",
    "@type": "Church",
    "@id": `${siteUrl()}/#church`,
    name: site.name || "The Light City Church",
    url: siteUrl(),
    ...(site.tagline && { description: site.tagline }),
    ...(opts.logoUrl && { logo: opts.logoUrl, image: opts.logoUrl }),
    ...(site.email && { email: site.email }),
    ...(site.phone && { telephone: site.phone }),
    ...(service?.address && {
      address: { "@type": "PostalAddress", streetAddress: [service.venue, service.address].filter(nonEmpty).join(", "), addressCountry: "GB" },
    }),
    ...(sameAs.length && { sameAs }),
    ...(site.serviceTimes.length && {
      event: site.serviceTimes.map((t) => ({
        "@type": "Event",
        name: `${t.day} service`,
        eventSchedule: { "@type": "Schedule", byDay: `https://schema.org/${t.day}`, startTime: t.time, scheduleTimezone: "Europe/London" },
        location: { "@type": "Place", name: t.venue, address: t.address },
      })),
    }),
  };
}

/** A devotional (schema.org/Article). */
export function articleJsonLd(
  post: { slug: string; title: string; excerpt: string | null; publishedAt: string; authorName: string; image: { url: string } | null },
  site: SiteData,
  description: string,
): Json {
  const url = absoluteUrl(`/devotionals/${post.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title.slice(0, 110),
    description,
    datePublished: post.publishedAt,
    author: { "@type": "Person", name: post.authorName },
    publisher: { "@type": "Organization", name: site.name || "The Light City Church", url: siteUrl() },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    ...(post.image && { image: [post.image.url] }),
  };
}
