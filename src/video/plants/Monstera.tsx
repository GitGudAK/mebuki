import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, type Pt, leafTone, polyline, spline, taperPath } from "./kit";

const SOIL_Y = 404;
const POLE_TOP = 120;

// The climbing stem, hugging the moss pole.
const STEM: Pt[] = [[204, 410], [212, 350], [196, 280], [210, 210], [198, 140]];

// Leaves leave the stem at y, on a side, held at angle (deg, 0 = pointing outward horizontally).
const LEAVES = [
  { y: 380, side: -1, out: 40, rise: 40, a: 40, L: 150, d: 6, split: true },
  { y: 350, side: 1, out: 40, rise: 50, a: 36, L: 156, d: 10, split: true },
  { y: 270, side: -1, out: 30, rise: 40, a: 24, L: 136, d: 16, split: true },
  { y: 228, side: 1, out: 30, rise: 40, a: 18, L: 124, d: 22, split: true },
  { y: 160, side: -1, out: 22, rise: 26, a: 0, L: 92, d: 28, split: false },
];

// Unit leaf (length 100) pointing +x, attached at its sinus.
const HEART = "M8 0 C -12 -8 -14 -44 22 -50 C 62 -56 96 -26 100 0 C 96 26 62 56 22 50 C -14 44 -12 8 8 0 Z";
const SLITS = [22, 46, 70];

export const Monstera: React.FC<{ c: Ctx }> = ({ c }) => {
  const g = c.grow(0);
  const stemColor = shade(c.leaf, -0.18);
  const maskSplit = `${c.id}-mon-split`;
  const maskYoung = `${c.id}-mon-young`;
  const vein = mix(c.leaf, "#D9EFB0", 0.35);
  return (
    <g>
      <defs>
        <mask id={maskSplit} maskUnits="userSpaceOnUse" x={-30} y={-70} width={150} height={140}>
          <path d={HEART} fill="#fff" />
          {SLITS.map((x, k) =>
            [-1, 1].map((s) => (
              <g key={`${k}${s}`}>
                {/* Splits open from the margin as wedges, narrowing toward the midrib. */}
                <path d={`M${x} ${s * 13} L${x + 6} ${s * 72} L${x + 26} ${s * 72} L${x + 6} ${s * 13} Z`} fill="#000" />
                <circle cx={x + 2.5} cy={s * 13} r={2.5} fill="#000" />
                {k < 3 && <ellipse cx={x + 15} cy={s * 22} rx={5} ry={3.4} fill="#000" transform={`rotate(${s * 65} ${x + 15} ${s * 22})`} />}
              </g>
            )),
          )}
        </mask>
        <mask id={maskYoung} maskUnits="userSpaceOnUse" x={-30} y={-70} width={150} height={140}>
          <path d={HEART} fill="#fff" />
          {[30, 52].map((x) =>
            [-1, 1].map((s) => <ellipse key={`${x}${s}`} cx={x} cy={s * 20} rx={4} ry={2.4} fill="#000" />),
          )}
        </mask>
      </defs>

      {/* Moss pole. */}
      <g>
        <rect x={190} y={SOIL_Y - (SOIL_Y - POLE_TOP) * Math.min(1, g)} width={22} height={(SOIL_Y - POLE_TOP) * Math.min(1, g) + 6} rx={5} fill="#6E5B3E" />
        {Array.from({ length: 22 }, (_, k) => {
          const y = POLE_TOP + 8 + k * 14;
          return y > SOIL_Y - (SOIL_Y - POLE_TOP) * Math.min(1, g) ? (
            <g key={k}>
              <circle cx={194 + ((k * 7) % 14)} cy={y} r={3} fill="#7F7A44" />
              <circle cx={204 - ((k * 5) % 10)} cy={y + 6} r={2.2} fill="#5A4A31" />
            </g>
          ) : null;
        })}
        <rect x={193} y={POLE_TOP + 4} width={4} height={(SOIL_Y - POLE_TOP - 4) * Math.min(1, g)} fill="#fff" opacity={0.12} />
      </g>

      {/* Climbing stem and its aerial root. */}
      <path d={taperPath(STEM, 11, 6, Math.min(1, c.grow(3)))} fill={stemColor} />
      <path
        d={polyline(spline([[206, 300], [226, 326], [236, 372], [238, 412]], Math.min(1, c.grow(30))))}
        stroke="#7B5A3C"
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
      />

      {LEAVES.map((lf, i) => {
        const s = Math.min(1.04, c.grow(lf.d));
        if (s <= 0.01) return null;
        const x0 = 202;
        const tip = [x0 + lf.side * lf.out * s, lf.y - lf.rise * s];
        const color = leafTone(c.leaf, i);
        const sw = c.sway(i, 1.8);
        return (
          <g key={i}>
            <path
              d={`M${x0} ${lf.y} Q ${x0 + lf.side * lf.out * 0.4 * s} ${lf.y - lf.rise * 1.3 * s} ${tip[0]} ${tip[1]}`}
              stroke={shade(c.leaf, -0.1)}
              strokeWidth={4.5}
              fill="none"
              strokeLinecap="round"
            />
            <g transform={`translate(${tip[0]} ${tip[1]}) scale(${lf.side} 1) rotate(${lf.a + sw}) scale(${(lf.L / 100) * s})`}>
              <g mask={`url(#${lf.split ? maskSplit : maskYoung})`}>
                <path d={HEART} fill={color} />
                <path d="M8 0 L97 0" stroke={vein} strokeWidth={2.4} />
                {SLITS.map((x) =>
                  [-1, 1].map((v) => (
                    <path key={`${x}${v}`} d={`M${x + 12} ${v * 2} L${x + 26} ${v * 56}`} stroke={shade(color, -0.2)} strokeWidth={1.4} />
                  )),
                )}
                <path d="M30 -38 C 52 -44 76 -34 88 -16" stroke="#fff" strokeOpacity={0.2} strokeWidth={5} fill="none" strokeLinecap="round" />
              </g>
            </g>
          </g>
        );
      })}

      <MidCenturyPlanter color={c.pot} />
    </g>
  );
};

/** A tapered bowl on splayed, angled wooden legs. */
const MidCenturyPlanter: React.FC<{ color: string }> = ({ color }) => {
  const wood = "#8A5A36";
  return (
    <g>
      {/* Back legs. */}
      <path d="M182 470 L174 500" stroke={shade(wood, -0.25)} strokeWidth={8} strokeLinecap="round" />
      <path d="M218 470 L226 500" stroke={shade(wood, -0.25)} strokeWidth={8} strokeLinecap="round" />
      {/* Front legs. */}
      <path d="M160 464 L136 506" stroke={wood} strokeWidth={10} strokeLinecap="round" />
      <path d="M240 464 L264 506" stroke={wood} strokeWidth={10} strokeLinecap="round" />
      <path d="M158 470 L140 502" stroke="#fff" strokeOpacity={0.2} strokeWidth={3} strokeLinecap="round" />
      <path d="M128 410 L272 410 L256 470 Q 253 478 244 478 L156 478 Q 147 478 144 470 Z" fill={color} />
      <path d="M131 422 L269 422" stroke={shade(color, -0.15)} strokeWidth={3} />
      <path d="M146 430 L158 470" stroke="#fff" strokeOpacity={0.25} strokeWidth={8} strokeLinecap="round" />
      <path d="M256 428 L246 468" stroke="#000" strokeOpacity={0.12} strokeWidth={10} strokeLinecap="round" />
      <rect x={122} y={400} width={156} height={14} rx={7} fill={shade(color, 0.07)} />
      <rect x={128} y={401} width={144} height={4} rx={2} fill="#fff" opacity={0.3} />
    </g>
  );
};

export const drawing: PlantDrawing = { id: "monstera-deliciosa", Component: Monstera, anchors: { soil: [168, 403], snip: [206, 232], snipR: 26 } };
