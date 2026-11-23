import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "../../page.module.css";
import blogStyles from "../devotionals.module.css";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { getLatestPosts, getPostBySlug } from "@/lib/posts/public";
import { TiptapContent, tiptapToText } from "@/lib/tiptap/render";
import { isValidSlug } from "@/lib/slug";
import { formatPostDate, PostCard } from "../post-card";

export async function generateMetadata({ params }: PageProps<"/devotionals/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = isValidSlug(slug) ? await getPostBySlug(slug) : null;
  if (!post) return { title: "Devotional not found" };
  const description = post.excerpt || tiptapToText(post.content);
  return {
    title: `${post.title} | Daily Light Devotional`,
    description,
    alternates: { canonical: `/devotionals/${post.slug}` },
    openGraph: { type: "article", title: post.title, description, publishedTime: post.publishedAt, images: post.image ? [post.image.url] : undefined },
  };
}

export default function DevotionalPage({ params }: PageProps<"/devotionals/[slug]">) {
  return (
    <div className={styles.container} style={{ background: "transparent" }}>
      <SiteHeader active="/devotionals" />
      <Suspense fallback={<p style={{ textAlign: "center", padding: "180px 0", color: "var(--text-secondary)" }}>Loading…</p>}>
        <Article params={params} />
      </Suspense>
      <SiteFooter />
    </div>
  );
}

async function Article({ params }: { params: PageProps<"/devotionals/[slug]">["params"] }) {
  const { slug } = await params;
  if (!isValidSlug(slug)) notFound();
  const [post, latest] = await Promise.all([getPostBySlug(slug), getLatestPosts(4)]);
  if (!post) notFound();
  const related = latest.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <>
      <article className={blogStyles.articleWrapper}>
        <Link href="/devotionals" className={blogStyles.backButton}>← All devotionals</Link>
        <div className={blogStyles.articleCard}>
          <header className={blogStyles.articleHeader}>
            <span className={blogStyles.articleCategory}>{post.category ?? "Devotional"}</span>
            <h1 className={blogStyles.articleTitle}>{post.title}</h1>
            <div className={blogStyles.metaRow}>
              <span className={blogStyles.authorName}>{post.authorName}</span>
              <span aria-hidden>•</span>
              <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
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
    </>
  );
}
