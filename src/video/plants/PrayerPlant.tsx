import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, ramp } from "./kit";

const X = 200;
const Y = 424;

// Spreading oval leaves on petioles; `fold` leaves stand upright and half-closed as they do at night.
// `front` leaves spill over the bowl's rim and are drawn in front of it.
type Leaf = { a: number; p: number; rot: number; L: number; W: number; d: number; fold?: boolean; front?: boolean };
const LEAVES: Leaf[] = [
  { a: -64, p: 112, rot: -78, L: 118, W: 70, d: 8 },
  { a: 62, p: 108, rot: 80, L: 116, W: 68, d: 10 },
  { a: -40, p: 150, rot: -50, L: 120, W: 72, d: 12 },
  { a: 38, p: 146, rot: 48, L: 118, W: 70, d: 14 },
  { a: -20, p: 190, rot: -22, L: 108, W: 64, d: 18 },
  { a: 18, p: 182, rot: 26, L: 110, W: 64, d: 20 },
  { a: -6, p: 196, rot: -6, L: 104, W: 62, d: 24, fold: true },
  { a: 8, p: 212, rot: 10, L: 100, W: 60, d: 26, fold: true },
  { a: -26, p: 124, rot: -34, L: 98, W: 58, d: 22, fold: true },
  { a: 0, p: 128, rot: 2, L: 112, W: 66, d: 16 },
  { a: -82, p: 78, rot: -108, L: 108, W: 64, d: 6, front: true },
  { a: 82, p: 74, rot: 110, L: 106, W: 62, d: 7, front: true },
];

const leafPath = (L: number, W: number) =>
  `M0 0 C ${W * 0.62} ${-L * 0.08} ${W * 0.62} ${-L * 0.72} 0 ${-L} C ${-W * 0.62} ${-L * 0.72} ${-W * 0.62} ${-L * 0.08} 0 0 Z`;

/** The pale feathered zone along the midrib, with its herringbone-jagged edge. */
const featherPath = (L: number, W: number) => {
  const pts: string[] = [`M0 ${-L * 0.04}`];
  const n = 7;
  for (let k = 0; k <= n; k++) {
    const t = 0.08 + (k / n) * 0.82;
    const w = W * 0.16 * Math.sin(Math.PI * Math.min(1, t * 1.05));
    pts.push(`L${w * 1.25} ${-L * t}`, `L${w * 0.6} ${-L * (t + 0.05)}`);
  }
  pts.push(`L0 ${-L * 0.96}`);
  for (let k = n; k >= 0; k--) {
    const t = 0.08 + (k / n) * 0.82;
    const w = W * 0.16 * Math.sin(Math.PI * Math.min(1, t * 1.05));
    pts.push(`L${-w * 0.6} ${-L * (t + 0.05)}`, `L${-w * 1.25} ${-L * t}`);
  }
  return `${pts.join(" ")} Z`;
};

const MarantaLeaf: React.FC<{ L: number; W: number; leaf: string; red: string; tone: number; clip: string }> = ({ L, W, leaf, red, tone, clip }) => {
  const base = shade(leaf, -0.3 + tone);
  const feather = mix(leaf, "#C9DF7E", 0.38);
  const blotch = shade(leaf, -0.58);
  const veins = [0.16, 0.27, 0.38, 0.49, 0.6, 0.71, 0.82];
  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <path d={leafPath(L, W)} />
        </clipPath>
      </defs>
      <path d={leafPath(L, W)} fill={base} />
      <g clipPath={`url(#${clip})`}>
      <path d={featherPath(L, W)} fill={feather} />
      {/* Dark blotches paired either side of the midrib, between the veins. */}
      {[0.22, 0.44, 0.66].map((t) =>
        [-1, 1].map((v) => (
          <ellipse
            key={`${t}${v}`}
            cx={v * W * 0.21}
            cy={-L * (t + 0.05)}
            rx={W * 0.09}
            ry={L * 0.06}
            fill={blotch}
            transform={`rotate(${v * 35} ${v * W * 0.21} ${-L * (t + 0.05)})`}
          />
        )),
      )}
      {/* Red herringbone: lateral veins sweeping out and up from the red midrib. */}
      {veins.map((t) =>
        [-1, 1].map((v) => {
          const half = W * 0.5 * Math.sin(Math.PI * Math.min(0.98, t + 0.06));
          return (
            <path
              key={`${t}${v}`}
              d={`M0 ${-L * t} Q ${v * half * 0.45} ${-L * (t + 0.05)} ${v * half * 1.1} ${-L * (t + 0.15)}`}
              stroke={red}
              strokeWidth={1.7}
              fill="none"
              strokeLinecap="round"
            />
          );
        }),
      )}
      </g>
      <path d={`M0 0 L0 ${-L * 0.95}`} stroke={red} strokeWidth={3} strokeLinecap="round" />
      <path d={leafPath(L, W)} fill="none" stroke={shade(base, -0.25)} strokeWidth={1.4} />
      <path d={`M${-W * 0.3} ${-L * 0.22} C ${-W * 0.38} ${-L * 0.42} ${-W * 0.34} ${-L * 0.62} ${-W * 0.18} ${-L * 0.8}`} stroke="#fff" strokeOpacity={0.18} strokeWidth={5} fill="none" strokeLinecap="round" />
    </g>
  );
};

export const PrayerPlant: React.FC<{ c: Ctx }> = ({ c }) => {
  const petiole = shade(c.leaf, -0.18);
  const red = shade(c.accent, -0.05);
  const draw = (lf: Leaf, i: number) => {
    const g = c.grow(lf.d);
    const len = lf.p * Math.min(1, g);
    const r = (lf.a * Math.PI) / 180;
    const tx = Math.sin(r) * len;
    const ty = -Math.cos(r) * len;
    const s = ramp(g, 0.3, 1);
    // Folded leaves close up like praying hands: squeezed to one half, held upright.
    const fold = lf.fold ? 0.42 : 1;
    const ox = lf.front ? lf.a * 0.3 : 0;
    return (
      <g key={i} transform={`translate(${X + ox} ${Y - (lf.front ? 8 : 0)}) rotate(${c.sway(i, lf.fold ? 1 : 1.8)})`}>
        <path d={`M0 0 Q ${tx * 0.15} ${ty * 0.7} ${tx} ${ty}`} stroke={petiole} strokeWidth={3.5} fill="none" strokeLinecap="round" />
        <g transform={`translate(${tx} ${ty}) rotate(${lf.rot}) scale(${s * fold} ${s})`}>
          <MarantaLeaf L={lf.L} W={lf.W} leaf={c.leaf} red={red} tone={((i % 3) - 1) * 0.05} clip={`${c.id}-maranta-${i}`} />
        </g>
      </g>
    );
  };
  return (
    <g>
      <ellipse cx={X} cy={Y} rx={104} ry={10} fill="#3B2A1E" />
      {LEAVES.map((lf, i) => (lf.front ? null : draw(lf, i)))}
      <LowBowl color={c.pot} />
      {LEAVES.map((lf, i) => (lf.front ? draw(lf, i) : null))}
    </g>
  );
};

/** A low, wide stoneware bowl on a short foot, with a band of incised lines. */
const LowBowl: React.FC<{ color: string }> = ({ color }) => (
  <g>
    <rect x={158} y={494} width={84} height={14} rx={4} fill={shade(color, -0.2)} />
    <path d="M78 428 L322 428 C 320 470 298 496 256 500 L144 500 C 102 496 80 470 78 428 Z" fill={color} />
    {[448, 456].map((y) => (
      <path key={y} d={`M${84 + (y - 440) * 0.4} ${y} Q 200 ${y + 8} ${316 - (y - 440) * 0.4} ${y}`} stroke={shade(color, -0.18)} strokeWidth={2} fill="none" />
    ))}
    <path d="M100 444 C 108 470 126 486 150 492" stroke="#fff" strokeOpacity={0.25} strokeWidth={8} fill="none" strokeLinecap="round" />
    <path d="M304 450 C 296 474 280 488 258 494" stroke="#000" strokeOpacity={0.12} strokeWidth={10} fill="none" strokeLinecap="round" />
    <rect x={70} y={418} width={260} height={14} rx={7} fill={shade(color, 0.08)} />
    <rect x={78} y={419} width={244} height={4} rx={2} fill="#fff" opacity={0.3} />
  </g>
);

export const drawing: PlantDrawing = { id: "prayer-plant", Component: PrayerPlant, anchors: { soil: [200, 416], snip: [350, 358], snipR: 54 } };
