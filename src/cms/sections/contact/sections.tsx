// Contact page sections (server components). Design and classes from the old contact/page.tsx.
// Venue, service times, email and phone come from Site settings (ctx.site), never from here.
import { defineSection } from "@/cms/define";
import { f } from "@/cms/fields";
import { SplitText, ViewportSection } from "@/cms/sections/shared/animate";
import { FILL, Icon, iconField, paragraphsOf } from "@/cms/sections/about/icons";
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
    const hasFooter = data.footerLabel || data.footerValue || (data.directions.href && data.directions.label);
    return (
      <section className={c.hero}>
        {mapUrl && (
          <iframe
            src={mapUrl}
            className={c.heroMap}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={service?.venue ? `${service.venue} location map` : "Location map"}
          ></iframe>
        )}

        <div className={c.heroHeaderBg} />

        <div className={c.heroHeader}>
          {data.tag && (
            <span className={`${c.heroTag} animate-fade-in-up`} style={{ animationDelay: "0.1s" }}>
              <span className={c.heroTagIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="10"></circle>
                  <polygon points="10 8 16 12 10 16 10 8"></polygon>
                </svg>
              </span>
              {data.tag}
            </span>
          )}

          {(data.headingLine1 || data.headingLine2) && (
            <h1 className={c.heroTitle}>
              {data.headingLine1 && <SplitText text={data.headingLine1} delayOffset={0.3} />}
              {data.headingLine1 && data.headingLine2 && <br />}
              {data.headingLine2 && <SplitText text={data.headingLine2} delayOffset={0.8} />}
            </h1>
          )}

          {data.subheading && (
            <p className={`${c.heroSubtitle} animate-fade-in-up`} style={{ animationDelay: "1.2s" }}>
              {data.subheading}
            </p>
          )}
        </div>

        {service && (
          <div className={`${c.floatingCard} animate-fade-in-up`} style={{ animationDelay: "1.4s" }}>
            {(img || data.cardBadge) && (
              <div className={c.cardImageWrapper} style={img ? undefined : { height: 64 }}>
                {data.cardBadge && <span className={c.cardBadge}>{data.cardBadge}</span>}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {img && <img src={img.url} alt={img.alt} loading="lazy" className={c.cardImage} style={FILL} />}
              </div>
            )}

            <div className={c.cardContent}>
              <div className={c.cardHeader}>
                {service.venue && <h3 className={c.cardTitle}>{service.venue}</h3>}
                {service.address && (
                  <p className={c.cardSubtitle}>
                    <Icon name="pin" size={12} className={c.cardSubtitleIcon} />
                    {service.address}
                  </p>
                )}
              </div>

              {(when || data.welcomeText) && (
                <div className={c.cardStats}>
                  {when && (
                    <div className={c.cardStatItem}>
                      <Icon name="clock" size={12} />
                      <span>{when}</span>
                    </div>
                  )}
                  {data.welcomeText && (
                    <div className={c.cardStatItem}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <span>{data.welcomeText}</span>
                    </div>
                  )}
                </div>
              )}

              {hasFooter && (
                <div className={c.cardFooter}>
                  <div>
                    {data.footerLabel && <span className={c.cardLabel}>{data.footerLabel}</span>}
                    {data.footerValue && <span className={c.cardVal}>{data.footerValue}</span>}
                  </div>
                  {data.directions.href && data.directions.label && (
                    <a href={data.directions.href} target="_blank" rel="noopener noreferrer" className={c.cardBtn}>
                      {data.directions.label}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
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
      ctx.site.email ? { key: "email", value: ctx.site.email, label: data.emailLabel, href: `mailto:${ctx.site.email}`, small: true } : null,
      ctx.site.phone ? { key: "phone", value: ctx.site.phone, label: data.phoneLabel, href: `tel:${ctx.site.phone.replace(/[^\d+]/g, "")}`, small: true } : null,
    ].filter((x) => x !== null);
    if (cols.length === 0) return null;
    return (
      <section className={`${c.statsBar} ${c[`statsBar${cols.length}`] ?? ""}`}>
        {cols.map((col) => {
          const val = (
            <span
              className={c.statVal}
              style={col.small ? { fontSize: "1.2rem", fontWeight: "800", height: "40px", display: "flex", alignItems: "center", overflowWrap: "anywhere" } : undefined}
            >
              {col.value}
            </span>
          );
          const label = col.label && <span className={c.statLabel}>{col.label}</span>;
          return col.href ? (
            <a key={col.key} href={col.href} className={c.statColumn} style={{ color: "inherit", textDecoration: "none" }}>
              {val}
              {label}
            </a>
          ) : (
            <div key={col.key} className={c.statColumn}>
              {val}
              {label}
            </div>
          );
        })}
      </section>
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
      <ViewportSection as="section" className={c.splitSection}>
        <div className={c.splitGrid}>
          <div className={c.formArea}>
            {tag && <span className={c.formTag}>{tag}</span>}
            {heading && <h2 className={c.formTitle}>{heading}</h2>}
            {paragraphsOf(text).map((p, i) => (
              <p key={i} className={c.formParagraph}>
                {p}
              </p>
            ))}
            <ContactForm text={formText} sourcePage={`/${ctx.pageSlug}`.replace(/\/+$/, "") || "/"} />
          </div>

          {cards.length > 0 && (
            <div className={c.bentoGrid}>
              {cards.map((card) => {
                const img = card.wide ? ctx.image(card.image) : null;
                const icon = card.icon !== "none" && (
                  <div className={c.bentoIconWrapper}>
                    <Icon name={card.icon} size={18} />
                  </div>
                );
                if (!card.wide) {
                  return (
                    <div key={card.id} className={c.bentoCard}>
                      {icon}
                      {card.title && <h3 className={c.bentoCardTitle}>{card.title}</h3>}
                      {card.text && <p className={c.bentoCardText}>{card.text}</p>}
                    </div>
                  );
                }
                return (
                  <div key={card.id} className={`${c.bentoCard} ${c.bentoCardWide}`}>
                    <div>
                      {icon}
                      {card.title && <h3 className={c.bentoCardTitle}>{card.title}</h3>}
                      {paragraphsOf(card.text).map((p, i) => (
                        <p key={i} className={c.bentoCardText}>
                          {p}
                        </p>
                      ))}
                    </div>
                    {img && (
                      <div className={c.bentoStackContainer}>
                        <div className={c.bentoGridPattern} />
                        {card.badge && <span className={c.bentoTraceBadge}>{card.badge}</span>}
                        <div className={c.bentoTraceMarker} />
                        <div className={c.bentoTraceLine} />
                        <div className={c.stackedPhotoCard}>
                          <div className={c.stackedPhoto}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.url} alt={img.alt} loading="lazy" className={c.cardImage} style={FILL} />
                          </div>
                          {card.imageTitle && <h4 className={c.stackedPhotoTitle}>{card.imageTitle}</h4>}
                          {card.imageCaption && <p className={c.stackedPhotoMeta}>{card.imageCaption}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ViewportSection>
    );
  },
});
