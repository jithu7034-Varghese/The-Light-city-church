// Ministries page sections (server components). Design and classes from the old ministries/page.tsx.
import { defineSection } from "@/cms/define";
import { f } from "@/cms/fields";
import { SplitText, ViewportSection } from "@/cms/sections/shared/animate";
import { FILL, Icon } from "@/cms/sections/about/icons";
import m from "./ministries.module.css";

export const ministriesHero = defineSection({
  type: "ministries_hero",
  label: "Ministries: heading with background image",
  fields: {
    tag: f.text("Small text above the title", { max: 80 }),
    heading: f.text("Title", { max: 120 }),
    subheading: f.textarea("Subtitle", { max: 400 }),
    image: f.image("Background image"),
  },
  Component: ({ data, ctx }) => {
    const img = ctx.image(data.image);
    return (
      <section className={m.hero}>
        <div className={m.heroBackground}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {img && <img src={img.url} alt={img.alt} loading="eager" fetchPriority="high" className={m.heroImage} style={FILL} />}
          <div className={m.heroOverlay} />
        </div>
        <div className={m.heroContent}>
          {data.tag && (
            <span className={`${m.heroTag} animate-fade-in-up`} style={{ animationDelay: "0.1s" }}>
              {data.tag}
            </span>
          )}
          {data.heading && (
            <h1 className={m.heroTitle}>
              <SplitText text={data.heading} delayOffset={0.3} />
            </h1>
          )}
          {data.subheading && (
            <p className={`${m.heroSubtitle} animate-fade-in-up`} style={{ animationDelay: "0.8s" }}>
              {data.subheading}
            </p>
          )}
        </div>
      </section>
    );
  },
});

export const ministriesGrid = defineSection({
  type: "ministries_grid",
  label: "Ministries: list of ministries",
  description: "Numbered cards with an image, label, description, when and where.",
  fields: {
    heading: f.text("Heading", { max: 160 }),
    intro: f.textarea("Intro", { max: 800 }),
    items: f.list(
      "Ministries",
      "Ministry",
      {
        title: f.text("Name", { max: 120 }),
        badge: f.text("Label (optional)", { max: 60, placeholder: "Worship & Word" }),
        text: f.textarea("Description", { max: 1500 }),
        schedule: f.text("When (optional)", { max: 120 }),
        location: f.text("Where (optional)", { max: 120 }),
        image: f.image("Image (optional)"),
        link: f.link("Link (optional)", { help: "Makes the whole card clickable, e.g. /the-loved-circle." }),
      },
      { max: 24, titleKey: "title" },
    ),
  },
  Component: ({ data, ctx }) => (
    <ViewportSection as="section" className={m.ministriesSection}>
      <div className={m.container}>
        {(data.heading || data.intro) && (
          <div className={m.sectionHeader}>
            {data.heading && (
              <h2 className={m.sectionTitle}>
                <SplitText text={data.heading} delayOffset={0.1} />
              </h2>
            )}
            {data.intro && <p className={m.sectionSubtitle}>{data.intro}</p>}
          </div>
        )}

        <div className={m.grid}>
          {data.items.map((item, idx) => {
            const img = ctx.image(item.image);
            const inner = (
              <>
                {img && (
                  <div className={m.cardImageWrapper}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.alt || item.title} loading="lazy" className={m.cardImage} style={FILL} />
                  </div>
                )}

                <div className={m.cardContent}>
                  <div className={m.cardMeta}>
                    <span className={m.cardIndex}>{String(idx + 1).padStart(2, "0")}</span>
                    {item.badge && <span className={m.cardBadge}>{item.badge}</span>}
                  </div>

                  {item.title && <h3 className={m.cardTitle}>{item.title}</h3>}
                  {item.text && <p className={m.cardDescription}>{item.text}</p>}

                  {(item.schedule || item.location) && (
                    <div className={m.cardDetails}>
                      {item.schedule && (
                        <div className={m.detailRow}>
                          <Icon name="clock" size={14} className={m.detailIcon} />
                          <span>{item.schedule}</span>
                        </div>
                      )}
                      {item.location && (
                        <div className={m.detailRow}>
                          <Icon name="pin" size={14} className={m.detailIcon} />
                          <span>{item.location}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            );
            const className = `${m.card} animate-premium-block`;
            const style = { animationDelay: `${0.2 + idx * 0.1}s` };
            return item.link.href ? (
              <a key={item.id} href={item.link.href} className={className} style={{ ...style, color: "inherit", textDecoration: "none" }}>
                {inner}
              </a>
            ) : (
              <div key={item.id} className={className} style={style}>
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </ViewportSection>
  ),
});

export const ministriesCta = defineSection({
  type: "ministries_cta",
  label: "Ministries: call to action",
  fields: {
    heading: f.text("Heading", { max: 160 }),
    headingHighlight: f.text("Highlighted end of heading (optional)", { max: 60, help: "Shown in italics after the heading." }),
    text: f.textarea("Text", { max: 1200 }),
    button: f.link("Button"),
  },
  Component: ({ data }) => (
    <section className={m.ctaSection}>
      <div className={m.ctaContainer}>
        {(data.heading || data.headingHighlight) && (
          <h2 className={m.ctaTitle}>
            {data.heading} {data.headingHighlight && <span className={m.italicSerif}>{data.headingHighlight}</span>}
          </h2>
        )}
        {data.text && <p className={m.ctaText}>{data.text}</p>}
        {data.button.href && data.button.label && (
          <a href={data.button.href} className={m.ctaButton} style={{ textDecoration: "none" }}>
            {data.button.label}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </a>
        )}
      </div>
    </section>
  ),
});
