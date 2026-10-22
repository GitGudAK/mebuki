import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, type Pt, along, polyline, ramp, taperPath } from "./kit";

const up = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [x, y - 10]);

// A twiggy, much-branched holy basil bush.
const BRANCHES: { pts: Pt[]; w: [number, number]; delay: number }[] = [
  { pts: up([[200, 348], [199, 290], [201, 230], [199, 170], [200, 124]]), w: [9, 3], delay: 0 },
  { pts: up([[200, 320], [172, 298], [146, 264], [128, 222]]), w: [6, 2.5], delay: 5 },
  { pts: up([[200, 308], [230, 288], [256, 256], [272, 216]]), w: [6, 2.5], delay: 7 },
  { pts: up([[200, 262], [176, 236], [160, 204], [150, 168]]), w: [4.5, 2], delay: 11 },
  { pts: up([[200, 244], [226, 220], [242, 190], [250, 156]]), w: [4.5, 2], delay: 13 },
  { pts: up([[146, 264], [118, 256], [98, 240], [86, 214]]), w: [4, 2], delay: 14 },
  { pts: up([[256, 256], [284, 248], [304, 230], [314, 206]]), w: [4, 2], delay: 16 },
];

// Opposite leaf pairs; `k` alternates the pair's spread so pairs cross.
const NODES: { b: number; t: number; s: number; k: number }[] = [
  { b: 0, t: 0.2, s: 1.1, k: 0 }, { b: 0, t: 0.5, s: 1, k: 1 }, { b: 0, t: 0.78, s: 0.85, k: 0 }, { b: 0, t: 0.98, s: 0.6, k: 1 },
  { b: 1, t: 0.3, s: 1, k: 1 }, { b: 1, t: 0.66, s: 0.9, k: 0 }, { b: 1, t: 0.97, s: 0.6, k: 1 },
  { b: 2, t: 0.3, s: 1, k: 1 }, { b: 2, t: 0.66, s: 0.9, k: 0 }, { b: 2, t: 0.97, s: 0.6, k: 1 },
  { b: 3, t: 0.45, s: 0.85, k: 0 }, { b: 3, t: 0.95, s: 0.6, k: 1 },
  { b: 4, t: 0.45, s: 0.85, k: 0 }, { b: 4, t: 0.95, s: 0.6, k: 1 },
  { b: 5, t: 0.5, s: 0.8, k: 1 }, { b: 5, t: 0.95, s: 0.55, k: 0 },
  { b: 6, t: 0.5, s: 0.8, k: 1 }, { b: 6, t: 0.95, s: 0.55, k: 0 },
  { b: 0, t: 0.35, s: 0.95, k: 1 }, { b: 0, t: 0.64, s: 0.9, k: 0 },
  { b: 1, t: 0.5, s: 0.95, k: 0 }, { b: 2, t: 0.5, s: 0.95, k: 0 },
  { b: 3, t: 0.72, s: 0.75, k: 1 }, { b: 4, t: 0.72, s: 0.75, k: 1 },
  { b: 5, t: 0.25, s: 0.75, k: 0 }, { b: 6, t: 0.25, s: 0.75, k: 0 },
];

// Slender flower spikes carry on from each branch tip.
const SPIKES: { b: number; len: number; bend: number; delay: number }[] = [
  { b: 0, len: 84, bend: 4, delay: 40 },
  { b: 1, len: 70, bend: -8, delay: 44 },
  { b: 2, len: 72, bend: 8, delay: 46 },
  { b: 3, len: 62, bend: -6, delay: 50 },
  { b: 4, len: 64, bend: 6, delay: 52 },
  { b: 5, len: 54, bend: -10, delay: 54 },
  { b: 6, len: 56, bend: 10, delay: 56 },
];

/** An elliptic leaf with a serrated margin, pointing up from its base at the origin. */
const toothed = (L: number, W: number, teeth: number, depth = 0.16) => {
  const N = teeth * 2;
  const right: Pt[] = [];
  for (let k = 0; k <= N; k++) {
    const s = k / N;
    const base = W * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.8)), 0.85);
    const tooth = k % 2 === 1 && s > 0.15 && k < N - 1;
    right.push([tooth ? base * (1 + depth) : base, -L * s - (tooth ? L * 0.025 : 0)]);
  }
  const left = right.slice(0, -1).reverse().map(([x, y]): Pt => [-x, y]);
  return `${polyline([...right, ...left])} Z`;
};
const LEAF = toothed(44, 14.5, 7);

export const Tulasi: React.FC<{ c: Ctx }> = ({ c }) => {
  const stem = mix(shade(c.leaf, -0.35), "#7A2E6A", 0.55);
  const growOf = BRANCHES.map((b) => c.grow(b.delay));
  return (
    <g>
      <Vrindavan color={c.pot} />
      <g transform={`rotate(${c.sway(1, 0.8)} 200 338)`}>
        {BRANCHES.map((b, i) => (
          <path key={i} d={taperPath(b.pts, b.w[0], b.w[1], Math.min(1, growOf[i]))} fill={stem} />
        ))}

        {SPIKES.map((sp, i) => {
          const g = c.grow(sp.delay);
          const end = along(BRANCHES[sp.b].pts, 1);
          const a = ((end.angle + sp.bend) * Math.PI) / 180;
          const pts: Pt[] = [
            [end.x, end.y],
            [end.x + Math.cos(a) * sp.len * 0.5, end.y + Math.sin(a) * sp.len * 0.5],
            [end.x + Math.cos(a + sp.bend * 0.012) * sp.len, end.y + Math.sin(a + sp.bend * 0.012) * sp.len],
          ];
          const whorls = Math.round(sp.len / 9);
          return (
            <g key={i} transform={`rotate(${c.sway(i + 3, 2)} ${end.x} ${end.y})`}>
              <path d={taperPath(pts, 3, 1.5, Math.min(1, g))} fill={stem} />
              {Array.from({ length: whorls }, (_, k) => {
                const t = (k + 0.5) / whorls;
                const s = ramp(g, t * 0.8, t * 0.8 + 0.25) * (1 - t * 0.45);
                const p = along(pts, t);
                const bud = t > 0.75;
                return (
                  <g key={k} transform={`translate(${p.x} ${p.y}) rotate(${p.angle + 90}) scale(${s})`}>
                    {[-1, 1].map((side) => (
                      <g key={side} transform={`rotate(${side * 62})`}>
                        <ellipse cx={0} cy={-4} rx={2.6} ry={3.2} fill={shade(stem, 0.08)} />
                        {!bud && <ellipse cx={0} cy={-8} rx={2.8} ry={3.8} fill={c.accent} />}
                      </g>
                    ))}
                    <circle cx={0} cy={-1} r={2.4} fill={bud ? shade(c.accent, -0.35) : shade(c.accent, -0.15)} />
                  </g>
                );
              })}
            </g>
          );
        })}

        {NODES.flatMap((n, i) =>
          [-1, 1].map((side) => {
            const s = ramp(growOf[n.b], n.t - 0.15, n.t + 0.2) * n.s;
            const p = along(BRANCHES[n.b].pts, n.t);
            // Young leaves near the tips flush purple, as Krishna tulsi does.
            const young = ramp(n.t, 0.6, 1) * 0.45;
            const color = mix(shade(c.leaf, 0.08 + (((i + side + 3) % 3) - 1) * 0.06), "#6E3570", young);
            const spread = n.k ? 40 : 74;
            return (
              <g
                key={`${i}${side}`}
                transform={`translate(${p.x} ${p.y}) rotate(${p.angle + 90 + side * spread + c.sway(i + side, 3)}) scale(${s * (n.k ? 0.85 : 1)} ${s})`}
              >
                <path d="M0 0 L0 -9" stroke={stem} strokeWidth={2.4} strokeLinecap="round" />
                <g transform="translate(0 -8)">
                  <path d={LEAF} fill={color} />
                  <path d="M0 -1 L0 -36" stroke={shade(color, -0.25)} strokeWidth={1.6} />
                  {[12, 20, 28].map((y) =>
                    [-1, 1].map((v) => (
                      <path key={`${y}${v}`} d={`M0 ${-y} L${v * 8} ${-y - 6}`} stroke={shade(color, -0.2)} strokeWidth={1.1} />
                    )),
                  )}
                  <path d="M-6 -10 C -10 -18 -9 -26 -5 -32" stroke="#fff" strokeOpacity={0.25} strokeWidth={2.5} fill="none" strokeLinecap="round" />
                </g>
              </g>
            );
          }),
        )}
      </g>
      <VrindavanFront color={c.pot} />
    </g>
  );
};

const TRIM = "#B8432E";
const OCHRE = "#D9A13A";

/** The soil bed behind the vrindavan's parapet. */
const Vrindavan: React.FC<{ color: string }> = () => <ellipse cx={200} cy={332} rx={66} ry={7} fill="#3B2A1E" />;

/** A whitewashed tulsi vrindavan: plinth, pillar with a lamp niche, cornice, parapet with corner finials. */
const VrindavanFront: React.FC<{ color: string }> = ({ color }) => {
  const dark = shade(color, -0.14);
  return (
    <g>
      {/* Plinth and step. */}
      <rect x={104} y={490} width={192} height={18} rx={2} fill={shade(color, -0.1)} />
      <rect x={104} y={490} width={192} height={4} fill={TRIM} />
      <rect x={116} y={474} width={168} height={18} rx={2} fill={shade(color, -0.03)} />
      {/* Pillar with corner pilasters. */}
      <rect x={130} y={384} width={140} height={92} fill={color} />
      <rect x={130} y={384} width={12} height={92} fill={shade(color, 0.05)} />
      <rect x={258} y={384} width={12} height={92} fill={dark} />
      {/* Lamp niche with a lit diya. */}
      <path d="M180 466 L180 422 Q 180 398 200 394 Q 220 398 220 422 L220 466 Z" fill={TRIM} />
      <path d="M184 466 L184 423 Q 184 403 200 399 Q 216 403 216 423 L216 466 Z" fill="#3A2418" />
      <circle cx={200} cy={448} r={11} fill="#FFC94A" opacity={0.22} />
      <path d="M200 440 C 195 447 196 454 200 454 C 204 454 205 447 200 440 Z" fill="#FFC94A" />
      <path d="M200 446 C 198 450 198 453 200 453 C 202 453 202 450 200 446 Z" fill="#FFF3C4" />
      <path d="M189 456 Q 200 468 211 456 Z" fill="#B9603F" />
      {/* Painted rangoli flowers either side of the niche. */}
      {[158, 242].map((x) => (
        <g key={x} transform={`translate(${x} 430)`}>
          {[0, 90, 180, 270, 45, 135, 225, 315].map((a, k) => (
            <ellipse key={a} cx={0} cy={k < 4 ? -7 : -5} rx={k < 4 ? 3.4 : 2.2} ry={k < 4 ? 5 : 3.4} fill={k < 4 ? TRIM : OCHRE} transform={`rotate(${a})`} />
          ))}
          <circle r={2.6} fill={OCHRE} />
        </g>
      ))}
      {/* Cornice with dentils. */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => (
        <rect key={k} x={134 + k * 13.6} y={382} width={7} height={6} fill={dark} />
      ))}
      <rect x={116} y={364} width={168} height={20} rx={2} fill={shade(color, 0.04)} />
      <rect x={116} y={377} width={168} height={7} fill={TRIM} />
      <rect x={116} y={364} width={168} height={4} fill="#fff" opacity={0.35} />
      {/* Parapet that holds the soil, with domed corner finials. */}
      <rect x={126} y={328} width={148} height={38} fill={color} />
      <rect x={126} y={344} width={148} height={6} fill={OCHRE} />
      <rect x={262} y={328} width={12} height={38} fill={dark} />
      {[132, 268].map((x) => (
        <g key={x}>
          <rect x={x - 10} y={322} width={20} height={10} rx={2} fill={shade(color, 0.04)} />
          <path d={`M${x - 9} 323 Q ${x - 9} 306 ${x} 302 Q ${x + 9} 306 ${x + 9} 323 Z`} fill={color} />
          <path d={`M${x - 9} 323 Q ${x - 9} 306 ${x} 302 Q ${x + 9} 306 ${x + 9} 323 Z`} fill="none" stroke={TRIM} strokeWidth={2} />
          <circle cx={x} cy={299} r={3} fill={OCHRE} />
        </g>
      ))}
      <circle cx={200} cy={347} r={5} fill={TRIM} />
      <rect x={130} y={330} width={128} height={3} fill="#fff" opacity={0.35} />
    </g>
  );
};

export const drawing: PlantDrawing = { id: "tulasi", Component: Tulasi };
