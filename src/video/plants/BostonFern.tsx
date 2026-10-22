import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, type Pt, along, polyline, ramp, spline } from "./kit";

const CX = 200;
const CROWN_Y = 236;

// Fronds: start heading (degrees, -90 = up), length, droop per step and grow delay.
const FRONDS = [
  { a: -100, len: 130, bend: 6, delay: 10 },
  { a: -78, len: 134, bend: 6, delay: 12 },
  { a: -118, len: 170, bend: 14, delay: 8 },
  { a: -60, len: 170, bend: 14, delay: 9 },
  { a: -136, len: 210, bend: 18, delay: 6 },
  { a: -44, len: 206, bend: 18, delay: 7 },
  { a: -150, len: 250, bend: 22, delay: 4 },
  { a: -30, len: 246, bend: 22, delay: 5 },
  { a: -162, len: 270, bend: 22, delay: 2 },
  { a: -18, len: 266, bend: 22, delay: 3 },
  { a: -174, len: 250, bend: 26, delay: 0 },
  { a: -6, len: 246, bend: 26, delay: 1 },
  { a: -168, len: 200, bend: 34, delay: 3 },
  { a: -12, len: 196, bend: 34, delay: 4 },
  { a: -140, len: 160, bend: 36, delay: 13 },
  { a: -40, len: 160, bend: 36, delay: 14 },
  { a: -90, len: 116, bend: 4, delay: 16 },
];

// Shorter fronds rooted at the front of the crown that tumble over the rim.
const FRONT = [
  { a: -176, len: 116, bend: 42, delay: 18, x: 200, y: 240 },
  { a: -4, len: 112, bend: 42, delay: 19, x: 200, y: 240 },
  { a: 104, len: 92, bend: 3, delay: 21, x: 178, y: 238 },
  { a: 76, len: 88, bend: 3, delay: 22, x: 222, y: 238 },
];

const frondPts = (a: number, len: number, bend: number, x0 = CX, y0 = CROWN_Y): Pt[] => {
  const side = Math.cos((a * Math.PI) / 180) < -0.05 ? -1 : Math.cos((a * Math.PI) / 180) > 0.05 ? 1 : 0;
  const n = 6;
  const step = len / n;
  let h = a;
  let x = x0 + side * 10;
  let y = y0;
  const pts: Pt[] = [[x, y]];
  for (let k = 0; k < n; k++) {
    x += Math.cos((h * Math.PI) / 180) * step;
    y += Math.sin((h * Math.PI) / 180) * step;
    pts.push([x, y]);
    h += side * bend * (0.6 + k * 0.2);
  }
  return pts;
};

const PINNA = (L: number) => `M0 0 C -3 -3 -3.4 ${-L * 0.7} 0 ${-L} C 3.4 ${-L * 0.7} 3 -3 0 0 Z`;

export const BostonFern: React.FC<{ c: Ctx }> = ({ c }) => {
  const rachis = shade(c.leaf, -0.32);
  const frond = (f: { a: number; len: number; bend: number; delay: number; x?: number; y?: number }, i: number) => {
        const g = Math.min(1, c.grow(f.delay));
        const pts = frondPts(f.a, f.len, f.bend, f.x, f.y);
        const n = Math.round(f.len / 7);
        const maxP = 15 + f.len * 0.055;
        const pivot = pts[0];
        return (
          <g key={i} transform={`rotate(${c.sway(i, 1.5)} ${pivot[0]} ${pivot[1]})`}>
            <path d={polyline(spline(pts, g, 30))} stroke={rachis} strokeWidth={2.4} fill="none" strokeLinecap="round" />
            {Array.from({ length: n }).map((_, k) => {
              const t = 0.07 + (k / (n - 1)) * 0.92;
              if (t > g) return null;
              const p = along(pts, t);
              const env = Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.12));
              const open = ramp(g - t, 0, 0.15);
              const L = maxP * env * open;
              if (L < 1) return null;
              const tone = shade(c.leaf, (((k + i) % 3) - 1) * 0.06 + (t > 0.85 ? 0.08 : 0));
              return [-1, 1].map((sd) => (
                <g key={`${k}${sd}`} transform={`translate(${p.x} ${p.y}) rotate(${p.angle + 90 + sd * 62})`}>
                  <path d={PINNA(L)} fill={sd > 0 ? tone : shade(tone, -0.06)} />
                </g>
              ));
            })}
            {/* Light midrib catching the light. */}
            <path d={polyline(spline(pts, g * 0.9, 30))} stroke={mix(c.leaf, "#E8F4C8", 0.35)} strokeOpacity={0.5} strokeWidth={1} fill="none" />
          </g>
        );
      };

  return (
    <g>
      <PlantStand />

      {/* Pot on the stand top. */}
      <ellipse cx={CX} cy={CROWN_Y + 2} rx={52} ry={7} fill="#3B2A1E" />
      <path d="M150 244 L250 244 L240 312 Q 238 318 230 318 L170 318 Q 162 318 160 312 Z" fill={c.pot} />
      <path d="M162 254 L170 308" stroke="#fff" strokeOpacity={0.3} strokeWidth={7} strokeLinecap="round" />
      <path d="M238 256 L232 306" stroke="#000" strokeOpacity={0.12} strokeWidth={7} strokeLinecap="round" />
      <rect x={144} y={234} width={112} height={14} rx={6} fill={shade(c.pot, 0.06)} />
      <rect x={150} y={235} width={100} height={4} rx={2} fill="#fff" opacity={0.3} />

      {FRONDS.map(frond)}

      {/* Front fronds spill over the rim and hang down the pot's face. */}
      {FRONT.map((f, i) => frond(f, i + 40))}
    </g>
  );
};

/** A tall turned-wood pedestal: square top, baluster column and three splayed feet. */
const PlantStand: React.FC = () => {
  const wood = "#A8774E";
  const dark = shade(wood, -0.22);
  const light = shade(wood, 0.12);
  return (
    <g>
      {/* Feet. */}
      <path d="M196 470 C 170 482 150 494 132 500 L132 508 L148 508 C 166 498 184 490 200 486 Z" fill={dark} />
      <path d="M204 470 C 230 482 250 494 268 500 L268 508 L252 508 C 234 498 216 490 200 486 Z" fill={dark} />
      <path d="M194 470 L206 470 L206 508 L194 508 Z" fill={wood} />
      {/* Column with turned bulges and rings. */}
      <path d="M190 330 L210 330 L208 360 C 222 372 222 396 208 408 L206 450 C 216 456 216 470 206 476 L194 476 C 184 470 184 456 194 450 L192 408 C 178 396 178 372 192 360 Z" fill={wood} />
      <path d="M194 362 C 186 374 186 394 194 404 M196 412 L196 446" stroke={light} strokeWidth={3} fill="none" strokeLinecap="round" />
      {[[186, 360, 28], [186, 408, 28], [188, 448, 24]].map(([x, y, w], k) => (
        <rect key={k} x={x} y={y - 3} width={w} height={6} rx={3} fill={dark} />
      ))}
      {/* Top: a moulded square table. */}
      <rect x={122} y={318} width={156} height={9} rx={2} fill={light} />
      <rect x={130} y={327} width={140} height={9} rx={2} fill={wood} />
      <rect x={122} y={318} width={156} height={2.5} fill="#fff" opacity={0.25} />
    </g>
  );
};

export const drawing: PlantDrawing = { id: "boston-fern", Component: BostonFern };
