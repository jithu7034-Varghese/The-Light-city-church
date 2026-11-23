// Home: three-column photo collage (intro + up to 4 photos + a button).
import { defineSection } from "@/cms/define";
import { f, type ImageRef } from "@/cms/fields";
import type { SectionCtx } from "@/cms/define";
import { ViewportSection } from "@/cms/sections/shared/animate";
import styles from "@/app/(site)/page.module.css";
import h from "./home.module.css";

type Photo = { id: string; image: ImageRef; caption: string };

function PhotoCard({ photo, ctx, cardClass, wrapperClass, delay }: { photo: Photo | undefined; ctx: SectionCtx; cardClass: string; wrapperClass: string; delay: string }) {
  if (!photo) return null;
  const img = ctx.image(photo.image);
  if (!img) return null;
  return (
    <div className={`${styles.portfolioCard} ${cardClass} animate-premium-block ${delay}`}>
      <div className={`${styles.portfolioImageWrapper} ${wrapperClass}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.url} alt={img.alt} loading="lazy" className={`${styles.portfolioCardImage} ${h.fill}`} />
        {photo.caption && <span className={styles.portfolioCardTextBadge}>{photo.caption}</span>}
      </div>
    </div>
  );
}

export const homeGallery = defineSection({
  type: "home_gallery",
  label: "Home: photo collage",
  description: "Intro text and up to 4 photos in three columns, with a button.",
  fields: {
    heading: f.text("Heading", { max: 120 }),
    text: f.textarea("Intro", { max: 600 }),
    photos: f.list("Photos", "Photo", { image: f.image("Photo"), caption: f.text("Caption (optional)", { max: 60 }) }, { max: 4, titleKey: "caption", help: "Order: left, middle top, middle bottom, right." }),
    buttonLabel: f.text("Button label", { max: 60 }),
    buttonLink: f.link("Button link"),
  },
  Component: ({ data, ctx }) => {
    const [p1, p2, p3, p4] = data.photos;
    const label = data.buttonLabel || data.buttonLink.label;
    return (
      <ViewportSection className={styles.portfolioSection} id="gallery">
        <div className={styles.portfolioContainer}>
          <div className={styles.portfolioColumn}>
            {(data.heading || data.text) && (
              <div className={styles.portfolioIntro}>
                {data.heading && <h2 className={styles.portfolioIntroTitle}>{data.heading}</h2>}
                {data.text && <p className={styles.portfolioIntroText}>{data.text}</p>}
              </div>
            )}
            <PhotoCard photo={p1} ctx={ctx} cardClass={styles.stretchCard} wrapperClass={styles.stretchImage} delay="" />
          </div>

          <div className={styles.portfolioColumn}>
            <PhotoCard photo={p2} ctx={ctx} cardClass={styles.middleCard} wrapperClass="" delay="delay-1" />
            <PhotoCard photo={p3} ctx={ctx} cardClass={styles.middleCard} wrapperClass="" delay="delay-2" />
          </div>

          <div className={styles.portfolioColumn}>
            <PhotoCard photo={p4} ctx={ctx} cardClass={`${styles.tallCard} ${styles.stretchCard}`} wrapperClass={styles.stretchImage} delay="delay-3" />
            {label && data.buttonLink.href && (
              <div className={styles.portfolioCta}>
                <a href={data.buttonLink.href} className={styles.portfolioBtn}>
                  {label}
                </a>
              </div>
            )}
          </div>
        </div>
      </ViewportSection>
    );
  },
});
