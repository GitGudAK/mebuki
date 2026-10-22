import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import type { Ctx } from "./kit";

const X = 200;
const Y = 390;

/** A round, quilted leaf on a short stalk, pointing up from the origin. */
const Leaf: React.FC<{ color: string; L: number }> = ({ color, L }) => {
  const p = L * 0.3;
  const r = L * 0.36;
  const cy = -(p + r);
  const vein = shade(color, -0.2);
  return (
    <g>
      <path d={`M0 0 L0 ${-p - 4}`} stroke={shade(color, -0.1)} strokeWidth={L * 0.07} strokeLinecap="round" />
      <path
        d={`M0 ${-p} C ${-r * 1.15} ${-p + r * 0.05} ${-r * 1.15} ${cy - r * 1.05} 0 ${cy - r * 1.02} C ${r * 1.15} ${cy - r * 1.05} ${r * 1.15} ${-p + r * 0.05} 0 ${-p} Z`}
        fill={color}
      />
      <path d={`M0 ${-p} L0 ${cy - r * 0.8}`} stroke={vein} strokeWidth={2} />
      {[0.25, 0.55, 0.85].map((t) =>
        [-1, 1].map((v) => (
          <path key={`${t}${v}`} d={`M0 ${-p - r * 2 * t * 0.8} q ${v * r * 0.35} ${-r * 0.05} ${v * r * 0.7} ${-r * 0.35}`} stroke={vein} strokeWidth={1.4} fill="none" opacity={0.8} />
        )),
      )}
      {/* Velvety hairs catch the light around the margin. */}
      <path
        d={`M0 ${-p} C ${-r * 1.15} ${-p + r * 0.05} ${-r * 1.15} ${cy - r * 1.05} 0 ${cy - r * 1.02} C ${r * 1.15} ${cy - r * 1.05} ${r * 1.15} ${-p + r * 0.05} 0 ${-p} Z`}
        fill="none"
        stroke={mix(color, "#E8F0D8", 0.5)}
        strokeWidth={2}
        strokeDasharray="1.5 2.5"
        opacity={0.8}
      />
      <ellipse cx={-r * 0.35} cy={cy - r * 0.2} rx={r * 0.25} ry={r * 0.45} fill="#fff" opacity={0.1} />
    </g>
  );
};

// Outer ring lies flat and drapes over the rim; inner ring cups upward.
const OUTER = [180, 150, 210, 120, 240, 90, 270, 60, 300, 30, 330, 0].map((a, i) => ({ a, i }));
const INNER = [160, 200, 120, 240, 80, 280, 40, 320].map((a, i) => ({ a, i }));

const FLOWERS = [
  { x: -36, y: -50, r: -14, s: 0.95 },
  { x: 34, y: -54, r: 12, s: 0.95 },
  { x: -2, y: -72, r: 0, s: 1 },
  { x: -54, y: -26, r: -26, s: 0.85 },
  { x: 54, y: -28, r: 24, s: 0.85 },
  { x: -18, y: -36, r: -6, s: 0.9 },
  { x: 20, y: -32, r: 8, s: 0.9 },
];

const Bloom: React.FC<{ color: string }> = ({ color }) => (
  <g>
    {[-90, -18, 54, 126, 198].map((a, k) => {
      const big = k > 0 && k < 4;
      const d = big ? 10 : 8;
      const rad = (a * Math.PI) / 180;
      return (
        <g key={a}>
          <circle cx={Math.cos(rad) * d} cy={Math.sin(rad) * d} r={big ? 10.5 : 9} fill={k % 2 ? shade(color, -0.06) : color} />
        </g>
      );
    })}
    <circle r={6} fill={shade(color, -0.25)} opacity={0.6} />
    <ellipse cx={-2.2} cy={0} rx={2.4} ry={3.4} fill="#F7D23E" />
    <ellipse cx={2.2} cy={0} rx={2.4} ry={3.4} fill="#F7D23E" />
  </g>
);

export const AfricanViolet: React.FC<{ c: Ctx }> = ({ c }) => {
  const order = (a: number) => -Math.cos((a * Math.PI) / 180); // back (up) first
  return (
    <g>
      <SelfWateringPot color={c.pot} />
      <ellipse cx={X} cy={Y + 4} rx={66} ry={8} fill="#3B2A1E" />

      <g transform={`translate(${X} ${Y}) scale(1 0.52)`}>
        {[...OUTER].sort((p, q) => order(q.a) - order(p.a)).map(({ a, i }) => (
          <g key={a} transform={`rotate(${a + c.sway(i, 1.2)}) scale(${c.grow(i * 1.5)})`}>
            <Leaf color={shade(c.leaf, ((i % 3) - 1) * 0.06 - 0.04)} L={128} />
          </g>
        ))}
      </g>
      <g transform={`translate(${X} ${Y - 6}) scale(1 0.72)`}>
        {[...INNER].sort((p, q) => order(q.a) - order(p.a)).map(({ a, i }) => (
          <g key={a} transform={`rotate(${a + c.sway(i + 4, 1.5)}) scale(${c.grow(12 + i * 1.5)})`}>
            <Leaf color={shade(c.leaf, ((i % 3) - 1) * 0.06 + 0.06)} L={86} />
          </g>
        ))}
      </g>

      {FLOWERS.map((f, i) => {
        const s = c.grow(34 + i * 3);
        return (
          <g key={i}>
            <path d={`M${X} ${Y - 10} Q ${X + f.x * 0.3} ${Y - 30} ${X + f.x * s} ${Y - 10 + f.y * s}`} stroke={shade(c.leaf, -0.2)} strokeWidth={2.5} fill="none" />
            <g transform={`translate(${X + f.x * s} ${Y - 10 + f.y * s}) rotate(${f.r + c.sway(i + 9, 3)}) scale(${s * f.s * 1.15})`}>
              <Bloom color={c.accent} />
            </g>
          </g>
        );
      })}
    </g>
  );
};

/** Glazed outer reservoir with an unglazed terracotta inner pot sitting in it. */
const SelfWateringPot: React.FC<{ color: string }> = ({ color }) => {
  const clay = "#C8774E";
  return (
    <g>
      <rect x={132} y={386} width={136} height={30} rx={4} fill={clay} />
      <rect x={132} y={386} width={136} height={6} rx={3} fill="#fff" opacity={0.18} />
      <path d="M150 396 L150 414 M250 396 L250 414" stroke={shade(clay, -0.2)} strokeWidth={3} opacity={0.5} />
      <path d="M116 424 L284 424 C 288 466 280 496 262 505 Q 256 508 248 508 L152 508 Q 144 508 138 505 C 120 496 112 466 116 424 Z" fill={color} />
      <path d="M134 440 C 128 468 134 488 148 500" stroke="#fff" strokeOpacity={0.35} strokeWidth={9} fill="none" strokeLinecap="round" />
      <path d="M270 444 C 272 468 266 488 252 500" stroke="#000" strokeOpacity={0.1} strokeWidth={10} fill="none" strokeLinecap="round" />
      {/* Water-level window. */}
      <rect x={232} y={452} width={14} height={36} rx={7} fill={shade(color, -0.25)} />
      <rect x={235} y={470} width={8} height={15} rx={4} fill="#8FC7E8" />
      <rect x={108} y={410} width={184} height={18} rx={9} fill={shade(color, 0.08)} />
      <rect x={116} y={411} width={168} height={5} rx={2.5} fill="#fff" opacity={0.4} />
    </g>
  );
};

export const drawing: PlantDrawing = { id: "african-violet", Component: AfricanViolet };
