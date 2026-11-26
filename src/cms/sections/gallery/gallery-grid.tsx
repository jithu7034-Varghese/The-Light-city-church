"use client";
// Photo grid + full-size lightbox for the gallery_grid section. Receives resolved photos only.
import { useEffect, useRef, useState } from "react";
import { ds } from "@/components/site/ds";
import g from "./gallery.module.css";

export type GalleryPhoto = { id: string; url: string; alt: string; tag: string; title: string; caption: string };

export function GalleryGrid({ photos }: { photos: GalleryPhoto[] }) {
  const [active, setActive] = useState<GalleryPhoto | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const open = (item: GalleryPhoto, opener: HTMLElement) => {
    openerRef.current = opener;
    setActive(item);
  };

  useEffect(() => {
    if (!active) return;
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
      // Keep focus inside the dialog: the close button is its only control.
      if (e.key === "Tab") {
        e.preventDefault();
        closeRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      openerRef.current?.focus();
    };
  }, [active]);

  return (
    <>
      <div className={g.grid}>
        {photos.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${g.card} ${ds.reveal}`}
            onClick={(e) => open(item, e.currentTarget)}
            aria-label={item.title || item.alt || "Open photo"}
            aria-haspopup="dialog"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt={item.alt} loading="lazy" className={g.cardImage} />

            {(item.tag || item.title) && (
              <span className={`${ds.photoCaption} ${g.caption}`}>
                {item.tag && <span className={`${ds.eyebrow} ${g.captionTag}`}>{item.tag}</span>}
                {item.title && <span className={g.captionTitle}>{item.title}</span>}
              </span>
            )}

            <span className={g.zoomIcon} aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7.5"></circle>
                <line x1="20.5" y1="20.5" x2="16.4" y2="16.4"></line>
                <line x1="11" y1="8" x2="11" y2="14"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
            </span>
          </button>
        ))}
      </div>

      {active && (
        <div className={g.lightbox} onClick={() => setActive(null)} role="dialog" aria-modal="true" aria-label={active.title || active.alt}>
          <button ref={closeRef} type="button" className={g.lightboxClose} aria-label="Close" onClick={() => setActive(null)}>
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
