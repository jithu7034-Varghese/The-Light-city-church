import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccentHeading, PhotoBackground, SectionTag, ds } from "@/components/site/ds";
import { ViewportSection } from "@/cms/sections/shared/animate";
import d from "../devotionals.module.css";
import { getLatestPosts, getPostBySlug, getPublishedPostSlugs, type PublicPost } from "@/lib/posts/public";
import { getGlobal } from "@/cms/queries";
import { splitKeywords } from "@/cms/seo";
import { articleJsonLd, JsonLd } from "@/lib/seo/jsonld";
import { tiptapToText } from "@/lib/tiptap/render";
import { isValidSlug } from "@/lib/slug";
import { formatPostDate, PostCard } from "../post-card";
import { getDevotionalsSettings } from "../site-background";
import { ArticleBody } from "./article-body";

// Known slugs are prerendered; new ones render on first visit. `ensureStatic = "navigation"`
// makes that first visit wait for the complete page instead of streaming an App Shell with a
// 200, so a missing devotional returns a real 404 status. (All data here is cached, which
// this setting requires and validates at build.)
export const ensureStatic = "navigation";

export async function generateStaticParams() {
  const slugs = (await getPublishedPostSlugs()).filter(isValidSlug);
  return (slugs.length ? slugs : ["__placeholder__"]).map((slug) => ({ slug }));
}

const describe = (post: PublicPost) => post.seo.description || post.excerpt || tiptapToText(post.content);

export async function generateMetadata({ params }: PageProps<"/devotionals/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = isValidSlug(slug) ? await getPostBySlug(slug) : null;
  if (!post) return { title: "Devotional not found", robots: { index: false } };
  const site = await getGlobal("site");
  const title = post.seo.title || `${post.title} | Daily Light Devotional`;
  const description = describe(post);
  const image = post.seo.imageUrl ? { url: post.seo.imageUrl, alt: post.title } : (post.image ?? undefined);
  return {
    title,
    description,
    keywords: splitKeywords(post.seo.keywords),
    authors: [{ name: post.authorName }],
    alternates: { canonical: `/devotionals/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/devotionals/${post.slug}`,
      siteName: site.name || "The Light City Church",
      publishedTime: post.publishedAt,
      ...(post.updatedDisplayAt && { modifiedTime: post.updatedDisplayAt }),
      ...(post.categories.length && { tags: post.categories.map((c) => c.name) }),
      authors: [post.authorName],
      ...(image && { images: [{ url: image.url, alt: image.alt }] }),
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description },
  };
}

export default async function DevotionalPage({ params }: PageProps<"/devotionals/[slug]">) {
  const { slug } = await params;
  if (!isValidSlug(slug)) notFound();
  const [post, latest, { site, cfg, background }] = await Promise.all([getPostBySlug(slug), getLatestPosts(4), getDevotionalsSettings()]);
  if (!post) notFound();
  const related = latest.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <>
      <JsonLd data={articleJsonLd(post, site, describe(post))} />
      <article>
        <header className={`${ds.pageHero} ${d.articleHero}`} data-hero-photo>
          <PhotoBackground image={post.image ?? background} zoom priority />
          <div className={ds.container}>
            <div className={`${ds.pageHeroCard} ${d.articleHeroCard}`}>
              {post.categories.length > 0 ? (
                <ul className={d.categoryList} aria-label="Categories">
                  {post.categories.map((c) => (
                    <li key={c.slug}>
                      <Link href={`/devotionals?category=${encodeURIComponent(c.slug)}`} className={`${ds.eyebrow} ${d.categoryLink}`}>
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <SectionTag plain>{cfg.fallbackCategory}</SectionTag>
              )}
              <h1 className={ds.pageHeroTitle}>{post.title}</h1>
              <div className={d.byline}>
                {post.author?.photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.author.photo.url} alt="" width={44} height={44} className={d.authorAvatar} />
                )}
                <div className={d.bylineText}>
                  <p>
                    <span className={d.authorName}>{post.author?.name ?? post.authorName}</span>
                    {" · "}
                    <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
                  </p>
                  {post.author?.position && <p className={d.bylineSmall}>{post.author.position}</p>}
                  {post.updatedDisplayAt && (
                    <p className={d.bylineSmall}>
                      Last updated <time dateTime={post.updatedDisplayAt}>{formatPostDate(post.updatedDisplayAt)}</time>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className={d.articleSection}>
          <div className={ds.container}>
            <div className={d.articleColumn}>
              <Link href="/devotionals" className={d.backLink}>{cfg.backLabel}</Link>
              <div className={d.articleBody}>
                <ArticleBody doc={post.content} />
              </div>
            </div>
          </div>
        </section>
      </article>

      {related.length > 0 && (
        <ViewportSection as="section" className={`${ds.cream} ${d.relatedSection}`}>
          <div className={ds.container}>
            <AccentHeading text={cfg.relatedHeading} as="h2" className={`${ds.h2} ${d.relatedTitle}`} />
            <div className={ds.cardGrid3}>
              {related.map((p) => <PostCard key={p.slug} post={p} fallbackCategory={cfg.fallbackCategory} />)}
            </div>
          </div>
        </ViewportSection>
      )}
    </>
  );
}
