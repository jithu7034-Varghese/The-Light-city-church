// Home: numbered cards for ministries and ways to connect.
import { defineSection } from "@/cms/define";
import { f } from "@/cms/fields";
import { ViewportSection } from "@/cms/sections/shared/animate";
import { AccentHeading, PillButton, SectionTag, ds } from "@/components/site/ds";
import { TAG_HELP } from "@/cms/sections/shared/help";
import h from "./home.module.css";
import { ArrowRight } from "./social-icons";
import { externalProps } from "./util";

export const homeServices = defineSection({
  type: "home_services",
  label: "Home: ministries",
  description: "A heading and numbered picture cards (best with 4).",
  fields: {
    tag: f.text("Small text above the heading", { max: 80, help: TAG_HELP }),
    heading: f.text("Heading", { max: 120 }),
    buttonLabel: f.text("Button on the right: label (optional)", { max: 60, help: "e.g. View All Ministries. Shown only with a link." }),
    buttonLink: f.link("Button on the right: link (optional)"),
    items: f.list(
      "Cards",
      "Card",
      {
        title: f.text("Title", { max: 80 }),
        text: f.textarea("Text", { max: 400 }),
        image: f.image("Image"),
        link: f.link("Link (optional)"),
      },
      { max: 8, titleKey: "title" },
    ),
  },
  Component: ({ data, ctx }) => (
    <ViewportSection className={`${ds.section} ${ds.cream}`} id="services">
      <div className={ds.container}>
        {(data.tag || data.heading || data.buttonLink.href) && (
          <div className={ds.sectionHeader}>
            <div className={ds.sectionHeaderText}>
              {data.tag && <SectionTag>{data.tag}</SectionTag>}
              {data.heading && <AccentHeading text={data.heading} as="h2" className={ds.h2} />}
            </div>
            <PillButton href={data.buttonLink.href} label={data.buttonLabel || data.buttonLink.label} variant="secondary" />
          </div>
        )}

        <div className={ds.cardGrid4}>
          {data.items.map((item, idx) => {
            const img = ctx.image(item.image);
            const inner = (
              <>
                <div className={h.serviceImage}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {img && <img src={img.url} alt={img.alt} loading="lazy" className={h.fill} />}
                  <span className={`${ds.chip} ${h.indexChip}`}>{String(idx + 1).padStart(2, "0")}</span>
                </div>
                <div className={h.serviceBody}>
                  {item.title && <h3 className={h.cardTitle}>{item.title}</h3>}
                  {item.text && <p className={h.cardText}>{item.text}</p>}
                  {item.link.href && (
                    <span className={h.cardFoot}>
                      {item.link.label}
                      <ArrowRight />
                    </span>
                  )}
                </div>
              </>
            );
            const cls = `${ds.card} ${h.serviceCard} ${ds.reveal}`;
            return item.link.href ? (
              <a key={item.id} href={item.link.href} {...externalProps(item.link.href)} className={cls}>
                {inner}
              </a>
            ) : (
              <div key={item.id} className={cls}>
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </ViewportSection>
  ),
});
