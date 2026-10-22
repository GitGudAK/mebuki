import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, type Pt, polyline } from "./kit";

const X = 200;
const Y = 404;

type Spear = { a: number; L: number; w: number; bend: number; tone: number; delay: number };

// Upright spears in the heart of the rosette, drawn first so the outer ones lap over them.
const BACK: Spear[] = [
  { a: -12, L: 214, w: 57, bend: -0.06, tone: -0.1, delay: 6 },
  { a: 12, L: 222, w: 57, bend: 0.06, tone: -0.08, delay: 4 },
  { a: 0, L: 186, w: 53, bend: 0.02, tone: -0.02, delay: 10 },
];
// Older spears leaning outward, their tips curving gently away.
const FRONT: Spear[] = [
  { a: -46, L: 176, w: 71, bend: -0.2, tone: -0.04, delay: 0 },
  { a: 44, L: 182, w: 71, bend: 0.2, tone: 0.0, delay: 2 },
  { a: -28, L: 198, w: 71, bend: -0.12, tone: 0.04, delay: 3 },
  { a: 26, L: 204, w: 71, bend: 0.12, tone: 0.02, delay: 5 },
  { a: -9, L: 168, w: 64, bend: -0.04, tone: 0.08, delay: 8 },
];
const PUP: Spear[] = [
  { a: -30, L: 62, w: 26, bend: -0.12, tone: 0.02, delay: 24 },
  { a: 30, L: 66, w: 26, bend: 0.12, tone: 0.06, delay: 25 },
  { a: 2, L: 76, w: 26, bend: 0.02, tone: -0.02, delay: 26 },
];

/** Centre line point, unit normal and half width at t along a spear. */
const frame = (L: number, w: number, bend: number, t: number) => {
  const cx = bend * L * t * t;
  const cy = -L * t;
  const tx = 2 * bend * L * t;
  const ty = -L;
  const len = Math.hypot(tx, ty);
  // Fleshy: stays wide most of the way, then rounds off into a blunt-ish point.
  const hw = (w / 2) * Math.pow(1 - t, 0.45) * (t < 0.06 ? 0.9 : 1);
  return { cx, cy, nx: -ty / len, ny: tx / len, hw };
};

const outline = (L: number, w: number, bend: number, scale: number, shift: number) => {
  const N = 20;
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let k = 0; k <= N; k++) {
    const f = frame(L, w, bend, k / N);
    const hw = f.hw * scale;
    const sx = f.nx * f.hw * shift;
    const sy = f.ny * f.hw * shift;
    left.push([f.cx - f.nx * hw + sx, f.cy - f.ny * hw + sy]);
    right.push([f.cx + f.nx * hw + sx, f.cy + f.ny * hw + sy]);
  }
  return `${polyline(left)} ${polyline(right.reverse()).replace("M", "L")} Z`;
};

const SpearShape: React.FC<{ s: Spear; color: string; g: number; i: number }> = ({ s, color, g, i }) => {
  const { L, w, bend } = s;
  const side = shade(color, -0.2);
  const top = mix(color, "#DCE8D8", 0.18);
  const teeth = Array.from({ length: 7 }, (_, j) => {
    const t = 0.18 + j * 0.1;
    const f = frame(L, w, bend, t);
    return [-1, 1].map((v) => ({ x: f.cx + v * f.nx * f.hw, y: f.cy + v * f.ny * f.hw, v, key: `${j}${v}` }));
  }).flat();
  const spots = Array.from({ length: Math.round(L / 18) }, (_, j) => {
    const t = 0.1 + j * (0.68 / Math.round(L / 18));
    const f = frame(L, w, bend, t);
    const off = ((((j + i) * 37) % 10) / 10 - 0.5) * 0.9 * f.hw;
    return { x: f.cx + off, y: f.cy, r: 3 * (1 - t * 0.5) };
  });
  return (
    <g transform={`scale(${0.4 + 0.6 * Math.min(1, g)} ${g})`}>
      {teeth.map((t) => (
        <path key={t.key} d={`M${t.x} ${t.y - 3} l${t.v * 4} -1 l${-t.v * 4} -3 Z`} fill={mix(color, "#F4F2E0", 0.55)} />
      ))}
      {/* Thick in section: the whole blade in a darker side tone, the lit upper face inset on it. */}
      <path d={outline(L, w, bend, 1, 0)} fill={side} />
      <path d={outline(L * 0.98, w, bend, 0.7, -0.18)} fill={top} />
      <path d={outline(L * 0.9, w, bend, 0.16, -0.42)} fill="#fff" opacity={0.18} />
      {spots.map((p, k) => (
        <ellipse key={k} cx={p.x} cy={p.y} rx={p.r * 1.3} ry={p.r * 0.7} fill="#F6F8EE" opacity={0.7} />
      ))}
    </g>
  );
};

export const AloeVera: React.FC<{ c: Ctx }> = ({ c }) => {
  const tone = (s: Spear) => mix(shade(c.leaf, s.tone), "#9DB5A8", 0.3);
  return (
    <g>
      <ellipse cx={X} cy={Y + 4} rx={96} ry={9} fill="#3B2A1E" />

      {BACK.map((s, i) => (
        <g key={`b${i}`} transform={`translate(${X} ${Y}) rotate(${s.a + c.sway(i, 0.8)})`}>
          <SpearShape s={s} color={tone(s)} g={c.grow(s.delay)} i={i} />
        </g>
      ))}

      {FRONT.map((s, i) => (
        <g key={`f${i}`} transform={`translate(${X} ${Y}) rotate(${s.a + c.sway(i + 2, 1)})`}>
          <SpearShape s={s} color={tone(s)} g={c.grow(s.delay)} i={i + 6} />
        </g>
      ))}

      {/* A pup at the side, already making its own little rosette. */}
      {PUP.map((s, i) => (
        <g key={`p${i}`} transform={`translate(${X + 104} ${Y + 6}) rotate(${s.a + c.sway(i + 5, 1)})`}>
          <SpearShape s={s} color={tone(s)} g={c.grow(s.delay)} i={i + 3} />
        </g>
      ))}

      <AzaleaPot color={c.pot} />
    </g>
  );
};

/** A wide, shallow terracotta azalea pot with a thick rolled rim. */
const AzaleaPot: React.FC<{ color: string }> = ({ color }) => (
  <g>
    <path d="M100 430 L300 430 L282 497 Q 279 508 266 508 L134 508 Q 121 508 118 497 Z" fill={color} />
    <path d="M104 438 L296 438" stroke={shade(color, -0.25)} strokeWidth={5} opacity={0.5} />
    <path d="M126 446 C 124 470 128 486 136 498" stroke="#fff" strokeOpacity={0.22} strokeWidth={9} fill="none" strokeLinecap="round" />
    <path d="M284 446 C 282 470 276 486 268 498" stroke="#000" strokeOpacity={0.12} strokeWidth={10} fill="none" strokeLinecap="round" />
    {/* Clay speckle. */}
    {[[160, 470], [214, 488], [246, 460], [184, 452], [262, 484], [148, 492]].map(([x, y], k) => (
      <circle key={k} cx={x} cy={y} r={1.6} fill={shade(color, -0.25)} opacity={0.5} />
    ))}
    <rect x={88} y={406} width={224} height={28} rx={8} fill={shade(color, 0.06)} />
    <rect x={94} y={408} width={212} height={6} rx={3} fill="#fff" opacity={0.25} />
    <rect x={88} y={426} width={224} height={8} rx={4} fill={shade(color, -0.12)} />
  </g>
);

export const drawing: PlantDrawing = { id: "aloe-vera", Component: AloeVera, anchors: { soil: [232, 399], snip: [315, 322], snipR: 30 } };
