// Home: full-screen welcome hero.
import { defineSection } from "@/cms/define";
import { f } from "@/cms/fields";
import { SplitText, ViewportSection } from "@/cms/sections/shared/animate";
import styles from "@/app/(site)/page.module.css";
import h from "./home.module.css";
import { buttonFields, shownButtons } from "./util";

export const homeHero = defineSection({
  type: "home_hero",
  label: "Home: welcome",
  description: "Full-screen welcome at the top of the home page.",
  fields: {
    eyebrow: f.text("Small text above the title", { max: 80 }),
    heading: f.text("Title", { max: 120 }),
    headingLine2: f.text("Title, second line (optional)", { max: 120 }),
    text: f.textarea("Text under the title", { max: 600 }),
    image: f.image("Background image", { help: "Leave empty to use the standard church background." }),
    buttons: f.list("Buttons", "Button", buttonFields, { max: 2, titleKey: "label" }),
  },
  Component: ({ data, ctx }) => {
    const img = ctx.image(data.image);
    const buttons = shownButtons(data.buttons);
    return (
      <ViewportSection className={styles.hero} id="hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {img && <img src={img.url} alt="" aria-hidden className={h.fill} />}
        <div className={styles.heroContent}>
          {data.eyebrow && (
            <span className={`${styles.heroTag} animate-fade-in-up`} style={{ animationDelay: "0.1s" }}>
              {data.eyebrow}
            </span>
          )}
          {(data.heading || data.headingLine2) && (
            <h1 className={styles.heroTitle}>
              {data.heading && <SplitText text={data.heading} delayOffset={0.3} />}
              {data.heading && data.headingLine2 && <br />}
              {data.headingLine2 && <SplitText text={data.headingLine2} delayOffset={0.8} />}
            </h1>
          )}
          {data.text && (
            <p className={`${h.heroText} animate-fade-in-up`} style={{ animationDelay: "1.1s" }}>
              {data.text}
            </p>
          )}
          {buttons.length > 0 && (
            <div className={`${styles.heroButtons} animate-fade-in-up`} style={{ animationDelay: "1.3s" }}>
              {buttons.map((b, i) => (
                <a key={b.id} href={b.href} className={i === 0 ? styles.exploreBtn : styles.demoBtn}>
                  {b.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </ViewportSection>
    );
  },
});
