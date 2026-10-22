import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, type Pt, along, ramp, taperPath } from "./kit";

// A stout trunk that forks into thick, slightly crooked limbs: a little tree in a bowl.
const TRUNK: Pt[] = [[200, 440], [192, 408], [204, 372], [198, 336]];
const LIMBS: { from: number; pts: Pt[]; w: [number, number]; delay: number }[] = [
  { from: 0.45, pts: [[156, 362], [122, 334], [104, 296]], w: [22, 12], delay: 6 },
  { from: 0.6, pts: [[246, 354], [280, 324], [298, 284]], w: [21, 12], delay: 8 },
  { from: 1, pts: [[176, 298], [156, 262], [148, 222]], w: [20, 10], delay: 12 },
  { from: 1, pts: [[216, 296], [238, 256], [252, 214]], w: [20, 10], delay: 14 },
  { from: 1, pts: [[198, 292], [196, 246], [200, 190]], w: [17, 9], delay: 16 },
];

// Leaf clusters: at each limb tip, plus a couple partway up the older limbs.
const CLUSTERS: { limb: number; t: number; s: number }[] = [
  { limb: 0, t: 1, s: 1 },
  { limb: 1, t: 1, s: 1 },
  { limb: 2, t: 1, s: 0.95 },
  { limb: 3, t: 1, s: 0.95 },
  { limb: 4, t: 1, s: 0.9 },
  { limb: 0, t: 0.5, s: 0.85 },
  { limb: 1, t: 0.5, s: 0.85 },
  { limb: 2, t: 0.5, s: 0.8 },
  { limb: 3, t: 0.5, s: 0.8 },
  { limb: 4, t: 0.55, s: 0.75 },
];

/** A plump, rounded-oval leaf, widest above the middle, like a fat coin. */
const LEAF = "M0 0 C -11 -3 -17 -22 -14 -34 C -11 -46 11 -46 14 -34 C 17 -22 11 -3 0 0 Z";
const RIM = "M-14 -32 C -12 -46 12 -46 14 -32";

const FAN = [
  { a: -78, s: 0.9 },
  { a: 78, s: 0.92 },
  { a: -46, s: 1 },
  { a: 46, s: 1 },
  { a: -16, s: 0.95 },
  { a: 16, s: 0.92 },
  { a: 0, s: 0.62 },
];

export const JadePlant: React.FC<{ c: Ctx }> = ({ c }) => {
  const bark = "#7E6E5C";
  const young = mix(bark, c.leaf, 0.35);
  const edge = mix(c.accent, "#C2263A", 0.45);
  const g = c.grow(0);
  const limbG = LIMBS.map((l) => c.grow(l.delay));
  const ptsOf = (i: number): Pt[] => {
    const p0 = along(TRUNK, LIMBS[i].from);
    return [[p0.x, p0.y], ...LIMBS[i].pts];
  };
  return (
    <g>
      <ellipse cx={200} cy={440} rx={96} ry={9} fill="#3B2A1E" />
      <g transform={`rotate(${c.sway(1, 0.5)} 200 440)`}>
        {LIMBS.map((l, i) => (
          <path key={i} d={taperPath(ptsOf(i), l.w[0], l.w[1], Math.min(1, limbG[i]), 18)} fill={i > 1 ? young : shade(bark, 0.04)} />
        ))}
        <path d={taperPath(TRUNK, 40, 22, Math.min(1, g), 16)} fill={bark} />
        {/* Leaf scars ring the woody trunk; a lit flank down one side. */}
        {[420, 396, 372, 348].map((y, k) => (
          <path key={y} d={`M${186 + (k % 2) * 4} ${y} q 12 ${4} 24 0`} stroke={shade(bark, -0.25)} strokeWidth={2} fill="none" opacity={ramp(g, 0.3 + k * 0.1, 0.8)} />
        ))}
        <path d="M188 432 C 184 404 192 372 188 334" stroke="#fff" strokeOpacity={0.16 * Math.min(1, g)} strokeWidth={5} fill="none" strokeLinecap="round" />

        {CLUSTERS.map((cl, ci) => {
          const pts = ptsOf(cl.limb);
          const p = along(pts, cl.t);
          const base = cl.t === 1 ? 0 : (ci % 2 ? 1 : -1) * 50;
          return (
            <g key={ci} transform={`translate(${p.x} ${p.y}) rotate(${(cl.t === 1 ? p.angle + 90 : base) + c.sway(ci, 2)})`}>
              {FAN.map((f, k) => {
                const s = c.grow(LIMBS[cl.limb].delay + 10 + k * 2 + ci) * f.s * cl.s * 1.4;
                const color = shade(c.leaf, ((k + ci) % 3 - 1) * 0.07);
                return (
                  <g key={k} transform={`rotate(${f.a}) scale(${s})`}>
                    <path d={LEAF} fill={color} />
                    <path d={RIM} stroke={edge} strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.75} />
                    <path d={LEAF} fill="none" stroke={edge} strokeWidth={1} opacity={0.35} />
                    <ellipse cx={-5} cy={-26} rx={3.5} ry={9} fill="#fff" opacity={0.24} transform="rotate(-10 -5 -26)" />
                  </g>
                );
              })}
            </g>
          );
        })}
      </g>

      <ClayBowl color={c.pot} />
    </g>
  );
};

/** A low, round unglazed terracotta bowl: thick rounded lip, matte clay, a short foot ring. */
const ClayBowl: React.FC<{ color: string }> = ({ color }) => (
  <g>
    <rect x={160} y={494} width={80} height={14} rx={5} fill={shade(color, -0.2)} />
    <path d="M96 446 L304 446 C 306 482 268 500 200 500 C 132 500 94 482 96 446 Z" fill={color} />
    {/* Matte clay: soft tonal bands, no glaze shine, a scatter of grog specks. */}
    <path d="M100 462 C 140 474 260 474 300 462" stroke={shade(color, -0.12)} strokeWidth={3} fill="none" opacity={0.6} />
    <path d="M118 458 C 126 476 146 488 172 494" stroke="#fff" strokeOpacity={0.14} strokeWidth={10} fill="none" strokeLinecap="round" />
    <path d="M292 460 C 284 478 264 490 238 495" stroke="#000" strokeOpacity={0.14} strokeWidth={10} fill="none" strokeLinecap="round" />
    {[[136, 470], [170, 486], [214, 480], [250, 488], [272, 470], [190, 466], [232, 466], [152, 482]].map(([x, y], k) => (
      <circle key={k} cx={x} cy={y} r={1.6} fill={shade(color, -0.3)} opacity={0.55} />
    ))}
    <rect x={86} y={432} width={228} height={20} rx={10} fill={shade(color, 0.06)} />
    <rect x={94} y={434} width={212} height={5} rx={2.5} fill="#fff" opacity={0.2} />
    <rect x={88} y={446} width={224} height={6} rx={3} fill={shade(color, -0.14)} />
  </g>
);

export const drawing: PlantDrawing = { id: "jade-plant", Component: JadePlant, anchors: { soil: [200, 436], snip: [330, 268], snipR: 34 } };
