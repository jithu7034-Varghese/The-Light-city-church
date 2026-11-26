// Home: senior pastors, with a photo, tabs (story / values / connect) and social links.
import { defineSection } from "@/cms/define";
import { f } from "@/cms/fields";
import { ViewportSection } from "@/cms/sections/shared/animate";
import { safeHref, TiptapContent } from "@/lib/tiptap/render";
import { AccentHeading, ds, PillButtons, SectionTag } from "@/components/site/ds";
import h from "./home.module.css";
import { PastorTabs } from "./pastor-tabs";
import { socialIcon } from "./social-icons";
import { buttonFields } from "./util";

/** "With Grace & Vision" → "With Grace & " + italic "Vision". */
function accentLast(text: string) {
  const t = text.trim();
  const cut = t.lastIndexOf(" ");
  if (cut <= 0) return t;
  return (
    <>
      {t.slice(0, cut + 1)}
      <span className={ds.accent}>{t.slice(cut + 1)}</span>
    </>
  );
}

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
    const socials = data.showSocials
      ? ctx.site.socials.flatMap((s) => {
          const url = safeHref(s.url);
          return url ? [{ ...s, url }] : [];
        })
      : [];
    return (
      <ViewportSection className={ds.section} id="pastor">
        <div className={`${ds.container} ${h.pastorRow}`}>
          <div className={`${h.pastorPhoto} ${ds.reveal}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {img ? <img src={img.url} alt={img.alt} loading="lazy" className={h.fill} /> : <div className={h.placeholder} />}
            {(data.badgeName || data.badgeRole) && (
              <div className={h.nameCard}>
                {data.badgeName && <h4 className={h.nameCardName}>{data.badgeName}</h4>}
                {data.badgeRole && <p className={h.nameCardRole}>{data.badgeRole}</p>}
              </div>
            )}
          </div>

          <div className={`${h.pastorInfo} ${ds.reveal}`}>
            {(data.tag || data.heading || data.headingLine2) && (
              <div className={h.pastorHeading}>
                {data.tag && <SectionTag>{data.tag}</SectionTag>}
                {data.headingLine2 ? (
                  <h2 className={ds.h2}>
                    {data.heading}
                    <span className={h.pastorLine2}>{accentLast(data.headingLine2)}</span>
                  </h2>
                ) : (
                  data.heading && <AccentHeading text={data.heading} as="h2" className={ds.h2} />
                )}
              </div>
            )}

            {data.quote && <blockquote className={h.pastorQuote}>&ldquo;{data.quote}&rdquo;</blockquote>}

            {tabs.length > 0 && (
              <PastorTabs
                labels={tabs.map((t) => t.label)}
                panels={tabs.map((t) => (
                  <div key={t.id} className={h.tabRich}>
                    <TiptapContent doc={t.body} />
                    <PillButtons items={t.buttons} className={`${ds.btnRow} ${h.tabButtons}`} />
                  </div>
                ))}
              />
            )}

            {socials.length > 0 && (
              <>
                <hr className={h.divider} />
                <div className={h.socialRow}>
                  {data.socialLabel && <span className={h.socialLabel}>{data.socialLabel}</span>}
                  <div className={h.socialIcons}>
                    {socials.map((s) => (
                      <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.network} className={h.socialIcon}>
                        {socialIcon(s.network)}
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </ViewportSection>
    );
  },
});
