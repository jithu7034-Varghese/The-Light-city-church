// Home: senior pastors, with a photo, tabs (story / values / connect) and social links.
import { defineSection } from "@/cms/define";
import { f } from "@/cms/fields";
import { SplitText, ViewportSection } from "@/cms/sections/shared/animate";
import { safeHref, TiptapContent } from "@/lib/tiptap/render";
import styles from "@/app/(site)/page.module.css";
import h from "./home.module.css";
import { PastorTabs } from "./pastor-tabs";
import { socialIcon } from "./social-icons";
import { buttonFields, externalProps, shownButtons } from "./util";

export const homePastor = defineSection({
  type: "home_pastor",
  label: "Home: our pastors",
  description: "Photo of the pastors, a short introduction in tabs, and the church's social links.",
  fields: {
    image: f.image("Photo"),
    badgeName: f.text("Name on the photo", { max: 80 }),
    badgeRole: f.text("Role on the photo", { max: 80 }),
    tag: f.text("Small text above the heading", { max: 60 }),
    heading: f.text("Heading", { max: 120 }),
    headingLine2: f.text("Heading, second line (lighter)", { max: 120 }),
    quote: f.textarea("Quote (optional)", { max: 500 }),
    tabs: f.list(
      "Tabs",
      "Tab",
      {
        label: f.text("Tab name", { max: 40 }),
        body: f.richtext("Text"),
        buttons: f.list("Buttons", "Button", buttonFields, { max: 2, titleKey: "label" }),
      },
      { max: 5, titleKey: "label" },
    ),
    socialLabel: f.text("Text before the social links", { max: 80, help: "The links themselves come from Site settings." }),
    showSocials: f.boolean("Show social links", { default: true }),
  },
  Component: ({ data, ctx }) => {
    const img = ctx.image(data.image);
    const tabs = data.tabs.filter((t) => t.label);
    const socials = data.showSocials ? ctx.site.socials.flatMap((s) => {
          const url = safeHref(s.url);
          return url ? [{ ...s, url }] : [];
        })
      : [];
    return (
      <ViewportSection className={styles.pastorSection} id="pastor">
        <div className={styles.pastorCard}>
          <div className={styles.pastorGrid}>
            <div className={`${styles.pastorImageWrapper} animate-premium-block`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {img ? <img src={img.url} alt={img.alt} loading="lazy" className={`${styles.pastorImage} ${h.fill}`} /> : <div className={h.placeholder} />}
              {(data.badgeName || data.badgeRole) && (
                <div className={styles.pastorFloatingBadge}>
                  {data.badgeName && <h4 className={styles.badgeName}>{data.badgeName}</h4>}
                  {data.badgeRole && <p className={styles.badgeRole}>{data.badgeRole}</p>}
                </div>
              )}
            </div>

            <div className={styles.pastorInfo}>
              {data.tag && (
                <span className={styles.pastorTag}>
                  <SplitText text={data.tag} delayOffset={0.0} />
                </span>
              )}
              {(data.heading || data.headingLine2) && (
                <h2 className={styles.pastorTitle}>
                  {data.heading && <SplitText text={data.heading} delayOffset={0.1} />}
                  {data.heading && data.headingLine2 && <br />}
                  {data.headingLine2 && (
                    <span className={styles.gradientText}>
                      <SplitText text={data.headingLine2} delayOffset={0.6} />
                    </span>
                  )}
                </h2>
              )}

              {data.quote && (
                <blockquote className={`${styles.pastorQuote} animate-fade-in-up`} style={{ animationDelay: "1.1s" }}>
                  &ldquo;{data.quote}&rdquo;
                </blockquote>
              )}

              {tabs.length > 0 && (
                <PastorTabs
                  labels={tabs.map((t) => t.label)}
                  panels={tabs.map((t) => {
                    const buttons = shownButtons(t.buttons);
                    return (
                      <div key={t.id} className={h.tabRich}>
                        <TiptapContent doc={t.body} />
                        {buttons.length > 0 && (
                          <div className={styles.connectButtons}>
                            {buttons.map((b, i) => (
                              <a key={b.id} href={b.href} {...externalProps(b.href)} className={i === 0 ? styles.connectMailBtn : styles.connectInstaBtn}>
                                {b.label}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                />
              )}

              {socials.length > 0 && (
                <div className={`${styles.socialRow} animate-fade-in-up`} style={{ animationDelay: "1.5s" }}>
                  {data.socialLabel && <span className={styles.socialLabel}>{data.socialLabel}</span>}
                  <div className={styles.socialIcons}>
                    {socials.map((s) => (
                      <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.network} className={styles.socialIconLink}>
                        {socialIcon(s.network)}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </ViewportSection>
    );
  },
});
