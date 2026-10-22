import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import type { Ctx } from "./kit";

const SOIL_Y = 378;

// Stiff upright swords of staggered heights; drawn back to front.
const LEAVES = [
  { x: 158, a: -34, L: 176, w: 27, d: 12 },
  { x: 244, a: 32, L: 196, w: 27, d: 14 },
  { x: 174, a: -16, L: 250, w: 31, d: 6 },
  { x: 228, a: 15, L: 276, w: 31, d: 4 },
  { x: 198, a: -3, L: 322, w: 34, d: 0 },
  { x: 214, a: 6, L: 214, w: 30, d: 9 },
  { x: 184, a: -24, L: 150, w: 26, d: 16 },
];

const sword = (L: number, w: number) =>
  `M${-w * 0.78} 0 C ${-w * 1.08} ${-L * 0.42} ${-w * 0.86} ${-L * 0.78} 0 ${-L} C ${w * 0.86} ${-L * 0.78} ${w * 1.08} ${-L * 0.42} ${w * 0.78} 0 Z`;

export const SnakePlant: React.FC<{ c: Ctx }> = ({ c }) => {
  const margin = mix(c.accent, "#D8D36A", 0.4);
  const dark = shade(c.leaf, -0.32);
  const band = mix(c.leaf, "#B9CFA0", 0.42);
  return (
    <g>
      {LEAVES.map((lf, i) => {
        const g = c.grow(lf.d);
        const clip = `${c.id}-sw${i}`;
        const inner = sword(lf.L * 0.965, lf.w * 0.8);
        // Irregular zig-zag cross bands, the "tiger" pattern of Sansevieria.
        const bands = Array.from({ length: Math.floor(lf.L / 26) }, (_, k) => {
          const y = -18 - k * 26 - ((k * 7 + i * 5) % 6);
          const w = lf.w;
          const j = ((k + i) % 3) * 2;
          return `M${-w} ${y} L${-w * 0.55} ${y - 5 - j} L${-w * 0.15} ${y + 2} L${w * 0.25} ${y - 6 + j} L${w * 0.65} ${y + 1} L${w} ${y - 5}`;
        });
        return (
          <g
            key={i}
            transform={`translate(${lf.x} ${SOIL_Y + 6}) rotate(${lf.a * 0.55 + c.sway(i, 0.7)}) scale(${0.55 + 0.45 * Math.min(1, g)} ${g})`}
          >
            <defs>
              <clipPath id={clip}>
                <path d={inner} />
              </clipPath>
            </defs>
            <path d={sword(lf.L, lf.w)} fill={margin} />
            <path d={inner} fill={dark} />
            <g clipPath={`url(#${clip})`}>
              {bands.map((d, k) => (
                <path key={k} d={d} stroke={k % 2 ? band : shade(band, -0.1)} strokeWidth={8} fill="none" strokeLinejoin="round" />
              ))}
              <path d={`M${-lf.w * 0.32} -10 C ${-lf.w * 0.42} ${-lf.L * 0.4} ${-lf.w * 0.3} ${-lf.L * 0.7} ${-lf.w * 0.05} ${-lf.L * 0.92}`} stroke="#fff" strokeOpacity={0.16} strokeWidth={5} fill="none" strokeLinecap="round" />
            </g>
          </g>
        );
      })}
      <ConcretePlanter color={c.pot} />
    </g>
  );
};

/** A tall cast-concrete cylinder with a formwork seam and pitted surface. */
const ConcretePlanter: React.FC<{ color: string }> = ({ color }) => {
  const pits = [
    [152, 402, 1.6], [176, 430, 1.2], [234, 418, 1.8], [248, 452, 1.3], [166, 470, 1.5], [206, 488, 1.2],
    [222, 398, 1.1], [190, 456, 1.7], [240, 492, 1.4], [158, 446, 1], [214, 440, 1.3], [184, 404, 1],
  ];
  return (
    <g>
      <path d="M140 380 L260 380 L260 498 Q 260 508 250 508 L150 508 Q 140 508 140 498 Z" fill={color} />
      <path d="M140 444 L260 444" stroke={shade(color, -0.12)} strokeWidth={2} />
      <path d="M140 446 L260 446" stroke="#fff" strokeOpacity={0.15} strokeWidth={1.5} />
      {pits.map(([x, y, r], k) => (
        <circle key={k} cx={x} cy={y} r={r} fill={shade(color, k % 3 ? -0.22 : -0.32)} />
      ))}
      <path d="M154 392 L154 496" stroke="#fff" strokeOpacity={0.22} strokeWidth={9} strokeLinecap="round" />
      <path d="M248 392 L248 498" stroke="#000" strokeOpacity={0.13} strokeWidth={14} strokeLinecap="round" />
      <rect x={134} y={366} width={132} height={18} rx={4} fill={shade(color, 0.08)} />
      <rect x={134} y={366} width={132} height={4} rx={2} fill="#fff" opacity={0.3} />
      <rect x={134} y={381} width={132} height={3} fill="#000" opacity={0.12} />
    </g>
  );
};

export const drawing: PlantDrawing = { id: "snake-plant", Component: SnakePlant, anchors: { soil: [200, 368], snip: [290, 216], snipR: 30 } };
