import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, type Pt, along, taperPath } from "./kit";

const SOIL_Y = 414;

// Five stiff, upright wands fanning slightly: base x, lean (deg from vertical), length, delay; young = new growth.
const WANDS = [
  { x: 172, lean: -32, L: 206, d: 8 },
  { x: 230, lean: 33, L: 218, d: 10 },
  { x: 186, lean: -14, L: 282, d: 2 },
  { x: 216, lean: 15, L: 256, d: 4, young: true },
  { x: 201, lean: 1, L: 322, d: 0 },
];

// Thick, waxy oval leaflet with a short point.
const LEAFLET = "M0 0 C -15 -6 -17 -36 -2 -54 L0 -57 L2 -54 C 17 -36 15 -6 0 0 Z";
const PAIRS = [0.38, 0.56, 0.74, 0.9];

export const ZZPlant: React.FC<{ c: Ctx }> = ({ c }) => {
  return (
    <g>
      {WANDS.map((wd, i) => {
        const g = c.grow(wd.d);
        const shown = Math.min(1, g);
        if (shown <= 0.01) return null;
        const rad = (wd.lean * Math.PI) / 180;
        const dx = Math.sin(rad);
        const dy = -Math.cos(rad);
        // Nearly straight, with the faintest outward bow.
        const pts: Pt[] = [0, 0.35, 0.7, 1].map((u) => [
          wd.x + dx * wd.L * u + dx * 6 * Math.sin(u * Math.PI),
          SOIL_Y + dy * wd.L * u,
        ]);
        const base = wd.young ? mix(c.leaf, c.accent, 0.4) : shade(c.leaf, -0.18);
        const rachis = shade(c.leaf, -0.28);
        const bulb = Math.min(1, shown * 2.5);
        return (
          <g key={i} transform={`rotate(${c.sway(i, 0.6)} ${wd.x} ${SOIL_Y})`}>
            <path d={taperPath(pts, 9, 4, shown)} fill={rachis} />
            {/* Swollen, water-storing base, like a fat bulb at the soil line. */}
            <g transform={`translate(${wd.x + dx * 12} ${SOIL_Y - 18}) rotate(${wd.lean * 0.7}) scale(${bulb * 1.15})`}>
              <path d="M0 16 C -17 16 -19 -4 -13 -16 C -9 -26 -5 -32 0 -40 C 5 -32 9 -26 13 -16 C 19 -4 17 16 0 16 Z" fill={shade(c.leaf, -0.1)} />
              <path d="M-8 6 C -10 -2 -8 -10 -4 -16" stroke="#fff" strokeOpacity={0.3} strokeWidth={3} fill="none" strokeLinecap="round" />
            </g>
            {PAIRS.map((t, k) => {
              if (t > shown) return null;
              const p = along(pts, t);
              const s = c.grow(wd.d + 12 + k * 3) * (1.28 - t * 0.38);
              return [-1, 1].map((side) => {
                const tone = shade(base, side > 0 ? -0.08 : 0.02);
                return (
                  <g key={`${k}${side}`} transform={`translate(${p.x} ${p.y}) rotate(${wd.lean + side * 34 + c.sway(k + i * 3, 1.5)}) scale(${s})`}>
                    <path d={LEAFLET} fill={tone} />
                    <path d="M0 -4 L0 -50" stroke={shade(tone, -0.25)} strokeWidth={1.2} />
                    {/* Waxy specular shine. */}
                    <ellipse cx={-5} cy={-28} rx={3.4} ry={14} fill="#fff" opacity={0.42} transform="rotate(8 -5 -28)" />
                    <circle cx={-6} cy={-44} r={2} fill="#fff" opacity={0.6} />
                  </g>
                );
              });
            })}
            {shown > 0.97 &&
              (() => {
                const p = along(pts, 1);
                const s = c.grow(wd.d + 26) * 1.0;
                return (
                  <g transform={`translate(${p.x} ${p.y}) rotate(${wd.lean}) scale(${s})`}>
                    <path d={LEAFLET} fill={base} />
                    <ellipse cx={-5} cy={-28} rx={3.4} ry={14} fill="#fff" opacity={0.42} />
                  </g>
                );
              })()}
          </g>
        );
      })}
      <SquareConcrete color={c.pot} />
    </g>
  );
};

/** A square concrete box seen slightly from above and to the left. */
const SquareConcrete: React.FC<{ color: string }> = ({ color }) => (
  <g>
    {/* Right side face. */}
    <path d="M258 420 L276 406 L276 494 L258 508 Z" fill={shade(color, -0.2)} />
    {/* Front face. */}
    <rect x={130} y={420} width={128} height={88} fill={color} />
    {/* Top rim with soil inset. */}
    <path d="M130 420 L258 420 L276 406 L148 406 Z" fill={shade(color, 0.14)} />
    <path d="M142 416 L252 416 L264 409 L154 409 Z" fill="#4A3527" />
    {[[146, 440], [170, 470], [214, 452], [240, 488], [196, 492], [156, 498], [226, 432], [186, 446]].map(([x, y], k) => (
      <circle key={k} cx={x} cy={y} r={k % 2 ? 1.3 : 1.8} fill={shade(color, -0.28)} />
    ))}
    <path d="M131 421 L131 507" stroke="#fff" strokeOpacity={0.3} strokeWidth={3} />
    <path d="M142 430 L142 498" stroke="#fff" strokeOpacity={0.14} strokeWidth={8} strokeLinecap="round" />
    <path d="M130 420 L258 420" stroke="#fff" strokeOpacity={0.35} strokeWidth={2} />
  </g>
);

export const drawing: PlantDrawing = { id: "zz-plant", Component: ZZPlant };
