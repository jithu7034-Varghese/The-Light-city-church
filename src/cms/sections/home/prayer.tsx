// Home: big photo-backed call to action (prayer requests).
import { defineSection } from "@/cms/define";
import { f } from "@/cms/fields";
import styles from "@/app/(site)/page.module.css";
import h from "./home.module.css";

const SHADE = "linear-gradient(rgba(18, 20, 24, 0.45), rgba(18, 20, 24, 0.15))";
const NO_IMAGE = "linear-gradient(135deg, #1c1f26, #3a3f4b)";

export const homePrayer = defineSection({
  type: "home_prayer",
  label: "Home: big call to action",
  description: "Large heading and text over a photo, with one button.",
  fields: {
    heading: f.text("Heading", { max: 160 }),
    text: f.textarea("Text", { max: 800 }),
    image: f.image("Background photo"),
    buttonLabel: f.text("Button label", { max: 80 }),
    buttonLink: f.link("Button link"),
  },
  Component: ({ data, ctx }) => {
    const img = ctx.image(data.image);
    const background = img ? `${SHADE}, url(${JSON.stringify(img.url)})` : NO_IMAGE;
    const label = data.buttonLabel || data.buttonLink.label;
    return (
      <section className={styles.ctaFooterSection} id="contact">
        <div className={`${styles.ctaFooterContainer} ${h.prayer}`} style={{ backgroundImage: background }}>
          <div className={styles.ctaContent}>
            {data.heading && <h2 className={styles.ctaHeadline}>{data.heading}</h2>}
            {data.text && <p className={styles.ctaSubtext}>{data.text}</p>}
            {label && data.buttonLink.href && (
              <div className={styles.ctaButtonWrapper}>
                <a href={data.buttonLink.href} className={styles.ctaButton}>
                  <span className={styles.ctaButtonText}>{label}</span>
                  <span className={styles.ctaButtonIcon} aria-hidden>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="7" y1="17" x2="17" y2="7"></line>
                      <polyline points="7 7 17 7 17 17"></polyline>
                    </svg>
                  </span>
                </a>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  },
});
