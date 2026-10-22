import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, type Pt, along, polyline, ramp, spline, taperPath } from "./kit";

// An informal upright trunk that twists left, right and left again to its apex.
const TRUNK: Pt[] = [[206, 458], [184, 414], [214, 360], [190, 300], [214, 238], [212, 184]];

// Branches leave the trunk at t and carry a foliage pad at their tip.
const BRANCHES = [
  { t: 0.2, to: [112, 352] as Pt, mid: [150, 380] as Pt, pad: { rx: 64, ry: 22 }, delay: 14 },
  { t: 0.42, to: [292, 302] as Pt, mid: [254, 330] as Pt, pad: { rx: 54, ry: 20 }, delay: 18 },
  { t: 0.62, to: [138, 252] as Pt, mid: [166, 270] as Pt, pad: { rx: 46, ry: 18 }, delay: 22 },
  { t: 0.8, to: [266, 214] as Pt, mid: [240, 226] as Pt, pad: { rx: 38, ry: 15 }, delay: 26 },
];
const APEX = { at: [210, 176] as Pt, rx: 44, ry: 24, delay: 30 };

/** A cloud-shaped pad of scale foliage: a dark underside, massed tufts, a lit crown. */
const Pad: React.FC<{ x: number; y: number; rx: number; ry: number; s: number; leaf: string }> = ({ x, y, rx, ry, s, leaf }) => {
  const tufts = [-0.78, -0.48, -0.16, 0.16, 0.48, 0.78];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={ry * 0.35} rx={rx} ry={ry * 0.7} fill={shade(leaf, -0.32)} />
      {tufts.map((t, k) => (
        <circle key={k} cx={t * rx * 0.92} cy={-Math.cos(t * 1.4) * ry * 0.3} r={ry * (0.78 - Math.abs(t) * 0.25)} fill={shade(leaf, (k % 2 ? -0.06 : 0.02))} />
      ))}
      {tufts.slice(1, 5).map((t, k) => (
        <circle key={k} cx={t * rx * 0.7} cy={-ry * 0.5} r={ry * 0.42} fill={mix(leaf, "#C9E3A8", 0.32)} />
      ))}
      {/* Fine speckle that reads as scale-like needles. */}
      {tufts.map((t, k) => (
        <circle key={`d${k}`} cx={t * rx * 0.8 + 6} cy={-ry * 0.15 + (k % 3) * 4} r={2} fill={mix(leaf, "#E2F0C8", 0.5)} opacity={0.7} />
      ))}
    </g>
  );
};

export const JuniperBonsai: React.FC<{ c: Ctx }> = ({ c }) => {
  const bark = "#6B5040";
  const deadwood = "#DDD5C6";
  const g = c.grow(0);
  const trunkShown = Math.min(1, g);
  const bend = c.sway(2, 0.4);
  return (
    <g>
      <g transform={`rotate(${bend} 206 458)`}>
        {/* Jin: a bleached, stripped branch that juniper bonsai are known for. */}
        <path
          d={polyline(spline([[192, 300], [172, 262], [160, 226]], ramp(g, 0.5, 1)))}
          stroke={deadwood}
          strokeWidth={6}
          strokeLinecap="round"
          fill="none"
        />

        {BRANCHES.map((b, i) => {
          const s = c.grow(b.delay);
          const from = along(TRUNK, b.t);
          const pts: Pt[] = [[from.x, from.y], b.mid, b.to];
          return (
            <path key={i} d={taperPath(pts, 9 - i, 3, Math.min(1, s), 14)} fill={shade(bark, 0.05)} />
          );
        })}

        <path d={taperPath(TRUNK, 46, 9, trunkShown)} fill={bark} />
        {/* Shari: a live vein of bark spiralling round pale deadwood up the trunk. */}
        <path d={taperPath(TRUNK.map(([x, y]) => [x + 5, y] as Pt), 8, 2, trunkShown * 0.9)} fill={deadwood} opacity={0.55} />
        {[-12, 10].map((dx) => (
          <path key={dx} d={polyline(spline(TRUNK.map(([x, y]) => [x + dx * (1 - (458 - y) / 360), y] as Pt), trunkShown * 0.85))} stroke={shade(bark, -0.25)} strokeWidth={2.5} fill="none" />
        ))}

        {BRANCHES.map((b, i) => (
          <g key={i} transform={`rotate(${c.sway(i + 3, 1)} ${b.to[0]} ${b.to[1]})`}>
            <Pad x={b.to[0]} y={b.to[1] - 6} rx={b.pad.rx} ry={b.pad.ry} s={c.grow(b.delay + 10)} leaf={c.leaf} />
          </g>
        ))}
        <Pad x={APEX.at[0]} y={APEX.at[1]} rx={APEX.rx} ry={APEX.ry} s={c.grow(APEX.delay)} leaf={c.leaf} />
      </g>

      <BonsaiPot color={c.pot} />
    </g>
  );
};

/** A shallow glazed tray on little feet, with moss on the soil. */
const BonsaiPot: React.FC<{ color: string }> = ({ color }) => (
  <g>
    <path d="M100 452 Q 200 444 300 452 L300 462 L100 462 Z" fill="#3B2A1E" />
    {[[124, 450], [146, 448], [258, 449], [282, 451], [168, 447], [238, 447]].map(([x, y], k) => (
      <ellipse key={k} cx={x} cy={y} rx={12} ry={6} fill={["#6E9A4E", "#5C8A44", "#7FA85A"][k % 3]} />
    ))}
    <rect x={82} y={456} width={236} height={14} rx={4} fill={shade(color, 0.1)} />
    <rect x={86} y={457} width={228} height={3.5} rx={1.5} fill="#fff" opacity={0.25} />
    <path d="M90 470 L310 470 L300 498 L100 498 Z" fill={color} />
    <path d="M110 476 L290 476" stroke={shade(color, -0.2)} strokeWidth={2} opacity={0.6} />
    <rect x={112} y={498} width={26} height={9} rx={2} fill={shade(color, -0.15)} />
    <rect x={262} y={498} width={26} height={9} rx={2} fill={shade(color, -0.15)} />
  </g>
);

export const drawing: PlantDrawing = { id: "juniper-bonsai", Component: JuniperBonsai };
