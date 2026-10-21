import React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  Series,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "../motion";
import type { Difficulty, GuideStep, PlantGuide } from "../types";
import { INTRO_FRAMES, OUTRO_FRAMES, POSTER_FRAME, STEP_FRAMES } from "./timing";
import { PlantIllustration } from "./PlantIllustration";
import { STEP_LABELS, StepMotif } from "./StepIcons";
import { inkFor, mix, readableOn, shade, withAlpha } from "./colors";

export const FONT_STACK = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

/** Safe area for platform UI (TikTok/Reels/Shorts overlays). */
const SAFE = { side: 90, top: 200, bottom: 300 } as const;
const CONTENT_W = 1080 - SAFE.side * 2;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Palette = PlantGuide["palette"];

const useTheme = (palette: Palette) => {
  const ink = inkFor(palette.background);
  return {
    ink,
    inkSoft: withAlpha(ink, 0.72),
    accentText: readableOn(palette.accent, palette.background, 3),
    accentInk: inkFor(palette.accent),
  };
};

/** Fades/lifts a scene out over its last few frames. */
const useExit = (duration: number, frames = 8) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [duration - frames, duration], [0, 1], clamp);
  return { opacity: 1 - t, transform: `translateY(${-t * 40}px)` };
};

/* ----------------------------------------------------------- background */

const Backdrop: React.FC<{ palette: Palette }> = ({ palette }) => {
  const frame = useCurrentFrame();
  const blobA = mix(palette.background, palette.accent, 0.14);
  const blobB = mix(palette.background, palette.leaf, 0.14);
  return (
    <AbsoluteFill style={{ background: palette.background, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: blobA,
          left: -320 + Math.sin(frame / 60) * 40,
          top: -260 + Math.cos(frame / 70) * 30,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1000,
          height: 1000,
          borderRadius: "50%",
          background: blobB,
          right: -420 + Math.cos(frame / 65) * 40,
          bottom: -380 + Math.sin(frame / 55) * 30,
        }}
      />
      {Array.from({ length: 14 }).map((_, i) => {
        const x = random(`dotx${i}`) * 1080;
        const y = ((random(`doty${i}`) * 1920 - frame * (0.4 + random(`dots${i}`) * 0.6)) % 1920 + 1920) % 1920;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 10 + random(`dotr${i}`) * 14,
              height: 10 + random(`dotr${i}`) * 14,
              borderRadius: "50%",
              background: withAlpha(palette.leaf, 0.12),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/* ----------------------------------------------------------- shared bits */

const Pill: React.FC<{
  children: React.ReactNode;
  bg: string;
  color: string;
  fontSize?: number;
  style?: React.CSSProperties;
}> = ({ children, bg, color, fontSize = 34, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 14,
      background: bg,
      color,
      fontSize,
      fontWeight: 800,
      letterSpacing: 1,
      padding: `${fontSize * 0.34}px ${fontSize * 0.75}px`,
      borderRadius: 999,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </div>
);

const DIFFICULTY: Record<Difficulty, { label: string; color: string; dots: number }> = {
  easy: { label: "Easy care", color: "#2FA36B", dots: 1 },
  moderate: { label: "Moderate", color: "#E39B2D", dots: 2 },
  tricky: { label: "Tricky", color: "#D9534F", dots: 3 },
};

/** Animate every number inside `stat` counting up from 0. */
const countUp = (stat: string, progress: number) =>
  stat.replace(/\d+(?:[.,]\d+)?/g, (m) => {
    const n = parseFloat(m.replace(",", "."));
    const decimals = m.includes(".") || m.includes(",") ? m.split(/[.,]/)[1].length : 0;
    return (n * progress).toFixed(decimals);
  });

const WordReveal: React.FC<{
  text: string;
  start: number;
  stagger?: number;
  style?: React.CSSProperties;
}> = ({ text, start, stagger = 2, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: "0.28em", ...style }}>
      {words.map((w, i) => {
        const s = spring({ frame: frame - start - i * stagger, fps, config: { damping: 16, stiffness: 160 } });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: s,
              transform: `translateY(${(1 - s) * 30}px)`,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

/* ----------------------------------------------------------- intro */

const nameSize = (name: string) => Math.max(84, Math.min(136, Math.floor(CONTENT_W / (name.length * 0.56))));

export const IntroScene: React.FC<{ guide: PlantGuide }> = ({ guide }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = useTheme(guide.palette);
  const exit = useExit(INTRO_FRAMES, 6);
  const s = (delay: number, damping = 14) => spring({ frame: frame - delay, fps, config: { damping, stiffness: 140 } });
  const diff = DIFFICULTY[guide.difficulty];
  const label = s(0);
  const name = s(3, 12);
  const sci = s(9);
  const hook = s(26);
  const plantW = 460;

  return (
    <AbsoluteFill style={{ ...exit, fontFamily: FONT_STACK, color: theme.ink }}>
      <div
        style={{
          position: "absolute",
          top: SAFE.top + 30,
          left: SAFE.side,
          right: SAFE.side,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Pill
          bg={guide.palette.accent}
          color={theme.accentInk}
          fontSize={30}
          style={{ opacity: label, transform: `scale(${0.6 + label * 0.4})`, letterSpacing: 4 }}
        >
          🌿 PLANT CARE GUIDE
        </Pill>
        <div
          style={{
            marginTop: 30,
            fontSize: nameSize(guide.name),
            fontWeight: 900,
            lineHeight: 1.0,
            letterSpacing: -2,
            opacity: name,
            transform: `translateY(${(1 - name) * 60}px)`,
          }}
        >
          {guide.name}
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 46,
            fontStyle: "italic",
            fontWeight: 500,
            color: theme.inkSoft,
            opacity: sci,
            transform: `translateY(${(1 - sci) * 30}px)`,
          }}
        >
          {guide.scientificName}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 650,
          left: (1080 - plantW) / 2,
          width: plantW,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -40,
            top: 40,
            width: plantW + 80,
            height: plantW + 80,
            borderRadius: "50%",
            background: withAlpha(guide.palette.accent, 0.16),
            transform: `scale(${s(4, 18)})`,
          }}
        />
        <PlantIllustration leafShape={guide.leafShape} palette={guide.palette} width={plantW} growStart={6} idPrefix={`intro-${guide.id}`} />
      </div>

      <div
        style={{
          position: "absolute",
          top: 1340,
          left: SAFE.side,
          right: SAFE.side,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: 52,
            fontWeight: 800,
            lineHeight: 1.15,
            textWrap: "balance",
            opacity: hook,
            transform: `translateY(${(1 - hook) * 40}px)`,
          }}
        >
          {guide.hook}
        </div>
        <div
          style={{
            marginTop: 34,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 16,
          }}
        >
          {[
            <Pill key="diff" bg={diff.color} color="#fff" fontSize={32}>
              <span style={{ display: "inline-flex", gap: 6 }}>
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 7,
                      background: d < diff.dots ? "#fff" : "rgba(255,255,255,0.35)",
                    }}
                  />
                ))}
              </span>
              {diff.label}
            </Pill>,
            ...guide.tags.slice(0, 4).map((t) => (
              <Pill
                key={t}
                bg={withAlpha(theme.ink, 0.08)}
                color={theme.ink}
                fontSize={32}
                style={{ fontWeight: 700, border: `3px solid ${withAlpha(theme.ink, 0.14)}` }}
              >
                {t}
              </Pill>
            )),
          ].map((el, i) => {
            const c = s(36 + i * 4, 12);
            return (
              <div key={i} style={{ opacity: c, transform: `scale(${0.5 + c * 0.5})` }}>
                {el}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ----------------------------------------------------------- step */

export const StepScene: React.FC<{
  guide: PlantGuide;
  step: GuideStep;
  index: number;
}> = ({ guide, step, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = useTheme(guide.palette);
  const exit = useExit(STEP_FRAMES);
  const s = (delay: number, damping = 14) => spring({ frame: frame - delay, fps, config: { damping, stiffness: 140 } });

  const pill = s(0);
  const title = s(4, 13);
  const motif = s(8, 16);
  const statIn = s(22, 10);
  const statCount = interpolate(frame, [22, 52], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const hasStat = Boolean(step.stat);
  const motifSize = hasStat ? 560 : 640;
  const motifTop = hasStat ? 560 : 580;

  return (
    <AbsoluteFill style={{ ...exit, fontFamily: FONT_STACK, color: theme.ink }}>
      <div
        style={{
          position: "absolute",
          top: 262,
          left: SAFE.side,
          right: SAFE.side,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Pill
          bg={guide.palette.accent}
          color={theme.accentInk}
          fontSize={32}
          style={{ opacity: pill, transform: `translateY(${(1 - pill) * -20}px) scale(${0.7 + pill * 0.3})`, letterSpacing: 3 }}
        >
          STEP {index + 1} · {STEP_LABELS[step.kind].toUpperCase()}
        </Pill>
        <div
          style={{
            marginTop: 26,
            fontSize: step.title.length > 22 ? 82 : 92,
            fontWeight: 900,
            lineHeight: 1.04,
            letterSpacing: -1.5,
            textWrap: "balance",
            opacity: title,
            transform: `translateY(${(1 - title) * 50}px)`,
          }}
        >
          {step.title}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: motifTop,
          left: (1080 - motifSize) / 2,
          width: motifSize,
          height: motifSize,
          opacity: Math.min(1, motif * 1.4),
          transform: `scale(${0.75 + motif * 0.25})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: -20,
            borderRadius: "50%",
            background: withAlpha(guide.palette.accent, 0.14),
            border: `4px dashed ${withAlpha(guide.palette.accent, 0.3)}`,
          }}
        />
        <StepMotif kind={step.kind} palette={guide.palette} size={motifSize} />
      </div>

      {hasStat && (
        <div
          style={{
            position: "absolute",
            top: 1138,
            left: SAFE.side,
            right: SAFE.side,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 120,
              fontWeight: 900,
              letterSpacing: -3,
              lineHeight: 1,
              color: theme.accentText,
              fontVariantNumeric: "tabular-nums",
              opacity: statIn,
              transform: `scale(${0.4 + statIn * 0.6})`,
              whiteSpace: "nowrap",
            }}
          >
            {countUp(step.stat ?? "", statCount)}
          </div>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: hasStat ? 1290 : 1270,
          left: SAFE.side,
          right: SAFE.side,
          bottom: SAFE.bottom,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        <WordReveal
          text={step.tip}
          start={24}
          stagger={1.5}
          style={{
            fontSize: 52,
            fontWeight: 600,
            lineHeight: 1.28,
            textAlign: "center",
            color: theme.ink,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

/* ----------------------------------------------------------- outro */

const FallingLeaves: React.FC<{ palette: Palette; start: number }> = ({ palette, start }) => {
  const frame = useCurrentFrame();
  const t = frame - start;
  if (t < 0) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        {Array.from({ length: 22 }).map((_, i) => {
          const delay = random(`fl-d${i}`) * 30;
          const age = t - delay;
          if (age < 0) return null;
          const x = random(`fl-x${i}`) * 1080 + Math.sin(age / 10 + i) * 40;
          const y = -60 + age * (9 + random(`fl-v${i}`) * 8);
          const rot = age * (4 + random(`fl-r${i}`) * 6) * (i % 2 ? 1 : -1);
          const scale = 0.8 + random(`fl-s${i}`) * 1.0;
          const color = i % 3 === 0 ? palette.accent : i % 3 === 1 ? palette.leaf : shade(palette.leaf, 0.25);
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`} opacity={0.85}>
              <path d="M0 0 C -14 -8 -18 -34 0 -48 C 18 -34 14 -8 0 0 Z" fill={color} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

export const OutroScene: React.FC<{ guide: PlantGuide }> = ({ guide }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = useTheme(guide.palette);
  const s = (delay: number, damping = 14) => spring({ frame: frame - delay, fps, config: { damping, stiffness: 140 } });
  const text = s(14, 13);
  const cta = s(34, 9);
  const follow = s(50);
  const pulse = frame > 50 ? 1 + Math.sin((frame - 50) / 5) * 0.035 : 1;
  const fadeOut = interpolate(frame, [OUTRO_FRAMES - 6, OUTRO_FRAMES], [1, 0.85], clamp);
  const plantW = 380;

  return (
    <AbsoluteFill style={{ fontFamily: FONT_STACK, color: theme.ink, opacity: fadeOut }}>
      <FallingLeaves palette={guide.palette} start={40} />
      <div
        style={{
          position: "absolute",
          top: 350,
          left: (1080 - plantW) / 2,
          width: plantW,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -50,
            top: 30,
            width: plantW + 100,
            height: plantW + 100,
            borderRadius: "50%",
            background: withAlpha(guide.palette.accent, 0.16),
            transform: `scale(${s(0, 18)})`,
          }}
        />
        <PlantIllustration leafShape={guide.leafShape} palette={guide.palette} width={plantW} growStart={0} idPrefix={`outro-${guide.id}`} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 900,
          left: SAFE.side,
          right: SAFE.side,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: 4,
            color: theme.accentText,
            opacity: text,
          }}
        >
          {guide.name.toUpperCase()} IN SHORT
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 76,
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: -1.5,
            textWrap: "balance",
            opacity: text,
            transform: `translateY(${(1 - text) * 50}px)`,
          }}
        >
          {guide.outro}
        </div>
        <div style={{ marginTop: 60, transform: `scale(${cta * pulse})`, opacity: cta }}>
          <Pill
            bg={guide.palette.accent}
            color={theme.accentInk}
            fontSize={54}
            style={{ boxShadow: `0 16px 40px ${withAlpha(shade(guide.palette.accent, -0.4), 0.35)}`, letterSpacing: 0 }}
          >
            Save this for later 🌱
          </Pill>
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 40,
            fontWeight: 600,
            color: theme.inkSoft,
            opacity: follow,
            transform: `translateY(${(1 - follow) * 20}px)`,
          }}
        >
          Follow for a new plant guide every week
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ----------------------------------------------------------- progress */

const StepProgress: React.FC<{ guide: PlantGuide }> = ({ guide }) => {
  const frame = useCurrentFrame();
  const theme = useTheme(guide.palette);
  const n = guide.steps.length;
  const stepsEnd = INTRO_FRAMES + n * STEP_FRAMES;
  const visible =
    interpolate(frame, [INTRO_FRAMES - 8, INTRO_FRAMES + 4], [0, 1], clamp) *
    interpolate(frame, [stepsEnd - 4, stepsEnd + 8], [1, 0], clamp);
  if (visible <= 0) return null;
  const gap = 14;
  const segW = (CONTENT_W - gap * (n - 1)) / n;
  return (
    <div
      style={{
        position: "absolute",
        top: 214,
        left: SAFE.side,
        width: CONTENT_W,
        height: 14,
        display: "flex",
        gap,
        opacity: visible,
        transform: `translateY(${(1 - visible) * -20}px)`,
      }}
    >
      {guide.steps.map((_, i) => {
        const start = INTRO_FRAMES + i * STEP_FRAMES;
        const p = interpolate(frame, [start, start + STEP_FRAMES], [0, 1], clamp);
        const active = frame >= start && frame < start + STEP_FRAMES;
        return (
          <div
            key={i}
            style={{
              width: segW,
              height: active ? 14 : 10,
              marginTop: active ? 0 : 2,
              borderRadius: 7,
              background: withAlpha(theme.ink, 0.15),
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${p * 100}%`,
                height: "100%",
                borderRadius: 7,
                background: guide.palette.accent,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

/* ----------------------------------------------------------- composition */

export const GuideVideo: React.FC<{ guide: PlantGuide }> = ({ guide }) => {
  return (
    <AbsoluteFill style={{ background: guide.palette.background, fontFamily: FONT_STACK }}>
      <Backdrop palette={guide.palette} />
      <Series>
        <Series.Sequence durationInFrames={INTRO_FRAMES} name="Intro">
          <IntroScene guide={guide} />
        </Series.Sequence>
        {guide.steps.map((step, i) => (
          <Series.Sequence key={i} durationInFrames={STEP_FRAMES} name={`Step ${i + 1}: ${step.kind}`}>
            <StepScene guide={guide} step={step} index={i} />
          </Series.Sequence>
        ))}
        <Series.Sequence durationInFrames={OUTRO_FRAMES} name="Outro">
          <OutroScene guide={guide} />
        </Series.Sequence>
      </Series>
      <StepProgress guide={guide} />
    </AbsoluteFill>
  );
};

/** Cover image: the intro scene frozen once everything has animated in. */
export const GuideThumbnail: React.FC<{ guide: PlantGuide }> = ({ guide }) => (
  <AbsoluteFill style={{ background: guide.palette.background, fontFamily: FONT_STACK }}>
    {/* A negative `from` shifts the local clock so children see POSTER_FRAME. */}
    <Sequence from={-POSTER_FRAME} layout="none">
      <Backdrop palette={guide.palette} />
      <IntroScene guide={guide} />
    </Sequence>
  </AbsoluteFill>
);
