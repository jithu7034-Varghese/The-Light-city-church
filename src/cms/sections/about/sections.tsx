// About page sections (server components). Design and classes from the old about/page.tsx.
import { defineSection } from "@/cms/define";
import { f } from "@/cms/fields";
import { SplitText, ViewportSection } from "@/cms/sections/shared/animate";
import { FILL, Icon, iconField, paragraphsOf } from "./icons";
import { LeadershipTabs } from "./leadership-tabs";
import a from "./about.module.css";

export const aboutHero = defineSection({
  type: "about_hero",
  label: "About: heading with background image",
  fields: {
    tag: f.text("Small text above the title", { max: 80 }),
    heading: f.text("Title", { max: 120 }),
    subheading: f.textarea("Subtitle", { max: 400 }),
    image: f.image("Background image"),
  },
  Component: ({ data, ctx }) => {
    const img = ctx.image(data.image);
    return (
      <section className={a.hero}>
        <div className={a.heroBackground}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {img && <img src={img.url} alt={img.alt} loading="eager" fetchPriority="high" className={a.heroImage} style={FILL} />}
          <div className={a.heroOverlay} />
        </div>
        <div className={a.heroContent}>
          {data.tag && (
            <span className={`${a.heroTag} animate-fade-in-up`} style={{ animationDelay: "0.1s" }}>
              {data.tag}
            </span>
          )}
          {data.heading && (
            <h1 className={a.heroTitle}>
              <SplitText text={data.heading} delayOffset={0.3} />
            </h1>
          )}
          {data.subheading && (
            <p className={`${a.heroSubtitle} animate-fade-in-up`} style={{ animationDelay: "0.8s" }}>
              {data.subheading}
            </p>
          )}
        </div>
      </section>
    );
  },
});

export const aboutStory = defineSection({
  type: "about_story",
  label: "About: mission with image",
  description: "Image with a floating quote badge next to a heading and paragraphs.",
  fields: {
    tag: f.text("Small text above the heading", { max: 80 }),
    heading: f.text("Heading", { max: 160 }),
    headingHighlight: f.text("Highlighted end of heading (optional)", { max: 60, help: "Shown in italics after the heading." }),
    body: f.textarea("Text", { max: 3000, help: "Leave a blank line between paragraphs." }),
    image: f.image("Image"),
    badgeTitle: f.text("Badge quote (optional)", { max: 80 }),
    badgeText: f.text("Badge reference (optional)", { max: 120 }),
  },
  Component: ({ data, ctx }) => {
    const img = ctx.image(data.image);
    const hasBadge = data.badgeTitle || data.badgeText;
    return (
      <ViewportSection className={a.storySection} id="story">
        <div className={a.storyContainer}>
          <div className={a.storyGrid}>
            {(img || hasBadge) && (
              <div className={`${a.storyImageWrapper} animate-premium-block`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {img && <img src={img.url} alt={img.alt} loading="lazy" className={a.storyImage} style={FILL} />}
                {hasBadge && (
                  <div className={a.storyFloatingBadge}>
                    {data.badgeTitle && <h4 className={a.storyBadgeTitle}>&ldquo;{data.badgeTitle}&rdquo;</h4>}
                    {data.badgeText && <p className={a.storyBadgeSub}>{data.badgeText}</p>}
                  </div>
                )}
              </div>
            )}

            <div className={a.storyTextContent}>
              {data.tag && (
                <span className={`${a.sectionTag} animate-fade-in-up`} style={{ animationDelay: "0.1s" }}>
                  {data.tag}
                </span>
              )}
              {(data.heading || data.headingHighlight) && (
                <h2 className={`${a.storyTitle} animate-fade-in-up`} style={{ animationDelay: "0.2s" }}>
                  {data.heading} {data.headingHighlight && <span className={a.italicSerif}>{data.headingHighlight}</span>}
                </h2>
              )}
              {paragraphsOf(data.body).map((p, i) => (
                <p key={i} className={`${a.storyParagraph} animate-fade-in-up`} style={{ animationDelay: `${0.4 + i * 0.2}s` }}>
                  {p}
                </p>
              ))}
            </div>
          </div>
        </div>
      </ViewportSection>
    );
  },
});

export const aboutValues = defineSection({
  type: "about_values",
  label: "About: core values",
  description: "Bento grid of values. The first value is shown large, over its image.",
  fields: {
    tag: f.text("Small text above the heading", { max: 80 }),
    heading: f.text("Heading", { max: 160 }),
    items: f.list(
      "Values",
      "Value",
      {
        title: f.text("Title", { max: 120 }),
        text: f.textarea("Text", { max: 1200 }),
        icon: iconField(),
        image: f.image("Background image (only used for the first, large card)"),
      },
      { max: 9, titleKey: "title" },
    ),
  },
  Component: ({ data, ctx }) => (
    <ViewportSection className={a.valuesSection} id="values">
      <div className={a.valuesContainer}>
        <div className={a.valuesHeader}>
          {data.tag && (
            <span className={`${a.sectionTag} animate-fade-in-up`} style={{ animationDelay: "0.1s" }}>
              {data.tag}
            </span>
          )}
          {data.heading && (
            <h2 className={`${a.valuesTitle} animate-fade-in-up`} style={{ animationDelay: "0.2s" }}>
              {data.heading}
            </h2>
          )}
        </div>

        <div className={a.bentoGrid}>
          {data.items.map((item, i) => {
            const delay = { animationDelay: `${0.3 + i * 0.2}s` };
            if (i === 0) {
              const img = ctx.image(item.image);
              return (
                <div key={item.id} className={`${a.bentoCard} ${a.bentoCardLarge} animate-premium-block`} style={delay}>
                  <div className={`${a.cardBgImage} ${img ? "" : a.cardBgFallback}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {img && <img src={img.url} alt={img.alt} loading="lazy" className={a.cardImage} style={FILL} />}
                    <div className={a.heroOverlay} />
                  </div>
                  <div className={a.cardContentOverlay}>
                    {item.icon !== "none" && (
                      <div className={`${a.valueIcon} ${a.largeIcon}`}>
                        <Icon name={item.icon} />
                      </div>
                    )}
                    {item.title && <h3 className={`${a.valueTitle} ${a.largeTitle}`}>{item.title}</h3>}
                    {item.text && <p className={`${a.valueText} ${a.largeText}`}>{item.text}</p>}
                  </div>
                </div>
              );
            }
            return (
              <div key={item.id} className={`${a.bentoCard} animate-premium-block`} style={delay}>
                {item.icon !== "none" && (
                  <div className={a.valueIcon}>
                    <Icon name={item.icon} />
                  </div>
                )}
                {item.title && <h3 className={a.valueTitle}>{item.title}</h3>}
                {item.text && <p className={a.valueText}>{item.text}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </ViewportSection>
  ),
});

export const aboutLeadership = defineSection({
  type: "about_leadership",
  label: "About: leadership",
  description: "Tabs that switch between leaders, each with a photo and biography.",
  fields: {
    tag: f.text("Small text above the heading", { max: 80 }),
    heading: f.text("Heading", { max: 160 }),
    items: f.list(
      "Leaders",
      "Leader",
      {
        tabLabel: f.text("Tab label", { max: 40, help: "Short name on the tab button, e.g. Pastor Ronnie." }),
        name: f.text("Full name", { max: 120 }),
        role: f.text("Role (optional)", { max: 120 }),
        bio: f.textarea("Biography", { max: 3000, help: "Leave a blank line between paragraphs." }),
        quote: f.textarea("Quote (optional)", { max: 600 }),
        image: f.image("Photo"),
      },
      { max: 8, titleKey: "name" },
    ),
  },
  Component: ({ data, ctx }) => {
    const leaders = data.items.map((item) => {
      const img = ctx.image(item.image);
      return {
        id: item.id,
        tabLabel: item.tabLabel || item.name,
        name: item.name,
        role: item.role,
        bio: paragraphsOf(item.bio),
        quote: item.quote,
        image: img ? { url: img.url, alt: img.alt || item.name } : null,
      };
    });
    return (
      <ViewportSection className={a.leadershipSection} id="leadership">
        <div className={a.leadershipContainer}>
          <LeadershipTabs tag={data.tag} heading={data.heading} leaders={leaders} />
        </div>
      </ViewportSection>
    );
  },
});

export const aboutVisit = defineSection({
  type: "about_visit",
  label: "About: visit us",
  description: "Image card with text, the service times and venue from Site settings, and a button.",
  fields: {
    heading: f.text("Heading", { max: 160 }),
    text: f.textarea("Text", { max: 1500, help: "Leave a blank line between paragraphs." }),
    serviceLabel: f.text("Label for the service time", { max: 60, default: "Worship Service" }),
    locationLabel: f.text("Label for the venue", { max: 60, default: "Location" }),
    showServiceTimes: f.boolean("Show service times and venue (from Site settings)", { default: true }),
    button: f.link("Button"),
    image: f.image("Image"),
  },
  Component: ({ data, ctx }) => {
    const img = ctx.image(data.image);
    const times = data.showServiceTimes ? ctx.site.serviceTimes : [];
    return (
      <ViewportSection className={a.visitSection} id="visit">
        <div className={a.visitContainer}>
          <div className={a.visitBento}>
            <div className={`${a.visitImageWrapper} ${img ? "" : a.cardBgFallback}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {img && <img src={img.url} alt={img.alt} loading="lazy" className={a.visitImage} style={FILL} />}
            </div>

            <div className={a.visitContent}>
              {data.heading && <h2 className={a.visitTitle}>{data.heading}</h2>}
              {paragraphsOf(data.text).map((p, i) => (
                <p key={i} className={a.visitText}>
                  {p}
                </p>
              ))}

              {times.length > 0 && (
                <div className={a.visitDetailsList}>
                  {times.flatMap((t) => {
                    const when = [t.day, t.time].filter(Boolean).join(" ");
                    const where = [t.venue, t.address].filter(Boolean).join(", ");
                    const rows = [
                      { key: `time-${t.id}`, icon: "clock" as const, title: data.serviceLabel, value: when },
                      { key: `place-${t.id}`, icon: "pin" as const, title: data.locationLabel, value: where },
                    ];
                    return rows
                      .filter((r) => r.value)
                      .map((r) => (
                        <div key={r.key} className={a.visitRow}>
                          <div className={a.visitRowIcon}>
                            <Icon name={r.icon} size={20} />
                          </div>
                          <div>
                            <h4 className={a.visitRowTitle}>{r.title}</h4>
                            <span className={a.visitRowValue}>{r.value}</span>
                          </div>
                        </div>
                      ));
                  })}
                </div>
              )}

              {data.button.href && data.button.label && (
                <a href={data.button.href} className={a.visitCtaBtn} style={{ textDecoration: "none" }}>
                  {data.button.label}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </ViewportSection>
    );
  },
});
