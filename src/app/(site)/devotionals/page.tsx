import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import styles from "../page.module.css";
import blogStyles from "./devotionals.module.css";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { getPublishedPosts, POSTS_PER_PAGE } from "@/lib/posts/public";
import { PostCard } from "./post-card";

export const metadata: Metadata = {
  title: "Daily Light Devotionals | The Light City Church",
  description: "Daily devotionals from Pastor Ronnie Dube and The Light City Church, Nottingham: grow in the accurate teaching of the Gospel of grace.",
  alternates: { canonical: "/devotionals" },
};

export default function DevotionalsPage({ searchParams }: PageProps<"/devotionals">) {
  return (
    <div className={styles.container} style={{ background: "transparent" }}>
      <SiteHeader active="/devotionals" />
      <section className={blogStyles.blogHeaderContainer}>
        <h1 className={blogStyles.blogTitle}>
          Daily Light <span className={blogStyles.italicSerif}>Devotionals</span>
        </h1>
        <p className={blogStyles.blogSubtitle}>
          Grow in the accurate teaching of the Gospel of grace. Read, reflect and pray with Pastor Ronnie Dube.
        </p>
      </section>
      <section className={styles.blogSection} style={{ paddingTop: 0 }}>
        <div className={styles.blogContainer}>
          {/* The page number is request data, so the list streams in after the static shell */}
          <Suspense fallback={<p style={{ textAlign: "center", color: "var(--text-secondary)" }}>Loading devotionals…</p>}>
            <PostList searchParams={searchParams} />
          </Suspense>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

async function PostList({ searchParams }: { searchParams: PageProps<"/devotionals">["searchParams"] }) {
  const raw = (await searchParams).page;
  const requested = Number(Array.isArray(raw) ? raw[0] : raw);
  const page = Number.isInteger(requested) && requested > 0 && requested < 10_000 ? requested : 1;
  const { posts, total } = await getPublishedPosts(page);
  const pages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));

  if (posts.length === 0) {
    return (
      <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>
        {page > 1 ? <>No devotionals on this page. <Link href="/devotionals">Back to the latest</Link></> : "New devotionals are coming soon."}
      </p>
    );
  }

  return (
    <>
      <div className={styles.blogGrid}>
        {posts.map((p, i) => <PostCard key={p.slug} post={p} delay={0.05 + i * 0.03} />)}
      </div>
      <nav aria-label="Devotional pages" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "48px" }}>
        {page > 1 && (
          <Link href={page === 2 ? "/devotionals" : `/devotionals?page=${page - 1}`} className={styles.loadMoreBtn} rel="prev">
            ← Newer
          </Link>
        )}
        <span style={{ color: "var(--text-secondary)" }}>Page {page} of {pages}</span>
        {page < pages && (
          <Link href={`/devotionals?page=${page + 1}`} className={styles.loadMoreBtn} rel="next">
            Older →
          </Link>
        )}
      </nav>
    </>
  );
}
