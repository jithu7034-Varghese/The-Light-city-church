// Generic sections used by several pages (and the new pages). Server components.
import { defineSection } from "@/cms/define";
import { f, type RichText } from "@/cms/fields";
import { TiptapContent } from "@/lib/tiptap/render";
import { AccentHeading, PageHero, PhotoBackground, PillButtons, SectionTag, ds } from "@/components/site/ds";
import { ViewportSection } from "./animate";
import { BG_PHOTO_HELP } from "./help";
import s from "./shared.module.css";

const buttonFields = { label: f.text("Button label", { max: 80 }), link: f.link("Button link") };

type TNode = { type?: string; text?: string; content?: TNode[] };
const plain = (n: TNode | undefined): string => (n ? (n.text ?? "") + (n.content ?? []).map(plain).join("") : "");

/** A letter-style sign-off: the doc ends with a short "With so much love," line + a short name line. */
function endsWithSignOff(doc: RichText): boolean {
  const blocks = (doc?.content ?? []) as TNode[];
  if (blocks.length < 3) return false;
  const [closing, name] = blocks.slice(-2);
  if (closing.type !== "paragraph" || name.type !== "paragraph") return false;
  const c = plain(closing).trim();
  const n = plain(name).trim();
  return c.length > 0 && c.length <= 60 && c.endsWith(",") && n.length > 0 && n.length <= 40 && !/[.!?]$/.test(n);
}

export const pageHero = defineSection({
  type: "page_hero",
  label: "Page heading",
  description: "Big title at the top of a page, with optional image and buttons.",
  fields: {
    eyebrow: f.text("Small text above the title", { max: 80 }),
    heading: f.text("Title", { max: 160 }),
    subheading: f.textarea("Subtitle", { max: 400 }),
    buttons: f.list("Buttons", "Button", buttonFields, { max: 3, titleKey: "label" }),
    image: f.image("Background image (optional)", { help: BG_PHOTO_HELP }),
  },
  Component: ({ data, ctx }) => (
    <PageHero image={ctx.image(data.image) ?? ctx.background} eyebrow={data.eyebrow} title={data.heading} text={data.subheading || undefined}>
      <PillButtons items={data.buttons} first="onPhoto" rest="secondaryOnPhoto" className={`${ds.btnRow} ${s.heroButtons}`} />
    </PageHero>
  ),
});

export const richText = defineSection({
  type: "rich_text",
  label: "Text",
  description: "A heading and formatted text (paragraphs, headings, lists, quotes, links).",
  fields: {
    heading: f.text("Heading", { max: 160 }),
    body: f.richtext("Text"),
    align: f.select("Alignment", [{ value: "left", label: "Left" }, { value: "center", label: "Centre" }] as const),
  },
  Component: ({ data }) => {
    // Centred: heading over a centred column. Left + heading: heading on the left, text on the
    // right (Partner "Why become a monthly partner"). Left without heading: a readable article.
    if (data.align === "center") {
      return (
        <section className={`${ds.section} ${s.sec} ${s.white}`}>
          <div className={ds.container}><div className={s.centerColumn}>
            {data.heading && <AccentHeading text={data.heading} as="h2" className={`${ds.h2} ${s.richHeading}`} />}
            <div className={`${s.prose} ${s.proseCenter}`}><TiptapContent doc={data.body} /></div>
          </div>
          </div>
        </section>
      );
    }
    if (data.heading) {
      return (
        <section className={`${ds.section} ${s.sec} ${s.white}`}>
          <div className={`${ds.container} ${s.richSplit}`}>
            <AccentHeading text={data.heading} as="h2" className={`${ds.h2} ${s.richSplitHeading}`} />
            <div className={`${s.prose} ${s.proseLead}`}><TiptapContent doc={data.body} /></div>
          </div>
        </section>
      );
    }
    return (
      <section className={`${ds.section} ${s.sec} ${s.white}`}>
        <div className={ds.container}><div className={s.article}>
          <div className={s.prose}><TiptapContent doc={data.body} /></div>
        </div>
        </div>
      </section>
    );
  },
});

export const scripture = defineSection({
  type: "scripture",
  label: "Scripture / quote",
  fields: {
    heading: f.text("Heading (optional)", { max: 120 }),
    text: f.textarea("Verse or quote", { max: 1500 }),
    reference: f.text("Reference", { max: 80, placeholder: "ACTS 26:18" }),
    buttons: f.list("Buttons", "Button", buttonFields, { max: 2, titleKey: "label" }),
    image: f.image("Background photo", { help: BG_PHOTO_HELP }),
  },
  Component: ({ data, ctx }) => (
    <ViewportSection className={`${ds.photo} ${s.scripture}`}>
      <PhotoBackground image={ctx.image(data.image) ?? ctx.background} />
      <div className={ds.container}>
        <div className={`${ds.glass} ${ds.reveal} ${s.scriptureCard}`}>
          <span className={s.rule} aria-hidden />
          {data.heading && <AccentHeading text={data.heading} as="h2" className={`${ds.h2} ${s.scriptureHeading}`} />}
          {data.text && <blockquote className={s.scriptureText}>“{data.text}”</blockquote>}
          {data.reference && <p className={s.scriptureRef}>{data.reference}</p>}
          <PillButtons items={data.buttons} first="onPhoto" rest="secondaryOnPhoto" className={`${ds.btnRow} ${s.buttonsCenter}`} />
        </div>
      </div>
    </ViewportSection>
  ),
});

export const cta = defineSection({
  type: "cta",
  label: "Call to action",
  description: "Heading, short text and buttons.",
  fields: {
    eyebrow: f.text("Small text above the heading", { max: 80, help: "Small amber label above the heading. Leave empty to hide it." }),
    heading: f.text("Heading", { max: 160 }),
    text: f.textarea("Text", { max: 1200 }),
    buttons: f.list("Buttons", "Button", buttonFields, { max: 3, titleKey: "label" }),
    image: f.image("Background photo", { help: BG_PHOTO_HELP }),
  },
  Component: ({ data, ctx }) => (
    <ViewportSection className={`${ds.section} ${s.sec} ${s.white}`}>
      <div className={ds.container}>
        <div className={`${ds.photo} ${s.ctaPanel}`}>
          <PhotoBackground image={ctx.image(data.image) ?? ctx.background} />
          <div className={`${ds.glass} ${ds.reveal} ${s.ctaCard}`}>
            {data.eyebrow && <SectionTag plain>{data.eyebrow}</SectionTag>}
            {data.heading && <AccentHeading text={data.heading} as="h2" className={`${ds.h2} ${s.ctaHeading}`} />}
            {data.text && <p className={s.ctaText}>{data.text}</p>}
            <PillButtons items={data.buttons} first="onPhoto" rest="secondaryOnPhoto" className={`${ds.btnRow} ${s.buttonsCenter}`} />
          </div>
        </div>
      </div>
    </ViewportSection>
  ),
});

export const textImage = defineSection({
  type: "text_image",
  label: "Text and image",
  fields: {
    heading: f.text("Heading", { max: 160 }),
    body: f.richtext("Text"),
    buttons: f.list("Buttons", "Button", buttonFields, { max: 2, titleKey: "label" }),
    image: f.image("Image"),
    imageSide: f.select("Image position", [{ value: "right", label: "Right" }, { value: "left", label: "Left" }] as const),
  },
  Component: ({ data, ctx }) => {
    const img = ctx.image(data.image);
    return (
      <ViewportSection className={`${ds.section} ${s.sec} ${s.white}`}>
        <div className={`${ds.container} ${s.split} ${img ? "" : s.splitSolo} ${data.imageSide === "left" ? s.splitReverse : ""}`}>
          <div className={`${ds.reveal} ${s.splitText}`}>
            {data.heading && <AccentHeading text={data.heading} as="h2" className={`${ds.h2} ${s.richHeading}`} />}
            <div className={`${s.prose} ${s.proseLead} ${endsWithSignOff(data.body) ? s.signOff : ""}`}>
              <TiptapContent doc={data.body} />
            </div>
            <PillButtons items={data.buttons} className={`${ds.btnRow} ${s.buttons}`} />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {img && <img src={img.url} alt={img.alt} loading="lazy" className={`${ds.reveal} ${s.splitImage}`} />}
        </div>
      </ViewportSection>
    );
  },
});

export const cardsGrid = defineSection({
  type: "cards_grid",
  label: "Cards",
  description: "A heading and a grid of cards (values, ministries, ways to help…).",
  fields: {
    eyebrow: f.text("Small text above the heading", { max: 80 }),
    heading: f.text("Heading", { max: 160 }),
    intro: f.textarea("Intro", { max: 800 }),
    items: f.list("Cards", "Card", { title: f.text("Title", { max: 120 }), text: f.textarea("Text", { max: 1200 }), image: f.image("Image (optional)"), link: f.link("Link (optional)") }, { max: 24, titleKey: "title" }),
  },
  Component: ({ data, ctx }) => (
    <ViewportSection className={`${ds.section} ${s.sec} ${s.white}`}>
      <div className={ds.container}>
        {(data.eyebrow || data.heading || data.intro) && (
          <div className={ds.sectionHeaderCenter}>
            <div className={ds.sectionHeaderText}>
              <SectionTag>{data.eyebrow}</SectionTag>
              {data.heading && <AccentHeading text={data.heading} as="h2" className={ds.h2} />}
              {data.intro && <p className={ds.lead}>{data.intro}</p>}
            </div>
          </div>
        )}
        <div className={ds.cardGrid3}>
          {data.items.map((item) => {
            const img = ctx.image(item.image);
            const inner = (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {img && <img src={img.url} alt={img.alt} loading="lazy" className={s.cardImage} />}
                <div className={s.cardBody}>
                  {item.title && <h3 className={`${ds.h4} ${s.cardTitle}`}>{item.title}</h3>}
                  {item.text && <p className={ds.small}>{item.text}</p>}
                </div>
              </>
            );
            return item.link.href ? (
              <a key={item.id} href={item.link.href} className={`${ds.card} ${ds.reveal} ${s.cardLink}`}>{inner}</a>
            ) : (
              <div key={item.id} className={`${ds.card} ${ds.reveal}`}>{inner}</div>
            );
          })}
        </div>
      </div>
    </ViewportSection>
  ),
});
