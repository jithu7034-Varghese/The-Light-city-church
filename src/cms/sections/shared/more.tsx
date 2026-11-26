// More generic sections: video, service times, giving, newsletter, enquiry form, latest posts,
// podcast, directions. Server components; forms render small client islands.
import Link from "next/link";
import { defineSection } from "@/cms/define";
import { f } from "@/cms/fields";
import { getPublicForm } from "@/cms/queries";
import { getLatestPosts } from "@/lib/posts/public";
import { AccentHeading, PhotoBackground, PillButton, PillButtons, SectionTag, ds } from "@/components/site/ds";
import { ViewportSection } from "./animate";
import { BG_PHOTO_HELP, TAG_HELP } from "./help";
import { mapEmbedField, safeMapEmbed } from "./map-embed";
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
      <ViewportSection className={`${ds.section} ${s.sec} ${s.white}`}>
        <div className={ds.container}>
          {(data.heading || data.text) && (
            <div className={ds.sectionHeaderCenter}>
              <div className={ds.sectionHeaderText}>
                {data.heading && <AccentHeading text={data.heading} as="h2" className={ds.h2} />}
                {data.text && <p className={ds.lead}>{data.text}</p>}
              </div>
            </div>
          )}
          {id && (
            <div className={`${ds.reveal} ${s.videoFrame}`}>
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
      </ViewportSection>
    );
  },
});

export const serviceTimes = defineSection({
  type: "service_times",
  label: "Service times",
  description: "Times and venue come from Site settings.",
  fields: {
    tag: f.text("Small text above the heading", { max: 80, help: TAG_HELP }),
    heading: f.text("Heading", { max: 160 }),
    text: f.textarea("Text", { max: 1200 }),
    buttons: f.list("Buttons", "Button", buttonFields, { max: 2, titleKey: "label" }),
    image: f.image("Background photo", { help: BG_PHOTO_HELP }),
  },
  Component: ({ data, ctx }) => {
    const times = ctx.site.serviceTimes;
    return (
      <ViewportSection className={`${ds.section} ${s.sec} ${s.white}`}>
        <div className={ds.container}>
          <div className={`${ds.photo} ${s.servicePanel} ${times.length ? "" : s.servicePanelSolo}`}>
            <PhotoBackground image={ctx.image(data.image) ?? ctx.background} />
            <div className={`${ds.reveal} ${s.serviceText}`}>
              {data.tag && <SectionTag plain>{data.tag}</SectionTag>}
              {data.heading && <AccentHeading text={data.heading} as="h2" className={`${ds.h2} ${s.onPhotoHeading}`} />}
              {data.text && <p className={s.onPhotoText}>{data.text}</p>}
              <PillButtons items={data.buttons} first="onPhoto" rest="secondaryOnPhoto" className={`${ds.btnRow} ${s.buttons}`} />
            </div>
            {times.length > 0 && (
              <div className={`${ds.glass} ${ds.reveal} ${s.serviceCard}`}>
                {times.map((t) => (
                  <div key={t.id} className={s.serviceGroup}>
                    {t.day && (
                      <div className={s.serviceRow}>
                        <p className={s.serviceValue}>{t.day}</p>
                      </div>
                    )}
                    {t.time && (
                      <div className={s.serviceRow}>
                        <p className={s.serviceValue}>{t.time}</p>
                      </div>
                    )}
                    {(t.venue || t.address) && (
                      <div className={s.serviceRow}>
                        <p className={s.serviceValue}>
                          {t.venue}
                          {t.address && <span className={s.serviceAddress}>{t.address}</span>}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ViewportSection>
    );
  },
});

export const giving = defineSection({
  type: "giving",
  label: "Giving (PayPal)",
  description: "The PayPal account comes from Site settings.",
  fields: {
    tag: f.text("Small text above the heading", { max: 80, help: TAG_HELP }),
    heading: f.text("Heading", { max: 160 }),
    text: f.textarea("Text", { max: 1500 }),
    buttonLabel: f.text("Button label", { max: 60, default: "Give" }),
    note: f.text("Small note under the button (optional)", { max: 120, help: "e.g. Secure giving through PayPal. Leave empty to hide it." }),
    notReadyText: f.text("Message while online giving isn't set up", {
      max: 200,
      default: "Online giving is being set up. Please speak to us on Sunday.",
      help: "Shown instead of the button until a PayPal account is entered in Site settings.",
    }),
  },
  Component: ({ data, ctx }) => {
    const pp = ctx.site.paypal;
    // Directly followed by a newsletter section (home page), the two sit side by side as equal
    // cards: see `.giving + .newsletter` in shared.module.css.
    return (
      <section className={`${ds.section} ${s.sec} ${s.white} ${s.giving}`}>
        <div className={`${ds.container} ${s.pairInner}`}>
          <div className={s.givingCard}>
            <div className={s.givingText}>
              {data.tag && <SectionTag className={s.cardTag}>{data.tag}</SectionTag>}
              {data.heading && <AccentHeading text={data.heading} as="h2" className={`${ds.h2} ${s.givingTitle}`} />}
              {data.text && <p className={ds.body}>{data.text}</p>}
            </div>
            {pp.business ? (
              <form action="https://www.paypal.com/donate" method="post" target="_blank" className={s.givingAction}>
                <input type="hidden" name="cmd" value="_donations" />
                <input type="hidden" name="business" value={pp.business} />
                <input type="hidden" name="item_name" value={pp.itemName || ctx.site.name} />
                <input type="hidden" name="currency_code" value={pp.currency} />
                <button type="submit" className={ds.btnPrimary}>
                  <span>{data.buttonLabel || "Give"}</span>
                  <span className={ds.btnBadge} aria-hidden>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icons/arrow-up-right-dark.svg" alt="" width={16} height={16} />
                  </span>
                </button>
                {data.note && <p className={`${ds.small} ${s.givingNote}`}>{data.note}</p>}
              </form>
            ) : (
              data.notReadyText && <p className={`${ds.small} ${s.givingAction}`}>{data.notReadyText}</p>
            )}
          </div>
        </div>
      </section>
    );
  },
});

export const newsletter = defineSection({
  type: "newsletter",
  label: "Newsletter sign-up",
  fields: {
    tag: f.text("Small text above the heading", { max: 80, help: TAG_HELP }),
    heading: f.text("Heading", { max: 160 }),
    text: f.textarea("Text", { max: 800 }),
    emailPlaceholder: f.text("Text inside the email box", { max: 60, default: "Email" }),
    buttonLabel: f.text("Button label", { max: 40, default: "Sign up" }),
    sendingLabel: f.text("Button text while sending", { max: 40, default: "Signing up…" }),
  },
  Component: ({ data }) => (
    <section className={`${ds.section} ${s.sec} ${s.white} ${s.newsletter}`}>
      <div className={`${ds.container} ${s.pairInner}`}>
        <div className={s.newsletterCard}>
          {data.tag && <SectionTag className={s.cardTag}>{data.tag}</SectionTag>}
          {data.heading && <AccentHeading text={data.heading} as="h2" className={`${ds.h3} ${s.newsletterTitle}`} />}
          {data.text && <p className={ds.body}>{data.text}</p>}
          <div className={ds.cardFoot}>
            <NewsletterFormClient
              buttonLabel={data.buttonLabel || "Sign up"}
              placeholder={data.emailPlaceholder || "Email"}
              sendingLabel={data.sendingLabel || "Signing up…"}
            />
          </div>
        </div>
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
    // "CONTACT US" (heading) is the small tag; the subheading is the card's title. A heading on
    // its own becomes the title.
    const tag = data.subheading ? data.heading : "";
    const title = data.subheading || data.heading;
    return (
      <section className={`${ds.section} ${ds.cream} ${s.sec}`} id="form">
        <div className={ds.container}>
          <div className={s.formCard}>
            {(tag || title) && (
              <div className={s.formHead}>
                <SectionTag>{tag}</SectionTag>
                {title && <h2 className={`${ds.h3} ${s.formTitle}`}>{title}</h2>}
              </div>
            )}
            {form ? (
              <EnquiryFormClient slug={form.slug} fields={form.fields} buttonLabel={data.buttonLabel || "Send"} sourcePage={`/${ctx.pageSlug === "home" ? "" : ctx.pageSlug}`} />
            ) : (
              <p className={ds.body}>This form isn&apos;t available right now.</p>
            )}
          </div>
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
      <ViewportSection className={`${ds.section} ${s.sec} ${s.white}`}>
        <div className={ds.container}>
          <div className={ds.sectionHeader}>
            <div className={ds.sectionHeaderText}>
              {data.heading && <AccentHeading text={data.heading} as="h2" className={ds.h2} />}
              {data.intro && <p className={ds.lead}>{data.intro}</p>}
            </div>
            <PillButton href="/devotionals" label={data.buttonLabel} variant="secondary" />
          </div>
          <div className={ds.cardGrid3}>
            {posts.map((p) => (
              <Link key={p.slug} href={`/devotionals/${p.slug}`} className={`${ds.card} ${ds.reveal} ${s.cardLink}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image?.url ?? "/citylights.jpeg"} alt={p.image?.alt ?? ""} loading="lazy" className={s.cardImage} />
                <div className={s.cardBody}>
                  <h3 className={`${ds.h4} ${s.cardTitle}`}>{p.title}</h3>
                  {p.excerpt && <p className={ds.small}>{p.excerpt}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </ViewportSection>
    );
  },
});

function PlayIcon() {
  return (
    <span className={s.play} aria-hidden>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
        <path d="M3 1.6v8.8a.6.6 0 0 0 .92.5l6.9-4.4a.6.6 0 0 0 0-1L3.92 1.1A.6.6 0 0 0 3 1.6Z" />
      </svg>
    </span>
  );
}

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
  Component: ({ data }) => {
    const href = data.link.href;
    return (
      <ViewportSection className={`${ds.section} ${ds.cream} ${s.sec}`}>
        <div className={`${ds.container} ${s.podcast} ${data.episodes.length ? "" : s.podcastSolo}`}>
          <div className={`${ds.reveal} ${s.podcastIntro}`}>
            <SectionTag>{data.heading}</SectionTag>
            {data.subheading && <AccentHeading text={data.subheading} as="h2" className={ds.h2} />}
            {data.text && <p className={ds.body}>{data.text}</p>}
            {href && <PillButton href={href} label={data.link.label || "Listen"} variant="primary" external className={s.buttons} />}
          </div>
          {data.episodes.length > 0 && (
            <ol className={s.episodes}>
              {data.episodes.map((e) => {
                const meta = [e.date, e.duration].filter(Boolean).join(" · ");
                const inner = (
                  <>
                    <PlayIcon />
                    <span className={s.episodeText}>
                      <span className={s.episodeTitle}>{e.title}</span>
                      {meta && <span className={s.episodeMeta}>{meta}</span>}
                    </span>
                  </>
                );
                return (
                  <li key={e.id} className={ds.reveal}>
                    {href ? (
                      <a href={href} target="_blank" rel="noopener" className={s.episode}>{inner}</a>
                    ) : (
                      <div className={s.episode}>{inner}</div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </ViewportSection>
    );
  },
});

export const directions = defineSection({
  type: "directions",
  label: "Directions",
  fields: {
    tag: f.text("Small text above the heading", { max: 80, help: TAG_HELP }),
    heading: f.text("Heading", { max: 160 }),
    address: f.textarea("Address", { max: 300 }),
    mapEmbedUrl: { ...mapEmbedField, spec: { ...mapEmbedField.spec, help: "Shows a live map in the panel. In Google Maps: Share → Embed a map → copy only the https://www.google.com/maps/embed?… address. Leave empty for the plain panel." } },
    buttonLabel: f.text("Map button label", { max: 60, default: "Get directions" }),
    items: f.list("Ways to get here", "Option", { title: f.text("Title", { max: 80 }), text: f.textarea("Text", { max: 1200 }), link: f.link("Link (optional)") }, { max: 8, titleKey: "title" }),
  },
  Component: ({ data }) => {
    const mapHref = data.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.address)}` : "";
    const embed = safeMapEmbed(data.mapEmbedUrl);
    return (
      <ViewportSection className={`${ds.section} ${ds.cream} ${s.sec}`}>
        <div className={ds.container}>
          {(data.tag || data.heading || data.address) && (
            <div className={ds.sectionHeader}>
              <div className={ds.sectionHeaderText}>
                {data.tag && <SectionTag>{data.tag}</SectionTag>}
                {data.heading && <AccentHeading text={data.heading} as="h2" className={ds.h2} />}
                {data.address && <p className={ds.lead}>{data.address}</p>}
              </div>
            </div>
          )}
          <div className={`${s.directions} ${mapHref ? "" : s.directionsSolo}`}>
            {mapHref && (
              <div className={`${ds.reveal} ${s.mapPanel} ${embed ? s.mapPanelLive : ""}`}>
                {embed && (
                  <iframe
                    src={embed}
                    className={s.mapEmbed}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    title={data.address ? `Map: ${data.address}` : "Map"}
                  />
                )}
                <span className={s.mapPin} aria-hidden>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 21s-7-6.1-7-11.5a7 7 0 1 1 14 0C19 14.9 12 21 12 21Z" />
                    <circle cx="12" cy="9.5" r="2.5" />
                  </svg>
                </span>
                <PillButton href={mapHref} label={data.buttonLabel} variant="primary" />
              </div>
            )}
            <div className={s.directionItems}>
              {data.items.map((i) => (
                <div key={i.id} className={`${ds.reveal} ${s.directionCard}`}>
                  {i.title && <h3 className={`${ds.h4} ${s.cardTitle}`}>{i.title}</h3>}
                  {i.text && <p className={`${ds.body} ${s.directionText}`}>{i.text}</p>}
                  {i.link.href && (
                    <a href={i.link.href} target="_blank" rel="noopener" className={`${ds.textLink} ${s.directionLink}`}>
                      {i.link.label || "More info"}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </ViewportSection>
    );
  },
});
