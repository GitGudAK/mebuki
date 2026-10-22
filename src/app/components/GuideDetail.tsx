import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Player, type PlayerRef } from "../../motion";
import { GuideVideo } from "../../video/GuideVideo";
import {
  FPS,
  INTRO_FRAMES,
  OUTRO_FRAMES,
  POSTER_FRAME,
  STEP_FRAMES,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
  getGuideDurationInFrames,
} from "../../video/timing";
import type { GuideSource, PlantGuide } from "../../types";
import { STEP_META } from "../meta";
import { hrefFor } from "../router";
import { DifficultyBadge } from "./DifficultyBadge";
import { HeartButton } from "./HeartButton";
import { ShareButton } from "./ShareButton";
import { ExportPanel } from "./ExportPanel";
import { isNativeApp } from "../platform";

const NEW_ISSUE_URL = "https://github.com/GitGudAK/mebuki/issues/new/choose";

type Chapter = { label: string; start: number; length: number };

/** Intro, one chapter per care step, then the outro: the same timeline the video plays. */
const chaptersFor = (guide: PlantGuide): Chapter[] => [
  { label: "Intro", start: 0, length: INTRO_FRAMES },
  ...guide.steps.map((step, i) => ({
    label: STEP_META[step.kind].label,
    start: INTRO_FRAMES + i * STEP_FRAMES,
    length: STEP_FRAMES,
  })),
  { label: "Recap", start: INTRO_FRAMES + guide.steps.length * STEP_FRAMES, length: OUTRO_FRAMES },
];

const formatTime = (frame: number) => {
  const s = Math.floor(frame / FPS);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const SourceLinks = ({ sources }: { sources: GuideSource[] }) => (
  <ul className="g-source-list">
    {sources.map((s) => (
      <li key={s.url}>
        <a href={s.url} target="_blank" rel="noopener noreferrer">
          {s.title}
        </a>
      </li>
    ))}
  </ul>
);

const SourcesDrawer = ({ sources, label = "Sources" }: { sources: GuideSource[]; label?: string }) => (
  <details className="g-drawer">
    <summary>
      {label} ({sources.length})
    </summary>
    <SourceLinks sources={sources} />
  </details>
);

export const GuideDetail = ({ guide }: { guide: PlantGuide }) => {
  const playerRef = useRef<PlayerRef>(null);
  const [frame, setFrame] = useState(0);
  const durationInFrames = getGuideDurationInFrames(guide);
  const chapters = chaptersFor(guide);
  let current = 0;
  chapters.forEach((c, i) => {
    if (frame >= c.start) current = i;
  });

  useEffect(() => {
    document.title = `${guide.name} care · Mebuki`;
    window.scrollTo(0, 0);
    return () => {
      document.title = "Mebuki";
    };
  }, [guide.name]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const onFrame = (e: { detail: { frame: number } }) => setFrame(e.detail.frame);
    player.addEventListener("frameupdate", onFrame);
    player.addEventListener("seeked", onFrame);
    return () => {
      player.removeEventListener("frameupdate", onFrame);
      player.removeEventListener("seeked", onFrame);
    };
  }, []);

  const stageRef = useRef<HTMLDivElement>(null);

  const seekTo = useCallback((start: number) => {
    const player = playerRef.current;
    if (!player) return;
    player.seekTo(start);
    player.play();
    // Bring the animation back into view when a chapter is picked further down.
    const stage = stageRef.current;
    if (stage && stage.getBoundingClientRect().bottom < 120) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const themeStyle = {
    "--plant-bg": guide.palette.background,
    "--plant-accent": guide.palette.accent,
  } as CSSProperties;

  const stepSources = (refs?: number[]) =>
    refs?.length ? refs.map((r) => guide.sources[r]).filter(Boolean) : guide.sources;

  return (
    <article className="g" style={themeStyle}>
      <div className="g-stage" ref={stageRef}>
        <Player
          ref={playerRef}
          component={GuideVideo}
          inputProps={{ guide, inApp: true }}
          durationInFrames={durationInFrames}
          compositionWidth={VIDEO_WIDTH}
          compositionHeight={VIDEO_HEIGHT}
          fps={FPS}
          loop
          clickToPlay
          posterFrame={POSTER_FRAME}
          style={{ width: "100%", height: "100%" }}
        />

        <div className="g-stage-top">
          <a className="g-round" href={hrefFor({ name: "library" })} aria-label="All plants">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <span className="g-stage-actions">
            <ShareButton guide={guide} className="g-round" />
            <HeartButton id={guide.id} name={guide.name} className="g-round" />
          </span>
        </div>

        <nav className="g-strip" aria-label="Chapters">
          <div className="g-strip-bars">
            {chapters.map((c, i) => {
              const fill = Math.min(1, Math.max(0, (frame - c.start + 1) / c.length));
              return (
                <button
                  key={c.start}
                  type="button"
                  className="g-strip-bar"
                  aria-label={`Play ${c.label}`}
                  aria-current={i === current ? "step" : undefined}
                  onClick={() => seekTo(c.start)}
                >
                  <span style={{ transform: `scaleX(${fill})` }} />
                </button>
              );
            })}
          </div>
          <div className="g-strip-caption" aria-live="polite">
            <span>{chapters[current].label}</span>
            <span>
              {current + 1} of {chapters.length}
            </span>
          </div>
        </nav>
      </div>

      <div className="g-sheet">
        <header className="g-head">
          <h1>{guide.name}</h1>
          <p className="g-sci">
            {guide.scientificName} · <DifficultyBadge difficulty={guide.difficulty} /> ·{" "}
            {Math.round(durationInFrames / FPS)}s
          </p>
          <p className="g-hook">{guide.hook}</p>
          <ul className="tag-list" aria-label="Tags">
            {guide.tags.map((t) => (
              <li key={t} className="tag">
                {t}
              </li>
            ))}
          </ul>
        </header>

        <section aria-labelledby="chapters-title">
          <h2 id="chapters-title" className="g-section-title">
            Chapters
          </h2>
          <ol className="g-chapters">
            {guide.steps.map((step, i) => {
              const chapter = chapters[i + 1];
              const open = current === i + 1;
              const meta = STEP_META[step.kind];
              return (
                <li key={chapter.start} className={`g-chapter${open ? " is-open" : ""}`}>
                  <button
                    type="button"
                    className="g-chapter-row"
                    aria-expanded={open}
                    onClick={() => seekTo(chapter.start)}
                  >
                    <span className="g-chapter-icon" aria-hidden="true">
                      {meta.icon}
                    </span>
                    <span className="g-chapter-title">{step.title}</span>
                    <span className="g-chapter-time">{formatTime(chapter.start)}</span>
                  </button>
                  <div className="g-chapter-body">
                    <div className="g-chapter-inner">
                      <p>{step.tip}</p>
                      {step.stat && <span className="g-stat">{step.stat}</span>}
                      <SourcesDrawer sources={stepSources(step.sourceRefs)} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <p className="g-recap">{guide.outro}</p>

        {guide.faqs && guide.faqs.length > 0 && (
          <section aria-labelledby="faq-title">
            <h2 id="faq-title" className="g-section-title">
              Questions from growers
            </h2>
            <p className="g-muted">Answered by contributors, with sources.</p>
            {guide.faqs.map((faq) => (
              <details key={faq.question} className="g-faq">
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
                <SourceLinks sources={faq.sources} />
                {faq.contributor && <p className="g-credit">Added by @{faq.contributor}</p>}
              </details>
            ))}
          </section>
        )}

        <div className="g-footer-links">
          <SourcesDrawer sources={guide.sources} label="All sources" />
          <a className="g-suggest" href={NEW_ISSUE_URL} target="_blank" rel="noopener noreferrer">
            Ask a question or fix a tip on GitHub
          </a>
        </div>

        {!isNativeApp && <ExportPanel id={guide.id} />}
      </div>
    </article>
  );
};
