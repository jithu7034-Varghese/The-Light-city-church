// Public site footer + announcement bar, driven by the published "footer", "site" and
// "announcement" globals. Server components.
import Link from "next/link";
import styles from "@/app/(site)/page.module.css";
import shared from "@/cms/sections/shared/shared.module.css";
import chrome from "./chrome.module.css";
import { SOCIAL_NETWORKS, type AnnouncementData, type FooterData, type SiteData } from "@/cms/globals";
import { safeHref } from "@/lib/tiptap/render";

const networkLabel = (n: string) => SOCIAL_NETWORKS.find((s) => s.value === n)?.label ?? n;

export function SiteFooter({ footer, site }: { footer: FooterData; site: SiteData }) {
  const socials = site.socials.filter((s) => safeHref(s.url));
  return (
    <footer className={styles.ctaFooterSection} id="footer">
      <div className={styles.ctaFooterContainer}>
        {(footer.ctaHeading || footer.ctaText) && (
          <div className={styles.ctaContent}>
            {footer.ctaHeading && <h2 className={styles.ctaHeadline}>{footer.ctaHeading}</h2>}
            {footer.ctaText && <p className={styles.ctaSubtext}>{footer.ctaText}</p>}
            {footer.ctaButton.href && (
              <div className={styles.ctaButtonWrapper}>
                <Link href={footer.ctaButton.href} className={styles.ctaButton}>{footer.ctaButton.label || "Contact us"}</Link>
              </div>
            )}
          </div>
        )}
        <div className={styles.footerOverlay}>
          {footer.copyright && (
            <div className={styles.footerTopRow}>
              <span className={styles.footerCopyrightText}>{footer.copyright}</span>
            </div>
          )}
          {footer.columns.length > 0 && (
            <nav className={chrome.columns} aria-label="Footer">
              {footer.columns.map((col) => (
                <div key={col.id}>
                  {col.heading && <p className={chrome.columnHeading}>{col.heading}</p>}
                  <ul className={chrome.columnLinks}>
                    {col.links.filter((l) => l.label && safeHref(l.href)).map((l) => (
                      <li key={l.id}><Link href={l.href}>{l.label}</Link></li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          )}
          {footer.showContact && (
            <div className={chrome.contactRow}>
              {site.serviceTimes.map((t) => (
                <span key={t.id}>{t.day} {t.time} · {t.venue}</span>
              ))}
              {site.email && <a href={`mailto:${site.email}`}>{site.email}</a>}
              {site.phone && <a href={`tel:${site.phone.replace(/[^\d+]/g, "")}`}>{site.phone}</a>}
              {site.whatsapp && safeHref(site.whatsapp) && <a href={site.whatsapp} target="_blank" rel="noopener">WhatsApp</a>}
            </div>
          )}
          {footer.showSocials && socials.length > 0 && (
            <div className={chrome.socials}>
              {socials.map((s) => (
                <a key={s.id} href={s.url} target="_blank" rel="noopener">{networkLabel(s.network)}</a>
              ))}
            </div>
          )}
          {footer.brandText && (
            <div className={styles.giantBrandContainer}>
              <p className={styles.giantBrandText} aria-hidden>{footer.brandText}</p>
            </div>
          )}
        </div>
      </div>
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
