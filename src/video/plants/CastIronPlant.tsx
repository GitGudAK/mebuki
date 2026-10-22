import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import type { Ctx } from "./kit";

const Y = 398;

// Each leaf rises singly from the soil on its own stalk. Drawn back to front.
const LEAVES = [
  { x: 172, a: -30, stalk: 60, L: 150, d: 12 },
  { x: 232, a: 32, stalk: 56, L: 148, d: 14 },
  { x: 186, a: -18, stalk: 92, L: 196, d: 4 },
  { x: 218, a: 16, stalk: 86, L: 190, d: 6 },
  { x: 202, a: -4, stalk: 108, L: 214, d: 0 },
  { x: 178, a: -40, stalk: 40, L: 128, d: 18 },
  { x: 224, a: 42, stalk: 44, L: 124, d: 20 },
  { x: 208, a: 6, stalk: 70, L: 168, d: 9 },
];

/** Broad lance, widest just above the middle, tapering to a long point. */
const lance = (L: number, w: number, s: 1 | -1) =>
  `M0 0 C ${s * w * 0.55} ${-L * 0.12} ${s * w} ${-L * 0.32} ${s * w * 0.95} ${-L * 0.55} C ${s * w * 0.85} ${-L * 0.78} ${s * w * 0.3} ${-L * 0.92} 0 ${-L} Z`;

export const CastIronPlant: React.FC<{ c: Ctx }> = ({ c }) => (
  <g>
    {LEAVES.map((lf, i) => {
      const g = c.grow(lf.d);
      const shown = Math.min(1, g);
      if (shown <= 0.01) return null;
      const side = Math.sign(lf.a) || 1;
      const sh = lf.stalk * shown;
      const L = lf.L * Math.max(0, (g - 0.25) / 0.75);
      const w = lf.L * 0.13;
      const tone = shade(c.leaf, ((i % 3) - 1) * 0.06);
      const vein = shade(tone, -0.22);
      return (
        <g key={i} transform={`translate(${lf.x} ${Y}) rotate(${lf.a * 0.5 + c.sway(i, 1.2)})`}>
          <path d={`M0 0 L0 ${-sh}`} stroke={shade(c.leaf, -0.25)} strokeWidth={4.5} strokeLinecap="round" />
          <g transform={`translate(0 ${-sh + 2}) rotate(${side * (8 + Math.abs(lf.a) * 0.35)})`}>
            {/* Lit half and shaded half, folded along the midrib. */}
            <path d={lance(L, w, -1)} fill={mix(tone, "#9CC28A", 0.12)} />
            <path d={lance(L, w, 1)} fill={shade(tone, -0.14)} />
            {[-0.6, -0.3, 0.3, 0.6].map((u) => (
              <path
                key={u}
                d={`M${u * w * 0.25} ${-L * 0.06} C ${u * w * 1.05} ${-L * 0.32} ${u * w * 0.95} ${-L * 0.62} ${u * 0.1} ${-L * 0.97}`}
                stroke={vein}
                strokeOpacity={0.5}
                strokeWidth={1}
                fill="none"
              />
            ))}
            <path d={`M0 0 L0 ${-L * 0.98}`} stroke={mix(tone, "#E2E8C6", 0.3)} strokeWidth={1.8} />
            <path d={`M${-w * 0.45} ${-L * 0.25} C ${-w * 0.7} ${-L * 0.45} ${-w * 0.6} ${-L * 0.66} ${-w * 0.3} ${-L * 0.82}`} stroke="#fff" strokeOpacity={0.16} strokeWidth={4} fill="none" strokeLinecap="round" />
          </g>
        </g>
      );
    })}
    <CobaltPot color={c.pot} />
  </g>
);

/** A glazed cobalt pot: glossy glaze pooling over the shoulder, raw clay at the foot. */
const CobaltPot: React.FC<{ color: string }> = ({ color }) => {
  const clay = "#C9A584";
  return (
    <g>
      <path d="M130 404 L270 404 C 282 440 276 476 256 498 Q 250 508 238 508 L162 508 Q 150 508 144 498 C 124 476 118 440 130 404 Z" fill={color} />
      {/* Unglazed foot. */}
      <path d="M146 492 L254 492 Q 250 508 238 508 L162 508 Q 150 508 146 492 Z" fill={clay} />
      {/* Glaze drips running down over the foot line. */}
      {[[166, 6], [190, 10], [222, 7], [240, 5]].map(([x, l], k) => (
        <path key={k} d={`M${x - 4} 490 L${x + 4} 490 L${x + 3} ${490 + l} Q ${x} ${494 + l} ${x - 3} ${490 + l} Z`} fill={color} />
      ))}
      {/* Darker pooled glaze band below the shoulder. */}
      <path d="M128 424 C 170 434 230 434 272 424" stroke={shade(color, -0.25)} strokeWidth={5} fill="none" />
      <path d="M146 418 C 134 446 138 472 156 488" stroke="#fff" strokeOpacity={0.35} strokeWidth={9} fill="none" strokeLinecap="round" />
      <circle cx={150} cy={414} r={4} fill="#fff" opacity={0.55} />
      <path d="M262 420 C 268 450 262 474 248 490" stroke="#000" strokeOpacity={0.2} strokeWidth={12} fill="none" strokeLinecap="round" />
      <rect x={124} y={392} width={152} height={16} rx={8} fill={shade(color, 0.1)} />
      <rect x={130} y={393} width={140} height={4} rx={2} fill="#fff" opacity={0.35} />
    </g>
  );
};

export const drawing: PlantDrawing = { id: "cast-iron-plant", Component: CastIronPlant };
