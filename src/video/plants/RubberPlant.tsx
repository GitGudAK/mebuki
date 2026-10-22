import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, type Pt, along, taperPath } from "./kit";

const STEM: Pt[] = [[200, 404], [197, 340], [203, 270], [199, 200], [201, 136]];

// Alternate leaves up the stem: t along it, angle from vertical, blade length.
const LEAVES = [
  { t: 0.1, a: -84, L: 118 },
  { t: 0.2, a: 80, L: 124 },
  { t: 0.32, a: -70, L: 122 },
  { t: 0.43, a: 66, L: 116 },
  { t: 0.55, a: -54, L: 108 },
  { t: 0.66, a: 48, L: 98 },
  { t: 0.77, a: -36, L: 86 },
  { t: 0.87, a: 28, L: 72 },
  { t: 0.94, a: -14, L: 54 },
];

/** Thick oval blade with a short drip tip. */
const oval = (L: number) => {
  const w = L * 0.42;
  return `M0 0 C ${-w * 0.9} ${-L * 0.06} ${-w * 1.1} ${-L * 0.6} ${-w * 0.4} ${-L * 0.9} Q ${-w * 0.12} ${-L * 0.98} 0 ${-L} Q ${w * 0.12} ${-L * 0.98} ${w * 0.4} ${-L * 0.9} C ${w * 1.1} ${-L * 0.6} ${w * 0.9} ${-L * 0.06} 0 0 Z`;
};

export const RubberPlant: React.FC<{ c: Ctx }> = ({ c }) => {
  const g = c.grow(0);
  const stem = mix(shade(c.leaf, -0.1), "#6B4A3A", 0.4);
  const leaf = shade(c.leaf, -0.08);
  const rib = mix(c.leaf, "#E9D9B4", 0.55);
  const sheath = c.accent;
  const top = along(STEM, Math.min(1, g));
  return (
    <g>
      <g transform={`rotate(${c.sway(1, 0.5)} 200 404)`}>
        <path d={taperPath(STEM, 13, 6, Math.min(1, g))} fill={stem} />
        {LEAVES.map((lf, i) => {
          const s = c.grow(6 + i * 2.5);
          if (s <= 0.01) return null;
          const p = along(STEM, lf.t);
          const L = lf.L;
          const color = shade(leaf, (i % 2 ? -0.05 : 0.03));
          return (
            <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${lf.a + c.sway(i + 3, 1.6)}) scale(${s})`}>
              <path d="M0 0 L0 -12" stroke={stem} strokeWidth={4} strokeLinecap="round" />
              <g transform={`translate(0 -10) rotate(${Math.sign(lf.a) * 6})`}>
                <path d={oval(L)} fill={color} />
                {/* Half the blade in shadow, the other catching light: a waxy, thick leaf. */}
                <path d={`M0 0 C ${L * 0.33} ${-L * 0.06} ${L * 0.4} ${-L * 0.6} ${L * 0.14} ${-L * 0.9} Q ${L * 0.04} ${-L * 0.98} 0 ${-L} Z`} fill="#000" opacity={0.14} />
                <path d={`M0 0 L0 ${-L * 0.96}`} stroke={rib} strokeWidth={2.4} strokeLinecap="round" />
                {[0.25, 0.4, 0.55, 0.7].map((t) =>
                  [-1, 1].map((v) => (
                    <path key={`${t}${v}`} d={`M0 ${-L * t} L${v * L * 0.26} ${-L * (t + 0.1)}`} stroke={shade(color, -0.2)} strokeWidth={1} opacity={0.7} />
                  )),
                )}
                <path
                  d={`M${-L * 0.12} ${-L * 0.18} C ${-L * 0.26} ${-L * 0.38} ${-L * 0.24} ${-L * 0.6} ${-L * 0.12} ${-L * 0.78}`}
                  stroke="#fff"
                  strokeOpacity={0.32}
                  strokeWidth={5}
                  fill="none"
                  strokeLinecap="round"
                />
              </g>
            </g>
          );
        })}
        {/* The new leaf, rolled inside its red-pink sheath at the growing tip. */}
        {(() => {
          const s = c.grow(34);
          return (
            <g transform={`translate(${top.x} ${top.y + 4}) rotate(${4 + c.sway(9, 2)}) scale(${s})`}>
              <path d="M0 0 C -8 -10 -7 -34 0 -50 C 7 -34 8 -10 0 0 Z" fill={sheath} />
              <path d="M-2 -6 C -4 -18 -3 -32 0 -44" stroke="#fff" strokeOpacity={0.4} strokeWidth={2} fill="none" strokeLinecap="round" />
              <path d="M0 0 C 5 -8 6 -20 3 -30" stroke={shade(sheath, -0.25)} strokeWidth={1.4} fill="none" />
            </g>
          );
        })()}
      </g>
      <GlossyCylinder color={c.pot} />
    </g>
  );
};

/** A high-gloss white cylinder with a crisp reflection. */
const GlossyCylinder: React.FC<{ color: string }> = ({ color }) => (
  <g>
    <path d="M140 404 L260 404 L260 494 Q 260 508 246 508 L154 508 Q 140 508 140 494 Z" fill={color} />
    <path d="M232 412 L232 500" stroke="#000" strokeOpacity={0.07} strokeWidth={22} />
    <path d="M250 414 L250 494" stroke="#000" strokeOpacity={0.1} strokeWidth={10} strokeLinecap="round" />
    <path d="M158 414 L158 494" stroke="#fff" strokeOpacity={0.85} strokeWidth={8} strokeLinecap="round" />
    <path d="M172 418 L172 470" stroke="#fff" strokeOpacity={0.55} strokeWidth={3} strokeLinecap="round" />
    <rect x={136} y={396} width={128} height={12} rx={6} fill={shade(color, 0.3)} />
    <rect x={136} y={405} width={128} height={3} fill="#000" opacity={0.08} />
  </g>
);

export const drawing: PlantDrawing = { id: "rubber-plant", Component: RubberPlant };
