// Gallery page sections (server components). Layout from the Figma "Gallery" frame, built on the
// shared design system (src/components/site/ds). Every text and photo comes from the CMS.
import { defineSection } from "@/cms/define";
import { f } from "@/cms/fields";
import { ViewportSection } from "@/cms/sections/shared/animate";
import { AccentHeading, PageHero, ds } from "@/components/site/ds";
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
  Component: ({ data, ctx }) => (
    <PageHero
      image={ctx.image(data.image) ?? ctx.background}
      eyebrow={data.tag}
      title={data.heading}
      text={data.subheading ? <p>{data.subheading}</p> : undefined}
    />
  ),
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
      <ViewportSection as="section" className={ds.section}>
        <div className={ds.container}>
          {(data.heading || data.intro) && (
            <div className={ds.sectionHeader}>
              <div className={ds.sectionHeaderText}>
                {data.heading && <AccentHeading text={data.heading} as="h2" className={ds.h2} />}
                {data.intro && <p className={`${ds.lead} ${g.intro}`}>{data.intro}</p>}
              </div>
            </div>
          )}
          <GalleryGrid photos={photos} />
        </div>
      </ViewportSection>
    );
  },
});
