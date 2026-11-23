// Generic sections used by several pages (and the new pages). Server components.
import { defineSection } from "@/cms/define";
import { f, type LinkValue } from "@/cms/fields";
import { TiptapContent } from "@/lib/tiptap/render";
import s from "./shared.module.css";

const buttonFields = { label: f.text("Button label", { max: 80 }), link: f.link("Button link") };

/** Buttons with both a label and a link render; empty ones are skipped. */
export function Buttons({ items, ghostAfterFirst = true }: { items: { id: string; label: string; link: LinkValue }[]; ghostAfterFirst?: boolean }) {
  const shown = items.filter((b) => (b.label || b.link.label) && b.link.href);
  if (shown.length === 0) return null;
  return (
    <div className={s.buttons}>
      {shown.map((b, i) => (
        <a key={b.id} href={b.link.href} className={i > 0 && ghostAfterFirst ? s.buttonGhost : s.button}>
          {b.label || b.link.label}
        </a>
      ))}
    </div>
  );
}

export const pageHero = defineSection({
  type: "page_hero",
  label: "Page heading",
  description: "Big title at the top of a page, with optional image and buttons.",
  fields: {
    eyebrow: f.text("Small text above the title", { max: 80 }),
    heading: f.text("Title", { max: 160 }),
    subheading: f.textarea("Subtitle", { max: 400 }),
    image: f.image("Background image (optional)"),
    buttons: f.list("Buttons", "Button", buttonFields, { max: 3, titleKey: "label" }),
  },
  Component: ({ data, ctx }) => {
    const img = ctx.image(data.image);
    return (
      <section className={s.hero}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {img && <img src={img.url} alt="" aria-hidden className={s.heroImage} />}
        <div className={s.narrow}>
          {data.eyebrow && <span className={s.eyebrow}>{data.eyebrow}</span>}
          {data.heading && <h1 className={s.heroTitle}>{data.heading}</h1>}
          {data.subheading && <p className={s.lead} style={{ marginTop: 20 }}>{data.subheading}</p>}
          <Buttons items={data.buttons} />
        </div>
      </section>
    );
  },
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
  Component: ({ data }) => (
    <section className={s.section}>
      <div className={`${s.narrow} ${data.align === "center" ? s.center : ""}`}>
        {data.heading && <h2 className={s.heading}>{data.heading}</h2>}
        <div className={s.prose}><TiptapContent doc={data.body} /></div>
      </div>
    </section>
  ),
});

export const scripture = defineSection({
  type: "scripture",
  label: "Scripture / quote",
  fields: {
    heading: f.text("Heading (optional)", { max: 120 }),
    text: f.textarea("Verse or quote", { max: 1500 }),
    reference: f.text("Reference", { max: 80, placeholder: "ACTS 26:18" }),
    buttons: f.list("Buttons", "Button", buttonFields, { max: 2, titleKey: "label" }),
  },
  Component: ({ data }) => (
    <section className={s.section}>
      <div className={`${s.narrow} ${s.glass} ${s.scripture}`}>
        {data.heading && <h2 className={s.heading}>{data.heading}</h2>}
        {data.text && <blockquote className={s.scriptureText}>“{data.text}”</blockquote>}
        {data.reference && <p className={s.scriptureRef}>{data.reference}</p>}
        <div className={s.center}><Buttons items={data.buttons} /></div>
      </div>
    </section>
  ),
});

export const cta = defineSection({
  type: "cta",
  label: "Call to action",
  description: "Heading, short text and buttons.",
  fields: {
    heading: f.text("Heading", { max: 160 }),
    text: f.textarea("Text", { max: 1200 }),
    buttons: f.list("Buttons", "Button", buttonFields, { max: 3, titleKey: "label" }),
  },
  Component: ({ data }) => (
    <section className={s.section}>
      <div className={`${s.narrow} ${s.center}`}>
        {data.heading && <h2 className={s.heading}>{data.heading}</h2>}
        {data.text && <p className={s.lead}>{data.text}</p>}
        <Buttons items={data.buttons} />
      </div>
    </section>
  ),
});

export const textImage = defineSection({
  type: "text_image",
  label: "Text and image",
  fields: {
    heading: f.text("Heading", { max: 160 }),
    body: f.richtext("Text"),
    image: f.image("Image"),
    imageSide: f.select("Image position", [{ value: "right", label: "Right" }, { value: "left", label: "Left" }] as const),
    buttons: f.list("Buttons", "Button", buttonFields, { max: 2, titleKey: "label" }),
  },
  Component: ({ data, ctx }) => {
    const img = ctx.image(data.image);
    return (
      <section className={s.section}>
        <div className={`${s.wide} ${s.split} ${data.imageSide === "left" ? s.splitReverse : ""}`}>
          <div>
            {data.heading && <h2 className={s.heading}>{data.heading}</h2>}
            <div className={s.prose}><TiptapContent doc={data.body} /></div>
            <Buttons items={data.buttons} />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {img ? <img src={img.url} alt={img.alt} loading="lazy" className={s.splitImage} /> : <div />}
        </div>
      </section>
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
    <section className={s.section}>
      <div className={s.wide}>
        <div className={s.center}>
          {data.eyebrow && <span className={s.eyebrow}>{data.eyebrow}</span>}
          {data.heading && <h2 className={s.heading}>{data.heading}</h2>}
          {data.intro && <p className={s.lead}>{data.intro}</p>}
        </div>
        <div className={s.grid3}>
          {data.items.map((item) => {
            const img = ctx.image(item.image);
            const inner = (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {img && <img src={img.url} alt={img.alt} loading="lazy" className={s.cardImage} />}
                {item.title && <h3 className={s.cardTitle}>{item.title}</h3>}
                {item.text && <p className={s.cardText}>{item.text}</p>}
              </>
            );
            return item.link.href ? (
              <a key={item.id} href={item.link.href} className={`${s.glass} ${s.card}`} style={{ color: "inherit", textDecoration: "none" }}>{inner}</a>
            ) : (
              <div key={item.id} className={`${s.glass} ${s.card}`}>{inner}</div>
            );
          })}
        </div>
      </div>
    </section>
  ),
});
