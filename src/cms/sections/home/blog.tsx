// Home: the latest devotionals (read live from the posts table).
import { defineSection } from "@/cms/define";
import { f } from "@/cms/fields";
import { ViewportSection } from "@/cms/sections/shared/animate";
import { getLatestPosts } from "@/lib/posts/public";
import styles from "@/app/(site)/page.module.css";
import { dateFormat } from "./util";

const FALLBACK_IMAGE = "/citylights.jpeg";
const imgStyle = { width: "100%", height: "100%", objectFit: "cover" } as const;

export const homeBlog = defineSection({
  type: "home_blog",
  label: "Home: latest devotionals",
  description: "Shows the 4 newest published devotionals automatically.",
  fields: {
    label: f.text("Small text above the heading", { max: 60 }),
    heading: f.text("Heading", { max: 160 }),
    headingItalic: f.text("Heading ending (italic, optional)", { max: 60 }),
    buttonLabel: f.text("Button label", { max: 60, default: "View All Devotionals" }),
    buttonLink: f.link("Button link", { default: { label: "", href: "/devotionals" } }),
  },
  Component: async ({ data }) => {
    const [featured, ...rest] = await getLatestPosts(4);
    const buttonLabel = data.buttonLabel || data.buttonLink.label;
    return (
      <ViewportSection className={styles.blogSection} id="blog">
        <div className={styles.blogContainer}>
          {(data.label || data.heading || data.headingItalic) && (
            <div className={styles.blogHeader}>
              {data.label && <span className={styles.blogLabel}>{data.label}</span>}
              <h2 className={styles.blogHeadline}>
                {data.heading}
                {data.heading && data.headingItalic && " "}
                {data.headingItalic && <span className={styles.italicSerif}>{data.headingItalic}</span>}
              </h2>
            </div>
          )}

          {featured && (
            <a href={`/devotionals/${featured.slug}`} className={`${styles.featuredCard} animate-premium-block`} style={{ display: "flex" }}>
              <div className={styles.featuredImageArea}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={featured.image?.url ?? FALLBACK_IMAGE} alt={featured.image?.alt ?? ""} loading="lazy" className={styles.blogCardImage} style={imgStyle} />
              </div>
              <div className={styles.featuredTextArea}>
                <div className={styles.badgeRow}>
                  <span className={styles.blogPillBadge}>{featured.category ?? "Devotional"}</span>
                </div>
                <h3 className={styles.featuredTitle}>{featured.title}</h3>
                {featured.excerpt && <p className={styles.featuredExcerpt}>{featured.excerpt}</p>}
                <div className={styles.featuredFooter}>
                  <div className={styles.authorGroup}>
                    <span className={styles.authorName}>{featured.authorName}</span>
                  </div>
                  <span className={styles.postDate}>{dateFormat.format(new Date(featured.publishedAt))}</span>
                </div>
              </div>
            </a>
          )}

          {rest.length > 0 && (
            <div className={styles.blogGrid}>
              {rest.map((post, idx) => (
                <a
                  key={post.slug}
                  href={`/devotionals/${post.slug}`}
                  className={`${styles.blogCard} animate-premium-block`}
                  style={{ animationDelay: `${0.2 + idx * 0.1}s` }}
                >
                  <div className={styles.blogCardImageWrapper}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={post.image?.url ?? FALLBACK_IMAGE} alt={post.image?.alt ?? ""} loading="lazy" className={styles.blogCardImage} style={imgStyle} />
                  </div>
                  <div className={styles.blogCardContent}>
                    <div className={styles.badgeRow}>
                      <span className={styles.blogPillBadge}>{post.category ?? "Devotional"}</span>
                    </div>
                    <h3 className={styles.blogCardTitle}>{post.title}</h3>
                  </div>
                </a>
              ))}
            </div>
          )}

          {buttonLabel && data.buttonLink.href && (
            <div className={styles.blogCtaContainer}>
              <a href={data.buttonLink.href} className={styles.loadMoreBtn} style={{ display: "inline-block", textAlign: "center" }}>
                {buttonLabel}
              </a>
            </div>
          )}
        </div>
      </ViewportSection>
    );
  },
});
