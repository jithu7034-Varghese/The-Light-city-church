import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, ds } from "@/components/site/ds";
import { ViewportSection } from "@/cms/sections/shared/animate";
import d from "./devotionals.module.css";
import { getPostCategories, getPublishedPosts, POSTS_PER_PAGE } from "@/lib/posts/public";
import { isValidSlug } from "@/lib/slug";
import { PostCard } from "./post-card";
import { getDevotionalsSettings } from "./site-background";

export const metadata: Metadata = {
  title: "Daily Light Devotionals | The Light City Church",
  description: "Daily devotionals from Pastor Ronnie Dube and The Light City Church, Nottingham: grow in the accurate teaching of the Gospel of grace.",
  alternates: { canonical: "/devotionals" },
};

export default async function DevotionalsPage({ searchParams }: PageProps<"/devotionals">) {
  const { cfg, heroImage } = await getDevotionalsSettings();
  return (
    <>
      <PageHero
        image={heroImage}
        eyebrow={cfg.heroEyebrow || undefined}
        title={cfg.heroTitle || undefined}
        text={cfg.heroText ? <p>{cfg.heroText}</p> : undefined}
      />
      <ViewportSection as="section" className={`${ds.section} ${ds.cream} ${d.listSection}`}>
        <div className={ds.container}>
          {/* The page number and category are request data, so the list streams in after the static shell */}
          <Suspense fallback={<p className={d.notice}>{cfg.loadingText}</p>}>
            <PostList searchParams={searchParams} labels={cfg} />
          </Suspense>
        </div>
      </ViewportSection>
    </>
  );
}

type Labels = Awaited<ReturnType<typeof getDevotionalsSettings>>["cfg"];

async function PostList({ searchParams, labels }: { searchParams: PageProps<"/devotionals">["searchParams"]; labels: Labels }) {
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
        {labels.allLabel}
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
            <>{labels.unknownCategoryText} <Link href="/devotionals">{labels.seeAllLabel}</Link></>
          ) : page > 1 ? (
            <>{labels.emptyPageText} <Link href={href(1)}>{labels.backToLatestLabel}</Link></>
          ) : (
            labels.emptyText
          )}
        </p>
      </>
    );
  }

  return (
    <>
      {filters}
      <div className={ds.cardGrid3}>
        {posts.map((p) => <PostCard key={p.slug} post={p} fallbackCategory={labels.fallbackCategory} />)}
      </div>
      <nav aria-label="Devotional pages" className={d.pagination}>
        {page > 1 && (
          <Link href={href(page - 1)} className={d.pageButton} rel="prev">
            {labels.newerLabel}
          </Link>
        )}
        <span className={d.pageStatus}>{labels.pageStatus.replace("{page}", String(page)).replace("{pages}", String(pages))}</span>
        {page < pages && (
          <Link href={href(page + 1)} className={d.pageButton} rel="next">
            {labels.olderLabel}
          </Link>
        )}
      </nav>
    </>
  );
}
