import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, type Pt, taperPath } from "./kit";

const GX = 200;
const GY = 334;
const R = 162;
const BASE: Pt = [200, 440];

// Thick silvery leaves that start upright and curl outward, Tillandsia ionantha style.
const LEAVES = [
  { a: -80, L: 96, curl: -0.8 }, { a: 80, L: 98, curl: 0.8 },
  { a: -62, L: 124, curl: -0.95 }, { a: 62, L: 126, curl: 0.95 },
  { a: -44, L: 138, curl: -0.95 }, { a: 46, L: 136, curl: 0.95 },
  { a: -26, L: 136, curl: -0.75 }, { a: 28, L: 140, curl: 0.75 },
  { a: -12, L: 118, curl: -0.55 }, { a: 14, L: 120, curl: 0.55 },
  { a: -3, L: 92, curl: -0.35 }, { a: 5, L: 88, curl: 0.4 },
];

/** Points along a leaf whose heading turns steadily by `curl` radians over its length. */
const curlPts = (a: number, L: number, curl: number): Pt[] => {
  const pts: Pt[] = [BASE];
  let h = (a * Math.PI) / 180;
  let [x, y] = BASE;
  const n = 6;
  for (let k = 0; k < n; k++) {
    h += curl / n;
    x += Math.sin(h) * (L / n);
    y -= Math.cos(h) * (L / n);
    pts.push([x, y]);
  }
  return pts;
};

export const AirPlant: React.FC<{ c: Ctx }> = ({ c }) => {
  const glass = c.pot;
  const silver = mix(c.leaf, "#EEF2EC", 0.5);
  const blush = "#E07C98";
  const clip = `${c.id}-globe`;
  const swing = c.sway(0, 1.2);
  const cordEnd = GY - R - 10;
  return (
    <g transform={`rotate(${swing} 200 10)`}>
      {/* Jute cord down from the ceiling hook. */}
      <path d={`M200 10 L200 ${cordEnd}`} stroke="#9A7E5C" strokeWidth={5} />
      {Array.from({ length: 13 }, (_, k) => (
        <path key={k} d={`M197 ${16 + k * 12} l6 5`} stroke={shade("#9A7E5C", -0.3)} strokeWidth={1.6} />
      ))}
      <ellipse cx={200} cy={cordEnd + 2} rx={10} ry={7} fill="none" stroke="#9A7E5C" strokeWidth={4.5} />

      {/* Back of the globe. */}
      <defs>
        <clipPath id={clip}>
          <circle cx={GX} cy={GY} r={R - 3} />
        </clipPath>
      </defs>
      <circle cx={GX} cy={GY} r={R} fill={glass} opacity={0.2} />
      <rect x={188} y={GY - R - 8} width={24} height={12} rx={3} fill={glass} opacity={0.8} />

      {/* A bed of white pebbles in the bottom of the bowl. */}
      <g clipPath={`url(#${clip})`}>
        <rect x={GX - R} y={BASE[1]} width={R * 2} height={80} fill="#E9E4DA" opacity={0.9} />
        {Array.from({ length: 26 }, (_, k) => (
          <ellipse key={k} cx={70 + ((k * 47) % 260)} cy={BASE[1] + 2 + ((k * 13) % 40)} rx={9} ry={6} fill={["#F4F1EA", "#C9C1B2", "#DDD7CB"][k % 3]} />
        ))}
      </g>

      <g transform={`rotate(${c.sway(3, 1.5)} ${BASE[0]} ${BASE[1]})`}>
        {LEAVES.map((lf, i) => {
          const g = Math.min(1, c.grow(i * 2));
          const inner = Math.abs(lf.a) < 20;
          const col = inner ? mix(silver, blush, 0.6 * c.grow(36)) : shade(silver, ((i % 3) - 1) * 0.06);
          const pts = curlPts(lf.a, lf.L, lf.curl);
          const d = taperPath(pts, 28, 3, g, 18);
          return (
            <g key={i}>
              <path d={d} fill={col} stroke={shade(c.leaf, -0.35)} strokeWidth={2} strokeLinejoin="round" />
              <path d={taperPath(pts.map(([x, y]) => [x - 2, y] as Pt), 5, 0.5, g * 0.8, 18)} fill="#fff" opacity={0.4} />
            </g>
          );
        })}
        {/* Purple tubular flowers poking out of the blushing heart. */}
        {[-12, 2, 14].map((a, k) => {
          const s = c.grow(40 + k * 4);
          return (
            <g key={a} transform={`translate(${BASE[0] + a * 0.5} ${BASE[1] - 56}) rotate(${a}) scale(${s * 1.3})`}>
              <rect x={-3.5} y={-38} width={7} height={40} rx={3.5} fill="#8A55C2" stroke="#5E3590" strokeWidth={1} />
              <path d="M0 -38 L-2 -50 M0 -38 L2 -50 M0 -38 L0 -52" stroke="#F4D35E" strokeWidth={1.8} strokeLinecap="round" />
            </g>
          );
        })}
      </g>

      {/* Front of the globe: a strong rim, the round opening, bold highlights. */}
      <circle cx={GX} cy={GY} r={R} fill="none" stroke={shade(glass, 0.2)} strokeOpacity={0.9} strokeWidth={6} />
      <ellipse cx={GX - 8} cy={GY - 44} rx={104} ry={108} fill="none" stroke={shade(glass, 0.35)} strokeOpacity={0.8} strokeWidth={5} />
      <path d={`M${GX - 132} ${GY - 54} A 140 140 0 0 1 ${GX - 52} ${GY - 134}`} stroke="#fff" strokeOpacity={0.75} strokeWidth={10} fill="none" strokeLinecap="round" />
      <circle cx={GX - 138} cy={GY - 20} r={6} fill="#fff" opacity={0.7} />
      <path d={`M${GX + 110} ${GY + 90} A 144 144 0 0 1 ${GX + 40} ${GY + 140}`} stroke="#fff" strokeOpacity={0.35} strokeWidth={8} fill="none" strokeLinecap="round" />
    </g>
  );
};

export const drawing: PlantDrawing = { id: "air-plant", Component: AirPlant, shadow: false, anchors: { soil: [196, 435], snip: [298, 413], snipR: 28 } };
