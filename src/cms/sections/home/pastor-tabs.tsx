"use client";
// Tab switcher for the home pastor section. Panels are rendered on the server and passed in.
import { useState, type ReactNode } from "react";
import styles from "@/app/(site)/page.module.css";

export function PastorTabs({ labels, panels }: { labels: string[]; panels: ReactNode[] }) {
  const [active, setActive] = useState(0);
  const current = Math.min(active, panels.length - 1);
  return (
    <div className={`${styles.tabsContainer} animate-fade-in-up`} style={{ animationDelay: "1.3s" }}>
      <div className={styles.tabButtons} role="tablist">
        {labels.map((label, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === current}
            className={`${styles.tabButton} ${i === current ? styles.tabButtonActive : ""}`}
            onClick={() => setActive(i)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={styles.tabPanel} role="tabpanel">
        <div key={current} className={`${styles.tabContent} animate-fade-in-up`}>
          {panels[current]}
        </div>
      </div>
    </div>
  );
}
