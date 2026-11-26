"use client";
// Tab switcher for the home pastor section. Panels are rendered on the server and passed in.
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import h from "./home.module.css";

export function PastorTabs({ labels, panels }: { labels: string[]; panels: ReactNode[] }) {
  const [active, setActive] = useState(0);
  const base = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = Math.min(active, panels.length - 1);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const last = labels.length - 1;
    const next =
      e.key === "ArrowRight" ? (current === last ? 0 : current + 1)
      : e.key === "ArrowLeft" ? (current === 0 ? last : current - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : -1;
    if (next < 0) return;
    e.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className={h.tabs}>
      <div className={h.tabList} role="tablist" onKeyDown={onKeyDown}>
        {labels.map((label, i) => (
          <button
            key={i}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${base}-tab-${i}`}
            aria-selected={i === current}
            aria-controls={`${base}-panel`}
            tabIndex={i === current ? 0 : -1}
            className={`${h.tab} ${i === current ? h.tabActive : ""}`}
            onClick={() => setActive(i)}
          >
            {label}
          </button>
        ))}
      </div>
      <div key={current} id={`${base}-panel`} className={h.tabPanel} role="tabpanel" aria-labelledby={`${base}-tab-${current}`} tabIndex={0}>
        {panels[current]}
      </div>
    </div>
  );
}
