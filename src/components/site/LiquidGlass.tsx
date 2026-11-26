"use client";
// Liquid glass edge refraction (Figma "Liquid glass"): an SVG displacement filter that the
// `.glass` classes use as a backdrop-filter. Only Chromium renders url() backdrop filters, so the
// filter is switched on with the `lg-refract` class on <html> there; Safari and Firefox keep the
// plain blur from ds.module.css. Skipped when the visitor prefers reduced transparency/motion.
import { useEffect } from "react";

type UAData = { brands?: { brand: string }[] };

export function LiquidGlassDefs() {
  useEffect(() => {
    const ua = (navigator as Navigator & { userAgentData?: UAData }).userAgentData;
    const chromium = Boolean(ua?.brands?.some((b) => /Chromium/i.test(b.brand)));
    const reduced =
      window.matchMedia("(prefers-reduced-transparency: reduce)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (chromium && !reduced) document.documentElement.classList.add("lg-refract");
    return () => document.documentElement.classList.remove("lg-refract");
  }, []);

  return (
    <svg width="0" height="0" aria-hidden focusable="false" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
      <defs>
        {/* Low-frequency noise, smoothed, displaces the backdrop: strongest where the noise
            changes most, which reads as light bending through thick glass at the edges. */}
        <filter id="lg-refract" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.009" numOctaves="2" seed="11" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="3" result="smooth" />
          <feDisplacementMap in="SourceGraphic" in2="smooth" scale="34" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
