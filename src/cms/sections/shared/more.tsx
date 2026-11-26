// More generic sections: video, service times, giving, newsletter, enquiry form, latest posts,
// podcast, directions. Server components; forms render small client islands.
import Link from "next/link";
import { defineSection } from "@/cms/define";
import { f } from "@/cms/fields";
import { getPublicForm } from "@/cms/queries";
import { getLatestPosts } from "@/lib/posts/public";
import { Buttons } from "./basic";
import { EnquiryFormClient, NewsletterFormClient } from "./forms-client";
import s from "./shared.module.css";

const buttonFields = { label: f.text("Button label", { max: 80 }), link: f.link("Button link") };

export const video = defineSection({
  type: "video",
  label: "YouTube video",
  fields: {
    heading: f.text("Heading", { max: 200 }),
    text: f.textarea("Text", { max: 800 }),
    youtubeId: f.text("YouTube video ID", { max: 20, help: "The part after watch?v= in the YouTube link, e.g. QiJN-zZk-hI" }),
  },
  Component: ({ data }) => {
    const id = /^[A-Za-z0-9_-]{6,20}$/.test(data.youtubeId) ? data.youtubeId : null;
    return (
      <section className={s.section}>
        <div className={`${s.wide} ${s.center}`}>
          {data.heading && <h2 className={s.heading} style={{ maxWidth: 900, margin: "0 auto 20px" }}>{data.heading}</h2>}
          {data.text && <p className={s.lead}>{data.text}</p>}
          {id && (
            <div className={s.videoFrame}>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${id}`}
                title={data.heading || "Video"}
                loading="lazy"
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>
      </section>
    );
  },
});

export const serviceTimes = defineSection({
  type: "service_times",
  label: "Service times",
  description: "Times and venue come from Site settings.",
  fields: {
    heading: f.text("Heading", { max: 160 }),
    text: f.textarea("Text", { max: 1200 }),
    buttons: f.list("Buttons", "Button", buttonFields, { max: 2, titleKey: "label" }),
  },
  Component: ({ data, ctx }) => (
    <section className={s.section}>
      <div className={`${s.wide} ${s.center}`}>
        {data.heading && <h2 className={s.heading}>{data.heading}</h2>}
        {data.text && <p className={s.lead} style={{ maxWidth: 760, margin: "0 auto" }}>{data.text}</p>}
        {ctx.site.serviceTimes.length > 0 && (
          <div className={s.grid3}>
            {ctx.site.serviceTimes.map((t) => (
              <div key={t.id} className={`${s.glass} ${s.timeCard}`}>
                <p className={s.timeDay}>{t.day}</p>
                <p className={s.timeTime}>{t.time}</p>
                <p>{t.venue}</p>
                {t.address && <p className={s.muted} style={{ marginTop: 6 }}>{t.address}</p>}
              </div>
            ))}
          </div>
        )}
        <Buttons items={data.buttons} />
      </div>
    </section>
  ),
});

export const giving = defineSection({
  type: "giving",
  label: "Giving (PayPal)",
  description: "The PayPal account comes from Site settings.",
  fields: {
    heading: f.text("Heading", { max: 160 }),
    text: f.textarea("Text", { max: 1500 }),
    buttonLabel: f.text("Button label", { max: 60, default: "Give" }),
  },
  Component: ({ data, ctx }) => {
    const pp = ctx.site.paypal;
    return (
      <section className={s.section}>
        <div className={`${s.narrow} ${s.center} ${s.glass}`} style={{ padding: "56px 32px" }}>
          {data.heading && <h2 className={s.heading}>{data.heading}</h2>}
          {data.text && <p className={s.lead}>{data.text}</p>}
          {pp.business ? (
            <form action="https://www.paypal.com/donate" method="post" target="_blank" className={s.buttons} style={{ justifyContent: "center" }}>
              <input type="hidden" name="cmd" value="_donations" />
              <input type="hidden" name="business" value={pp.business} />
              <input type="hidden" name="item_name" value={pp.itemName || ctx.site.name} />
              <input type="hidden" name="currency_code" value={pp.currency} />
              <button type="submit" className={s.button}>{data.buttonLabel || "Give"}</button>
            </form>
          ) : (
            <p className={s.muted} style={{ marginTop: 24 }}>Online giving is being set up. Please speak to us on Sunday.</p>
          )}
        </div>
      </section>
    );
  },
});

export const newsletter = defineSection({
  type: "newsletter",
  label: "Newsletter sign-up",
  fields: {
    heading: f.text("Heading", { max: 160 }),
    text: f.textarea("Text", { max: 800 }),
    buttonLabel: f.text("Button label", { max: 40, default: "Sign up" }),
  },
  Component: ({ data }) => (
    <section className={s.section}>
      <div className={`${s.narrow} ${s.center}`}>
        {data.heading && <h2 className={s.heading}>{data.heading}</h2>}
        {data.text && <p className={s.lead}>{data.text}</p>}
        <NewsletterFormClient buttonLabel={data.buttonLabel || "Sign up"} />
      </div>
    </section>
  ),
});

export const FORM_SLUGS = [
  { value: "get-involved", label: "Contact / Get Involved" },
  { value: "prayer", label: "Prayer & Testimony" },
  { value: "salvation", label: "Salvation decision" },
  { value: "loved-circle", label: "Join The Loved Circle" },
  { value: "volunteer", label: "Volunteer" },
  { value: "newsletter", label: "Newsletter" },
] as const;

export const enquiryForm = defineSection({
  type: "enquiry_form",
  label: "Form",
  description: "One of the website's forms. Submissions arrive in the Enquiries inbox.",
  fields: {
    heading: f.text("Heading", { max: 160 }),
    subheading: f.text("Subheading", { max: 200 }),
    formSlug: f.select("Which form", FORM_SLUGS),
    buttonLabel: f.text("Button label", { max: 40, default: "Send" }),
  },
  Component: async ({ data, ctx }) => {
    const form = await getPublicForm(data.formSlug);
    return (
      <section className={s.section} id="form">
        <div className={`${s.narrow} ${s.glass}`} style={{ padding: "48px 32px" }}>
          <div className={s.center}>
            {data.heading && <h2 className={s.heading}>{data.heading}</h2>}
            {data.subheading && <p className={s.subheading}>{data.subheading}</p>}
          </div>
          {form ? (
            <EnquiryFormClient slug={form.slug} fields={form.fields} buttonLabel={data.buttonLabel || "Send"} sourcePage={`/${ctx.pageSlug === "home" ? "" : ctx.pageSlug}`} />
          ) : (
            <p className={s.muted}>This form isn&apos;t available right now.</p>
          )}
        </div>
      </section>
    );
  },
});

export const latestPosts = defineSection({
  type: "latest_posts",
  label: "Latest devotionals",
  fields: {
    heading: f.text("Heading", { max: 160 }),
    intro: f.textarea("Intro", { max: 600 }),
    count: f.select("How many", [{ value: "3", label: "3" }, { value: "6", label: "6" }] as const),
    buttonLabel: f.text("Button label", { max: 60, default: "All devotionals" }),
  },
  Component: async ({ data }) => {
    const posts = await getLatestPosts(Number(data.count));
    return (
      <section className={s.section}>
        <div className={s.wide}>
          <div className={s.center}>
            {data.heading && <h2 className={s.heading}>{data.heading}</h2>}
            {data.intro && <p className={s.lead}>{data.intro}</p>}
          </div>
          <div className={s.grid3}>
            {posts.map((p) => (
              <Link key={p.slug} href={`/devotionals/${p.slug}`} className={`${s.glass} ${s.card}`} style={{ color: "inherit", textDecoration: "none" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image?.url ?? "/citylights.jpeg"} alt={p.image?.alt ?? ""} loading="lazy" className={s.cardImage} />
                <h3 className={s.cardTitle}>{p.title}</h3>
                {p.excerpt && <p className={s.cardText}>{p.excerpt}</p>}
              </Link>
            ))}
          </div>
          {data.buttonLabel && (
            <div className={s.center}>
              <div className={s.buttons} style={{ justifyContent: "center" }}>
                <Link href="/devotionals" className={s.buttonGhost}>{data.buttonLabel}</Link>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  },
});

export const podcast = defineSection({
  type: "podcast",
  label: "Podcast",
  fields: {
    heading: f.text("Heading", { max: 120 }),
    subheading: f.text("Subheading", { max: 160 }),
    text: f.textarea("Text", { max: 1200 }),
    link: f.link("Listen link (podcast page or RSS)"),
    episodes: f.list("Episodes", "Episode", { title: f.text("Title", { max: 200 }), date: f.text("Date", { max: 40 }), duration: f.text("Length", { max: 20 }) }, { max: 20, titleKey: "title" }),
  },
  Component: ({ data }) => (
    <section className={s.section}>
      <div className={s.narrow}>
        <div className={s.center}>
          {data.heading && <span className={s.eyebrow}>{data.heading}</span>}
          {data.subheading && <h2 className={s.heading}>{data.subheading}</h2>}
          {data.text && <p className={s.lead}>{data.text}</p>}
        </div>
        {data.episodes.length > 0 && (
          <ol className={`${s.glass}`} style={{ marginTop: 32, padding: "8px 24px", listStyle: "none" }}>
            {data.episodes.map((e, i) => (
              <li key={e.id} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "16px 0", borderTop: i ? "1px solid var(--glass-border)" : undefined }}>
                <span>{e.title}</span>
                <span className={s.muted} style={{ whiteSpace: "nowrap" }}>{[e.date, e.duration].filter(Boolean).join(" · ")}</span>
              </li>
            ))}
          </ol>
        )}
        {data.link.href && (
          <div className={s.buttons} style={{ justifyContent: "center" }}>
            <a href={data.link.href} className={s.button} target="_blank" rel="noopener">{data.link.label || "Listen"}</a>
          </div>
        )}
      </div>
    </section>
  ),
});

export const directions = defineSection({
  type: "directions",
  label: "Directions",
  fields: {
    heading: f.text("Heading", { max: 160 }),
    address: f.textarea("Address", { max: 300 }),
    items: f.list("Ways to get here", "Option", { title: f.text("Title", { max: 80 }), text: f.textarea("Text", { max: 1200 }), link: f.link("Link (optional)") }, { max: 8, titleKey: "title" }),
    buttonLabel: f.text("Map button label", { max: 60, default: "Get directions" }),
  },
  Component: ({ data }) => (
    <section className={s.section}>
      <div className={s.wide}>
        <div className={s.center}>
          {data.heading && <h2 className={s.heading}>{data.heading}</h2>}
          {data.address && <p className={s.lead}>{data.address}</p>}
        </div>
        <div className={s.grid3}>
          {data.items.map((i) => (
            <div key={i.id} className={`${s.glass} ${s.card}`}>
              <h3 className={s.cardTitle}>{i.title}</h3>
              <p className={s.cardText}>{i.text}</p>
              {i.link.href && <a href={i.link.href} target="_blank" rel="noopener" className={s.muted} style={{ display: "inline-block", marginTop: 12, textDecoration: "underline" }}>{i.link.label || "More info"}</a>}
            </div>
          ))}
        </div>
        {data.address && data.buttonLabel && (
          <div className={s.buttons} style={{ justifyContent: "center" }}>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.address)}`} target="_blank" rel="noopener" className={s.button}>{data.buttonLabel}</a>
          </div>
        )}
      </div>
    </section>
  ),
});
