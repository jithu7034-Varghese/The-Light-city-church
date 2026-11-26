// Ministries page sections (server components). Layout from the Figma "Ministries" frame, built on
// the shared design system (src/components/site/ds). Every text, image and link comes from the CMS.
import { defineSection } from "@/cms/define";
import { f } from "@/cms/fields";
import { ViewportSection } from "@/cms/sections/shared/animate";
import { AccentHeading, PageHero, PhotoBackground, PillButton, SectionTag, ds } from "@/components/site/ds";
import { BG_PHOTO_HELP, TAG_HELP } from "@/cms/sections/shared/help";
import m from "./ministries.module.css";

export const ministriesHero = defineSection({
  type: "ministries_hero",
  label: "Ministries: heading with background image",
  fields: {
    tag: f.text("Small text above the title", { max: 80 }),
    heading: f.text("Title", { max: 120 }),
    subheading: f.textarea("Subtitle", { max: 400 }),
    image: f.image("Background image", { help: BG_PHOTO_HELP }),
  },
  Component: ({ data, ctx }) => (
    <PageHero
      image={ctx.image(data.image) ?? ctx.background}
      eyebrow={data.tag}
      title={data.heading}
      text={data.subheading ? <p>{data.subheading}</p> : undefined}
    />
  ),
});

export const ministriesGrid = defineSection({
  type: "ministries_grid",
  label: "Ministries: list of ministries",
  description: "Numbered cards with an image, label, description, when and where.",
  fields: {
    tag: f.text("Small text above the heading", { max: 80, help: TAG_HELP }),
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
    <ViewportSection as="section" className={`${ds.section} ${ds.cream}`}>
      <div className={ds.container}>
        {(data.tag || data.heading || data.intro) && (
          <div className={ds.sectionHeader}>
            <div className={ds.sectionHeaderText}>
              {data.tag && <SectionTag>{data.tag}</SectionTag>}
              {data.heading && <AccentHeading text={data.heading} as="h2" className={ds.h2} />}
              {data.intro && <p className={`${ds.lead} ${m.intro}`}>{data.intro}</p>}
            </div>
          </div>
        )}

        <div className={`${ds.cardGrid2} ${m.grid}`}>
          {data.items.map((item, idx) => {
            const img = ctx.image(item.image);
            const index = String(idx + 1).padStart(2, "0");
            const inner = (
              <>
                {img && (
                  <div className={m.cardMedia}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.alt || item.title} loading="lazy" className={m.cardImage} />
                    <span className={`${ds.chip} ${m.cardIndexChip}`}>{index}</span>
                  </div>
                )}

                <div className={m.cardBody}>
                  <div className={m.cardMeta}>
                    {!img && <span className={m.cardIndex}>{index}</span>}
                    {item.badge && <span className={ds.chipCream}>{item.badge}</span>}
                  </div>

                  {item.title && <h3 className={`${ds.h3} ${m.cardTitle}`}>{item.title}</h3>}
                  {item.text && <p className={ds.body}>{item.text}</p>}

                  {(item.schedule || item.location) && (
                    <ul className={m.details}>
                      {item.schedule && <li>{item.schedule}</li>}
                      {item.location && <li>{item.location}</li>}
                    </ul>
                  )}

                  {item.link.href && item.link.label && (
                    <div className={`${ds.cardFoot} ${m.cardFoot}`}>
                      <span className={ds.textLink}>{item.link.label}</span>
                    </div>
                  )}
                </div>
              </>
            );
            const className = `${ds.card} ${ds.reveal} ${m.card}`;
            return item.link.href ? (
              <a key={item.id} href={item.link.href} className={`${className} ${m.cardLink}`}>
                {inner}
              </a>
            ) : (
              <div key={item.id} className={className}>
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
    image: f.image("Background photo", { help: BG_PHOTO_HELP }),
  },
  // No image field on this section: the photo is the Site settings "Section background image".
  Component: ({ data, ctx }) => (
    <ViewportSection as="section" className={`${ds.photo} ${m.cta}`}>
      <PhotoBackground image={ctx.image(data.image) ?? ctx.background} />
      <div className={ds.container}>
        <div className={`${ds.glass} ${ds.reveal} ${m.ctaCard}`}>
          {(data.heading || data.headingHighlight) && (
            <h2 className={`${ds.h2} ${m.ctaTitle}`}>
              {data.heading} {data.headingHighlight && <span className={`${ds.accent} ${m.ctaAccent}`}>{data.headingHighlight}</span>}
            </h2>
          )}
          {data.text && <p className={m.ctaText}>{data.text}</p>}
          <PillButton href={data.button.href} label={data.button.label} variant="onPhoto" className={m.ctaButton} />
        </div>
      </div>
    </ViewportSection>
  ),
});
