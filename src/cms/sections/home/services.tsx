// Home: numbered cards for ministries and ways to connect.
import { defineSection } from "@/cms/define";
import { f } from "@/cms/fields";
import { SplitText, ViewportSection } from "@/cms/sections/shared/animate";
import styles from "@/app/(site)/page.module.css";
import h from "./home.module.css";
import { externalProps } from "./util";

export const homeServices = defineSection({
  type: "home_services",
  label: "Home: ministries",
  description: "A heading and numbered picture cards (best with 4).",
  fields: {
    heading: f.text("Heading", { max: 120 }),
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
    <ViewportSection className={styles.servicesSection} id="services">
      <div className={styles.servicesContainer}>
        {data.heading && (
          <div className={styles.servicesHeader}>
            <h2 className={styles.servicesTitle}>
              <SplitText text={data.heading} delayOffset={0.1} />
            </h2>
          </div>
        )}

        <div className={styles.servicesGrid}>
          {data.items.map((item, idx) => {
            const img = ctx.image(item.image);
            const inner = (
              <>
                <div className={styles.serviceCardImageArea}>
                  <span className={styles.serviceCardIndex}>{String(idx + 1).padStart(2, "0")}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {img ? <img src={img.url} alt={img.alt} loading="lazy" className={`${styles.serviceCardImage} ${h.fill}`} /> : <div className={h.placeholder} />}
                </div>
                {item.title && <h3 className={styles.serviceCardTitle}>{item.title}</h3>}
                {item.text && <p className={styles.serviceCardText}>{item.text}</p>}
              </>
            );
            const cls = `${styles.serviceCard} animate-premium-block${idx > 0 ? ` delay-${Math.min(idx * 2, 6)}` : ""}`;
            return item.link.href ? (
              <a key={item.id} href={item.link.href} {...externalProps(item.link.href)} className={`${cls} ${h.cardLink}`}>
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
