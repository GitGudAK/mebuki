import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, type Pt, along, polyline, ramp, spline } from "./kit";

const HOOK: Pt = [200, 24];

/** Heart-shaped blade: petiole at the origin, tip at (0, -L), two rounded lobes round a notch. */
const heart = (L: number, w = 0.44) => {
  const W = L * w;
  return `M0 0 C ${-W * 0.45} ${L * 0.14} ${-W} ${L * 0.02} ${-W} ${-L * 0.32} C ${-W} ${-L * 0.62} ${-W * 0.45} ${-L * 0.82} 0 ${-L} C ${W * 0.45} ${-L * 0.82} ${W} ${-L * 0.62} ${W} ${-L * 0.32} C ${W} ${L * 0.02} ${W * 0.45} ${L * 0.14} 0 0 Z`;
};

const rnd = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// Vines spill over the rim and trail down, the front ones over the pot.
const VINES: { pts: Pt[]; delay: number }[] = [
  { pts: [[146, 214], [112, 222], [86, 262], [72, 330], [76, 400], [66, 450]], delay: 10 },
  { pts: [[254, 214], [290, 224], [314, 270], [324, 334], [316, 392]], delay: 12 },
  { pts: [[160, 216], [134, 230], [120, 284], [114, 356], [122, 430], [110, 500]], delay: 6 },
  { pts: [[240, 216], [266, 232], [280, 292], [284, 372], [274, 446]], delay: 8 },
  { pts: [[178, 220], [166, 246], [162, 310], [170, 372], [162, 424]], delay: 14 },
  { pts: [[222, 220], [236, 252], [242, 320], [234, 392], [244, 462], [238, 504]], delay: 4 },
];

// An upright tuft in the pot.
const CROWN = [
  { x: 176, a: -140, L: 40 },
  { x: 224, a: -40, L: 40 },
  { x: 188, a: -112, L: 46 },
  { x: 212, a: -70, L: 46 },
  { x: 200, a: -92, L: 50 },
];

const PothosLeaf: React.FC<{ L: number; leaf: string; gold: string; seed: number }> = ({ L, leaf, gold, seed }) => {
  const W = L * 0.44;
  const r = (k: number) => rnd(seed * 7 + k);
  // Marbled yellow streaks running out from the midrib, different on every leaf.
  const streaks = [0, 1, 2, 3].map((k) => {
    const side = k % 2 ? 1 : -1;
    const t0 = 0.12 + r(k) * 0.35;
    const t1 = t0 + 0.25 + r(k + 9) * 0.3;
    const reach = 0.25 + r(k + 4) * 0.5;
    return `M${side * W * 0.08} ${-L * t0} Q ${side * W * reach} ${-L * (t0 + t1) * 0.5} ${side * W * reach * 0.6} ${-L * Math.min(0.9, t1)}`;
  });
  return (
    <g>
      <path d={heart(L)} fill={leaf} />
      {streaks.map((d, k) => (
        <path key={k} d={d} stroke={gold} strokeWidth={L * (0.05 + r(k + 20) * 0.07)} strokeLinecap="round" fill="none" opacity={0.9} />
      ))}
      {r(30) > 0.45 && (
        <ellipse cx={(r(31) - 0.5) * W} cy={-L * (0.35 + r(32) * 0.3)} rx={L * 0.1} ry={L * 0.05} fill={mix(gold, "#fff", 0.35)} opacity={0.85} transform={`rotate(${r(33) * 90 - 45})`} />
      )}
      <path d={`M0 ${-L * 0.02} Q ${W * 0.08} ${-L * 0.5} 0 ${-L * 0.94}`} stroke={shade(leaf, -0.22)} strokeWidth={Math.max(1.2, L * 0.045)} fill="none" />
      <path d={`M${-W * 0.55} ${-L * 0.2} C ${-W * 0.8} ${-L * 0.4} ${-W * 0.6} ${-L * 0.65} ${-W * 0.2} ${-L * 0.8}`} stroke="#fff" strokeOpacity={0.2} strokeWidth={L * 0.08} fill="none" strokeLinecap="round" />
    </g>
  );
};

export const GoldenPothos: React.FC<{ c: Ctx }> = ({ c }) => {
  const cord = "#EFE4CC";
  const cordDark = "#C8B894";
  const gold = mix(c.accent, "#FFF4C2", 0.25);
  const stem = shade(c.leaf, -0.2);
  const swing = c.sway(0, 0.7);

  const strands: Pt[][] = [
    [[200, 48], [150, 170], [148, 222], [167, 246], [176, 296], [200, 318]],
    [[200, 48], [184, 176], [186, 222], [167, 246], [200, 282], [200, 318]],
    [[200, 48], [216, 176], [214, 222], [233, 246], [200, 282], [200, 318]],
    [[200, 48], [250, 170], [252, 222], [233, 246], [224, 296], [200, 318]],
  ];
  const knots: Pt[] = [[150, 170], [184, 176], [216, 176], [250, 170], [167, 246], [233, 246], [200, 282]];
  const line = (p: Pt[]) => p.map(([x, y], k) => `${k ? "L" : "M"}${x} ${y}`).join(" ");

  return (
    <g transform={`rotate(${swing} ${HOOK[0]} ${HOOK[1]})`}>
      {/* Ceiling hook and ring. */}
      <path d="M200 6 L200 15" stroke="#8C7A62" strokeWidth={4} strokeLinecap="round" />
      <circle cx={HOOK[0]} cy={HOOK[1]} r={9} fill="none" stroke="#C9A877" strokeWidth={4} />

      {/* Upper cords, gathered under the ring. */}
      {strands.map((s, k) => (
        <path key={k} d={line(s.slice(0, 3))} stroke={cord} strokeWidth={3.5} fill="none" strokeLinejoin="round" />
      ))}
      <rect x={193} y={32} width={14} height={18} rx={5} fill={cord} />
      {[37, 42, 47].map((y) => (
        <path key={y} d={`M193 ${y} L207 ${y}`} stroke={cordDark} strokeWidth={1.4} />
      ))}

      {/* Soil and the hanging pot. */}
      <ellipse cx={200} cy={215} rx={56} ry={7} fill="#3B2A1E" />
      {CROWN.map((cr, i) => {
        const s = c.grow(20 + i * 2);
        return (
          <g key={i} transform={`translate(${cr.x} 216) rotate(${cr.a + 90 + c.sway(i + 2, 3)}) scale(${Math.min(1.05, s)})`}>
            <path d="M0 0 L0 -12" stroke={stem} strokeWidth={3} />
            <g transform="translate(0 -10)">
              <PothosLeaf L={cr.L} leaf={shade(c.leaf, i % 2 ? -0.05 : 0.04)} gold={gold} seed={i + 50} />
            </g>
          </g>
        );
      })}
      <path d="M146 222 L254 222 C 256 262 246 292 224 304 Q 200 312 176 304 C 154 292 144 262 146 222 Z" fill={c.pot} />
      <path d="M158 236 C 154 262 160 284 176 298" stroke="#fff" strokeOpacity={0.28} strokeWidth={8} fill="none" strokeLinecap="round" />
      <path d="M244 240 C 244 266 236 284 222 296" stroke="#000" strokeOpacity={0.12} strokeWidth={9} fill="none" strokeLinecap="round" />
      <rect x={140} y={210} width={120} height={14} rx={7} fill={shade(c.pot, 0.08)} />
      <rect x={146} y={211} width={108} height={4} rx={2} fill="#fff" opacity={0.3} />

      {/* Macramé net with square knots round the pot, and a fringed tassel. */}
      {strands.map((s, k) => (
        <path key={k} d={line(s.slice(2))} stroke={cord} strokeWidth={3.5} fill="none" strokeLinejoin="round" />
      ))}
      {knots.map(([x, y], k) => (
        <g key={k}>
          <ellipse cx={x} cy={y} rx={6} ry={8} fill={cord} />
          <path d={`M${x - 5} ${y - 2} L${x + 5} ${y - 2} M${x - 5} ${y + 3} L${x + 5} ${y + 3}`} stroke={cordDark} strokeWidth={1.3} />
        </g>
      ))}
      <rect x={192} y={314} width={16} height={20} rx={5} fill={cord} />
      {[319, 324, 329].map((y) => (
        <path key={y} d={`M192 ${y} L208 ${y}`} stroke={cordDark} strokeWidth={1.4} />
      ))}
      <g transform={`rotate(${c.sway(7, 2)} 200 334)`}>
        {[-7, -4, -1, 2, 5, 8].map((dx, k) => (
          <path key={k} d={`M${200 + dx * 0.6} 334 Q ${200 + dx} 356 ${200 + dx * 1.6} ${376 + (k % 3) * 5}`} stroke={k % 2 ? cord : shade(cord, -0.06)} strokeWidth={2.6} fill="none" strokeLinecap="round" />
        ))}
      </g>

      {/* Trailing vines with alternating marbled hearts, smaller towards the tips. */}
      {VINES.map((v, i) => {
        const g = Math.min(1, c.grow(v.delay));
        const [ox, oy] = v.pts[0];
        const n = 8;
        return (
          <g key={i} transform={`rotate(${c.sway(i + 3, 1.4)} ${ox} ${oy})`}>
            <path d={polyline(spline(v.pts, g, 30))} stroke={stem} strokeWidth={3} fill="none" strokeLinecap="round" />
            {Array.from({ length: n }).map((_, k) => {
              const t = 0.08 + (k / (n - 1)) * 0.9;
              const s = ramp(c.grow(v.delay + 6 + k * 2.5), 0, 1) * (g >= t ? 1 : 0);
              if (s <= 0) return null;
              const p = along(v.pts, t);
              const side = (k + i) % 2 ? 1 : -1;
              const L = (46 - t * 20) * Math.min(1.05, s);
              const a = p.angle + side * 55;
              return (
                <g key={k} transform={`translate(${p.x} ${p.y}) rotate(${a + 90 + c.sway(i * 9 + k, 3)})`}>
                  <path d="M0 0 L0 -7" stroke={stem} strokeWidth={2} />
                  <g transform="translate(0 -6)">
                    <PothosLeaf L={L} leaf={shade(c.leaf, ((k + i) % 3 - 1) * 0.06)} gold={gold} seed={i * 20 + k} />
                  </g>
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
};

export const drawing: PlantDrawing = { id: "golden-pothos", Component: GoldenPothos, shadow: false, anchors: { soil: [200, 203], snip: [323, 404], snipR: 30 } };
