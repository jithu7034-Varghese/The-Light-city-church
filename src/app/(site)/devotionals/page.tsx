import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import styles from "../page.module.css";
import blogStyles from "./devotionals.module.css";
import { getPostCategories, getPublishedPosts, POSTS_PER_PAGE } from "@/lib/posts/public";
import { isValidSlug } from "@/lib/slug";
import { PostCard } from "./post-card";

export const metadata: Metadata = {
  title: "Daily Light Devotionals | The Light City Church",
  description: "Daily devotionals from Pastor Ronnie Dube and The Light City Church, Nottingham: grow in the accurate teaching of the Gospel of grace.",
  alternates: { canonical: "/devotionals" },
};

export default function DevotionalsPage({ searchParams }: PageProps<"/devotionals">) {
  return (
    <div className={styles.container} style={{ background: "transparent" }}>
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
          {/* The page number and category are request data, so the list streams in after the static shell */}
          <Suspense fallback={<p style={{ textAlign: "center", color: "var(--text-secondary)" }}>Loading devotionals…</p>}>
            <PostList searchParams={searchParams} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}

async function PostList({ searchParams }: { searchParams: PageProps<"/devotionals">["searchParams"] }) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const requested = Number(one(sp.page));
  const page = Number.isInteger(requested) && requested > 0 && requested < 10_000 ? requested : 1;
  const rawCategory = one(sp.category)?.toLowerCase() ?? "";
  const categories = await getPostCategories();
  const active = isValidSlug(rawCategory) ? (categories.find((c) => c.slug === rawCategory) ?? null) : null;
  // Unknown category: show nothing rather than silently showing everything.
  const unknownCategory = rawCategory !== "" && !active;
  const { posts, total } = unknownCategory ? { posts: [], total: 0 } : await getPublishedPosts(page, active?.id ?? null);
  const pages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
  const href = (p: number) => {
    const q = new URLSearchParams({ ...(active && { category: active.slug }), ...(p > 1 && { page: String(p) }) }).toString();
    return q ? `/devotionals?${q}` : "/devotionals";
  };

  const filters = categories.length > 1 && (
    <nav aria-label="Filter by category" className={blogStyles.categoryFilters}>
      <Link href="/devotionals" className={`${blogStyles.filterPill} ${!rawCategory ? blogStyles.filterPillActive : ""}`} aria-current={!rawCategory ? "page" : undefined}>
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/devotionals?category=${encodeURIComponent(c.slug)}`}
          className={`${blogStyles.filterPill} ${active?.slug === c.slug ? blogStyles.filterPillActive : ""}`}
          aria-current={active?.slug === c.slug ? "page" : undefined}
        >
          {c.name}
        </Link>
      ))}
    </nav>
  );

  if (posts.length === 0) {
    return (
      <>
        {filters}
        <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>
          {unknownCategory ? (
            <>That category doesn&apos;t exist. <Link href="/devotionals">See all devotionals</Link></>
          ) : page > 1 ? (
            <>No devotionals on this page. <Link href={href(1)}>Back to the latest</Link></>
          ) : (
            "New devotionals are coming soon."
          )}
        </p>
      </>
    );
  }

  return (
    <>
      {filters}
      <div className={styles.blogGrid}>
        {posts.map((p, i) => <PostCard key={p.slug} post={p} delay={0.05 + i * 0.03} />)}
      </div>
      <nav aria-label="Devotional pages" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "48px" }}>
        {page > 1 && (
          <Link href={href(page - 1)} className={styles.loadMoreBtn} rel="prev">
            ← Newer
          </Link>
        )}
        <span style={{ color: "var(--text-secondary)" }}>Page {page} of {pages}</span>
        {page < pages && (
          <Link href={href(page + 1)} className={styles.loadMoreBtn} rel="next">
            Older →
          </Link>
        )}
      </nav>
    </>
  );
}
