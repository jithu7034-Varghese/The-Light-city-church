// About page sections (server components), Figma "About — Desktop 1440" (12:61).
// Every text, image and link comes from the section's fields or Site settings.
import { defineSection } from "@/cms/define";
import { f } from "@/cms/fields";
import { ViewportSection } from "@/cms/sections/shared/animate";
import { ds, AccentHeading, SectionTag, PillButton, PhotoBackground, PageHero } from "@/components/site/ds";
import { Icon, iconField, paragraphsOf } from "./icons";
import { LeaderCards } from "./leadership-tabs";
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
  Component: ({ data, ctx }) => (
    <PageHero image={ctx.image(data.image) ?? ctx.background} eyebrow={data.tag} title={data.heading} text={data.subheading || undefined} className={a.hero} />
  ),
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
    const heading = data.headingHighlight ? (
      <h2 className={ds.h2}>
        {data.heading && `${data.heading} `}
        <span className={ds.accentEarth}>{data.headingHighlight}</span>
      </h2>
    ) : (
      data.heading && <AccentHeading text={data.heading} as="h2" className={ds.h2} accentClassName={ds.accentEarth} />
    );
    return (
      <ViewportSection className={ds.section} id="story">
        <div className={`${ds.container} ${a.storyRow}`}>
          <div className={`${a.storyCopy} ${ds.reveal}`}>
            <SectionTag>{data.tag}</SectionTag>
            {heading}
            {paragraphsOf(data.body).map((p, i) => (
              <p key={i} className={ds.lead}>
                {p}
              </p>
            ))}
          </div>

          {(img || hasBadge) && (
            <div className={`${ds.photo} ${a.storyPhoto} ${ds.reveal}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {img && <img src={img.url} alt={img.alt} loading="lazy" className={ds.photoImg} />}
              {hasBadge && (
                <div className={`${ds.photoCaption} ${a.storyCaption}`}>
                  {data.badgeTitle && <p className={a.captionTitle}>{data.badgeTitle}</p>}
                  {data.badgeText && <p className={a.captionText}>{data.badgeText}</p>}
                </div>
              )}
            </div>
          )}
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
    <ViewportSection className={`${ds.section} ${ds.cream}`} id="values">
      <div className={ds.container}>
        {(data.tag || data.heading) && (
          <div className={ds.sectionHeader}>
            <div className={ds.sectionHeaderText}>
              <SectionTag>{data.tag}</SectionTag>
              {data.heading && <AccentHeading text={data.heading} as="h2" className={ds.h2} />}
            </div>
          </div>
        )}

        <div className={ds.cardGrid3}>
          {data.items.map((item, i) => {
            // The first value keeps its own photo (when one is set), as a photo card in the same grid.
            const img = i === 0 ? ctx.image(item.image) : null;
            return (
              <div key={item.id} className={`${img ? `${ds.photo} ${a.valueCardPhoto}` : `${ds.card} ${a.valueCard}`} ${ds.reveal}`}>
                {img && <PhotoBackground image={img} strong />}
                {item.icon !== "none" && (
                  <span className={img ? `${ds.glass} ${a.iconChipGlass}` : a.iconChip} aria-hidden>
                    <Icon name={item.icon} size={24} strokeWidth={1.75} />
                  </span>
                )}
                {item.title && <h3 className={`${ds.h4} ${a.valueTitle}`}>{item.title}</h3>}
                {item.text && <p className={img ? a.valueTextOnPhoto : ds.body}>{item.text}</p>}
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
      <ViewportSection className={ds.section} id="leadership">
        <div className={ds.container}>
          {(data.tag || data.heading) && (
            <div className={ds.sectionHeader}>
              <div className={ds.sectionHeaderText}>
                <SectionTag>{data.tag}</SectionTag>
                {data.heading && <AccentHeading text={data.heading} as="h2" className={ds.h2} />}
              </div>
            </div>
          )}
          <LeaderCards leaders={leaders} />
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
    const img = ctx.image(data.image) ?? ctx.background;
    const times = data.showServiceTimes ? ctx.site.serviceTimes : [];
    const rows = times.flatMap((t) => {
      const when = [t.day, t.time].filter(Boolean).join(" ");
      const where = [t.venue, t.address].filter(Boolean).join(", ");
      return [
        { key: `time-${t.id}`, title: data.serviceLabel, value: when },
        { key: `place-${t.id}`, title: data.locationLabel, value: where },
      ].filter((r) => r.value);
    });
    return (
      <ViewportSection className={a.visitSection} id="visit">
        <div className={ds.container}>
          <div className={`${ds.photo} ${a.visitPanel} ${ds.reveal}`}>
            <PhotoBackground image={img} strong />
            <div className={a.visitCopy}>
              {data.heading && <AccentHeading text={data.heading} as="h2" className={ds.h2} />}
              {paragraphsOf(data.text).map((p, i) => (
                <p key={i} className={a.visitText}>
                  {p}
                </p>
              ))}
              {data.button.href && data.button.label && (
                <div className={a.visitButton}>
                  <PillButton href={data.button.href} label={data.button.label} variant="onPhoto" />
                </div>
              )}
            </div>

            {rows.length > 0 && (
              <dl className={`${ds.glass} ${a.visitDetails}`}>
                {rows.map((r) => (
                  <div key={r.key} className={a.visitRow}>
                    {r.title && <dt className={a.visitLabel}>{r.title}</dt>}
                    <dd className={a.visitValue}>{r.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </ViewportSection>
    );
  },
});
