import Link from "next/link";
import styles from "../page.module.css";
import type { PublicPostCard } from "@/lib/posts/public";

const FALLBACK_IMAGE = "/citylights.jpeg";
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" });
export const formatPostDate = (iso: string) => dateFmt.format(new Date(iso));

const imgStyle = { width: "100%", height: "100%", objectFit: "cover" } as const;

export function PostCard({ post, delay = 0, showExcerpt = true }: { post: PublicPostCard; delay?: number; showExcerpt?: boolean }) {
  return (
    <Link href={`/devotionals/${post.slug}`} className={`${styles.blogCard} animate-premium-block`} style={{ animationDelay: `${delay}s` }}>
      <div className={styles.blogCardImageWrapper}>
        {/* Plain <img> for CMS media (no next/image; responsive variants come later) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.image?.url ?? FALLBACK_IMAGE} alt={post.image?.alt ?? ""} loading="lazy" decoding="async" className={styles.blogCardImage} style={imgStyle} />
      </div>
      <div className={styles.blogCardContent}>
        <div className={styles.badgeRow}>
          <span className={styles.blogPillBadge}>{post.category ?? "Devotional"}</span>
        </div>
        <h3 className={styles.blogCardTitle}>{post.title}</h3>
        {showExcerpt && post.excerpt && (
          <p className={styles.blogCardExcerpt} style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginTop: "12px", lineHeight: 1.5 }}>
            {post.excerpt}
          </p>
        )}
        <p style={{ marginTop: "16px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          {post.authorName} · <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
        </p>
      </div>
    </Link>
  );
}
