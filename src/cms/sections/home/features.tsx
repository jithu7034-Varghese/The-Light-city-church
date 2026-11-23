// Home: mission statement with the video card and the "Daily Light" card.
import { defineSection } from "@/cms/define";
import { f } from "@/cms/fields";
import { SplitText, ViewportSection } from "@/cms/sections/shared/animate";
import styles from "@/app/(site)/page.module.css";
import h from "./home.module.css";
import { youtubeId } from "./util";

// Decorative waveform (not content).
const WAVEFORM = [12, 18, 8, 24, 14, 20, 28, 16, 22, 10, 18, 8, 14, 24, 12, 20, 8, 16, 10, 14];
const WAVEFORM_ACTIVE = 10;

export const homeFeatures = defineSection({
  type: "home_features",
  label: "Home: mission and video",
  description: "Mission statement, a YouTube video card and a short devotional card.",
  fields: {
    tag: f.text("Small text above the statement", { max: 60 }),
    highlight: f.textarea("Statement (dark part)", { max: 400 }),
    muted: f.textarea("Statement (light part, optional)", { max: 400 }),
    youtube: f.text("YouTube video", { max: 200, help: "The video link or its 11-character id.", placeholder: "https://youtu.be/…" }),
    videoQuote: f.text("Quote on the video", { max: 120 }),
    videoReference: f.text("Small label on the video", { max: 60 }),
    cardLabelLeft: f.text("Card: top-left label", { max: 40 }),
    cardLabelRight: f.text("Card: top-right label", { max: 40 }),
    cardTitle: f.textarea("Card: title", { max: 200 }),
    cardText: f.textarea("Card: footer text", { max: 300 }),
    cardImage: f.image("Card: small round photo"),
  },
  Component: ({ data, ctx }) => {
    const vid = youtubeId(data.youtube);
    const avatar = ctx.image(data.cardImage);
    return (
      <ViewportSection className={styles.featuresSection} id="features-detail">
        <div className={styles.featuresCard}>
          <div className={styles.featuresHeader}>
            {data.tag && (
              <span className={styles.featuresTag}>
                <SplitText text={data.tag} delayOffset={0.0} />
              </span>
            )}
            {(data.highlight || data.muted) && (
              <h2 className={styles.featuresTitle}>
                {data.highlight && (
                  <span className={styles.highlightText}>
                    <SplitText text={data.highlight} delayOffset={0.15} by="words" />
                  </span>
                )}{" "}
                {data.muted && (
                  <span className={styles.mutedText}>
                    <SplitText text={data.muted} delayOffset={0.75} by="words" />
                  </span>
                )}
              </h2>
            )}
          </div>

          <div className={styles.cardsGrid}>
            <div className={`${styles.videoCard} animate-premium-block`}>
              {vid ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://img.youtube.com/vi/${vid}/hqdefault.jpg`} alt="" loading="lazy" className={`${styles.videoBgImage} ${h.fill}`} />
                  <a
                    href={`https://youtu.be/${vid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.playButton}
                    aria-label={data.videoQuote ? `Play video: ${data.videoQuote}` : "Play video"}
                  >
                    <svg width="18" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <polygon points="5 3 21 12 5 21 5 3"></polygon>
                    </svg>
                  </a>
                </>
              ) : (
                <div className={h.placeholder} />
              )}
              {(data.videoQuote || data.videoReference) && (
                <div className={styles.videoBadges}>
                  {data.videoQuote && <div className={styles.quoteBadge}>&ldquo;{data.videoQuote}&rdquo;</div>}
                  {data.videoReference && <div className={styles.authorBadge}>{data.videoReference}</div>}
                </div>
              )}
            </div>

            <div className={`${styles.audioCard} animate-premium-block delay-2`}>
              <div className={styles.audioHeader}>
                <span className={styles.audioBrand}>{data.cardLabelLeft}</span>
                <span className={styles.audioBrand}>{data.cardLabelRight}</span>
              </div>

              <div className={styles.audioBody}>
                {data.cardTitle && <h3 className={styles.audioTitle}>{data.cardTitle}</h3>}
                <div className={styles.waveformContainer} aria-hidden>
                  {WAVEFORM.map((height, i) => (
                    <div key={i} className={`${styles.waveformBar} ${i < WAVEFORM_ACTIVE ? styles.activeBar : ""}`} style={{ height: `${height}px` }} />
                  ))}
                </div>
              </div>

              <div className={styles.audioFooter}>
                {data.cardText && <p className={styles.audioFooterText}>{data.cardText}</p>}
                {avatar && (
                  <div className={styles.avatarWrapper}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatar.url} alt={avatar.alt} width={52} height={52} loading="lazy" className={styles.avatarImage} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </ViewportSection>
    );
  },
});
