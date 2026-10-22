import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import type { Ctx } from "./kit";

const FLOOR = 492;
const WATER = 384;

// Straight cut canes of staggered heights, standing in pebbles.
const CANES = [
  { x: 170, top: 150, delay: 6 },
  { x: 186, top: 84, delay: 2 },
  { x: 203, top: 44, delay: 0 },
  { x: 220, top: 104, delay: 4 },
  { x: 236, top: 176, delay: 8 },
];
const CANE_W = 13;
const NODE_GAP = 54;

// Leaves sprout from the top node of each cane (and a side shoot on two of them).
const LEAF = "M0 0 C -9 -16 -11 -54 2 -80 C 12 -52 9 -16 0 0 Z";
const TUFT = [
  { a: -58, s: 0.9 },
  { a: -18, s: 1.05 },
  { a: 26, s: 1.0 },
  { a: 64, s: 0.85 },
];

export const LuckyBamboo: React.FC<{ c: Ctx }> = ({ c }) => {
  const cane = mix(c.leaf, "#E2E58C", 0.42);
  const ring = shade(cane, -0.28);
  const glass = c.pot;
  return (
    <g>
      {/* Back of the glass vase. */}
      <path d="M138 304 L138 494 Q 138 508 152 508 L248 508 Q 262 508 262 494 L262 304 Z" fill={glass} opacity={0.14} />
      <ellipse cx={200} cy={304} rx={62} ry={9} fill="none" stroke={glass} strokeOpacity={0.45} strokeWidth={2} />

      {CANES.map((cn, i) => {
        const g = c.grow(cn.delay);
        const top = FLOOR - (FLOOR - cn.top) * Math.min(1, g);
        const h = FLOOR - top;
        const nodes = Math.floor(h / NODE_GAP);
        const lean = c.sway(i, 0.6);
        return (
          <g key={i} transform={`rotate(${lean} ${cn.x} ${FLOOR})`}>
            <rect x={cn.x - CANE_W / 2} y={top} width={CANE_W} height={h} rx={3} fill={cane} />
            <rect x={cn.x - CANE_W / 2 + 2} y={top + 4} width={3.5} height={Math.max(0, h - 8)} rx={1.5} fill="#fff" opacity={0.28} />
            {Array.from({ length: nodes }).map((_, k) => {
              const y = FLOOR - (k + 1) * NODE_GAP + (i % 2) * 18;
              return y > top + 8 ? (
                <g key={k}>
                  <rect x={cn.x - CANE_W / 2 - 1} y={y} width={CANE_W + 2} height={4} rx={2} fill={ring} />
                  <rect x={cn.x - CANE_W / 2} y={y + 4} width={CANE_W} height={2} fill="#fff" opacity={0.25} />
                </g>
              ) : null;
            })}
            {/* Cut top. */}
            <ellipse cx={cn.x} cy={top} rx={CANE_W / 2} ry={2.6} fill={shade(cane, 0.12)} />
            {TUFT.map((t, k) => {
              const s = c.grow(cn.delay + 18 + k * 3) * t.s;
              return (
                <g key={k} transform={`translate(${cn.x} ${top + 14}) rotate(${t.a + c.sway(i * 4 + k, 5)}) scale(${s})`}>
                  <path d={LEAF} fill={shade(c.leaf, (k % 2 ? -0.06 : 0.04))} />
                  <path d="M0 -4 L1 -72" stroke={shade(c.leaf, 0.2)} strokeWidth={1.8} />
                </g>
              );
            })}
            {i % 2 === 1 &&
              [-1, 1].map((side) => {
                const s = c.grow(cn.delay + 30) * 0.7;
                return (
                  <g key={side} transform={`translate(${cn.x} ${top + 70}) rotate(${side * 52 + (i === 3 ? 10 : -10) + c.sway(i + side, 4)}) scale(${s})`}>
                    <path d={LEAF} fill={shade(c.leaf, -0.04)} />
                  </g>
                );
              })}
          </g>
        );
      })}

      {/* Gold ribbon tying the bundle, as lucky bamboo is sold. */}
      <g opacity={c.grow(20)}>
        <rect x={160} y={318} width={86} height={11} rx={3} fill={c.accent} />
        <rect x={160} y={319} width={86} height={3} fill="#fff" opacity={0.35} />
        <path d="M203 323 C 190 304 176 312 186 324 C 176 336 190 342 203 323 Z" fill={shade(c.accent, -0.08)} />
        <path d="M203 323 C 216 304 230 312 220 324 C 230 336 216 342 203 323 Z" fill={shade(c.accent, -0.08)} />
        <path d="M200 326 L188 356 M206 326 L214 358" stroke={shade(c.accent, -0.12)} strokeWidth={5} strokeLinecap="round" />
        <circle cx={203} cy={323} r={5} fill={shade(c.accent, -0.2)} />
      </g>

      {/* Water, pebbles and the front of the glass. */}
      <path d={`M140 ${WATER} L140 494 Q 140 506 152 506 L248 506 Q 260 506 260 494 L260 ${WATER} Z`} fill={mix(glass, "#7FC4C8", 0.4)} opacity={0.32} />
      <ellipse cx={200} cy={WATER} rx={60} ry={6} fill="#fff" opacity={0.22} />
      {[
        [154, 496, 13], [176, 498, 11], [198, 497, 14], [222, 498, 12], [244, 496, 12],
        [164, 484, 10], [188, 486, 12], [212, 485, 11], [236, 484, 10], [200, 476, 9], [176, 474, 8], [224, 474, 8],
      ].map(([x, y, r], k) => (
        <ellipse key={k} cx={x} cy={y} rx={r} ry={r * 0.72} fill={["#D9D2C3", "#A9A196", "#C4B9A6", "#8E877D"][k % 4]} />
      ))}
      <path d="M138 304 L138 494 Q 138 508 152 508 L248 508 Q 262 508 262 494 L262 304" fill="none" stroke={glass} strokeOpacity={0.7} strokeWidth={3} />
      <path d="M152 318 L152 490" stroke="#fff" strokeOpacity={0.4} strokeWidth={7} strokeLinecap="round" />
      <path d="M248 330 L248 420" stroke="#fff" strokeOpacity={0.18} strokeWidth={4} strokeLinecap="round" />
      <ellipse cx={200} cy={304} rx={62} ry={9} fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={2} />
    </g>
  );
};

export const drawing: PlantDrawing = { id: "lucky-bamboo", Component: LuckyBamboo, anchors: { soil: [200, 384], snip: [267, 175], snipR: 32 } };
