"use client";
// Tab switcher for the about_leadership section. Receives plain, already-resolved data only.
import { useState } from "react";
import a from "./about.module.css";

export type Leader = {
  id: string;
  tabLabel: string;
  name: string;
  role: string;
  bio: string[];
  quote: string;
  image: { url: string; alt: string } | null;
};

const FILL: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%" };

export function LeadershipTabs({ tag, heading, leaders }: { tag: string; heading: string; leaders: Leader[] }) {
  const [activeId, setActiveId] = useState(leaders[0]?.id);
  const current = leaders.find((l) => l.id === activeId) ?? leaders[0];

  return (
    <>
      <div className={a.leadershipHeader}>
        {tag && <span className={a.sectionTag}>{tag}</span>}
        {heading && <h2 className={a.valuesTitle}>{heading}</h2>}

        {leaders.length > 1 && (
          <div className={a.tabSwitcher} role="tablist">
            {leaders.map((l) => (
              <button
                key={l.id}
                type="button"
                role="tab"
                aria-selected={l.id === current?.id}
                className={`${a.tabBtn} ${l.id === current?.id ? a.tabBtnActive : ""}`}
                onClick={() => setActiveId(l.id)}
              >
                {l.tabLabel}
              </button>
            ))}
          </div>
        )}
      </div>

      {current && (
        <div className={a.magazineGrid}>
          {current.image && (
            <div className={`${a.pastorImageWrapper} animate-premium-block`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={current.id} src={current.image.url} alt={current.image.alt} loading="lazy" className={a.pastorImage} style={FILL} />
            </div>
          )}

          <div className={a.pastorDetailsArea} key={`details-${current.id}`}>
            {current.name && <h3 className={a.pastorName}>{current.name}</h3>}
            {current.role && <span className={a.pastorRole}>{current.role}</span>}
            {current.bio.map((p, i) => (
              <p key={i} className={a.pastorBio}>
                {p}
              </p>
            ))}
            {current.quote && <blockquote className={a.pastorQuote}>{current.quote}</blockquote>}
          </div>
        </div>
      )}
    </>
  );
}
