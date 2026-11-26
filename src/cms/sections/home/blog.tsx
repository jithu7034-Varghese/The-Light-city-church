// Home: the latest devotionals (read live from the posts table).
import Link from "next/link";
import { defineSection } from "@/cms/define";
import { f } from "@/cms/fields";
import { ViewportSection } from "@/cms/sections/shared/animate";
import { getLatestPosts } from "@/lib/posts/public";
import { ds, PillButton, SectionTag } from "@/components/site/ds";
import h from "./home.module.css";
import { ArrowRight } from "./social-icons";
import { dateFormat } from "./util";

const FALLBACK_IMAGE = "/citylights.jpeg";

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
      <ViewportSection className={`${ds.section} ${ds.cream}`} id="blog">
        <div className={ds.container}>
          {(data.label || data.heading || data.headingItalic || (buttonLabel && data.buttonLink.href)) && (
            <div className={ds.sectionHeader}>
              <div className={ds.sectionHeaderText}>
                {data.label && <SectionTag>{data.label}</SectionTag>}
                {(data.heading || data.headingItalic) && (
                  <h2 className={ds.h2}>
                    {data.heading}
                    {data.heading && data.headingItalic && " "}
                    {data.headingItalic && <span className={ds.accent}>{data.headingItalic}</span>}
                  </h2>
                )}
              </div>
              <PillButton href={data.buttonLink.href} label={buttonLabel} variant="secondary" />
            </div>
          )}

          {featured && (
            <Link href={`/devotionals/${featured.slug}`} className={`${h.featured} ${ds.reveal}`}>
              <div className={h.featuredImage}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={featured.image?.url ?? FALLBACK_IMAGE} alt={featured.image?.alt ?? ""} loading="lazy" className={h.fill} />
              </div>
              <div className={h.featuredBody}>
                <span className={ds.chipCream}>{featured.category ?? "Devotional"}</span>
                <h3 className={h.featuredTitle}>{featured.title}</h3>
                {featured.excerpt && <p className={h.featuredExcerpt}>{featured.excerpt}</p>}
                <div className={h.meta}>
                  <span className={h.metaText}>
                    {featured.authorName && <span>{featured.authorName}</span>}
                    <span>{dateFormat.format(new Date(featured.publishedAt))}</span>
                  </span>
                  <span className={h.cardFoot}>
                    <ArrowRight />
                  </span>
                </div>
              </div>
            </Link>
          )}

          {rest.length > 0 && (
            <div className={ds.cardGrid3}>
              {rest.map((post) => (
                <Link key={post.slug} href={`/devotionals/${post.slug}`} className={`${ds.card} ${h.postCard} ${ds.reveal}`}>
                  <div className={h.postImage}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={post.image?.url ?? FALLBACK_IMAGE} alt={post.image?.alt ?? ""} loading="lazy" className={h.fill} />
                  </div>
                  <div className={h.postBody}>
                    <span className={ds.chipCream}>{post.category ?? "Devotional"}</span>
                    <h3 className={h.cardTitle}>{post.title}</h3>
                    {post.excerpt && <p className={`${h.cardText} ${h.postExcerpt}`}>{post.excerpt}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </ViewportSection>
    );
  },
});
