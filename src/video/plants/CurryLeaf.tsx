import React from "react";
import type { PlantDrawing } from ".";
import { shade } from "../colors";
import { type Ctx, type Pt, along, ramp, spline, taperPath } from "./kit";

// A young curry tree: a slim trunk with four side branches.
const BRANCHES: { pts: Pt[]; w: [number, number]; delay: number }[] = [
  { pts: [[200, 338], [197, 292], [204, 240], [200, 188], [202, 150]], w: [11, 4], delay: 0 },
  { pts: [[198, 292], [172, 270], [144, 244]], w: [6, 3], delay: 6 },
  { pts: [[203, 254], [234, 230], [262, 200]], w: [6, 3], delay: 8 },
  { pts: [[201, 208], [180, 186], [164, 156]], w: [5, 2.5], delay: 11 },
  { pts: [[202, 160], [218, 136], [228, 108]], w: [4.5, 2.5], delay: 13 },
];

// Pinnate leaves: where they sprout, which way they point (deg), rachis length and droop.
const LEAVES: { b: number; t: number; a: number; L: number; droop: number }[] = [
  { b: 0, t: 0.38, a: 22, L: 82, droop: 22 },
  { b: 0, t: 0.62, a: 158, L: 80, droop: 22 },
  { b: 1, t: 1, a: 190, L: 104, droop: 30 },
  { b: 1, t: 1, a: 232, L: 96, droop: 24 },
  { b: 1, t: 0.9, a: 150, L: 84, droop: 18 },
  { b: 2, t: 1, a: -10, L: 104, droop: 30 },
  { b: 2, t: 1, a: -52, L: 96, droop: 24 },
  { b: 2, t: 0.9, a: 30, L: 84, droop: 18 },
  { b: 3, t: 1, a: 198, L: 96, droop: 26 },
  { b: 3, t: 1, a: 248, L: 92, droop: 26 },
  { b: 4, t: 1, a: -22, L: 96, droop: 26 },
  { b: 4, t: 1, a: -80, L: 92, droop: 30 },
  { b: 4, t: 1, a: 226, L: 86, droop: 24 },
  { b: 0, t: 1, a: -112, L: 80, droop: 20 },
];

const LEAFLET = "M0 0 C -7 -4 -9 -14 -4 -21 C -2 -24 -1 -25 0 -26 C 1 -25 2 -24 4 -21 C 9 -14 7 -4 0 0 Z";

/** One compound leaf: a drooping rachis with alternate glossy leaflets and a terminal one. */
const Compound: React.FC<{ from: Pt; a: number; L: number; droop: number; g: number; color: string; sway: number }> = ({
  from, a, L, droop, g, color, sway,
}) => {
  const r = ((a + sway) * Math.PI) / 180;
  const dx = Math.cos(r);
  const dy = Math.sin(r);
  const pts: Pt[] = [
    from,
    [from[0] + dx * L * 0.5, from[1] + dy * L * 0.5 - droop * 0.15],
    [from[0] + dx * L, from[1] + dy * L + droop],
  ];
  const shown = Math.min(1, g);
  const rachis = spline(pts, shown, 16);
  const n = 11;
  return (
    <g>
      <path d={rachis.map(([x, y], k) => `${k ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ")} stroke={shade(color, -0.3)} strokeWidth={2} fill="none" strokeLinecap="round" />
      {Array.from({ length: n + 1 }, (_, k) => {
        const terminal = k === n;
        const t = terminal ? 1 : 0.12 + (k / n) * 0.84;
        const s = ramp(g, t - 0.05, t + 0.2) * (terminal ? 1.05 : 0.8 + Math.sin(t * Math.PI) * 0.35);
        const p = along(pts, t);
        const side = k % 2 ? 1 : -1;
        const tone = shade(color, ((k % 3) - 1) * 0.05);
        return (
          <g key={k} transform={`translate(${p.x} ${p.y}) rotate(${p.angle + 90 + (terminal ? 0 : side * 58)}) scale(${s})`}>
            <path d={LEAFLET} fill={tone} />
            <path d="M0 -1 L0 -22" stroke={shade(tone, -0.22)} strokeWidth={1} />
            <path d="M-3 -6 C -5 -11 -4 -16 -2 -19" stroke="#fff" strokeOpacity={0.35} strokeWidth={1.8} fill="none" strokeLinecap="round" />
          </g>
        );
      })}
    </g>
  );
};

// Domed clusters of tiny cream flowers at two branch tips.
const CLUSTERS: { b: number; dx: number; dy: number }[] = [
  { b: 4, dx: 4, dy: -8 },
  { b: 2, dx: 6, dy: -6 },
];
const FLORETS: Pt[] = [[0, 0], [-9, 3], [9, 3], [-5, -6], [5, -6], [0, -11], [-14, -3], [14, -3], [-10, -11], [10, -11], [0, 6]];

export const CurryLeaf: React.FC<{ c: Ctx }> = ({ c }) => {
  const bark = "#6E5443";
  const growOf = BRANCHES.map((b) => c.grow(b.delay));
  return (
    <g>
      <ellipse cx={200} cy={334} rx={40} ry={6} fill="#3B2A1E" />
      <g transform={`rotate(${c.sway(1, 0.6)} 200 338)`}>
        {BRANCHES.map((b, i) => (
          <path key={i} d={taperPath(b.pts, b.w[0], b.w[1], Math.min(1, growOf[i]))} fill={bark} />
        ))}
        {LEAVES.map((lf, i) => {
          const p = along(BRANCHES[lf.b].pts, lf.t);
          const g = c.grow(BRANCHES[lf.b].delay + 10 + (i % 4) * 3);
          return (
            <Compound
              key={i}
              from={[p.x, p.y]}
              a={lf.a}
              L={lf.L}
              droop={lf.droop}
              g={g}
              color={shade(c.leaf, ((i % 3) - 1) * 0.06)}
              sway={c.sway(i, 3)}
            />
          );
        })}
        {CLUSTERS.map((cl, i) => {
          const p = along(BRANCHES[cl.b].pts, 1);
          const g = c.grow(46 + i * 6);
          return (
            <g key={i} transform={`translate(${p.x + cl.dx} ${p.y + cl.dy})`}>
              {FLORETS.map(([x, y], k) => (
                <path key={`s${k}`} d={`M0 12 L${x} ${y}`} stroke={shade(c.leaf, -0.15)} strokeWidth={1.2} opacity={ramp(g, 0, 0.4)} />
              ))}
              {FLORETS.map(([x, y], k) => {
                const s = ramp(g, (k / FLORETS.length) * 0.5, (k / FLORETS.length) * 0.5 + 0.5);
                return (
                  <g key={k} transform={`translate(${x} ${y}) scale(${s})`}>
                    {[0, 72, 144, 216, 288].map((r) => (
                      <ellipse key={r} cx={0} cy={-3} rx={1.9} ry={3.2} fill={c.accent} transform={`rotate(${r + k * 13})`} />
                    ))}
                    <circle r={1.5} fill="#E3C25A" />
                  </g>
                );
              })}
            </g>
          );
        })}
      </g>
      <Matka color={c.pot} />
    </g>
  );
};

/** A round-bellied clay matka on a coiled ring stand, painted with white bands. */
const Matka: React.FC<{ color: string }> = ({ color }) => {
  const paint = "#F3E6CF";
  return (
    <g>
      <rect x={150} y={496} width={100} height={12} rx={6} fill={shade(color, -0.35)} />
      {[166, 186, 206, 226].map((x) => (
        <path key={x} d={`M${x} 498 l8 8`} stroke={shade(color, -0.5)} strokeWidth={1.6} />
      ))}
      <path d="M166 348 C 100 354 82 400 90 440 C 98 482 140 504 200 505 C 260 504 302 482 310 440 C 318 400 300 354 234 348 Z" fill={color} />
      {/* Painted shoulder bands with a dotted row, and a band low on the belly. */}
      <path d="M118 372 Q 200 398 282 372" stroke={paint} strokeWidth={3} fill="none" />
      <path d="M106 392 Q 200 422 294 392" stroke={paint} strokeWidth={3} fill="none" />
      {Array.from({ length: 11 }, (_, k) => {
        const u = (k + 0.5) / 11;
        const x = 112 + u * 176;
        const y = 382 + Math.sin(u * Math.PI) * 13;
        return <circle key={k} cx={x} cy={y} r={2.6} fill={paint} />;
      })}
      <path d="M96 452 Q 200 486 304 452" stroke={paint} strokeWidth={2.5} fill="none" opacity={0.9} />
      <path d="M112 404 C 102 428 106 456 122 474" stroke="#fff" strokeOpacity={0.2} strokeWidth={12} fill="none" strokeLinecap="round" />
      <path d="M296 410 C 302 436 294 462 276 480" stroke="#000" strokeOpacity={0.14} strokeWidth={14} fill="none" strokeLinecap="round" />
      {/* Neck and rolled lip. */}
      <rect x={164} y={334} width={72} height={18} fill={shade(color, -0.1)} />
      <rect x={154} y={324} width={92} height={14} rx={7} fill={shade(color, 0.06)} />
      <rect x={160} y={326} width={80} height={3.5} rx={1.75} fill="#fff" opacity={0.3} />
    </g>
  );
};

export const drawing: PlantDrawing = { id: "curry-leaf", Component: CurryLeaf };
