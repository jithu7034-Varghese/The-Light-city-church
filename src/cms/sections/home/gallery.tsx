// Home: photo collage (intro + up to 4 photos + a button).
import { defineSection } from "@/cms/define";
import { f, type ImageRef } from "@/cms/fields";
import type { SectionCtx } from "@/cms/define";
import { ViewportSection } from "@/cms/sections/shared/animate";
import { AccentHeading, ds, PillButton, SectionTag } from "@/components/site/ds";
import { TAG_HELP } from "@/cms/sections/shared/help";
import h from "./home.module.css";

type Photo = { id: string; image: ImageRef; caption: string };

function PhotoCard({ photo, ctx, className }: { photo: Photo | undefined; ctx: SectionCtx; className: string }) {
  if (!photo) return null;
  const img = ctx.image(photo.image);
  if (!img) return null;
  return (
    <figure className={`${h.galleryPhoto} ${className} ${ds.reveal}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img.url} alt={img.alt} loading="lazy" className={h.fill} />
      {photo.caption && <figcaption className={h.caption}>{photo.caption}</figcaption>}
    </figure>
  );
}

export const homeGallery = defineSection({
  type: "home_gallery",
  label: "Home: photo collage",
  description: "Intro text and up to 4 photos in three columns, with a button.",
  fields: {
    tag: f.text("Small text above the heading", { max: 80, help: TAG_HELP }),
    heading: f.text("Heading", { max: 120 }),
    text: f.textarea("Intro", { max: 600 }),
    buttonLabel: f.text("Button label", { max: 60 }),
    buttonLink: f.link("Button link"),
    photos: f.list("Photos", "Photo", { image: f.image("Photo"), caption: f.text("Caption (optional)", { max: 60 }) }, { max: 4, titleKey: "caption", help: "Order: left, middle top, middle bottom, right." }),
  },
  Component: ({ data, ctx }) => {
    const [p1, p2, p3, p4] = data.photos;
    const label = data.buttonLabel || data.buttonLink.label;
    return (
      <ViewportSection className={ds.section} id="gallery">
        <div className={ds.container}>
          {(data.tag || data.heading || data.text || (label && data.buttonLink.href)) && (
            <div className={ds.sectionHeader}>
              <div className={ds.sectionHeaderText}>
                {data.tag && <SectionTag>{data.tag}</SectionTag>}
                {data.heading && <AccentHeading text={data.heading} as="h2" className={ds.h2} />}
                {data.text && <p className={`${ds.body} ${h.galleryIntro}`}>{data.text}</p>}
              </div>
              <PillButton href={data.buttonLink.href} label={label} variant="secondary" />
            </div>
          )}

          <div className={h.galleryGrid}>
            <PhotoCard photo={p1} ctx={ctx} className={h.galleryPhoto1} />
            <PhotoCard photo={p2} ctx={ctx} className={h.galleryPhoto2} />
            <PhotoCard photo={p3} ctx={ctx} className={h.galleryPhoto3} />
            <PhotoCard photo={p4} ctx={ctx} className={h.galleryPhoto4} />
          </div>
        </div>
      </ViewportSection>
    );
  },
});
