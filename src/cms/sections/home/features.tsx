// Home: mission statement with the video card and the "Daily Light" card.
import { defineSection } from "@/cms/define";
import { f } from "@/cms/fields";
import { ViewportSection } from "@/cms/sections/shared/animate";
import { ds } from "@/components/site/ds";
import h from "./home.module.css";
import { youtubeId } from "./util";

// Decorative waveform (not content): bar heights in px; the first ones are "played" (amber).
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
      <ViewportSection className={`${ds.section} ${ds.cream}`} id="features-detail">
        <div className={ds.container}>
          {(data.tag || data.highlight || data.muted) && (
            <div className={`${h.missionHead} ${ds.reveal}`}>
              <p className={h.missionLabel}>{data.tag}</p>
              {(data.highlight || data.muted) && (
                <h2 className={h.missionText}>
                  {data.highlight}
                  {data.highlight && data.muted && " "}
                  {data.muted && <span className={h.missionMuted}>{data.muted}</span>}
                </h2>
              )}
            </div>
          )}

          <div className={h.missionCards}>
            <div className={`${h.videoCard} ${ds.reveal}`}>
              {vid ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://img.youtube.com/vi/${vid}/hqdefault.jpg`} alt="" loading="lazy" className={h.videoThumb} />
                  <span className={h.videoShade} aria-hidden />
                  <a
                    href={`https://youtu.be/${vid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={h.playButton}
                    aria-label={data.videoQuote ? `Play video: ${data.videoQuote}` : "Play video"}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M7 4.5v15a1 1 0 0 0 1.52.85l12-7.5a1 1 0 0 0 0-1.7l-12-7.5A1 1 0 0 0 7 4.5z" />
                    </svg>
                  </a>
                </>
              ) : (
                <div className={h.placeholder} />
              )}
              {(data.videoQuote || data.videoReference) && (
                <div className={h.videoBadges}>
                  {data.videoQuote && <span className={h.quoteBadge}>&ldquo;{data.videoQuote}&rdquo;</span>}
                  {data.videoReference && <span className={h.refBadge}>{data.videoReference}</span>}
                </div>
              )}
            </div>

            <div className={`${h.lightCard} ${ds.reveal}`}>
              {(data.cardLabelLeft || data.cardLabelRight) && (
                <div className={h.lightLabels}>
                  <span>{data.cardLabelLeft}</span>
                  <span>{data.cardLabelRight}</span>
                </div>
              )}

              <div className={h.lightBody}>
                {data.cardTitle && <h3 className={h.lightTitle}>{data.cardTitle}</h3>}
                <div className={h.waveform} aria-hidden>
                  {WAVEFORM.map((height, i) => (
                    <span key={i} className={i < WAVEFORM_ACTIVE ? h.barOn : h.bar} style={{ height }} />
                  ))}
                </div>
              </div>

              {(data.cardText || avatar) && (
                <div className={h.lightFoot}>
                  <p>{data.cardText}</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {avatar && <img src={avatar.url} alt={avatar.alt} width={52} height={52} loading="lazy" className={h.avatar} />}
                </div>
              )}
            </div>
          </div>
        </div>
      </ViewportSection>
    );
  },
});
