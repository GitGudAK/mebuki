import React from "react";
import type { PlantDrawing } from ".";
import { shade } from "../colors";
import { type Ctx, type Pt, along, polyline, spline, taperPath } from "./kit";

const Y = 360;

// Slender bare canes of staggered heights, each topped with a spiky crown.
const CANES = [
  { pts: [[190, Y], [186, 300], [170, 230], [150, 168]] as Pt[], crown: 0.95, d: 4 },
  { pts: [[202, Y], [204, 260], [198, 170], [206, 76]] as Pt[], crown: 1.1, d: 0 },
  { pts: [[212, Y], [218, 320], [236, 270], [256, 232]] as Pt[], crown: 0.82, d: 8 },
];

// Crown leaves: angle from vertical and length; the outer ones droop.
const CROWN = [
  { a: 0, L: 58 }, { a: -14, L: 64 }, { a: 14, L: 62 }, { a: -28, L: 66 }, { a: 28, L: 66 },
  { a: -44, L: 66 }, { a: 44, L: 64 }, { a: -60, L: 62 }, { a: 60, L: 62 }, { a: -78, L: 58 },
  { a: 78, L: 58 }, { a: -96, L: 54 }, { a: 96, L: 54 }, { a: -116, L: 46 }, { a: 116, L: 46 },
  { a: -7, L: 44 }, { a: 8, L: 42 }, { a: -36, L: 46 }, { a: 36, L: 46 },
];

/** A thin strap leaf, bending a touch under its own weight. */
const strap = (L: number, w: number, bend: number) =>
  `M${-w} 0 Q ${-w + bend} ${-L * 0.55} ${bend * 1.6} ${-L} Q ${w + bend} ${-L * 0.55} ${w} 0 Z`;

export const DragonTree: React.FC<{ c: Ctx }> = ({ c }) => {
  const bark = "#A08C76";
  const red = c.accent;
  return (
    <g>
      {CANES.map((cn, i) => {
        const g = c.grow(cn.d);
        const shown = Math.min(1, g);
        if (shown <= 0.01) return null;
        const top = along(cn.pts, shown);
        const line = spline(cn.pts, shown, 30);
        return (
          <g key={i} transform={`rotate(${c.sway(i, 0.6)} ${cn.pts[0][0]} ${Y})`}>
            <path d={taperPath(cn.pts, 11, 7, shown)} fill={bark} />
            {/* Leaf scars: fine rings left by shed leaves. */}
            {line.slice(1, -2).map(([x, y], k) => (
              <path key={k} d={`M${x - 5} ${y} L${x + 5} ${y + 1}`} stroke={shade(bark, -0.28)} strokeWidth={1.2} />
            ))}
            <path d={polyline(line.map(([x, y]) => [x - 2.5, y] as Pt))} stroke="#fff" strokeOpacity={0.2} strokeWidth={2} fill="none" />
            {CROWN.map((lf, k) => {
              const s = c.grow(cn.d + 16 + Math.abs(lf.a) / 12) * cn.crown;
              const tone = shade(c.leaf, k >= 15 ? 0.1 : (k % 3 - 1) * 0.06);
              const bend = Math.sign(lf.a) * Math.min(14, Math.abs(lf.a) / 6);
              return (
                <g key={k} transform={`translate(${top.x} ${top.y + 4}) rotate(${lf.a + c.sway(k + i * 5, 3)}) scale(${s})`}>
                  <path d={strap(lf.L * 1.15, 5, bend)} fill={tone} />
                  {/* Red margins along both edges, as on Dracaena marginata. */}
                  <path d={strap(lf.L * 1.15, 5, bend)} fill="none" stroke={red} strokeWidth={1.3} />
                  <path d={`M0 -4 Q ${bend * 0.5} ${-lf.L * 0.6} ${bend * 1.6} ${-lf.L * 1.1}`} stroke={shade(tone, 0.25)} strokeWidth={1} fill="none" />
                </g>
              );
            })}
          </g>
        );
      })}
      <SlimPlanter color={c.pot} />
    </g>
  );
};

/** A tall, slim, slightly tapered white planter with fine horizontal ridges. */
const SlimPlanter: React.FC<{ color: string }> = ({ color }) => (
  <g>
    <path d="M162 362 L238 362 L230 500 Q 229 508 221 508 L179 508 Q 171 508 170 500 Z" fill={color} />
    {[392, 424, 456, 488].map((y) => (
      <path key={y} d={`M${163 + (y - 362) * 0.058} ${y} L${237 - (y - 362) * 0.058} ${y}`} stroke={shade(color, -0.1)} strokeWidth={1.5} />
    ))}
    <path d="M176 372 L182 496" stroke="#fff" strokeOpacity={0.5} strokeWidth={6} strokeLinecap="round" />
    <path d="M228 372 L222 496" stroke="#000" strokeOpacity={0.1} strokeWidth={10} strokeLinecap="round" />
    <rect x={158} y={352} width={84} height={12} rx={4} fill={shade(color, 0.3)} />
    <rect x={158} y={361} width={84} height={3} fill="#000" opacity={0.08} />
  </g>
);

export const drawing: PlantDrawing = { id: "dragon-tree", Component: DragonTree };
