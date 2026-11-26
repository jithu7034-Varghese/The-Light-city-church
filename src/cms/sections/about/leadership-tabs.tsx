// Leader cards for the about_leadership section (Figma "Pastoral Oversight"): every leader is shown
// side by side as a card (photo on top, role, name, biography, optional quote), so no tabs are needed.
// Server-safe; receives plain, already-resolved data only.
import { ds } from "@/components/site/ds";
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

export function LeaderCards({ leaders }: { leaders: Leader[] }) {
  if (leaders.length === 0) return null;
  return (
    <div className={leaders.length === 1 ? a.leaderSingle : ds.cardGrid2}>
      {leaders.map((l) => (
        <article key={l.id} className={`${ds.card} ${a.leaderCard} ${ds.reveal}`} aria-label={l.name || l.tabLabel || undefined}>
          {l.image && (
            <div className={a.leaderPhoto}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.image.url} alt={l.image.alt} loading="lazy" />
            </div>
          )}
          <div className={a.leaderBody}>
            {l.role && <p className={a.leaderRole}>{l.role}</p>}
            {l.name && <h3 className={ds.h3}>{l.name}</h3>}
            {l.bio.map((p, i) => (
              <p key={i} className={ds.body}>
                {p}
              </p>
            ))}
            {l.quote && <blockquote className={a.leaderQuote}>{l.quote}</blockquote>}
          </div>
        </article>
      ))}
    </div>
  );
}
