import React from "react";
import {
  Easing,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "../motion";
import type { GuideStep, PlantGuide, StepKind } from "../types";
import { shade } from "./colors";
import { PLANT_VIEWBOX, PlantIllustration } from "./PlantIllustration";
import { PLANT_DRAWINGS } from "./plants";

type Palette = PlantGuide["palette"];
type MotifProps = { palette: Palette; guide: PlantGuide; step?: GuideStep };

/* ---------------------------------------------------------------- helpers */

const SOIL = "#5A3D29";
const WATER = "#4FB3EE";
const FONT = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const ci = (
  f: number,
  input: [number, number],
  output: [number, number],
  easing?: (t: number) => number,
) =>
  interpolate(f, input, output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

const useSpring = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (delay: number, config?: Parameters<typeof spring>[0]["config"]) =>
    spring({ frame: frame - delay, fps, config: { damping: 13, stiffness: 120, ...config } });
};

const Sparkle: React.FC<{ x: number; y: number; r: number; color: string; opacity?: number; rotate?: number }> = ({
  x,
  y,
  r,
  color,
  opacity = 1,
  rotate = 0,
}) => (
  <path
    transform={`translate(${x} ${y}) rotate(${rotate}) scale(${r})`}
    d="M0 -1 C 0.12 -0.12 0.12 -0.12 1 0 C 0.12 0.12 0.12 0.12 0 1 C -0.12 0.12 -0.12 0.12 -1 0 C -0.12 -0.12 -0.12 -0.12 0 -1 Z"
    fill={color}
    opacity={opacity}
  />
);

const Drop: React.FC<{ x: number; y: number; s: number; color?: string; opacity?: number }> = ({
  x,
  y,
  s,
  color = WATER,
  opacity = 1,
}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
    <path d="M0 -14 C 6 -5 10 0 10 5 A 10 10 0 0 1 -10 5 C -10 0 -6 -5 0 -14 Z" fill={color} />
    <ellipse cx={-3.5} cy={4} rx={2.2} ry={3.5} fill="#fff" opacity={0.7} />
  </g>
);

const LEAF_D = "M0 0 C -14 -8 -18 -34 0 -48 C 18 -34 14 -8 0 0 Z";

/** The guide's own plant drawing, fully grown, with its container's base at (x, base) and `h` units tall. */
const GuidePlant: React.FC<{ guide: PlantGuide; x: number; base: number; h: number; id: string }> = ({ guide, x, base, h, id }) => {
  const w = (h * PLANT_VIEWBOX.width) / PLANT_VIEWBOX.height;
  return (
    <PlantIllustration
      leafShape={guide.leafShape}
      palette={guide.palette}
      plantId={guide.id}
      width={w}
      x={x - w / 2}
      y={base - (h * 514) / PLANT_VIEWBOX.height}
      growStart={-120}
      idPrefix={`${id}-${guide.id}`}
    />
  );
};

/** Maps a point in the plant drawing's viewBox to the scene, for a GuidePlant drawn at (x, base, h). */
const placePlant = (x: number, base: number, h: number) => {
  const k = h / PLANT_VIEWBOX.height;
  const ox = x - (PLANT_VIEWBOX.width * k) / 2;
  const oy = base - 514 * k;
  return { k, at: ([ax, ay]: [number, number]): [number, number] => [ox + ax * k, oy + ay * k] };
};

const anchorsFor = (guide: PlantGuide) => {
  const a = PLANT_DRAWINGS[guide.id]?.anchors;
  return { soil: a?.soil ?? ([200, 350] as [number, number]), snip: a?.snip ?? ([280, 190] as [number, number]), snipR: a?.snipR ?? 36 };
};

/* ---------------------------------------------------------------- WATER */

const WaterMotif: React.FC<MotifProps> = ({ palette, guide }) => {
  const f = useCurrentFrame();
  const sp = useSpring();
  const canIn = sp(0);
  const tilt = ci(f, [12, 28], [0, 28], Easing.out(Easing.cubic)) + (f > 28 ? Math.sin((f - 28) / 5) * 1.5 : 0);
  const potIn = sp(6);
  const soilTop = 312;
  const drops: React.ReactNode[] = [];
  for (let k = 0; k < 22; k++) {
    const spawn = 28 + k * 4;
    const age = f - spawn;
    const x0 = 258 + (random(`wx${k}`) - 0.5) * 14;
    if (age >= 0 && age < 16) {
      const t = age / 16;
      drops.push(
        <Drop key={`d${k}`} x={x0 + t * 10} y={168 + (soilTop - 168) * t * t} s={0.75 + random(`ws${k}`) * 0.35} />,
      );
    } else if (age >= 16 && age < 28) {
      const t = (age - 16) / 12;
      drops.push(
        <ellipse
          key={`s${k}`}
          cx={x0 + 10}
          cy={soilTop + 2}
          rx={6 + t * 22}
          ry={2 + t * 5}
          fill="none"
          stroke={WATER}
          strokeWidth={3}
          opacity={(1 - t) * 0.8}
        />,
      );
    }
  }
  const accent = palette.accent;
  return (
    <g>
      <g transform={`translate(0 ${(1 - potIn) * 120})`} opacity={potIn}>
        <GuidePlant guide={guide} x={262} base={400} h={300} id="water" />
      </g>
      {drops}
      <g transform={`translate(${(1 - canIn) * -220} ${(1 - canIn) * -40}) rotate(${tilt} 130 130)`}>
        <path d="M86 98 C 86 50 166 50 166 98" stroke={shade(accent, -0.25)} strokeWidth={13} fill="none" strokeLinecap="round" />
        <polygon points="184,146 252,92 266,106 192,174" fill={shade(accent, -0.12)} />
        <ellipse cx={261} cy={98} rx={10} ry={18} transform="rotate(-40 261 98)" fill={shade(accent, -0.25)} />
        <rect x={58} y={92} width={136} height={92} rx={20} fill={accent} />
        <rect x={58} y={118} width={136} height={16} fill={shade(accent, 0.25)} />
        <rect x={70} y={100} width={18} height={70} rx={9} fill="#fff" opacity={0.2} />
        <circle cx={126} cy={152} r={4} fill={shade(accent, -0.35)} opacity={0.5} />
      </g>
    </g>
  );
};

/* ---------------------------------------------------------------- LIGHT */

const LightMotif: React.FC<MotifProps> = ({ palette, guide }) => {
  const f = useCurrentFrame();
  const sp = useSpring();
  const sunIn = sp(0, { damping: 10 });
  const beam = ci(f, [18, 40], [0, 1]);
  const blink = f % 50 < 4 ? 0.15 : 1;
  const sunCx = 200;
  const sunCy = 116;
  return (
    <g>
      <defs>
        <linearGradient id="light-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFD54A" stopOpacity={0.55} />
          <stop offset="1" stopColor="#FFD54A" stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={`168,170 232,170 330,390 70,390`} fill="url(#light-beam)" opacity={beam} />
      {Array.from({ length: 9 }).map((_, i) => {
        const t = ((f * 0.8 + random(`m${i}`) * 100) % 100) / 100;
        const x = 120 + random(`mx${i}`) * 160 + Math.sin(f / 10 + i) * 6;
        const y = 200 + t * 160;
        return <circle key={i} cx={x} cy={y} r={2.5 + random(`mr${i}`) * 2.5} fill="#FFE58A" opacity={beam * (1 - Math.abs(t - 0.5) * 2) * 0.9} />;
      })}
      <GuidePlant guide={guide} x={200} base={398} h={230} id="light" />
      <g transform={`translate(${sunCx} ${sunCy}) scale(${sunIn})`}>
        <circle r={92 + Math.sin(f / 6) * 6} fill="#FFD54A" opacity={0.22} />
        <g transform={`rotate(${f * 1.4})`}>
          {Array.from({ length: 12 }).map((_, i) => {
            const len = 22 + Math.sin(f / 5 + i * 1.3) * 6;
            return (
              <rect
                key={i}
                x={-6}
                y={-70 - len - 8}
                width={12}
                height={len}
                rx={6}
                fill={i % 2 ? "#FFB627" : "#FFD54A"}
                transform={`rotate(${i * 30})`}
              />
            );
          })}
        </g>
        <circle r={58} fill="#FFCB3C" />
        <circle r={58} fill="none" stroke="#F5A623" strokeWidth={5} />
        <ellipse cx={-18} cy={-8} rx={5.5} ry={7 * blink} fill="#6B3E00" />
        <ellipse cx={18} cy={-8} rx={5.5} ry={7 * blink} fill="#6B3E00" />
        <circle cx={-32} cy={10} r={8} fill="#FF8A65" opacity={0.45} />
        <circle cx={32} cy={10} r={8} fill="#FF8A65" opacity={0.45} />
        <path d="M-15 12 Q 0 26 15 12" stroke="#6B3E00" strokeWidth={4.5} fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
};

/* ---------------------------------------------------------------- SOIL */

const SoilMotif: React.FC<MotifProps> = ({ palette, guide }) => {
  const f = useCurrentFrame();
  const sp = useSpring();
  const potIn = sp(0);
  const layers = [
    { top: 298, bottom: 352, fill: "#9AA2A6", delay: 8, label: "drainage", kind: "pebble" },
    { top: 222, bottom: 300, fill: "#A3744B", delay: 30, label: "airy mix", kind: "perlite" },
    { top: 152, bottom: 224, fill: SOIL, delay: 52, label: "rich soil", kind: "speck" },
  ] as const;
  const sprout = sp(66, { damping: 11 });
  return (
    <g transform={`translate(0 ${(1 - potIn) * 60})`} opacity={potIn}>
      <g transform={`translate(318 398) scale(${0.4 + sprout * 0.6}) translate(-318 -398)`} opacity={Math.min(1, sprout * 1.5)}>
        <GuidePlant guide={guide} x={318} base={398} h={250} id="soil" />
      </g>
      <g transform="translate(-39 98) scale(0.72)">
      <defs>
        <clipPath id="soil-pot">
          <polygon points="76,-80 252,-80 252,112 236,350 92,350 76,112" />
        </clipPath>
      </defs>
      <g clipPath="url(#soil-pot)">
        {layers.map((l, i) => {
          const s = sp(l.delay, { damping: 12, stiffness: 110 });
          const dy = (1 - s) * -320;
          const items: React.ReactNode[] = [];
          const n = l.kind === "pebble" ? 16 : 26;
          for (let k = 0; k < n; k++) {
            const x = 80 + random(`${l.kind}x${k}`) * 170;
            const y = l.top + 8 + random(`${l.kind}y${k}`) * (l.bottom - l.top - 10);
            if (l.kind === "pebble") {
              items.push(
                <ellipse key={k} cx={x} cy={y} rx={8 + random(`pr${k}`) * 6} ry={6 + random(`pq${k}`) * 4} fill={shade("#8A9296", (random(`pc${k}`) - 0.5) * 0.4)} />,
              );
            } else if (l.kind === "perlite") {
              items.push(<circle key={k} cx={x} cy={y} r={2.5 + random(`lr${k}`) * 3} fill={k % 4 === 0 ? "#6B4426" : "#F4F1EA"} />);
            } else {
              items.push(<circle key={k} cx={x} cy={y} r={1.5 + random(`sr${k}`) * 2.5} fill={k % 3 === 0 ? "#7A5638" : "#2E1E12"} />);
            }
          }
          return (
            <g key={i} transform={`translate(0 ${dy})`}>
              <path
                d={`M60 ${l.bottom + 4} L60 ${l.top} C 110 ${l.top - 9} 180 ${l.top + 9} 270 ${l.top - 2} L270 ${l.bottom + 4} Z`}
                fill={l.fill}
              />
              {items}
            </g>
          );
        })}
      </g>
      {/* glass pot outline */}
      <polygon points="76,112 252,112 236,350 92,350" fill="#fff" opacity={0.12} />
      <path d="M76 112 L92 350 L236 350 L252 112" stroke={palette.pot} strokeWidth={10} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <rect x={64} y={100} width={200} height={20} rx={10} fill={palette.pot} />
      <path d="M100 140 L110 320" stroke="#fff" strokeOpacity={0.35} strokeWidth={6} strokeLinecap="round" />
      {layers.map((l, i) => {
        const o = ci(f, [l.delay + 12, l.delay + 22], [0, 1]);
        const y = (l.top + l.bottom) / 2;
        return (
          <g key={`lbl${i}`} opacity={o} transform={`translate(${(1 - o) * 16} 0)`}>
            <line x1={250 - ((y - 112) / 238) * 16} y1={y} x2={272} y2={y} stroke={palette.pot} strokeWidth={3} strokeDasharray="4 4" />
            <text x={278} y={y + 8} fontFamily={FONT} fontWeight={800} fontSize={23} fill={shade(palette.pot, -0.35)}>
              {l.label}
            </text>
          </g>
        );
      })}
      </g>
    </g>
  );
};

/* ---------------------------------------------------------------- HUMIDITY */

const HumidityMotif: React.FC<MotifProps> = ({ palette, guide }) => {
  const f = useCurrentFrame();
  const sp = useSpring();
  const bottleIn = sp(0);
  const leafIn = sp(6, { damping: 11 });
  const bursts = [18, 46, 74, 102];
  const squeeze = bursts.reduce((acc, b) => acc + ci(f, [b - 4, b], [0, 1]) * ci(f, [b, b + 6], [1, 0]), 0);
  const particles: React.ReactNode[] = [];
  bursts.forEach((b, bi) => {
    for (let k = 0; k < 16; k++) {
      const age = f - b - random(`hd${bi}-${k}`) * 4;
      if (age < 0 || age > 42) continue;
      const t = age / 42;
      const ang = ((-38 + random(`ha${bi}-${k}`) * 70) * Math.PI) / 180;
      const dist = (130 + random(`hr${bi}-${k}`) * 150) * Easing.out(Easing.cubic)(t);
      particles.push(
        <circle
          key={`${bi}-${k}`}
          cx={134 + Math.cos(ang) * dist}
          cy={128 + Math.sin(ang) * dist - t * 20}
          r={(3 + random(`hs${bi}-${k}`) * 6) * (0.6 + t * 0.8)}
          fill="#8FD3F7"
          opacity={(1 - t) * 0.85}
        />,
      );
    }
  });
  const ambient = Array.from({ length: 12 }).map((_, i) => {
    const t = ((f * 0.6 + random(`am${i}`) * 120) % 120) / 120;
    return (
      <circle
        key={`a${i}`}
        cx={150 + random(`ax${i}`) * 240 + Math.sin(f / 15 + i) * 10}
        cy={380 - t * 340}
        r={10 + random(`ar${i}`) * 16}
        fill="#CDEBFB"
        opacity={Math.sin(t * Math.PI) * 0.45}
      />
    );
  });
  const beads = [
    [250, 200, 0],
    [302, 168, 1],
    [334, 232, 2],
    [268, 262, 3],
    [312, 290, 4],
    [236, 244, 5],
    [290, 138, 6],
  ];
  const sway = Math.sin(f / 18) * 3;
  return (
    <g>
      {ambient}
      <g transform={`translate(285 400) scale(${leafIn}) rotate(${sway * 0.3}) translate(-285 -400)`}>
        <GuidePlant guide={guide} x={285} base={400} h={300} id="mist" />
      </g>
      {beads.map(([x, y, i]) => {
        const s = sp(34 + i * 10, { damping: 9 });
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
            <circle r={6 + (i % 3) * 2} fill="#E9F7FF" opacity={0.85} />
            <circle cx={-2} cy={-2} r={2.2} fill="#fff" />
          </g>
        );
      })}
      {particles}
      <g transform={`translate(${(1 - bottleIn) * -200} 0)`}>
        <rect x={38} y={176} width={78} height={170} rx={20} fill={palette.accent} />
        <rect x={50} y={220} width={54} height={70} rx={10} fill="#fff" opacity={0.85} />
        <Drop x={77} y={258} s={1.4} />
        <rect x={60} y={146} width={34} height={34} rx={6} fill={shade(palette.accent, -0.25)} />
        <path d="M46 112 L118 112 L126 128 L118 148 L46 148 Z" fill="#EEF2F3" stroke="#B9C4C9" strokeWidth={3} />
        <rect x={120} y={122} width={16} height={12} rx={3} fill="#B9C4C9" />
        <path
          d="M70 148 C 62 168 50 180 36 184"
          stroke="#EEF2F3"
          strokeWidth={12}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(${squeeze * -18} 70 148)`}
        />
        <rect x={48} y={186} width={10} height={140} rx={5} fill="#fff" opacity={0.25} />
      </g>
    </g>
  );
};

/* ---------------------------------------------------------------- FERTILIZE */

type Feed = { kind: "liquid" | "granules"; label: string; strength?: string };

/** Reads the step's own advice to pick the product, its label and its strength. */
const feedFor = (step?: GuideStep): Feed => {
  const t = `${step?.title ?? ""} ${step?.tip ?? ""}`.toLowerCase();
  const kind = /slow-release|granule|pellet/.test(t) && !/liquid/.test(t) ? "granules" : "liquid";
  const label =
    /tomato (fertilizer|feed)/.test(t) && !/not tomato/.test(t)
      ? "TOMATO"
      : /citrus/.test(t)
        ? "CITRUS"
        : /orchid/.test(t)
          ? "ORCHID"
          : /cactus/.test(t)
            ? "CACTUS"
            : /bromeliad|air plant/.test(t)
              ? "AIR PLANT"
              : /african violet/.test(t)
                ? "VIOLET"
                : /high-potassium/.test(t)
                  ? "HIGH K"
                  : /low-nitrogen/.test(t)
                    ? "LOW N"
                    : /high-nitrogen/.test(t)
                      ? "HIGH N"
                      : /balanced/.test(t)
                        ? "BALANCED"
                        : "PLANT FOOD";
  const strength = /quarter|1\/4/.test(t) ? "¼" : /half/.test(t) ? "½" : undefined;
  return { kind, label, strength };
};

const FertilizeMotif: React.FC<MotifProps> = ({ palette, guide, step }) => {
  const f = useCurrentFrame();
  const sp = useSpring();
  const feed = feedFor(step);
  const plantIn = sp(4);
  const productIn = sp(0);
  // Held upright long enough to read the label, then tipped to pour, then set back.
  const POUR = feed.kind === "liquid" ? 72 : 40;
  const tilt =
    ci(f, [24, 38], [0, POUR], Easing.out(Easing.back(1.4))) * ci(f, [104, 116], [1, 0]) + (f > 38 && f < 100 ? Math.sin(f / 3) * 2 : 0);
  const growPulse = sp(80, { damping: 7, stiffness: 80 });
  const PX = 262;
  const place = placePlant(PX, 398, 300);
  const [sx, sy] = place.at(anchorsFor(guide).soil);
  const feedColor = feed.label === "TOMATO" || feed.label === "HIGH K" ? "#C0392B" : feed.label === "CITRUS" ? "#E6A817" : feed.label === "ORCHID" ? "#C064B4" : "#4C9F6B";
  // The spout (or the bag's open top), turned with the product.
  const spout: [number, number] = feed.kind === "liquid" ? [178, 127] : [150, 80];
  const rad = (tilt * Math.PI) / 180;
  const rx = spout[0] - 110;
  const ry = spout[1] - 125;
  const mouth = {
    x: (1 - productIn) * -220 + 110 + rx * Math.cos(rad) - ry * Math.sin(rad),
    y: 125 + rx * Math.sin(rad) + ry * Math.cos(rad),
  };
  const falling: React.ReactNode[] = [];
  const landed: React.ReactNode[] = [];
  for (let k = 0; k < 18; k++) {
    const spawn = 40 + k * 3.4;
    const age = f - spawn;
    if (age < 0) continue;
    const dx = (random(`fdx${k}`) - 0.5) * 34 * place.k * 2;
    const dur = 18;
    const t = Math.min(1, age / dur);
    const x = mouth.x + (sx + dx - mouth.x) * t;
    const y = mouth.y + (sy - mouth.y) * t * t;
    if (feed.kind === "liquid") {
      if (t < 1) falling.push(<Drop key={k} x={x} y={y} s={0.8} color={feedColor} />);
      else if (age < dur + 14) {
        const r = (age - dur) / 14;
        landed.push(<ellipse key={k} cx={sx + dx} cy={sy} rx={4 + r * 18} ry={1.5 + r * 4} fill="none" stroke={feedColor} strokeWidth={3} opacity={1 - r} />);
      }
    } else {
      const c = [palette.accent, "#7FB8E6", "#F7F3E8"][k % 3];
      (t < 1 ? falling : landed).push(
        <g key={k}>
          <circle cx={x} cy={Math.min(y, sy)} r={5} fill={c} stroke={shade(c, -0.3)} strokeWidth={1.5} />
          <circle cx={x - 1.5} cy={Math.min(y, sy) - 1.5} r={1.5} fill="#fff" opacity={0.7} />
        </g>,
      );
    }
  }
  const sparkles = [
    [sx - 70, sy - 120, 0],
    [sx + 60, sy - 150, 1],
    [sx + 20, sy - 210, 2],
  ].map(([x, y, i]) => {
    const r = ci(f, [84 + i * 6, 94 + i * 6], [0, 1]) * (0.7 + Math.sin(f / 4 + i) * 0.3);
    return <Sparkle key={i} x={x} y={y} r={15 * r} color="#FFC93C" rotate={f * 2} />;
  });
  const labelSize = feed.label.length > 8 ? 11 : feed.label.length > 6 ? 14 : 17;
  return (
    <g>
      <g transform={`translate(0 ${(1 - plantIn) * 120}) translate(${PX} 398) scale(${1 + growPulse * 0.05}) translate(${-PX} -398)`} opacity={plantIn}>
        <GuidePlant guide={guide} x={PX} base={398} h={300} id="feed" />
      </g>
      {landed}
      {falling}
      {sparkles}
      <g transform={`translate(${(1 - productIn) * -220} 0) rotate(${tilt} 110 125)`}>
        {feed.kind === "liquid" ? (
          <g>
            {/* feed bottle; its neck points right so tilting pours */}
            <rect x={66} y={84} width={84} height={116} rx={18} fill={shade(feedColor, 0.15)} />
            <rect x={150} y={118} width={22} height={18} rx={4} fill={shade(feedColor, -0.1)} />
            <rect x={170} y={114} width={10} height={26} rx={3} fill="#F2F2F2" />
            <rect x={74} y={110} width={68} height={60} rx={8} fill="#fff" opacity={0.94} />
            <text x={108} y={feed.strength ? 136 : 146} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={labelSize} fill={shade(feedColor, -0.3)}>
              {feed.label}
            </text>
            {feed.strength && (
              <text x={108} y={162} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={20} fill={shade(feedColor, -0.3)}>
                {feed.strength}
              </text>
            )}
            <rect x={74} y={92} width={10} height={100} rx={5} fill="#fff" opacity={0.3} />
          </g>
        ) : (
          <g>
            <path d="M58 78 L162 78 L174 184 Q 112 200 46 184 Z" fill="#DDBB82" />
            <path d="M58 78 L162 78 L158 98 L62 98 Z" fill="#C49A5C" />
            <path d="M58 78 L70 62 L84 78 L98 62 L112 78 L126 62 L140 78 L154 62 L162 78" fill="#DDBB82" stroke="#C49A5C" strokeWidth={3} strokeLinejoin="round" />
            <rect x={70} y={112} width={84} height={56} rx={10} fill="#fff" opacity={0.92} />
            <text x={112} y={146} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={labelSize} fill={shade(palette.accent, -0.3)}>
              {feed.label}
            </text>
          </g>
        )}
      </g>
    </g>
  );
};

/* ---------------------------------------------------------------- PRUNE */

const Blade: React.FC = () => (
  <g>
    <path d="M6 -7 L-122 -3 Q -132 2 -120 7 L6 9 Z" fill="#D5DEE3" stroke="#8C9AA2" strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M10 -2 L36 -20" stroke="#4A5359" strokeWidth={8} strokeLinecap="round" />
  </g>
);

type PruneAction = "yellow" | "spent" | "flower" | "tip" | "shoot" | "harvest" | "branch" | "stalk" | "tie" | "keep";

/** Reads the step's own advice to decide what the shears do. */
const pruneFor = (step?: GuideStep): PruneAction => {
  const t = `${step?.title ?? ""} ${step?.tip ?? ""}`.toLowerCase();
  if (/never cut|keep the old/.test(t)) return "keep";
  if (/side shoot/.test(t)) return "shoot";
  if (/moss pole/.test(t)) return "tie";
  if (/spent|faded/.test(t)) return "spent";
  if (/flower spike|flower bud|flower head/.test(t)) return "flower";
  if (/outer stem|outer stalk|stems with swollen/.test(t)) return "stalk";
  if (/harvest|pick fresh|top sprig/.test(t)) return "harvest";
  if (/cut back|cut a leggy|trim by|cut long stems/.test(t)) return "branch";
  if (/pinch|snip stems|trim/.test(t)) return "tip";
  return "yellow";
};

/** Browns a cut piece: dead leaves and spent flowers. */
const WILT = "0.55 0.45 0.1 0 0.06  0.45 0.5 0.08 0 0.02  0.2 0.22 0.1 0 0  0 0 0 1 0";

const PruneMotif: React.FC<MotifProps> = ({ palette, guide, step }) => {
  const f = useCurrentFrame();
  const sp = useSpring();
  const action = pruneFor(step);
  const plantIn = sp(0);
  const SNIP = 58;
  const PX = 168;
  const place = placePlant(PX, 400, 310);
  const a = anchorsFor(guide);
  const cut = (() => {
    const [x, y] = place.at(a.snip);
    return { x, y, r: a.snipR * place.k };
  })();
  const cuts = action !== "tie" && action !== "keep";
  const approach = ci(f, [10, 40], [0, 1], Easing.out(Easing.cubic));
  const open =
    !cuts
      ? 22 + Math.sin(f / 4) * 4
      : f < SNIP - 6
        ? 22 + Math.sin(f / 4) * 4
        : f < SNIP
          ? ci(f, [SNIP - 6, SNIP], [22, 0], Easing.in(Easing.quad))
          : ci(f, [SNIP + 8, SNIP + 20], [0, 18]);
  const leave = ci(f, [SNIP + 16, SNIP + 40], [0, 1], Easing.in(Easing.cubic));
  const hold = action === "keep" ? ci(f, [44, 56], [0, 1]) : 0;
  const fallT = cuts ? Math.max(0, f - SNIP) : 0;
  const toBowl = action === "harvest";
  const bowl = { x: 336, y: 372 };
  const pieceDX = toBowl ? ci(fallT, [0, 26], [0, bowl.x - cut.x], Easing.inOut(Easing.quad)) : Math.sin(fallT / 5) * 18;
  const pieceDY = toBowl ? ci(fallT, [0, 26], [0, bowl.y - 14 - cut.y], Easing.in(Easing.quad)) - Math.sin(ci(fallT, [0, 26], [0, Math.PI])) * 50 : fallT * fallT * 0.09;
  const pieceRot = toBowl ? ci(fallT, [0, 26], [0, 30]) : fallT * 4;
  const pieceOpacity = toBowl ? 1 : ci(fallT, [30, 50], [1, 0]);
  const burst = cuts ? ci(f, [SNIP, SNIP + 12], [0, 1]) : 0;
  const wilted = action === "yellow" || action === "spent";
  const sway = Math.sin(f / 16) * 1.5;
  const id = `prune-${guide.id}`;
  const tie = ci(f, [40, 70], [0, 1], Easing.inOut(Easing.quad));
  return (
    <g>
      <defs>
        <clipPath id={`${id}-piece`}>
          <circle cx={cut.x} cy={cut.y} r={cut.r} />
        </clipPath>
        <mask id={`${id}-rest`} maskUnits="userSpaceOnUse" x={-200} y={-200} width={800} height={800}>
          <rect x={-200} y={-200} width={800} height={800} fill="#fff" />
          {cuts && <circle cx={cut.x} cy={cut.y} r={cut.r} fill="#000" />}
        </mask>
        <filter id={`${id}-wilt`}>
          <feColorMatrix type="matrix" values={WILT} />
        </filter>
      </defs>
      <g transform={`translate(0 ${(1 - plantIn) * 100}) rotate(${sway} ${PX} 400)`} opacity={plantIn}>
        <g mask={`url(#${id}-rest)`}>
          <GuidePlant guide={guide} x={PX} base={400} h={310} id="prune" />
        </g>
        {/* the piece that comes away: a real part of this plant */}
        {cuts && (
          <g opacity={pieceOpacity} transform={`translate(${pieceDX} ${pieceDY}) rotate(${pieceRot} ${cut.x} ${cut.y})`}>
            <g clipPath={`url(#${id}-piece)`} filter={wilted ? `url(#${id}-wilt)` : undefined}>
              <GuidePlant guide={guide} x={PX} base={400} h={310} id="prune-piece" />
            </g>
          </g>
        )}
      </g>
      {toBowl && (
        <g opacity={ci(f, [SNIP - 10, SNIP], [0, 1])}>
          <path d={`M${bowl.x - 44} ${bowl.y - 12} Q ${bowl.x} ${bowl.y + 40} ${bowl.x + 44} ${bowl.y - 12} Z`} fill={shade(palette.accent, -0.1)} />
          <ellipse cx={bowl.x} cy={bowl.y - 12} rx={44} ry={8} fill={shade(palette.accent, -0.3)} />
        </g>
      )}
      {action === "tie" && (
        <g opacity={ci(f, [36, 42], [0, 1])}>
          <ellipse cx={cut.x} cy={cut.y} rx={cut.r * 0.9} ry={cut.r * 0.4} fill="none" stroke="#C9A06B" strokeWidth={5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - tie} transform={`rotate(-20 ${cut.x} ${cut.y})`} />
          <path d={`M${cut.x + cut.r * 0.8} ${cut.y - 4} q 14 -14 22 -2 M${cut.x + cut.r * 0.8} ${cut.y - 4} q 16 8 20 20`} stroke="#C9A06B" strokeWidth={4} fill="none" strokeLinecap="round" opacity={ci(f, [70, 76], [0, 1])} />
        </g>
      )}
      {burst > 0 && burst < 1 &&
        [0, 60, 120, 180, 240, 300].map((deg) => (
          <line
            key={deg}
            x1={cut.x + Math.cos((deg * Math.PI) / 180) * (14 + burst * 10)}
            y1={cut.y + Math.sin((deg * Math.PI) / 180) * (14 + burst * 10)}
            x2={cut.x + Math.cos((deg * Math.PI) / 180) * (24 + burst * 22)}
            y2={cut.y + Math.sin((deg * Math.PI) / 180) * (24 + burst * 22)}
            stroke={palette.accent}
            strokeWidth={5}
            strokeLinecap="round"
            opacity={1 - burst}
          />
        ))}
      {(cuts ? f >= SNIP && f < SNIP + 22 : action === "keep" ? f >= 50 && f < 110 : f >= 72 && f < 110) && (
        <text
          x={cut.x - 30}
          y={cut.y - cut.r - 18}
          fontFamily={FONT}
          fontWeight={900}
          fontSize={32}
          fill={action === "keep" ? "#E5484D" : palette.accent}
          transform={`rotate(-10 ${cut.x - 30} ${cut.y - cut.r - 18})`}
          opacity={cuts ? ci(f, [SNIP + 14, SNIP + 22], [1, 0]) : ci(f, [100, 110], [1, 0])}
        >
          {action === "keep" ? "keep!" : action === "tie" ? "tied" : action === "harvest" ? "pick!" : "snip!"}
        </text>
      )}
      {action === "keep" && (
        <g transform={`translate(${cut.x} ${cut.y})`} opacity={hold * ci(f, [96, 108], [1, 0])}>
          <circle r={cut.r + 10} fill="none" stroke="#E5484D" strokeWidth={8} />
          <line x1={-(cut.r + 4) * 0.7} y1={-(cut.r + 4) * 0.7} x2={(cut.r + 4) * 0.7} y2={(cut.r + 4) * 0.7} stroke="#E5484D" strokeWidth={8} strokeLinecap="round" />
        </g>
      )}
      {/* shears */}
      {action !== "tie" && (
        <g
          transform={`translate(${cut.x + 74 + (1 - approach) * 200 + (cuts ? leave * 120 : hold * 90)} ${cut.y + (cuts ? leave * -40 : 0)})`}
          opacity={Math.min(approach * 2, cuts ? 1 - leave : 1 - ci(f, [80, 100], [0, 1]))}
        >
          <g transform={`rotate(${-open})`}>
            <Blade />
            <circle cx={46} cy={-28} r={17} fill="none" stroke={palette.accent} strokeWidth={10} />
          </g>
          <g transform={`rotate(${open}) scale(1 -1)`}>
            <Blade />
            <circle cx={46} cy={-28} r={17} fill="none" stroke={shade(palette.accent, -0.15)} strokeWidth={10} />
          </g>
          <circle r={6} fill="#4A5359" />
          <circle r={2.5} fill="#D5DEE3" />
        </g>
      )}
    </g>
  );
};

/* ---------------------------------------------------------------- REPOT */

const PotShape: React.FC<{ x: number; y: number; w: number; h: number; color: string }> = ({ x, y, w, h, color }) => (
  <g>
    <path d={`M${x - w / 2} ${y + 10} L${x + w / 2} ${y + 10} L${x + w * 0.38} ${y + h} L${x - w * 0.38} ${y + h} Z`} fill={color} />
    <rect x={x - w / 2 - 8} y={y - 4} width={w + 16} height={h * 0.2 + 6} rx={8} fill={shade(color, 0.08)} />
    <path d={`M${x - w * 0.3} ${y + h * 0.35} L${x - w * 0.26} ${y + h * 0.82}`} stroke="#fff" strokeOpacity={0.2} strokeWidth={8} strokeLinecap="round" />
  </g>
);

const RepotMotif: React.FC<MotifProps> = ({ palette, guide }) => {
  const f = useCurrentFrame();
  const sp = useSpring();
  const before = sp(0);
  const arrow = ci(f, [26, 46], [0, 1], Easing.out(Easing.cubic));
  const after = sp(44, { damping: 11 });
  const sparkle = ci(f, [70, 80], [0, 1]) * ci(f, [104, 118], [1, 0]);
  return (
    <g>
      {/* the plant as it is now, then one pot size up */}
      <g transform={`translate(0 ${(1 - before) * 60})`} opacity={before}>
        <GuidePlant guide={guide} x={98} base={396} h={180} id="repot-a" />
      </g>
      <g opacity={arrow}>
        <path d={`M150 300 L${150 + 52 * arrow} 300`} stroke={palette.accent} strokeWidth={9} strokeLinecap="round" />
        <path d={`M${186 + 16 * arrow - 16} 284 L${202 + 16 * arrow - 16} 300 L${186 + 16 * arrow - 16} 316`} stroke={palette.accent} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g transform={`translate(292 398) scale(${after}) translate(-292 -398)`} opacity={Math.min(1, after * 1.5)}>
        <GuidePlant guide={guide} x={292} base={398} h={300} id="repot-b" />
      </g>
      <Sparkle x={196} y={150} r={16 * sparkle} color="#FFC93C" rotate={f * 3} />
      <Sparkle x={380} y={130} r={12 * sparkle} color="#FFC93C" rotate={-f * 3} />
      <Sparkle x={352} y={60} r={10 * sparkle} color={palette.accent} rotate={f * 3} />
    </g>
  );
};

/* ---------------------------------------------------------------- PESTS */

const Bug: React.FC<{ t: number }> = ({ t }) => {
  const leg = Math.sin(t * 1.2) * 12;
  return (
    <g>
      {[-1, 1].map((side) =>
        [-12, 0, 12].map((y, i) => (
          <line
            key={`${side}${y}`}
            x1={side * 14}
            y1={y}
            x2={side * 32}
            y2={y + (i - 1) * 8 + (i % 2 === 0 ? leg : -leg) * side * 0.5}
            stroke="#3A1E16"
            strokeWidth={4}
            strokeLinecap="round"
          />
        )),
      )}
      <path d="M-6 -30 Q -14 -48 -22 -50 M6 -30 Q 14 -48 22 -50" stroke="#3A1E16" strokeWidth={3} fill="none" strokeLinecap="round" />
      <circle cx={0} cy={-26} r={12} fill="#3A1E16" />
      <ellipse cx={0} cy={4} rx={22} ry={26} fill="#C8432B" />
      <path d="M0 -20 L0 30" stroke="#3A1E16" strokeWidth={3} />
      <circle cx={-10} cy={-4} r={5} fill="#3A1E16" />
      <circle cx={11} cy={6} r={5} fill="#3A1E16" />
      <circle cx={-8} cy={16} r={4} fill="#3A1E16" />
      <circle cx={-5} cy={-28} r={3.5} fill="#fff" />
      <circle cx={5} cy={-28} r={3.5} fill="#fff" />
      <circle cx={-5} cy={-27} r={1.6} fill="#000" />
      <circle cx={5} cy={-27} r={1.6} fill="#000" />
      <ellipse cx={-8} cy={-6} rx={6} ry={3} fill="#fff" opacity={0.3} />
    </g>
  );
};

const PestsMotif: React.FC<MotifProps> = ({ palette, guide }) => {
  const f = useCurrentFrame();
  const sp = useSpring();
  const leafIn = sp(0);
  const walk = ci(f, [8, 46], [0, 1], Easing.inOut(Easing.quad));
  const bugX = 120 + walk * 90;
  const bugY = 270 - walk * 70;
  const ban = ci(f, [48, 62], [0, 1], Easing.out(Easing.cubic));
  const shake = f > 50 && f < 70 ? Math.sin(f * 2.2) * 4 : 0;
  const wipe = ci(f, [72, 96], [0, 1], Easing.inOut(Easing.quad));
  const bugGone = ci(f, [80, 92], [1, 0]);
  const clean = ci(f, [98, 110], [0, 1]);
  const banOpacity = ci(f, [74, 86], [1, 0]);
  return (
    <g>
      <g transform={`translate(200 400) scale(${leafIn}) translate(-200 -400)`}>
        <GuidePlant guide={guide} x={200} base={400} h={320} id="pests" />
      </g>
      {/* little bite marks / spots that get wiped */}
      {[
        [160, 200],
        [236, 168],
        [206, 252],
        [256, 232],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={7} fill="#C9B458" opacity={0.85 * (1 - clean) * leafIn} />
      ))}
      <g transform={`translate(${bugX + shake} ${bugY}) rotate(${50 - walk * 10}) scale(${0.95 * bugGone + 0.001})`} opacity={bugGone}>
        <Bug t={f} />
      </g>
      {/* ban symbol */}
      <g transform={`translate(${210} ${200})`} opacity={banOpacity}>
        <circle r={62} fill="none" stroke="#E5484D" strokeWidth={13} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ban} transform="rotate(-90)" />
        <line x1={-44} y1={-44} x2={-44 + 88 * ci(f, [56, 66], [0, 1])} y2={-44 + 88 * ci(f, [56, 66], [0, 1])} stroke="#E5484D" strokeWidth={13} strokeLinecap="round" />
      </g>
      {/* wiping cloth */}
      {wipe > 0 && wipe < 1 && (
        <g transform={`translate(${60 + wipe * 280} ${300 - wipe * 210}) rotate(-20)`}>
          <rect x={-46} y={-30} width={92} height={60} rx={16} fill={palette.accent} />
          <path d="M-30 -12 L30 -12 M-30 4 L30 4" stroke="#fff" strokeOpacity={0.4} strokeWidth={5} strokeLinecap="round" />
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={-60 - i * 18} cy={20 + i * 6} r={5 - i} fill="#E9F7FF" opacity={0.8 - i * 0.2} />
          ))}
        </g>
      )}
      {[
        [150, 170, 0],
        [270, 120, 1],
        [235, 260, 2],
      ].map(([x, y, i]) => (
        <Sparkle key={i} x={x} y={y} r={(14 + i * 4) * clean * (0.8 + Math.sin(f / 4 + i) * 0.2)} color="#FFFFFF" rotate={f * 2} />
      ))}
      <g opacity={clean} transform={`translate(330 330) scale(${sp(100, { damping: 9 })})`}>
        <circle r={34} fill="#2FA36B" />
        <path d="M-15 0 L-4 12 L16 -12" stroke="#fff" strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  );
};

/* ---------------------------------------------------------------- TEMPERATURE */

const TemperatureMotif: React.FC<MotifProps> = ({ palette, guide }) => {
  const f = useCurrentFrame();
  const sp = useSpring();
  const tubeIn = sp(0);
  const fill = sp(14, { damping: 7, stiffness: 50 });
  const top = 60;
  const bottom = 300;
  const zone = { from: 0.48, to: 0.72 };
  const level = Math.min(1.05, 0.08 + fill * 0.52) + Math.sin(f / 8) * 0.008;
  const levelY = bottom - (bottom - top) * level;
  const inZone = level >= zone.from && level <= zone.to;
  const zoneGlow = inZone ? ci(f, [40, 55], [0, 1]) : 0;
  const mercury = "#E8543F";
  const check = sp(58, { damping: 9 });
  return (
    <g>
      <g transform={`translate(0 ${(1 - tubeIn) * 60})`} opacity={tubeIn}>
        <GuidePlant guide={guide} x={96} base={398} h={236} id="temp" />
      </g>
      {/* snowflake (cold) */}
      <g transform={`translate(64 70) rotate(${f * 1.2}) scale(${sp(10) * 0.8})`} opacity={0.9}>
        {[0, 60, 120].map((a) => (
          <g key={a} transform={`rotate(${a})`}>
            <line x1={0} y1={-34} x2={0} y2={34} stroke="#7FC4EC" strokeWidth={7} strokeLinecap="round" />
            <path d="M-10 -26 L0 -16 L10 -26 M-10 26 L0 16 L10 26" stroke="#7FC4EC" strokeWidth={5} fill="none" strokeLinecap="round" />
          </g>
        ))}
      </g>
      {/* heat (sun) */}
      <g transform={`translate(346 70) scale(${sp(18) * 0.85})`}>
        <g transform={`rotate(${-f * 1.5})`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <rect key={i} x={-4} y={-48} width={8} height={16} rx={4} fill="#FFB627" transform={`rotate(${i * 45})`} />
          ))}
        </g>
        <circle r={26} fill="#FFCB3C" />
      </g>
      <g transform={`translate(44 ${(1 - tubeIn) * 80})`} opacity={tubeIn}>
        {/* comfort zone band */}
        <rect
          x={238}
          y={bottom - (bottom - top) * zone.to}
          width={22 + zoneGlow * 8}
          height={(bottom - top) * (zone.to - zone.from)}
          rx={8}
          fill="#3DBE7A"
          opacity={0.35 + zoneGlow * 0.5}
        />
        {/* tube */}
        <rect x={168} y={top - 30} width={64} height={bottom - top + 60} rx={32} fill="#FFFFFF" stroke={shade(palette.pot, -0.1)} strokeWidth={6} />
        <circle cx={200} cy={bottom + 46} r={50} fill="#FFFFFF" stroke={shade(palette.pot, -0.1)} strokeWidth={6} />
        <rect x={171} y={bottom} width={58} height={20} fill="#FFFFFF" />
        {/* mercury */}
        <rect x={186} y={levelY} width={28} height={bottom - levelY + 30} rx={14} fill={mercury} />
        <circle cx={200} cy={bottom + 46} r={36} fill={mercury} />
        <ellipse cx={188} cy={bottom + 34} rx={9} ry={12} fill="#fff" opacity={0.4} />
        <rect x={180} y={top - 10} width={7} height={bottom - top} rx={3.5} fill="#fff" opacity={0.6} />
        {/* ticks */}
        {Array.from({ length: 9 }).map((_, i) => {
          const y = bottom - ((bottom - top) * i) / 8;
          return <line key={i} x1={i % 2 ? 150 : 140} y1={y} x2={164} y2={y} stroke={shade(palette.pot, -0.2)} strokeWidth={4} strokeLinecap="round" />;
        })}
      </g>
      <g transform={`translate(346 ${bottom - (bottom - top) * ((zone.from + zone.to) / 2)}) scale(${check * zoneGlow})`}>
        <circle r={28} fill="#2FA36B" />
        <path d="M-12 0 L-3 10 L13 -10" stroke="#fff" strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  );
};

/* ---------------------------------------------------------------- PROPAGATE */

const PropagateMotif: React.FC<MotifProps> = ({ palette, guide }) => {
  const f = useCurrentFrame();
  const sp = useSpring();
  const glassIn = sp(0);
  const cuttingIn = sp(10, { damping: 12 });
  const waterTop = 196;
  const wave = (x: number) => Math.sin(x / 22 + f / 6) * 4;
  let wavePath = `M122 ${waterTop + wave(122)}`;
  for (let x = 130; x <= 278; x += 8) wavePath += ` L${x} ${waterTop + wave(x)}`;
  wavePath += ` L262 372 L138 372 Z`;
  const node = { x: 204, y: 284 };
  const roots = [
    { d: `M${node.x} ${node.y} C 190 310 170 330 160 356`, delay: 30 },
    { d: `M${node.x} ${node.y} C 210 316 206 336 214 362`, delay: 40 },
    { d: `M${node.x} ${node.y} C 226 300 244 322 240 350`, delay: 52 },
    { d: `M${node.x} ${node.y} C 196 300 182 306 172 320`, delay: 64 },
    { d: `M${node.x} ${node.y} C 222 296 238 300 248 312`, delay: 72 },
  ];
  const newLeaf = sp(92, { damping: 9 });
  const bubbles = Array.from({ length: 9 }).map((_, i) => {
    const period = 50 + random(`bp${i}`) * 30;
    const t = ((f + random(`bo${i}`) * period) % period) / period;
    const x = 145 + random(`bx${i}`) * 110 + Math.sin(f / 8 + i) * 4;
    const y = 360 - t * (360 - waterTop - 8);
    return <circle key={i} cx={x} cy={y} r={3 + random(`br${i}`) * 4} fill="none" stroke="#fff" strokeWidth={2} opacity={0.8 * Math.sin(t * Math.PI)} />;
  });
  const sway = Math.sin(f / 18) * 2;
  return (
    <g transform={`translate(0 ${(1 - glassIn) * 80})`} opacity={glassIn}>
      <GuidePlant guide={guide} x={100} base={398} h={250} id="prop" />
      <g transform="translate(136 128) scale(0.66)">
      <defs>
        <clipPath id="prop-glass">
          <path d="M118 140 L282 140 L264 372 Q 262 380 254 380 L146 380 Q 138 380 136 372 Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#prop-glass)">
        <path d={wavePath} fill="#9FD8F5" opacity={0.75} />
        {bubbles}
      </g>
      {/* cutting */}
      <g transform={`translate(0 ${(1 - cuttingIn) * -140}) rotate(${sway} 200 140)`} opacity={cuttingIn}>
        <path d={`M196 60 C 200 120 194 200 ${node.x} ${node.y}`} stroke={shade(palette.leaf, -0.25)} strokeWidth={8} fill="none" strokeLinecap="round" />
        <circle cx={node.x} cy={node.y} r={6} fill={shade(palette.leaf, -0.3)} />
        {roots.map((r, i) => {
          const g = ci(f, [r.delay, r.delay + 40], [0, 1], Easing.out(Easing.quad));
          return <path key={i} d={r.d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - g} stroke="#F2E6CF" strokeWidth={5 - i * 0.5} fill="none" strokeLinecap="round" />;
        })}
        {[
          { x: 197, y: 92, a: -62, s: 2.0 },
          { x: 197, y: 70, a: 48, s: 2.2 },
        ].map((l, i) => (
          <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.a + Math.sin(f / 12 + i) * 4}) scale(${l.s})`}>
            <path d={LEAF_D} fill={shade(palette.leaf, i * 0.08)} />
            <path d="M0 -3 L0 -40" stroke={shade(palette.leaf, 0.25)} strokeWidth={2} />
          </g>
        ))}
        <g transform={`translate(196 62) rotate(${-8 + Math.sin(f / 10) * 4}) scale(${newLeaf * 1.1})`}>
          <path d={LEAF_D} fill={shade(palette.leaf, 0.22)} />
        </g>
      </g>
      {/* glass */}
      <path d="M118 140 L282 140 L264 372 Q 262 380 254 380 L146 380 Q 138 380 136 372 Z" fill="#ffffff" opacity={0.18} />
      <path d="M118 140 L136 372 Q 138 380 146 380 L254 380 Q 262 380 264 372 L282 140" stroke="#CFEAF6" strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx={200} cy={140} rx={82} ry={8} fill="none" stroke="#CFEAF6" strokeWidth={5} />
      <path d="M138 170 L150 350" stroke="#fff" strokeOpacity={0.6} strokeWidth={7} strokeLinecap="round" />
      <Sparkle x={300} y={250} r={14 * ci(f, [100, 110], [0, 1])} color="#FFC93C" rotate={f * 3} />
      <Sparkle x={100} y={210} r={10 * ci(f, [104, 114], [0, 1])} color="#FFC93C" rotate={-f * 3} />
      </g>
    </g>
  );
};

/* ---------------------------------------------------------------- export */

const MOTIFS: Record<StepKind, React.FC<MotifProps>> = {
  water: WaterMotif,
  light: LightMotif,
  soil: SoilMotif,
  humidity: HumidityMotif,
  fertilize: FertilizeMotif,
  prune: PruneMotif,
  repot: RepotMotif,
  pests: PestsMotif,
  temperature: TemperatureMotif,
  propagate: PropagateMotif,
};

export const STEP_LABELS: Record<StepKind, string> = {
  water: "Watering",
  light: "Light",
  soil: "Soil",
  humidity: "Humidity",
  fertilize: "Feeding",
  prune: "Pruning",
  repot: "Repotting",
  pests: "Pests",
  temperature: "Temperature",
  propagate: "Propagation",
};

export type StepMotifProps = {
  kind: StepKind;
  palette: Palette;
  /** The guide whose own plant drawing appears in the scene. */
  guide: PlantGuide;
  /** The step itself; its advice picks what the feed and pruning scenes show. */
  step?: GuideStep;
  /** Rendered size in px (square). */
  size?: number;
  style?: React.CSSProperties;
};

/** Animated SVG motif for a care step. Animation is driven by the parent Sequence's frame. */
export const StepMotif: React.FC<StepMotifProps> = ({ kind, palette, guide, step, size = 560, style }) => {
  const Motif = MOTIFS[kind] ?? WaterMotif;
  return (
    <svg viewBox="0 0 400 400" width={size} height={size} style={{ overflow: "visible", ...style }}>
      <Motif palette={palette} guide={guide} step={step} />
    </svg>
  );
};
