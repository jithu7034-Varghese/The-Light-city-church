// Gallery page sections (server components). Design and classes from the old gallery/page.tsx.
import { defineSection } from "@/cms/define";
import { f } from "@/cms/fields";
import { SplitText, ViewportSection } from "@/cms/sections/shared/animate";
import { FILL } from "@/cms/sections/about/icons";
import { GalleryGrid, type GalleryPhoto } from "./gallery-grid";
import g from "./gallery.module.css";

export const galleryHero = defineSection({
  type: "gallery_hero",
  label: "Gallery: heading with background image",
  fields: {
    tag: f.text("Small text above the title", { max: 80 }),
    heading: f.text("Title", { max: 120 }),
    subheading: f.textarea("Subtitle", { max: 400 }),
    image: f.image("Background image"),
  },
  Component: ({ data, ctx }) => {
    const img = ctx.image(data.image);
    return (
      <section className={g.hero}>
        <div className={g.heroBackground}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {img && <img src={img.url} alt={img.alt} loading="eager" fetchPriority="high" className={g.heroImage} style={FILL} />}
          <div className={g.heroOverlay} />
        </div>
        <div className={g.heroContent}>
          {data.tag && (
            <span className={`${g.heroTag} animate-fade-in-up`} style={{ animationDelay: "0.1s" }}>
              {data.tag}
            </span>
          )}
          {data.heading && (
            <h1 className={g.heroTitle}>
              <SplitText text={data.heading} delayOffset={0.3} />
            </h1>
          )}
          {data.subheading && (
            <p className={`${g.heroSubtitle} animate-fade-in-up`} style={{ animationDelay: "0.8s" }}>
              {data.subheading}
            </p>
          )}
        </div>
      </section>
    );
  },
});

export const galleryGrid = defineSection({
  type: "gallery_grid",
  label: "Gallery: photo grid",
  description: "Photos that open full size, with a caption, when clicked.",
  fields: {
    heading: f.text("Heading", { max: 160 }),
    intro: f.textarea("Intro", { max: 800 }),
    items: f.list(
      "Photos",
      "Photo",
      {
        image: f.image("Photo"),
        tag: f.text("Label (optional)", { max: 60, placeholder: "Sunday Worship" }),
        title: f.text("Title", { max: 120 }),
        caption: f.textarea("Caption (shown when opened)", { max: 600 }),
      },
      { max: 200, titleKey: "title" },
    ),
  },
  Component: ({ data, ctx }) => {
    const photos: GalleryPhoto[] = data.items.flatMap((item) => {
      const img = ctx.image(item.image);
      if (!img) return [];
      return [{ id: item.id, url: img.url, alt: img.alt || item.title, tag: item.tag, title: item.title, caption: item.caption }];
    });
    return (
      <ViewportSection as="section" className={g.gallerySection}>
        <div className={g.container}>
          {(data.heading || data.intro) && (
            <div className={g.sectionHeader}>
              {data.heading && (
                <h2 className={g.sectionTitle}>
                  <SplitText text={data.heading} delayOffset={0.1} />
                </h2>
              )}
              {data.intro && <p className={g.sectionSubtitle}>{data.intro}</p>}
            </div>
          )}
          <GalleryGrid photos={photos} />
        </div>
      </ViewportSection>
    );
  },
});
