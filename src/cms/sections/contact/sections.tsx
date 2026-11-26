// Contact page sections (server components), Figma "Contact — Desktop 1440" (13:159).
// Venue, service times, email and phone come from Site settings (ctx.site), never from here.
import { defineSection } from "@/cms/define";
import { f } from "@/cms/fields";
import { ViewportSection } from "@/cms/sections/shared/animate";
import { Icon, iconField, paragraphsOf } from "@/cms/sections/about/icons";
import { ds, AccentHeading, SectionTag, PillButton, PhotoBackground } from "@/components/site/ds";
import { ContactForm } from "./contact-form";
import c from "./contact.module.css";

const MAP_EMBED = /^https:\/\/www\.google\.com\/maps\/embed\?[^\s"'<>]*$/;

const mapEmbedField = (() => {
  const base = f.text("Google Maps embed link (optional)", {
    max: 2000,
    help: "In Google Maps: Share → Embed a map → copy only the https://www.google.com/maps/embed?… address from the code.",
  });
  return { ...base, zod: base.zod.refine((v) => v === "" || MAP_EMBED.test(v), "Paste a https://www.google.com/maps/embed?… link") };
})();

export const contactMapHero = defineSection({
  type: "contact_map_hero",
  label: "Contact: map with service card",
  description: "Full-width map, a heading, and a card with the next service from Site settings.",
  fields: {
    mapEmbedUrl: mapEmbedField,
    tag: f.text("Small text above the title", { max: 80 }),
    headingLine1: f.text("Title, first line", { max: 80 }),
    headingLine2: f.text("Title, second line (optional)", { max: 80 }),
    subheading: f.textarea("Subtitle", { max: 400 }),
    cardBadge: f.text("Card badge", { max: 40, default: "Next Service" }),
    cardImage: f.image("Card image (optional)"),
    welcomeText: f.text("Card note (optional)", { max: 60, placeholder: "All welcome" }),
    footerLabel: f.text("Card footer label (optional)", { max: 60, placeholder: "Senior Pastor" }),
    footerValue: f.text("Card footer text (optional)", { max: 80, placeholder: "Pastor Ronnie Dube" }),
    directions: f.link("Directions button", { help: "e.g. a https://maps.google.com/?q=… link." }),
  },
  Component: ({ data, ctx }) => {
    const service = ctx.site.serviceTimes[0];
    const img = ctx.image(data.cardImage);
    const mapUrl = MAP_EMBED.test(data.mapEmbedUrl) ? data.mapEmbedUrl : "";
    const when = service ? [service.day, service.time].filter(Boolean).join(" ") : "";
    const where = service ? [service.venue, service.address].filter(Boolean).join(", ") : "";
    const title = [data.headingLine1, data.headingLine2].filter(Boolean).join(" ");
    const hasFooter = data.footerLabel || data.footerValue;
    const hasButton = data.directions.href && data.directions.label;
    return (
      <section className={`${ds.pageHero} ${c.hero}`} data-hero-photo>
        <PhotoBackground image={ctx.background} zoom priority />
        <div className={`${ds.container} ${c.heroRow}`}>
          <div className={`${ds.pageHeroCard} ${c.heroCard}`}>
            {data.tag && <SectionTag plain>{data.tag}</SectionTag>}
            {title && <h1 className={ds.pageHeroTitle}>{title}</h1>}
            {data.subheading && <p className={ds.pageHeroText}>{data.subheading}</p>}
          </div>

          {(service || mapUrl) && (
            <aside className={`${ds.glass} ${c.serviceCard}`} aria-label={data.cardBadge || service?.venue || undefined}>
              {(data.cardBadge || img) && (
                <div className={c.serviceTop}>
                  {data.cardBadge && <span className={c.serviceBadge}>{data.cardBadge}</span>}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {img && <img src={img.url} alt={img.alt} loading="lazy" className={c.serviceThumb} />}
                </div>
              )}
              {when && <p className={c.serviceWhen}>{when}</p>}
              {where && <p className={c.serviceWhere}>{where}</p>}
              {mapUrl && (
                <iframe
                  src={mapUrl}
                  className={c.serviceMap}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={service?.venue ? `${service.venue} location map` : "Location map"}
                ></iframe>
              )}
              {data.welcomeText && <p className={c.serviceWelcome}>{data.welcomeText}</p>}
              {(hasFooter || hasButton) && <span className={c.serviceDivider} aria-hidden />}
              {hasFooter && (
                <div className={c.serviceFooter}>
                  {data.footerLabel && <span className={c.serviceLabel}>{data.footerLabel}</span>}
                  {data.footerValue && <span className={c.serviceValue}>{data.footerValue}</span>}
                </div>
              )}
              {hasButton && (
                <div className={c.serviceButton}>
                  <PillButton href={data.directions.href} label={data.directions.label} variant="onPhoto" external />
                </div>
              )}
            </aside>
          )}
        </div>
      </section>
    );
  },
});

export const contactDetailsBar = defineSection({
  type: "contact_details_bar",
  label: "Contact: details bar",
  description: "Service time, venue, email and phone from Site settings, in one row.",
  fields: {
    serviceLabel: f.text("Label under the service time", { max: 60, default: "Sunday Worship" }),
    venueValue: f.text("Short venue name (optional)", { max: 40, help: "Leave empty to show the venue from Site settings." }),
    venueLabel: f.text("Label under the venue", { max: 60, default: "Venue" }),
    emailLabel: f.text("Label under the email", { max: 60, default: "Email" }),
    phoneLabel: f.text("Label under the phone number", { max: 60, default: "Phone", help: "The phone only shows when one is set in Site settings." }),
  },
  Component: ({ data, ctx }) => {
    const service = ctx.site.serviceTimes[0];
    const venue = data.venueValue || service?.venue || "";
    const cols = [
      service?.time ? { key: "time", value: service.time, label: data.serviceLabel } : null,
      venue ? { key: "venue", value: venue, label: data.venueLabel } : null,
      ctx.site.email ? { key: "email", value: ctx.site.email, label: data.emailLabel, href: `mailto:${ctx.site.email}` } : null,
      ctx.site.phone ? { key: "phone", value: ctx.site.phone, label: data.phoneLabel, href: `tel:${ctx.site.phone.replace(/[^\d+]/g, "")}` } : null,
    ].filter((x) => x !== null);
    if (cols.length === 0) return null;
    return (
      <ViewportSection className={`${ds.cream} ${c.details}`} fullScreen={false}>
        <div className={ds.container}>
          <div className={`${c.detailsGrid} ${c[`detailsGrid${cols.length}`] ?? ""}`}>
            {cols.map((col) => {
              const inner = (
                <>
                  {col.label && <span className={c.detailLabel}>{col.label}</span>}
                  <span className={c.detailValue}>{col.value}</span>
                </>
              );
              return col.href ? (
                <a key={col.key} href={col.href} className={`${c.detailCard} ${c.detailLink} ${ds.reveal}`}>
                  {inner}
                </a>
              ) : (
                <div key={col.key} className={`${c.detailCard} ${ds.reveal}`}>
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      </ViewportSection>
    );
  },
});

export const contactForm = defineSection({
  type: "contact_form",
  label: "Contact: form with info cards",
  description: "The Get Involved contact form, with optional info cards beside it.",
  fields: {
    tag: f.text("Small text above the heading", { max: 80 }),
    heading: f.text("Heading", { max: 160 }),
    text: f.textarea("Text", { max: 1200, help: "Leave a blank line between paragraphs." }),
    nameLabel: f.text("Name label", { max: 60, default: "Full Name *" }),
    namePlaceholder: f.text("Name placeholder", { max: 80, default: "John Doe" }),
    emailLabel: f.text("Email label", { max: 60, default: "Email Address *" }),
    emailPlaceholder: f.text("Email placeholder", { max: 80, default: "john@example.com" }),
    phoneLabel: f.text("Phone label", { max: 60, default: "Phone Number" }),
    phonePlaceholder: f.text("Phone placeholder", { max: 80, default: "+44 7123 456789" }),
    subjectLabel: f.text("Subject label", { max: 60, default: "Subject" }),
    subjectPlaceholder: f.text("Subject placeholder", { max: 80, default: "How can we help?" }),
    messageLabel: f.text("Message label", { max: 60, default: "Message *" }),
    messagePlaceholder: f.text("Message placeholder", { max: 120, default: "Write your message or prayer request here..." }),
    buttonLabel: f.text("Button text", { max: 60, default: "Send Message" }),
    sendingLabel: f.text("Button text while sending", { max: 60, default: "Sending Message..." }),
    successTitle: f.text("Success heading", { max: 80, default: "Message sent successfully!", help: "The message under it is the form's success message (Forms settings)." }),
    errorTitle: f.text("Error heading", { max: 80, default: "Failed to send message." }),
    errorText: f.text("Error text if the connection fails", { max: 200, default: "There was a problem submitting your request. Please try again." }),
    cards: f.list(
      "Info cards beside the form",
      "Card",
      {
        icon: iconField(),
        title: f.text("Title", { max: 120 }),
        text: f.textarea("Text", { max: 1200 }),
        wide: f.boolean("Wide card"),
        badge: f.text("Photo badge (wide cards with a photo)", { max: 40 }),
        image: f.image("Photo (wide cards only, optional)"),
        imageTitle: f.text("Photo title", { max: 80 }),
        imageCaption: f.text("Photo caption", { max: 120 }),
      },
      { max: 6, titleKey: "title" },
    ),
  },
  Component: ({ data, ctx }) => {
    const { tag, heading, text, cards, ...formText } = data;
    return (
      <ViewportSection className={ds.section}>
        <div className={`${ds.container} ${c.formRow}`}>
          <div className={c.formCopy}>
            <SectionTag>{tag}</SectionTag>
            {heading && <AccentHeading text={heading} as="h2" className={`${ds.h2} ${c.formHeading}`} />}
            {paragraphsOf(text).map((p, i) => (
              <p key={i} className={ds.lead}>
                {p}
              </p>
            ))}

            {cards.length > 0 && (
              <div className={c.infoGrid}>
                {cards.map((card) => {
                  const img = card.wide ? ctx.image(card.image) : null;
                  return (
                    <div key={card.id} className={`${c.infoCard} ${card.wide ? c.infoCardWide : ""} ${ds.reveal}`}>
                      {card.icon !== "none" && (
                        <span className={c.infoIcon} aria-hidden>
                          <Icon name={card.icon} size={24} strokeWidth={1.75} />
                        </span>
                      )}
                      {card.title && <h3 className={`${ds.h4} ${c.infoTitle}`}>{card.title}</h3>}
                      {paragraphsOf(card.text).map((p, i) => (
                        <p key={i} className={ds.body}>
                          {p}
                        </p>
                      ))}
                      {img && (
                        <div className={`${ds.photo} ${c.infoPhoto}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.url} alt={img.alt} loading="lazy" className={ds.photoImg} />
                          {card.badge && <span className={`${ds.chip} ${c.infoPhotoBadge}`}>{card.badge}</span>}
                          {(card.imageTitle || card.imageCaption) && (
                            <div className={`${ds.photoCaption} ${c.infoPhotoCaption}`}>
                              {card.imageTitle && <p className={c.infoPhotoTitle}>{card.imageTitle}</p>}
                              {card.imageCaption && <p className={c.infoPhotoText}>{card.imageCaption}</p>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className={`${c.formCard} ${ds.reveal}`}>
            <ContactForm text={formText} sourcePage={`/${ctx.pageSlug}`.replace(/\/+$/, "") || "/"} />
          </div>
        </div>
      </ViewportSection>
    );
  },
});
