// Shared building blocks for the public site design (Figma "Home – Redesign" → Components).
// Server-safe (no hooks). Every text, image and link passed in comes from the CMS.
import type { ReactNode } from "react";
import Link from "next/link";
import ds from "./ds.module.css";

export { ds };

type HeadingTag = "h1" | "h2" | "h3";

/**
 * A heading whose last word is set in Playfair Display Italic (the design's accent).
 * Trailing punctuation stays with the word. Single-word headings stay plain.
 */
export function AccentHeading({
  text,
  as: Tag = "h2",
  className = ds.h2,
  accentClassName = ds.accent,
}: {
  text: string;
  as?: HeadingTag;
  className?: string;
  accentClassName?: string;
}) {
  const trimmed = text.trim();
  const cut = trimmed.lastIndexOf(" ");
  if (!trimmed) return null;
  if (cut <= 0) return <Tag className={className}>{trimmed}</Tag>;
  return (
    <Tag className={className}>
      {trimmed.slice(0, cut + 1)}
      <span className={accentClassName}>{trimmed.slice(cut + 1)}</span>
    </Tag>
  );
}

/** Small uppercase label in the amber tag with a dot. `plain` = amber text only (on photos). */
export function SectionTag({ children, plain = false, className = "" }: { children: ReactNode; plain?: boolean; className?: string }) {
  if (!children) return null;
  return <span className={`${plain ? ds.eyebrow : ds.tag} ${className}`.trim()}>{children}</span>;
}

export type PillVariant = "primary" | "onPhoto" | "secondary" | "secondaryOnPhoto";

const VARIANT_CLASS: Record<PillVariant, string> = {
  primary: ds.btnPrimary,
  onPhoto: ds.btnOnPhoto,
  secondary: ds.btnSecondary,
  secondaryOnPhoto: ds.btnSecondaryOnPhoto,
};

const isInternal = (href: string) => href.startsWith("/") && !href.startsWith("//");

/**
 * The design's pill button. Primary = dark pill + amber arrow badge, onPhoto = white pill + dark
 * arrow badge, secondary = outlined pill (no badge). Renders nothing without a label and a link.
 */
export function PillButton({
  href,
  label,
  variant = "primary",
  className = "",
  external,
}: {
  href: string | null | undefined;
  label: string | null | undefined;
  variant?: PillVariant;
  className?: string;
  /** Open in a new tab (defaults to true for http(s) links). */
  external?: boolean;
}) {
  if (!href || !label) return null;
  const cls = `${VARIANT_CLASS[variant]} ${className}`.trim();
  const badge =
    variant === "primary" || variant === "onPhoto" ? (
      <span className={ds.btnBadge} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={variant === "primary" ? "/icons/arrow-up-right-dark.svg" : "/icons/arrow-up-right-light.svg"} alt="" width={16} height={16} />
      </span>
    ) : null;
  const content = (
    <>
      <span>{label}</span>
      {badge}
    </>
  );
  if (isInternal(href)) {
    return <Link href={href} className={cls}>{content}</Link>;
  }
  const newTab = external ?? /^https?:\/\//.test(href);
  return (
    <a href={href} className={cls} {...(newTab ? { target: "_blank", rel: "noopener" } : {})}>
      {content}
    </a>
  );
}

/** A list of CMS buttons: the first in `first` style, the rest in `rest` style. */
export function PillButtons({
  items,
  first = "primary",
  rest = "secondary",
  className = ds.btnRow,
}: {
  items: { id: string; label: string; link: { label: string; href: string } }[];
  first?: PillVariant;
  rest?: PillVariant;
  className?: string;
}) {
  const shown = items.filter((b) => (b.label || b.link.label) && b.link.href);
  if (shown.length === 0) return null;
  return (
    <div className={className}>
      {shown.map((b, i) => (
        <PillButton key={b.id} href={b.link.href} label={b.label || b.link.label} variant={i === 0 ? first : rest} />
      ))}
    </div>
  );
}

/**
 * Photo layer + dark gradient for a section/panel that has the `ds.photo` class (or composes it).
 * `image` is the section's own CMS photo, else the Site settings "Section background image";
 * with neither, the dark gradient of `ds.photo` shows on its own.
 */
export function PhotoBackground({
  image,
  zoom = false,
  strong = false,
  priority = false,
}: {
  image: { url: string; alt?: string } | null | undefined;
  zoom?: boolean;
  strong?: boolean;
  priority?: boolean;
}) {
  return (
    <>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image.url}
          alt=""
          aria-hidden
          className={zoom ? ds.photoImgZoom : ds.photoImg}
          loading={priority ? "eager" : "lazy"}
          {...(priority ? { fetchPriority: "high" as const } : {})}
        />
      )}
      <span className={strong ? ds.photoShadeStrong : ds.photoShade} aria-hidden />
    </>
  );
}

/**
 * Inner page hero: full-width nature photo, dark gradient, and a liquid-glass title card.
 * `data-hero-photo` tells the header to use its on-photo style.
 */
export function PageHero({
  image,
  eyebrow,
  title,
  text,
  children,
  className = "",
  cardClassName = "",
}: {
  image: { url: string; alt?: string } | null | undefined;
  eyebrow?: ReactNode;
  title?: string;
  text?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** Extra class for the glass card (e.g. a wider card on the article page). */
  cardClassName?: string;
}) {
  return (
    <section className={`${ds.pageHero} ${className}`.trim()} data-hero-photo>
      <PhotoBackground image={image} zoom priority />
      <div className={ds.container}>
        <div className={`${ds.pageHeroCard} ${cardClassName}`.trim()}>
          {eyebrow && <SectionTag plain>{eyebrow}</SectionTag>}
          {title && <h1 className={ds.pageHeroTitle}>{title}</h1>}
          {text && <div className={ds.pageHeroText}>{text}</div>}
          {children}
        </div>
      </div>
    </section>
  );
}
