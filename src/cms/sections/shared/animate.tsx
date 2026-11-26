"use client";
// Scroll-triggered reveal helpers shared by the public sections (moved out of the old page files,
// same class names: "viewport-active"/"viewport-hidden", "letter-anim"/"letter-reveal" in globals.css).
import { useEffect, useRef, useState } from "react";

function useInView<T extends Element>(threshold: number, rootMargin: string) {
  const ref = useRef<T>(null);
  const [state, setState] = useState({ mounted: false, inView: false });
  useEffect(() => {
    const timer = setTimeout(() => setState((s) => ({ ...s, mounted: true })), 0);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState({ mounted: true, inView: true });
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin },
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [threshold, rootMargin]);
  return { ref, ...state };
}

export function ViewportSection({
  children,
  className = "",
  id,
  as: Component = "section",
  fullScreen = true,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  as?: "section" | "main" | "div";
  /** false = opt out of the site's one-screen minimum height (globals.css). */
  fullScreen?: boolean;
}) {
  const { ref, mounted, inView } = useInView<HTMLElement>(0.08, "0px 0px -40px 0px");
  const cls = mounted ? `${className} ${inView ? "viewport-active" : "viewport-hidden"}` : className;
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Component ref={ref as any} className={cls} id={id} data-screen={fullScreen ? undefined : "off"}>
      {children}
    </Component>
  );
}

export function SplitText({
  text,
  className,
  delayOffset = 0,
  by = "letters",
}: {
  text: string;
  className?: string;
  delayOffset?: number;
  by?: "letters" | "words";
}) {
  const { ref, mounted, inView } = useInView<HTMLSpanElement>(0.05, "0px 0px -20px 0px");
  const anim = (base: string) => (mounted ? `${base} ${inView ? "letter-reveal" : "letter-hidden"}` : base);
  let index = 0;
  return (
    <span ref={ref} className={className} style={{ display: "inline-block" }} aria-label={text}>
      {text.split(" ").map((word, w) => {
        if (by === "words") {
          const delay = delayOffset + index++ * 0.08;
          return (
            <span key={w} aria-hidden style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom" }}>
              <span className={anim("letter-anim letter-anim-words")} style={{ animationDelay: inView ? `${delay}s` : "0s", display: "inline-block", marginRight: "0.25em" }}>
                {word}
              </span>
            </span>
          );
        }
        return (
          <span key={w} aria-hidden style={{ display: "inline-block", whiteSpace: "nowrap", marginRight: "0.22em", verticalAlign: "bottom" }}>
            {Array.from(word).map((ch, c) => {
              const delay = delayOffset + index++ * 0.035;
              return (
                <span key={c} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom" }}>
                  <span className={anim("letter-anim")} style={{ animationDelay: inView ? `${delay}s` : "0s", display: "inline-block" }}>
                    {ch}
                  </span>
                </span>
              );
            })}
          </span>
        );
      })}
    </span>
  );
}
