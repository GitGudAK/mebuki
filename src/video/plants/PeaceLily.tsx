import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, leafTone, qbez, ramp } from "./kit";

const X = 200;
const Y = 352;

// Glossy lance leaves on long stalks, arching out from the clump.
const LEAVES = [
  { a: -80, l: 70, blade: 112 },
  { a: 78, l: 72, blade: 110 },
  { a: -62, l: 96, blade: 128 },
  { a: 60, l: 92, blade: 126 },
  { a: -44, l: 116, blade: 140 },
  { a: 42, l: 112, blade: 138 },
  { a: -26, l: 132, blade: 146 },
  { a: 24, l: 128, blade: 144 },
  { a: -10, l: 142, blade: 140 },
  { a: 8, l: 138, blade: 136 },
];

// White hooded spathes on bare stalks, standing above the leaves.
const SPATHES = [
  { a: -9, h: 205, tilt: -14, s: 0.8, delay: 26 },
  { a: 8, h: 228, tilt: 12, s: 0.86, delay: 32 },
  { a: 1, h: 180, tilt: -4, s: 0.72, delay: 38 },
];
const blade = (L: number) => {
  const w = L * 0.22;
  return `M0 0 C ${-w} ${-L * 0.18} ${-w * 1.05} ${-L * 0.62} 0 ${-L} C ${w * 1.05} ${-L * 0.62} ${w} ${-L * 0.18} 0 0 Z`;
};

const SPATHE = "M0 0 C -34 -12 -40 -70 -6 -112 L0 -122 L6 -112 C 40 -70 34 -12 0 0 Z";

export const PeaceLily: React.FC<{ c: Ctx }> = ({ c }) => {
  const white = c.accent;
  return (
    <g>
      <ellipse cx={X} cy={Y - 4} rx={84} ry={12} fill="#3B2A1E" />

      {LEAVES.map((lf, i) => {
        const g = c.grow(Math.abs(lf.a) / 10);
        const side = Math.sign(lf.a) || 1;
        const p0 = [0, 0];
        const p1 = [0, -lf.l * 0.75];
        const p2 = [side * lf.l * 0.16, -lf.l];
        const shown = Math.min(1, g);
        const stalk = Array.from({ length: 13 }, (_, k) => qbez(p0, p1, p2, (k / 12) * shown));
        const tip = stalk[stalk.length - 1];
        const color = leafTone(c.leaf, i);
        const L = lf.blade * ramp(g, 0.35, 1);
        return (
          <g key={i} transform={`translate(${X} ${Y}) rotate(${lf.a * 0.42 + c.sway(i, 1.6)})`}>
            <path
              d={stalk.map((p, k) => `${k ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")}
              stroke={shade(c.leaf, -0.3)}
              strokeWidth={5}
              fill="none"
              strokeLinecap="round"
            />
            {/* The blade droops a little past the line of its stalk. */}
            <g transform={`translate(${tip.x} ${tip.y}) rotate(${tip.angle + 90 + side * 8})`}>
              <path d={blade(L)} fill={color} />
              <path d={`M0 0 L0 ${-L * 0.96}`} stroke={shade(color, -0.22)} strokeWidth={3} />
              {[0.22, 0.4, 0.58, 0.76].map((t) =>
                [-1, 1].map((v) => (
                  <path
                    key={`${t}${v}`}
                    d={`M0 ${-L * t} Q ${v * L * 0.1} ${-L * (t + 0.04)} ${v * L * 0.17} ${-L * (t + 0.11)}`}
                    stroke={shade(color, -0.18)}
                    strokeWidth={1.6}
                    fill="none"
                  />
                )),
              )}
              <path
                d={`M${-L * 0.1} ${-L * 0.2} C ${-L * 0.17} ${-L * 0.4} ${-L * 0.15} ${-L * 0.6} ${-L * 0.06} ${-L * 0.8}`}
                stroke="#fff"
                strokeOpacity={0.22}
                strokeWidth={5}
                fill="none"
                strokeLinecap="round"
              />
            </g>
          </g>
        );
      })}

      {SPATHES.map((sp, i) => {
        const g = c.grow(sp.delay);
        const h = sp.h * Math.min(1, g);
        const open = ramp(g, 0.5, 1.02);
        return (
          <g key={i} transform={`translate(${X} ${Y}) rotate(${sp.a + c.sway(i + 9, 1.2)})`}>
            <path d={`M0 0 Q ${sp.a * 0.6} ${-h * 0.5} 0 ${-h}`} stroke={shade(c.leaf, -0.12)} strokeWidth={4.5} fill="none" strokeLinecap="round" />
            <g transform={`translate(0 ${-h}) rotate(${sp.tilt}) scale(${open * sp.s * 0.92} ${open * sp.s})`}>
              <path d={SPATHE} fill={white} />
              <path d={SPATHE} fill="none" stroke={shade(white, -0.16)} strokeWidth={2.5} />
              {/* A green blush at the base and down the keel, as real spathes have. */}
              <path d="M0 0 C -14 -6 -16 -22 -8 -34 L0 -40 L8 -34 C 16 -22 14 -6 0 0 Z" fill={mix(white, c.leaf, 0.35)} opacity={0.7} />
              <path d="M0 -4 L0 -114" stroke={mix(white, c.leaf, 0.3)} strokeWidth={2.5} opacity={0.6} />
              {/* The spadix: a cream club standing in the hood. */}
              <rect x={4} y={-70} width={11} height={44} rx={5.5} fill="#F1DE8C" transform="rotate(8)" />
              <rect x={6} y={-68} width={4} height={38} rx={2} fill="#fff" opacity={0.35} transform="rotate(8)" />
            </g>
          </g>
        );
      })}

      <CeramicPlanter color={c.pot} />
    </g>
  );
};

/** A rounded glazed planter with a thin rim, not the terracotta flowerpot. */
const CeramicPlanter: React.FC<{ color: string }> = ({ color }) => (
  <g>
    <path
      d="M116 352 L284 352 C 294 410 288 468 266 498 Q 259 508 246 508 L154 508 Q 141 508 134 498 C 112 468 106 410 116 352 Z"
      fill={color}
    />
    <path d="M118 400 C 160 410 240 410 282 400" stroke={shade(color, -0.12)} strokeWidth={3} fill="none" />
    <path d="M140 372 C 132 420 138 462 156 488" stroke="#fff" strokeOpacity={0.28} strokeWidth={10} fill="none" strokeLinecap="round" />
    <path d="M270 382 C 274 430 268 462 256 484" stroke="#000" strokeOpacity={0.12} strokeWidth={12} fill="none" strokeLinecap="round" />
    <rect x={110} y={340} width={180} height={18} rx={9} fill={shade(color, 0.06)} />
    <rect x={116} y={341} width={168} height={5} rx={2.5} fill="#fff" opacity={0.3} />
  </g>
);

export const drawing: PlantDrawing = { id: "peace-lily", Component: PeaceLily, anchors: { soil: [228, 338], snip: [250, 77], snipR: 50 } };
