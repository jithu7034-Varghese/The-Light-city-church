import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, ds } from "@/components/site/ds";
import { ViewportSection } from "@/cms/sections/shared/animate";
import d from "./devotionals.module.css";
import { getPostCategories, getPublishedPosts, POSTS_PER_PAGE } from "@/lib/posts/public";
import { isValidSlug } from "@/lib/slug";
import { PostCard } from "./post-card";
import { getSiteBackground } from "./site-background";

export const metadata: Metadata = {
  title: "Daily Light Devotionals | The Light City Church",
  description: "Daily devotionals from Pastor Ronnie Dube and The Light City Church, Nottingham: grow in the accurate teaching of the Gospel of grace.",
  alternates: { canonical: "/devotionals" },
};

export default async function DevotionalsPage({ searchParams }: PageProps<"/devotionals">) {
  const background = await getSiteBackground();
  return (
    <>
      <PageHero
        image={background}
        title="Daily Light Devotionals"
        text={<p>Grow in the accurate teaching of the Gospel of grace. Read, reflect and pray with Pastor Ronnie Dube.</p>}
      />
      <ViewportSection as="section" className={`${ds.section} ${ds.cream} ${d.listSection}`}>
        <div className={ds.container}>
          {/* The page number and category are request data, so the list streams in after the static shell */}
          <Suspense fallback={<p className={d.notice}>Loading devotionals…</p>}>
            <PostList searchParams={searchParams} />
          </Suspense>
        </div>
      </ViewportSection>
    </>
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
    <nav aria-label="Filter by category" className={d.categoryFilters}>
      <Link href="/devotionals" className={`${d.filterPill} ${!rawCategory ? d.filterPillActive : ""}`} aria-current={!rawCategory ? "page" : undefined}>
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/devotionals?category=${encodeURIComponent(c.slug)}`}
          className={`${d.filterPill} ${active?.slug === c.slug ? d.filterPillActive : ""}`}
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
        <p className={d.notice}>
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
      <div className={ds.cardGrid3}>
        {posts.map((p) => <PostCard key={p.slug} post={p} />)}
      </div>
      <nav aria-label="Devotional pages" className={d.pagination}>
        {page > 1 && (
          <Link href={href(page - 1)} className={d.pageButton} rel="prev">
            ← Newer
          </Link>
        )}
        <span className={d.pageStatus}>Page {page} of {pages}</span>
        {page < pages && (
          <Link href={href(page + 1)} className={d.pageButton} rel="next">
            Older →
          </Link>
        )}
      </nav>
    </>
  );
}
