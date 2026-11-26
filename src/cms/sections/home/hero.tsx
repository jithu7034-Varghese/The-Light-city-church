// Home: full-screen welcome hero. The CMS artwork is its background (bottom-anchored, full width);
// the intro sits left of the artwork's title and a "this Sunday" card (Site settings → service
// times) right of it. The h1 is visually hidden because the artwork shows the same words.
import { defineSection } from "@/cms/define";
import { f } from "@/cms/fields";
import { ds, PillButtons, SectionTag } from "@/components/site/ds";
import h from "./home.module.css";
import { buttonFields } from "./util";

export const homeHero = defineSection({
  type: "home_hero",
  label: "Home: welcome",
  description: "Full-screen welcome at the top of the home page.",
  fields: {
    eyebrow: f.text("Small text above the title", { max: 80 }),
    heading: f.text("Title", { max: 120 }),
    headingLine2: f.text("Title, second line (optional)", { max: 120 }),
    text: f.textarea("Text under the title", { max: 600 }),
    buttons: f.list("Buttons", "Button", buttonFields, { max: 2, titleKey: "label" }),
    showServiceCard: f.boolean("Sunday card: show it", {
      default: true,
      help: "The white card on the right. Its time, venue and address come from Site settings → Service times (the first one).",
    }),
    serviceCardLabel: f.text("Sunday card: small label at the top (optional)", {
      max: 40,
      help: "e.g. THIS SUNDAY. Leave empty to show the day from Site settings.",
    }),
    serviceCardLink: f.link("Sunday card: link at the bottom (optional)", { help: "e.g. Plan your visit → /contact. Leave empty to hide it." }),
    image: f.image("Background image", { help: "The welcome artwork across the hero. Leave empty to use the standard church background." }),
  },
  Component: ({ data, ctx }) => {
    const img = ctx.image(data.image);
    const service = ctx.site.serviceTimes[0];
    return (
      <section className={h.hero} id="hero" data-home-hero>
        <div className={h.heroLayer}>
          <div className={`${ds.container} ${h.heroInner}`}>
            <div className={h.heroIntro}>
              {data.eyebrow && <SectionTag className={h.rise}>{data.eyebrow}</SectionTag>}
              {(data.heading || data.headingLine2 || data.text) && (
                <div className={`${h.heroLead} ${h.rise} ${h.rise2}`}>
                  {(data.heading || data.headingLine2) && (
                    <h1 className={h.srOnly}>
                      {data.heading}
                      {data.heading && data.headingLine2 ? " " : ""}
                      {data.headingLine2}
                    </h1>
                  )}
                  {data.text && <p className={h.heroText}>{data.text}</p>}
                </div>
              )}
              <PillButtons items={data.buttons} className={`${ds.btnRow} ${h.heroButtons} ${h.rise} ${h.rise3}`} />
            </div>

            {data.showServiceCard && service && (service.time || service.venue || service.day) && (
              <div className={`${h.sundayCard} ${h.rise} ${h.rise4}`}>
                {(data.serviceCardLabel || service.day) && <p className={h.sundayDay}>{data.serviceCardLabel || service.day}</p>}
                {service.time && <p className={h.sundayTime}>{service.time}</p>}
                {service.venue && <p className={h.sundayVenue}>{service.venue}</p>}
                {service.address && <p className={h.sundayAddress}>{service.address}</p>}
                {data.serviceCardLink.href && data.serviceCardLink.label && (
                  <a href={data.serviceCardLink.href} className={`${ds.textLink} ${h.sundayLink}`}>{data.serviceCardLink.label}</a>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Decorative artwork (its words repeat the visually hidden h1). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {img && <img src={img.url} alt="" aria-hidden className={h.heroArt} fetchPriority="high" />}
      </section>
    );
  },
});
