import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, type Pt, along, leafTone, ramp, taperPath } from "./kit";

// A single upright stem, scarred where old leaves dropped, carrying the crown.
const STEM: Pt[] = [[200, 356], [197, 318], [203, 282], [199, 244], [201, 214]];

// Coin leaves on long petioles: `t` is where the petiole leaves the stem, `to` the leaf centre
// (where the petiole meets the underside), `r` the radius, `rot`/`sq` how the disc is tilted.
const LEAVES: { t: number; to: Pt; r: number; rot: number; sq: number; d: number }[] = [
  { t: 0.1, to: [102, 322], r: 31, rot: -24, sq: 0.74, d: 8 },
  { t: 0.14, to: [300, 326], r: 30, rot: 22, sq: 0.72, d: 10 },
  { t: 0.32, to: [80, 262], r: 35, rot: -32, sq: 0.84, d: 12 },
  { t: 0.36, to: [322, 258], r: 34, rot: 30, sq: 0.84, d: 14 },
  { t: 0.5, to: [146, 270], r: 27, rot: -10, sq: 0.9, d: 16 },
  { t: 0.54, to: [256, 276], r: 26, rot: 14, sq: 0.9, d: 17 },
  { t: 0.62, to: [114, 196], r: 34, rot: -22, sq: 0.9, d: 18 },
  { t: 0.66, to: [290, 192], r: 34, rot: 18, sq: 0.9, d: 20 },
  { t: 0.8, to: [160, 140], r: 31, rot: -12, sq: 0.94, d: 22 },
  { t: 0.84, to: [244, 136], r: 32, rot: 10, sq: 0.94, d: 24 },
  { t: 0.88, to: [168, 214], r: 25, rot: -6, sq: 0.95, d: 26 },
  { t: 0.9, to: [236, 212], r: 24, rot: 8, sq: 0.95, d: 27 },
  { t: 1, to: [202, 96], r: 27, rot: 0, sq: 0.92, d: 28 },
  { t: 1, to: [204, 168], r: 22, rot: 4, sq: 0.98, d: 30 },
];

// Pups: offsets pushing up through the soil beside the mother plant.
const PUPS = [
  { x: 146, lean: -14, d: 40, leaves: [{ a: -40, l: 30, r: 13 }, { a: 22, l: 26, r: 11 }, { a: -6, l: 40, r: 12 }] },
  { x: 262, lean: 12, d: 46, leaves: [{ a: 36, l: 28, r: 12 }, { a: -18, l: 24, r: 10 }] },
];

const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** A round peltate leaf: a tilted disc with the petiole dot near its centre and veins radiating out. */
const Coin: React.FC<{ r: number; rot: number; sq: number; color: string; tilt: number }> = ({ r, rot, sq, color, tilt }) => (
  <g transform={`rotate(${rot})`}>
    <ellipse rx={r} ry={r * sq} fill={color} />
    <ellipse rx={r} ry={r * sq} fill="none" stroke={shade(color, -0.18)} strokeWidth={1.6} />
    {Array.from({ length: 8 }, (_, k) => {
      const a = (k / 8) * Math.PI * 2 + 0.3;
      return (
        <path
          key={k}
          d={`M${tilt * r * 0.08} ${r * 0.06} L${Math.cos(a) * r * 0.78} ${Math.sin(a) * r * sq * 0.78}`}
          stroke={shade(color, -0.16)}
          strokeWidth={1.3}
          opacity={0.8}
        />
      );
    })}
    <path
      d={`M${-r * 0.72} ${-r * sq * 0.2} A ${r * 0.8} ${r * sq * 0.8} 0 0 1 ${-r * 0.1} ${-r * sq * 0.78}`}
      stroke="#fff"
      strokeOpacity={0.3}
      strokeWidth={r * 0.16}
      fill="none"
      strokeLinecap="round"
    />
    {/* The peltate dot: the petiole joins the underside here, so it shows through as a pale spot. */}
    <circle cx={tilt * r * 0.08} cy={r * 0.06} r={Math.max(2, r * 0.1)} fill={mix(color, "#F4F1D8", 0.55)} />
  </g>
);

export const ChineseMoneyPlant: React.FC<{ c: Ctx }> = ({ c }) => {
  const stemColor = shade(c.leaf, -0.28);
  const petiole = shade(c.leaf, -0.12);
  const gStem = c.grow(0);
  return (
    <g>
      <ellipse cx={200} cy={352} rx={80} ry={10} fill="#3B2A1E" />

      {PUPS.map((p, i) => {
        const g = c.grow(p.d);
        const top: Pt = [p.x + p.lean, 318];
        return (
          <g key={`p${i}`} transform={`rotate(${c.sway(i + 20, 1.5)} ${p.x} 352)`}>
            <path d={`M${p.x} 354 Q ${p.x + p.lean * 0.2} 336 ${p.x + (top[0] - p.x) * g} ${352 + (top[1] - 352) * Math.min(1, g)}`} stroke={petiole} strokeWidth={3} fill="none" strokeLinecap="round" />
            {p.leaves.map((lf, k) => {
              const s = ramp(g, 0.3, 1);
              const rad = ((lf.a - 90) * Math.PI) / 180;
              const ex = p.x + Math.cos(rad) * lf.l * s;
              const ey = 354 + Math.sin(rad) * lf.l * s;
              return (
                <g key={k}>
                  <path d={`M${p.x} 352 Q ${p.x} ${ey} ${ex} ${ey}`} stroke={petiole} strokeWidth={2} fill="none" />
                  <g transform={`translate(${ex} ${ey}) scale(${s})`}>
                    <Coin r={lf.r} rot={lf.a * 0.4} sq={0.8} color={leafTone(c.leaf, k + 1)} tilt={0} />
                  </g>
                </g>
              );
            })}
          </g>
        );
      })}

      <g transform={`rotate(${c.sway(1, 0.7)} 200 356)`}>
        <path d={taperPath(STEM, 12, 7, Math.min(1, gStem))} fill={stemColor} />
        {/* Leaf scars ringing the bare lower stem. */}
        {[0.12, 0.24, 0.36, 0.48].map((t) => {
          const p = along(STEM, t);
          return <path key={t} d={`M${p.x - 5} ${p.y} Q ${p.x} ${p.y + 3} ${p.x + 5} ${p.y}`} stroke={shade(stemColor, -0.3)} strokeWidth={1.6} fill="none" opacity={ramp(gStem, t, t + 0.2)} />;
        })}

        {LEAVES.map((lf, i) => {
          const g = c.grow(lf.d);
          const from = along(STEM, lf.t * Math.min(1, gStem));
          const s = Math.min(1, g);
          const [tx, ty] = lf.to;
          const ex = from.x + (tx - from.x) * s;
          const ey = from.y + (ty - from.y) * s;
          // Petioles arch up and out before turning towards the leaf.
          const cx = from.x + (ex - from.x) * 0.25;
          const cy = Math.min(from.y, ey) - 18 * s;
          const side = Math.sign(tx - 200);
          const sw = c.sway(i, 2.2);
          return (
            <g key={i} transform={`rotate(${sw} ${from.x} ${from.y})`}>
              <path d={`M${from.x} ${from.y} Q ${cx} ${cy} ${ex} ${ey}`} stroke={petiole} strokeWidth={3} fill="none" strokeLinecap="round" />
              <g transform={`translate(${ex} ${ey}) scale(${ramp(g, 0.25, 1) * (0.96 + rnd(i) * 0.08)})`}>
                <Coin r={lf.r} rot={lf.rot} sq={lf.sq} color={leafTone(c.leaf, i)} tilt={-side} />
              </g>
            </g>
          );
        })}
      </g>

      <SpeckledPot color={c.pot} id={c.id} />
    </g>
  );
};

/** A rounded stoneware pot in a speckled glaze that stops short of a raw clay foot. */
const SpeckledPot: React.FC<{ color: string; id: string }> = ({ color, id }) => {
  const body = "M120 354 L280 354 C 288 416 280 474 254 502 Q 248 508 238 508 L162 508 Q 152 508 146 502 C 120 474 112 416 120 354 Z";
  const clip = `${id}-cmp-pot`;
  const clay = "#B4825C";
  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <path d={body} />
        </clipPath>
      </defs>
      <path d={body} fill={color} />
      <g clipPath={`url(#${clip})`}>
        {/* Bare clay foot below a wavy glaze line. */}
        <path d="M100 486 C 130 478 150 492 178 484 C 204 476 222 490 248 482 C 266 477 284 486 300 480 L300 520 L100 520 Z" fill={clay} />
        <path d="M100 486 C 130 478 150 492 178 484 C 204 476 222 490 248 482 C 266 477 284 486 300 480" stroke={shade(color, -0.12)} strokeWidth={2.5} fill="none" />
        {Array.from({ length: 70 }, (_, k) => {
          const x = 116 + rnd(k * 3 + 1) * 168;
          const y = 360 + rnd(k * 7 + 2) * 122;
          const dark = k % 4 !== 0;
          return <circle key={k} cx={x} cy={y} r={0.9 + rnd(k * 11) * 1.6} fill={dark ? "#5B4636" : "#fff"} opacity={dark ? 0.55 : 0.5} />;
        })}
        <path d="M140 372 C 132 418 138 456 154 480" stroke="#fff" strokeOpacity={0.3} strokeWidth={10} fill="none" strokeLinecap="round" />
        <path d="M268 380 C 272 424 266 458 252 480" stroke="#000" strokeOpacity={0.1} strokeWidth={14} fill="none" strokeLinecap="round" />
      </g>
      <rect x={112} y={342} width={176} height={18} rx={9} fill={shade(color, 0.05)} />
      {Array.from({ length: 14 }, (_, k) => (
        <circle key={k} cx={120 + rnd(k * 5 + 40) * 160} cy={346 + rnd(k * 9 + 41) * 10} r={1.1} fill="#5B4636" opacity={0.5} />
      ))}
      <rect x={118} y={343} width={164} height={5} rx={2.5} fill="#fff" opacity={0.35} />
    </g>
  );
};

export const drawing: PlantDrawing = { id: "chinese-money-plant", Component: ChineseMoneyPlant };
