import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Player, type PlayerRef } from "../../motion";
import { GuideVideo } from "../../video/GuideVideo";
import {
  FPS,
  INTRO_FRAMES,
  POSTER_FRAME,
  STEP_FRAMES,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
  getGuideDurationInFrames,
} from "../../video/timing";
import type { PlantGuide } from "../../types";
import { STEP_META } from "../meta";
import { hrefFor } from "../router";
import { DifficultyBadge } from "./DifficultyBadge";
import { ExportPanel } from "./ExportPanel";
import { isNativeApp } from "../platform";

/** -1 = intro, steps.length = outro, otherwise the step index. */
const segmentForFrame = (frame: number, stepCount: number) => {
  if (frame < INTRO_FRAMES) return -1;
  return Math.min(Math.floor((frame - INTRO_FRAMES) / STEP_FRAMES), stepCount);
};

const stepStartFrame = (i: number) => INTRO_FRAMES + i * STEP_FRAMES;

const formatTime = (frame: number) => {
  const s = Math.floor(frame / FPS);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export const GuideDetail = ({ guide }: { guide: PlantGuide }) => {
  const playerRef = useRef<PlayerRef>(null);
  const [segment, setSegment] = useState(-1);
  const durationInFrames = getGuideDurationInFrames(guide);

  useEffect(() => {
    document.title = `${guide.name} care · Mebuki`;
    return () => {
      document.title = "Mebuki · Animated Plant Care";
    };
  }, [guide.name]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const onFrame = (e: { detail: { frame: number } }) => {
      setSegment(segmentForFrame(e.detail.frame, guide.steps.length));
    };
    player.addEventListener("frameupdate", onFrame);
    player.addEventListener("seeked", onFrame);
    return () => {
      player.removeEventListener("frameupdate", onFrame);
      player.removeEventListener("seeked", onFrame);
    };
  }, [guide.steps.length]);

  const seekToStep = useCallback(
    (i: number) => {
      const player = playerRef.current;
      if (!player) return;
      player.seekTo(stepStartFrame(i));
      setSegment(i);
      player.play();
    },
    [],
  );

  const themeStyle = {
    "--plant-bg": guide.palette.background,
    "--plant-accent": guide.palette.accent,
    "--plant-leaf": guide.palette.leaf,
    "--plant-pot": guide.palette.pot,
  } as CSSProperties;

  const totalSeconds = Math.round(durationInFrames / FPS);

  return (
    <article className="detail" style={themeStyle}>
      <a className="back-link" href={hrefFor({ name: "library" })}>
        ← All plants
      </a>

      <header className="detail-header">
        <div>
          <h1 className="detail-name">{guide.name}</h1>
          <p className="detail-sci">{guide.scientificName}</p>
        </div>
        <div className="detail-meta">
          <DifficultyBadge difficulty={guide.difficulty} />
          <span className="meta-pill">▶ {totalSeconds}s guide</span>
        </div>
      </header>
      <p className="detail-hook">{guide.hook}</p>
      <ul className="tag-list" aria-label="Tags">
        {guide.tags.map((t) => (
          <li key={t} className="tag">
            {t}
          </li>
        ))}
      </ul>

      <div className="detail-layout">
        <div className="player-column">
          <div className="phone-frame">
            <div className="phone-notch" aria-hidden="true" />
            <div className="phone-screen">
              <Player
                ref={playerRef}
                component={GuideVideo}
                inputProps={{ guide }}
                durationInFrames={durationInFrames}
                compositionWidth={VIDEO_WIDTH}
                compositionHeight={VIDEO_HEIGHT}
                fps={FPS}
                controls
                loop
                clickToPlay
                posterFrame={POSTER_FRAME}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </div>
        </div>

        <div className="steps-column">
          <h2 className="section-title">Care routine</h2>
          <ol className="step-list">
            {guide.steps.map((step, i) => {
              const meta = STEP_META[step.kind];
              const active = segment === i;
              return (
                <li key={`${step.kind}-${i}`}>
                  <button
                    type="button"
                    className={`step-card${active ? " is-active" : ""}`}
                    aria-current={active ? "step" : undefined}
                    onClick={() => seekToStep(i)}
                  >
                    <span className="step-icon" aria-hidden="true">
                      {meta.icon}
                    </span>
                    <span className="step-body">
                      <span className="step-kicker">
                        Step {i + 1} · {meta.label}
                        <span className="step-time">{formatTime(stepStartFrame(i))}</span>
                      </span>
                      <span className="step-title">{step.title}</span>
                      <span className="step-tip">{step.tip}</span>
                    </span>
                    {step.stat && <span className="step-stat">{step.stat}</span>}
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="takeaway">
            <span aria-hidden="true">✨</span>
            <p>{guide.outro}</p>
          </div>

          {guide.sources && guide.sources.length > 0 && (
            <section className="sources" aria-labelledby="sources-title">
              <h2 id="sources-title" className="section-title">
                Sources
              </h2>
              <ul>
                {guide.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!isNativeApp && <ExportPanel id={guide.id} />}
        </div>
      </div>
    </article>
  );
};
