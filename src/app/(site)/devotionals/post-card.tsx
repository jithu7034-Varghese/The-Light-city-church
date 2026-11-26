import Link from "next/link";
import { ds } from "@/components/site/ds";
import type { PublicPostCard } from "@/lib/posts/public";
import d from "./devotionals.module.css";

const FALLBACK_IMAGE = "/citylights.jpeg";
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" });
export const formatPostDate = (iso: string) => dateFmt.format(new Date(iso));

export function PostCard({
  post,
  showExcerpt = true,
  fallbackCategory = "Devotional",
}: {
  post: PublicPostCard;
  showExcerpt?: boolean;
  /** Site settings → Devotionals pages → label for devotionals without a category. */
  fallbackCategory?: string;
}) {
  return (
    <Link href={`/devotionals/${post.slug}`} className={`${ds.card} ${ds.reveal} ${d.postCard}`}>
      <div className={d.postCardMedia}>
        {/* Plain <img> for CMS media (no next/image; responsive variants come later) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.image?.url ?? FALLBACK_IMAGE} alt={post.image?.alt ?? ""} loading="lazy" decoding="async" className={d.postCardImage} />
      </div>
      <div className={d.postCardBody}>
        <span className={ds.chipCream}>{post.category ?? fallbackCategory}</span>
        <h3 className={`${ds.h4} ${d.postCardTitle}`}>{post.title}</h3>
        {showExcerpt && post.excerpt && <p className={`${ds.small} ${d.postCardExcerpt}`}>{post.excerpt}</p>}
        <p className={d.postCardMeta}>
          {post.authorName} · <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
        </p>
      </div>
    </Link>
  );
}
