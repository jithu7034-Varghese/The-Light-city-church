// Public site footer + announcement bar, driven by the published "footer", "site", "navbar" and
// "announcement" globals. Server components.
// Design: dark footer (#0B0F16) with the Site settings "Section background image" as the scene at
// the top fading to dark, logo on a white badge, link columns with rules, legal row, wordmark.
import Link from "next/link";
import shared from "@/cms/sections/shared/shared.module.css";
import c from "./chrome.module.css";
import { Logo } from "./SiteChrome";
import { SOCIAL_NETWORKS, type AnnouncementData, type FooterData, type SiteData } from "@/cms/globals";
import { safeHref } from "@/lib/tiptap/render";

const networkLabel = (n: string) => SOCIAL_NETWORKS.find((s) => s.value === n)?.label ?? n;

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) =>
  href.startsWith("/") && !href.startsWith("//") ? (
    <Link href={href}>{children}</Link>
  ) : (
    <a href={href} {...(/^https?:/.test(href) ? { target: "_blank", rel: "noopener" } : {})}>{children}</a>
  );

export function SiteFooter({
  footer,
  site,
  brand,
  background,
}: {
  footer: FooterData;
  site: SiteData;
  brand: { logoText: string; logoAccent: string; logo: { url: string; alt: string } | null };
  background: { url: string } | null;
}) {
  const socials = footer.showSocials ? site.socials.filter((s) => safeHref(s.url)) : [];
  const columns = footer.columns
    .map((col) => ({ ...col, links: col.links.filter((l) => l.label && safeHref(l.href)) }))
    .filter((col) => col.heading || col.links.length > 0);
  const contact = footer.showContact;
  const ctaButton = footer.ctaButton.href ? (
    <FooterLink href={footer.ctaButton.href}>
      <span className={c.footerOutlineBtn}>{footer.ctaButton.label || "Contact us"}</span>
    </FooterLink>
  ) : null;

  return (
    <footer className={c.footer} id="footer">
      {background && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={background.url} alt="" aria-hidden className={c.footerScene} loading="lazy" />
      )}
      <span className={c.footerFade} aria-hidden />
      <div className={c.footerInner}>
        <div className={c.footerTop}>
          <Logo {...brand} className={c.footerLogo} />
        </div>

        <div className={c.footerScenespace}>
          {(footer.ctaHeading || footer.ctaText) && (
            <div className={c.footerCta}>
              {footer.ctaHeading && <h2 className={c.footerCtaHeading}>{footer.ctaHeading}</h2>}
              {footer.ctaText && <p className={c.footerCtaText}>{footer.ctaText}</p>}
              {!contact && ctaButton && <div className={c.footerCtaButton}>{ctaButton}</div>}
            </div>
          )}
        </div>

        <nav className={c.footerColumns} aria-label="Footer">
          {columns.map((col) => (
            <div key={col.id} className={c.footerColumn}>
              {col.heading && <p className={c.footerHeading}>{col.heading}</p>}
              <ul className={c.footerLinks}>
                {col.links.map((l) => (
                  <li key={l.id}><FooterLink href={l.href}>{l.label}</FooterLink></li>
                ))}
              </ul>
            </div>
          ))}
          {socials.length > 0 && (
            <div className={c.footerColumn}>
              {/* No CMS heading exists for this column; keep the rule aligned with the others. */}
              <span className={c.footerHeadingSpacer} aria-hidden />
              <ul className={c.footerLinks}>
                {socials.map((s) => (
                  <li key={s.id}><a href={s.url} target="_blank" rel="noopener">{networkLabel(s.network)}</a></li>
                ))}
              </ul>
            </div>
          )}
          {contact && (site.serviceTimes.length > 0 || site.email || site.phone || site.whatsapp || ctaButton) && (
            <div className={`${c.footerColumn} ${c.footerVisit}`}>
              <span className={c.footerHeadingSpacer} aria-hidden />
              <ul className={c.footerLinks}>
                {site.serviceTimes.map((t) => (
                  <li key={t.id} className={c.footerVisitItem}>
                    {(t.day || t.time) && <span>{[t.day, t.time].filter(Boolean).join(" ")}</span>}
                    {t.venue && <span>{t.venue}</span>}
                    {t.address && <span>{t.address}</span>}
                  </li>
                ))}
                {site.email && <li><a href={`mailto:${site.email}`}>{site.email}</a></li>}
                {site.phone && <li><a href={`tel:${site.phone.replace(/[^\d+]/g, "")}`}>{site.phone}</a></li>}
                {site.whatsapp && safeHref(site.whatsapp) && <li><a href={site.whatsapp} target="_blank" rel="noopener">WhatsApp</a></li>}
              </ul>
              {ctaButton && <div className={c.footerCtaButton}>{ctaButton}</div>}
            </div>
          )}
        </nav>

        {footer.copyright && (
          <div className={c.footerLegal}>
            <span>{footer.copyright}</span>
          </div>
        )}
      </div>
      {footer.brandText && (
        <div className={c.wordmarkClip} aria-hidden>
          <p className={c.wordmark}>{footer.brandText}</p>
        </div>
      )}
    </footer>
  );
}

export function AnnouncementBar({ data }: { data: AnnouncementData }) {
  if (!data.enabled || !data.text) return null;
  return (
    <div className={shared.announcement} role="region" aria-label="Announcement">
      {data.text}
      {data.link.href && <a href={data.link.href}>{data.link.label || "Find out more"}</a>}
    </div>
  );
}
