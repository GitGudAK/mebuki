import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, ramp } from "./kit";

const BASE_X = 200;
const BASE_Y = 392;

/** One flat stem segment (phylloclade): narrow at the joint, scalloped edges, a squared-off tip. */
const segment = (L: number) => {
  const h = (f: number) => (-L * f).toFixed(1);
  return [
    `M-3 0`,
    `Q -7 ${h(0.12)} -8 ${h(0.3)}`,
    `Q -14 ${h(0.36)} -10 ${h(0.52)}`,
    `Q -15 ${h(0.62)} -11 ${h(0.78)}`,
    `Q -14 ${h(0.88)} -9 ${h(0.98)}`,
    `Q 0 ${h(1.06)} 9 ${h(0.98)}`,
    `Q 14 ${h(0.88)} 11 ${h(0.78)}`,
    `Q 15 ${h(0.62)} 10 ${h(0.52)}`,
    `Q 14 ${h(0.36)} 8 ${h(0.3)}`,
    `Q 7 ${h(0.12)} 3 0 Z`,
  ].join(" ");
};

type Seg = { x: number; y: number; a: number; L: number; k: number; chain: number; tip: boolean };

// Main chains: start heading (degrees, -90 = up), number of segments, droop per segment.
const CHAINS = [
  { a: -172, n: 7, bend: -13, fork: 2 },
  { a: -150, n: 7, bend: -12, fork: 3 },
  { a: -128, n: 6, bend: -10, fork: 2 },
  { a: -108, n: 5, bend: -9, fork: -1 },
  { a: -88, n: 5, bend: 6, fork: 2 },
  { a: -66, n: 5, bend: 9, fork: -1 },
  { a: -46, n: 6, bend: 10, fork: 2 },
  { a: -26, n: 7, bend: 12, fork: 3 },
  { a: -8, n: 7, bend: 13, fork: 2 },
];

const build = (): Seg[] => {
  const segs: Seg[] = [];
  const walk = (x: number, y: number, a: number, n: number, bend: number, chain: number, k0: number, fork: number) => {
    for (let k = 0; k < n; k++) {
      const L = 34 - (k0 + k) * 1.5;
      const tip = k === n - 1;
      segs.push({ x, y, a, L, k: k0 + k, chain, tip });
      if (k === fork) {
        // Segments often branch in pairs from a joint.
        walk(x + Math.cos((a * Math.PI) / 180) * L, y + Math.sin((a * Math.PI) / 180) * L, a - Math.sign(bend) * 30, n - k - 2, bend, chain, k0 + k + 1, -1);
      }
      x += Math.cos((a * Math.PI) / 180) * (L - 2);
      y += Math.sin((a * Math.PI) / 180) * (L - 2);
      a += bend;
    }
  };
  CHAINS.forEach((ch, i) => walk(BASE_X + (i - 4) * 6, BASE_Y - 4, ch.a, ch.n, ch.bend, i, 0, ch.fork));
  return segs;
};
const SEGS = build();

/** A tubular flower with reflexed petals and a tassel of stamens, pointing along -y. */
const Flower: React.FC<{ s: number; color: string }> = ({ s, color }) => {
  const dark = shade(color, -0.2);
  const light = mix(color, "#fff", 0.35);
  const petal = (side: number, len: number, curl: number) =>
    `M0 -12 C ${side * 6} ${-12 - len * 0.4} ${side * (8 + curl)} ${-12 - len * 0.8} ${side * (12 + curl)} ${-12 - len} C ${side * (4 + curl * 0.3)} ${-12 - len * 0.75} ${side * 1} ${-12 - len * 0.4} 0 -12 Z`;
  return (
    <g transform={`scale(${s})`}>
      {/* Calyx and ovary. */}
      <ellipse cx={0} cy={-3} rx={4} ry={5} fill={mix(color, "#4E8A4F", 0.5)} />
      <path d="M-4 -6 L-6 -26 L6 -26 L4 -6 Z" fill={dark} />
      {[-1, 1].map((sd) => (
        <path key={sd} d={petal(sd, 28, 10)} fill={dark} transform={`scale(1.25 1)`} />
      ))}
      {[-1, 1].map((sd) => (
        <path key={sd} d={petal(sd, 32, 4)} fill={color} transform="translate(0 -6) scale(1.3 1)" />
      ))}
      <path d="M0 -22 C -4 -32 -4 -40 0 -48 C 4 -40 4 -32 0 -22 Z" fill={light} />
      {[-4, -1.5, 1.5, 4].map((dx, k) => (
        <path key={k} d={`M0 -30 Q ${dx} -42 ${dx * 1.4} -50`} stroke="#F7E9EF" strokeWidth={1} fill="none" />
      ))}
      {[-4, -1.5, 1.5, 4].map((dx, k) => (
        <circle key={k} cx={dx * 1.4} cy={-50} r={1.4} fill="#F4D36B" />
      ))}
      <path d="M0 -30 L0 -54" stroke={dark} strokeWidth={1.4} />
      <circle cx={0} cy={-54} r={2} fill={dark} />
    </g>
  );
};

export const ChristmasCactus: React.FC<{ c: Ctx }> = ({ c }) => {
  const flowerTips = SEGS.filter((s) => s.tip);
  return (
    <g>
      <ellipse cx={BASE_X} cy={BASE_Y} rx={80} ry={9} fill="#3B2A1E" />

      {SEGS.map((s, i) => {
        const g = c.grow(s.chain * 1.5 + s.k * 7);
        const sc = Math.min(1.05, ramp(g, 0, 1));
        if (sc <= 0.01) return null;
        const tone = shade(c.leaf, ((s.chain + s.k) % 3 - 1) * 0.07);
        const sw = c.sway(s.chain, 0.8) * (s.k + 1);
        return (
          <g key={i} transform={`rotate(${sw} ${BASE_X} ${BASE_Y}) translate(${s.x} ${s.y}) rotate(${s.a + 90}) scale(${sc})`}>
            <path d={segment(s.L)} fill={tone} />
            <path d={`M0 -2 L0 ${-s.L * 0.92}`} stroke={shade(tone, -0.2)} strokeWidth={1.6} />
            <path d={`M-6 ${-s.L * 0.3} Q -9 ${-s.L * 0.6} -6 ${-s.L * 0.86}`} stroke="#fff" strokeOpacity={0.22} strokeWidth={3} fill="none" strokeLinecap="round" />
            {/* A faint red blush on the scallop teeth, as stressed segments get. */}
            <circle cx={-10.5} cy={-s.L * 0.52} r={1.4} fill={c.accent} opacity={0.35} />
            <circle cx={10.5} cy={-s.L * 0.52} r={1.4} fill={c.accent} opacity={0.35} />
          </g>
        );
      })}

      {flowerTips.map((s, i) => {
        if (i % 4 === 3) return null;
        const g = c.grow(s.chain * 1.5 + s.k * 7 + 24);
        const sc = Math.min(1.05, ramp(g, 0, 1)) * 1.05;
        if (sc <= 0.01) return null;
        const sw = c.sway(s.chain, 0.8) * (s.k + 1);
        const tx = s.x + Math.cos((s.a * Math.PI) / 180) * (s.L - 2);
        const ty = s.y + Math.sin((s.a * Math.PI) / 180) * (s.L - 2);
        return (
          <g key={i} transform={`rotate(${sw} ${BASE_X} ${BASE_Y}) translate(${tx} ${ty}) rotate(${s.a + 90 + (i % 2 ? 10 : -10) + c.sway(i + 30, 3)})`}>
            <Flower s={sc} color={c.accent} />
          </g>
        );
      })}

      <FootedBowl color={c.pot} />
    </g>
  );
};

/** A glazed bowl on a short pedestal foot. */
const FootedBowl: React.FC<{ color: string }> = ({ color }) => (
  <g>
    <path d="M178 452 L222 452 L214 490 L186 490 Z" fill={shade(color, -0.12)} />
    <path d="M150 508 Q 150 490 200 488 Q 250 490 250 508 Z" fill={color} />
    <path d="M160 502 Q 170 494 196 492" stroke="#fff" strokeOpacity={0.3} strokeWidth={4} fill="none" strokeLinecap="round" />
    <path d="M110 396 L290 396 C 288 432 262 456 220 460 L180 460 C 138 456 112 432 110 396 Z" fill={color} />
    <path d="M118 420 C 150 432 250 432 282 420" stroke={shade(color, -0.1)} strokeWidth={2.5} fill="none" />
    <path d="M130 410 C 138 432 156 446 180 452" stroke="#fff" strokeOpacity={0.4} strokeWidth={8} fill="none" strokeLinecap="round" />
    <path d="M276 412 C 268 434 250 446 228 452" stroke="#000" strokeOpacity={0.12} strokeWidth={9} fill="none" strokeLinecap="round" />
    <rect x={102} y={386} width={196} height={14} rx={7} fill={shade(color, 0.05)} />
    <rect x={108} y={387} width={184} height={4} rx={2} fill="#fff" opacity={0.4} />
  </g>
);

export const drawing: PlantDrawing = { id: "christmas-cactus", Component: ChristmasCactus };
