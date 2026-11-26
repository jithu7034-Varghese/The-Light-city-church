// Home: call to action (prayer requests) on a calm photo panel with a liquid-glass card.
import { defineSection } from "@/cms/define";
import { f } from "@/cms/fields";
import { ViewportSection } from "@/cms/sections/shared/animate";
import { AccentHeading, ds, PhotoBackground, PillButton, SectionTag } from "@/components/site/ds";
import { BG_PHOTO_HELP } from "@/cms/sections/shared/help";
import h from "./home.module.css";

export const homePrayer = defineSection({
  type: "home_prayer",
  label: "Home: big call to action",
  description: "Large heading and text over a photo, with one button.",
  fields: {
    eyebrow: f.text("Small text above the heading", { max: 80, help: "Small amber label above the heading, e.g. PRAYER. Leave empty to hide it." }),
    heading: f.text("Heading", { max: 160 }),
    text: f.textarea("Text", { max: 800 }),
    buttonLabel: f.text("Button label", { max: 80 }),
    buttonLink: f.link("Button link"),
    image: f.image("Background photo", { help: BG_PHOTO_HELP }),
  },
  Component: ({ data, ctx }) => {
    const img = ctx.image(data.image) ?? ctx.background;
    const label = data.buttonLabel || data.buttonLink.label;
    return (
      <ViewportSection className={h.prayerSection} id="contact">
        <div className={ds.container}>
          <div className={`${ds.photo} ${h.prayerPanel}`}>
            <PhotoBackground image={img} strong />
            <div className={`${ds.glass} ${h.prayerCard} ${ds.reveal}`}>
              {data.eyebrow && <SectionTag plain>{data.eyebrow}</SectionTag>}
              {data.heading && <AccentHeading text={data.heading} as="h2" className={`${ds.h2} ${h.prayerHeading}`} />}
              {data.text && <p className={h.prayerText}>{data.text}</p>}
              {label && data.buttonLink.href && (
                <div className={h.prayerButton}>
                  <PillButton href={data.buttonLink.href} label={label} variant="onPhoto" />
                </div>
              )}
            </div>
          </div>
        </div>
      </ViewportSection>
    );
  },
});
