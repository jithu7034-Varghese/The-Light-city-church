"use client";
// Photo grid + full-size lightbox for the gallery_grid section. Receives resolved photos only.
import { useEffect, useState } from "react";
import g from "./gallery.module.css";

export type GalleryPhoto = { id: string; url: string; alt: string; tag: string; title: string; caption: string };

const FILL: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%" };

export function GalleryGrid({ photos }: { photos: GalleryPhoto[] }) {
  const [active, setActive] = useState<GalleryPhoto | null>(null);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return (
    <>
      <div className={g.grid}>
        {photos.map((item, idx) => (
          <div
            key={item.id}
            className={`${g.card} animate-premium-block`}
            style={{ animationDelay: `${0.2 + idx * 0.08}s` }}
            onClick={() => setActive(item)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActive(item);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={item.title || item.alt || "Open photo"}
          >
            <div className={g.cardImageWrapper}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt={item.alt} loading="lazy" className={g.cardImage} style={FILL} />
            </div>

            <div className={g.cardOverlay} />

            {(item.tag || item.title) && (
              <div className={g.cardContent}>
                {item.tag && <span className={g.cardTag}>{item.tag}</span>}
                {item.title && <h3 className={g.cardTitle}>{item.title}</h3>}
              </div>
            )}

            <div className={g.cardZoomIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="11" y1="8" x2="11" y2="14"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
            </div>
          </div>
        ))}
      </div>

      {active && (
        <div className={g.lightbox} onClick={() => setActive(null)} role="dialog" aria-modal="true" aria-label={active.title || active.alt}>
          <button type="button" className={g.lightboxClose} aria-label="Close" onClick={() => setActive(null)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <div className={g.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <div className={g.lightboxImageWrapper}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={active.url} alt={active.alt} className={g.lightboxImage} />
            </div>

            {(active.title || active.caption) && (
              <div className={g.lightboxCaption}>
                {active.title && <h3 className={g.lightboxTitle}>{active.title}</h3>}
                {active.caption && <p className={g.lightboxDesc}>{active.caption}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
