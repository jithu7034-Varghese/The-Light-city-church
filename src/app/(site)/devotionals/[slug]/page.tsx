import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "../../page.module.css";
import blogStyles from "../devotionals.module.css";
import { getLatestPosts, getPostBySlug, getPublishedPostSlugs, type PublicPost } from "@/lib/posts/public";
import { getGlobal } from "@/cms/queries";
import { splitKeywords } from "@/cms/seo";
import { articleJsonLd, JsonLd } from "@/lib/seo/jsonld";
import { TiptapContent, tiptapToText } from "@/lib/tiptap/render";
import { isValidSlug } from "@/lib/slug";
import { formatPostDate, PostCard } from "../post-card";

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
  const [post, latest, site] = await Promise.all([getPostBySlug(slug), getLatestPosts(4), getGlobal("site")]);
  if (!post) notFound();
  const related = latest.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className={styles.container} style={{ background: "transparent" }}>
      <JsonLd data={articleJsonLd(post, site, describe(post))} />
      <article className={blogStyles.articleWrapper}>
        <Link href="/devotionals" className={blogStyles.backButton}>← All devotionals</Link>
        <div className={blogStyles.articleCard}>
          <header className={blogStyles.articleHeader}>
            {post.categories.length > 0 ? (
              <ul className={blogStyles.chipList} aria-label="Categories">
                {post.categories.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/devotionals?category=${encodeURIComponent(c.slug)}`} className={blogStyles.articleCategory}>{c.name}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <span className={blogStyles.articleCategory}>Devotional</span>
            )}
            <h1 className={blogStyles.articleTitle}>{post.title}</h1>
            <div className={blogStyles.metaRow}>
              <div className={blogStyles.authorMeta}>
                {post.author?.photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.author.photo.url} alt="" width={44} height={44} className={blogStyles.authorAvatar} />
                )}
                <span className={blogStyles.authorText}>
                  <span className={blogStyles.authorName}>{post.author?.name ?? post.authorName}</span>
                  {post.author?.position && <span className={blogStyles.authorPosition}>{post.author.position}</span>}
                </span>
              </div>
              <span className={blogStyles.dates}>
                <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
                {post.updatedDisplayAt && (
                  <span>
                    Last updated <time dateTime={post.updatedDisplayAt}>{formatPostDate(post.updatedDisplayAt)}</time>
                  </span>
                )}
              </span>
            </div>
          </header>
          {post.image && (
            <div className={blogStyles.heroImageContainer}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.image.url} alt={post.image.alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <div className={blogStyles.articleBody}>
            <TiptapContent doc={post.content} />
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className={blogStyles.relatedSection}>
          <div className={blogStyles.relatedContainer}>
            <h2 className={blogStyles.relatedTitle}>More devotionals</h2>
            <div className={blogStyles.relatedGrid}>
              {related.map((p, i) => <PostCard key={p.slug} post={p} delay={0.1 + i * 0.1} showExcerpt={false} />)}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
