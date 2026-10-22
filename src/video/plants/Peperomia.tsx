import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, ramp } from "./kit";

const X = 200;
const Y = 400;

// Stout stems fanning from the crown into a dome; back rows are longer so the mound stays round.
const LEAVES: { a: number; l: number; s: number; d: number }[] = [
  // back row
  { a: -40, l: 112, s: 80, d: 6 },
  { a: -16, l: 128, s: 84, d: 4 },
  { a: 8, l: 130, s: 84, d: 2 },
  { a: 30, l: 116, s: 80, d: 5 },
  { a: -62, l: 92, s: 78, d: 8 },
  { a: 56, l: 94, s: 78, d: 7 },
  // middle row
  { a: -78, l: 70, s: 80, d: 10 },
  { a: -44, l: 74, s: 84, d: 9 },
  { a: -16, l: 80, s: 86, d: 8 },
  { a: 14, l: 82, s: 86, d: 9 },
  { a: 42, l: 74, s: 84, d: 11 },
  { a: 76, l: 70, s: 80, d: 12 },
  // front row, low and spilling over the rim
  { a: -98, l: 46, s: 74, d: 16 },
  { a: -62, l: 38, s: 78, d: 15 },
  { a: -28, l: 36, s: 80, d: 14 },
  { a: 4, l: 40, s: 78, d: 14 },
  { a: 34, l: 36, s: 80, d: 15 },
  { a: 64, l: 40, s: 76, d: 16 },
  { a: 98, l: 44, s: 72, d: 17 },
];

// Peperomia's thin "rat-tail" flower spikes standing above the foliage.
const SPIKES = [
  { a: -10, l: 252, d: 36 },
  { a: 14, l: 236, d: 42 },
];

/** A thick obovate leaf, broadest towards its rounded tip. */
const leafPath = (L: number) => {
  const W = L * 0.42;
  return `M0 0 C ${W * 0.9} ${-L * 0.06} ${W * 1.25} ${-L * 0.6} ${W * 0.62} ${-L * 0.92} C ${W * 0.26} ${-L * 1.04} ${-W * 0.26} ${-L * 1.04} ${-W * 0.62} ${-L * 0.92} C ${-W * 1.25} ${-L * 0.6} ${-W * 0.9} ${-L * 0.06} 0 0 Z`;
};

export const Peperomia: React.FC<{ c: Ctx }> = ({ c }) => {
  const dark = shade(c.leaf, -0.2);
  const stem = mix(shade(c.leaf, -0.2), "#7A3E32", 0.4);
  return (
    <g>
      <ellipse cx={X} cy={Y - 2} rx={66} ry={9} fill="#3B2A1E" />

      {SPIKES.map((sp, i) => {
        const g = c.grow(sp.d);
        const h = sp.l * Math.min(1, g);
        return (
          <g key={`s${i}`} transform={`translate(${X} ${Y}) rotate(${sp.a + c.sway(i + 30, 1.4)})`}>
            <path d={`M0 0 Q ${sp.a * 0.5} ${-h * 0.55} 0 ${-h}`} stroke={mix(c.accent, c.leaf, 0.45)} strokeWidth={4} fill="none" strokeLinecap="round" />
            <path d={`M0 ${-h * 0.62} Q ${sp.a * 0.22} ${-h * 0.8} 0 ${-h}`} stroke={mix(c.accent, c.leaf, 0.2)} strokeWidth={6} fill="none" strokeLinecap="round" opacity={ramp(g, 0.6, 1)} />
          </g>
        );
      })}

      {LEAVES.map((lf, i) => {
        const g = c.grow(lf.d);
        const len = lf.l * Math.min(1, g);
        const bend = lf.a * 0.35;
        const tipX = Math.sin((lf.a * Math.PI) / 180) * len;
        const tipY = -Math.cos((lf.a * Math.PI) / 180) * len;
        const s = ramp(g, 0.3, 1);
        const L = lf.s;
        const tone = shade(dark, ((i * 7) % 3 - 1) * 0.07);
        const rim = shade(tone, 0.09);
        return (
          <g key={i} transform={`translate(${X} ${Y}) rotate(${c.sway(i, 1.4)})`}>
            <path d={`M0 0 Q ${tipX * 0.2 + bend} ${tipY * 0.6} ${tipX} ${tipY}`} stroke={stem} strokeWidth={7} fill="none" strokeLinecap="round" />
            <g transform={`translate(${tipX} ${tipY}) rotate(${lf.a * 1.12}) translate(0 ${L * 0.1}) scale(${s})`}>
              {/* Upturned rim (lighter, catching light) around a deeper cupped face. */}
              <path d={leafPath(L)} fill={rim} />
              <g transform={`translate(0 ${-L * 0.07}) scale(0.86)`}>
                <path d={leafPath(L)} fill={tone} />
              </g>
              <path d={`M0 ${-L * 0.12} Q ${L * 0.03} ${-L * 0.5} 0 ${-L * 0.84}`} stroke={shade(tone, -0.25)} strokeWidth={2.2} fill="none" />
              {/* Wet-look gloss: a long sheen and a bright specular spot. */}
              <path d={`M${-L * 0.24} ${-L * 0.3} C ${-L * 0.3} ${-L * 0.5} ${-L * 0.24} ${-L * 0.7} ${-L * 0.1} ${-L * 0.82}`} stroke="#fff" strokeOpacity={0.32} strokeWidth={L * 0.08} fill="none" strokeLinecap="round" />
              <ellipse cx={-L * 0.12} cy={-L * 0.78} rx={L * 0.05} ry={L * 0.03} fill="#fff" opacity={0.6} transform={`rotate(-30 ${-L * 0.12} ${-L * 0.78})`} />
              <path d={leafPath(L)} fill="none" stroke={shade(tone, -0.22)} strokeWidth={1.4} />
            </g>
          </g>
        );
      })}

      <GlazedPot color={c.pot} />
    </g>
  );
};

/** A small bulbous pot in a deep, high-gloss glaze with a rolled lip. */
const GlazedPot: React.FC<{ color: string }> = ({ color }) => (
  <g>
    <path d="M134 400 L266 400 C 280 440 274 486 248 503 Q 242 508 232 508 L168 508 Q 158 508 152 503 C 126 486 120 440 134 400 Z" fill={color} />
    <path d="M136 470 C 170 482 230 482 264 470" stroke={shade(color, -0.2)} strokeWidth={2} fill="none" opacity={0.6} />
    <path d="M262 414 C 272 446 266 478 248 496" stroke="#000" strokeOpacity={0.16} strokeWidth={12} fill="none" strokeLinecap="round" />
    <path d="M148 418 C 140 446 146 474 162 492" stroke="#fff" strokeOpacity={0.4} strokeWidth={8} fill="none" strokeLinecap="round" />
    <ellipse cx={164} cy={428} rx={4} ry={7} fill="#fff" opacity={0.75} transform="rotate(-18 164 428)" />
    <rect x={126} y={388} width={148} height={18} rx={9} fill={shade(color, 0.08)} />
    <rect x={134} y={390} width={110} height={4.5} rx={2.2} fill="#fff" opacity={0.45} />
    <circle cx={252} cy={393} r={2.5} fill="#fff" opacity={0.6} />
  </g>
);

export const drawing: PlantDrawing = { id: "peperomia", Component: Peperomia, anchors: { soil: [200, 390], snip: [304, 325], snipR: 40 } };
