import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, type Pt, along, leafTone, ramp, taperPath } from "./kit";

// A pinched, bushy basil: a main stem with two pairs of side shoots.
const BRANCHES: { pts: Pt[]; w: [number, number]; delay: number }[] = [
  { pts: [[200, 352], [199, 292], [202, 222], [200, 160], [201, 112]], w: [10, 4], delay: 0 },
  { pts: [[199, 316], [174, 296], [146, 266], [126, 226]], w: [7, 3], delay: 6 },
  { pts: [[200, 304], [228, 282], [256, 250], [274, 210]], w: [7, 3], delay: 8 },
  { pts: [[200, 250], [178, 226], [160, 194], [152, 156]], w: [5.5, 2.5], delay: 12 },
  { pts: [[201, 234], [224, 210], [242, 180], [250, 144]], w: [5.5, 2.5], delay: 14 },
];

// Opposite leaf pairs at nodes; k alternates so pairs cross (decussate) like real basil.
const NODES: { b: number; t: number; s: number; k: number }[] = [
  { b: 0, t: 0.16, s: 1.15, k: 0 },
  { b: 0, t: 0.62, s: 0.95, k: 1 },
  { b: 0, t: 0.86, s: 0.75, k: 0 },
  { b: 1, t: 0.4, s: 1.1, k: 1 },
  { b: 1, t: 0.75, s: 0.95, k: 0 },
  { b: 1, t: 1, s: 0.62, k: 1 },
  { b: 2, t: 0.4, s: 1.1, k: 1 },
  { b: 2, t: 0.75, s: 0.95, k: 0 },
  { b: 2, t: 1, s: 0.62, k: 1 },
  { b: 3, t: 0.5, s: 0.9, k: 0 },
  { b: 3, t: 1, s: 0.6, k: 1 },
  { b: 4, t: 0.5, s: 0.9, k: 0 },
  { b: 4, t: 1, s: 0.6, k: 1 },
  { b: 0, t: 1, s: 0.55, k: 1 },
];

const SPIKE: Pt[] = [[201, 114], [202, 82], [204, 46]];

// A broad, cupped ovate leaf on a short stalk.
const LEAF = "M0 -6 C -25 -10 -31 -37 -17 -53 C -11 -61 -5 -65 0 -69 C 5 -65 11 -61 17 -53 C 31 -37 25 -10 0 -6 Z";
const FOLD = "M0 -6 C 25 -10 31 -37 17 -53 C 11 -61 5 -65 0 -69 Z";

export const SweetBasil: React.FC<{ c: Ctx }> = ({ c }) => {
  const stem = shade(c.leaf, -0.18);
  const leaf = shade(c.leaf, 0.04);
  const growOf = BRANCHES.map((b) => c.grow(b.delay));
  const spikeG = c.grow(46);
  const flower = mix("#FBF8F0", c.accent, 0.1);
  return (
    <g>
      <ellipse cx={200} cy={348} rx={80} ry={9} fill="#3B2A1E" />
      <g transform={`rotate(${c.sway(1, 0.7)} 200 352)`}>
        {BRANCHES.map((b, i) => (
          <path key={i} d={taperPath(b.pts, b.w[0], b.w[1], Math.min(1, growOf[i]))} fill={stem} />
        ))}

        {/* The flower spike: whorls of small white lipped flowers over tiny bracts. */}
        <path d={taperPath(SPIKE, 4, 2, Math.min(1, spikeG))} fill={stem} />
        {[0, 1, 2, 3, 4, 5].map((k) => {
          const t = k / 5;
          const s = ramp(spikeG, t * 0.7, t * 0.7 + 0.3) * (1 - k * 0.11);
          const p = along(SPIKE, t);
          return (
            <g key={k} transform={`translate(${p.x} ${p.y}) scale(${s})`}>
              {[-1, 1].map((side) => (
                <path key={side} d={LEAF} fill={shade(leaf, -0.06)} transform={`rotate(${side * 70}) scale(0.2)`} />
              ))}
              {[-1, 0, 1].map((side) => (
                <g key={side} transform={`translate(${side * 7} ${-3 - (side ? 0 : 2)}) rotate(${side * 40})`}>
                  <ellipse cx={0} cy={-4} rx={3.6} ry={5} fill={flower} />
                  <ellipse cx={0} cy={-8} rx={4.6} ry={2.6} fill={flower} />
                </g>
              ))}
            </g>
          );
        })}

        {NODES.flatMap((n, i) =>
          [-1, 1].map((side) => {
            const s = ramp(growOf[n.b], n.t - 0.15, n.t + 0.2) * n.s;
            const p = along(BRANCHES[n.b].pts, n.t);
            const spread = n.k ? 44 : 80;
            const color = leafTone(leaf, i + (side > 0 ? 1 : 0));
            const sx = n.k ? 0.86 : 1;
            return (
              <g
                key={`${i}${side}`}
                transform={`translate(${p.x} ${p.y}) rotate(${p.angle + 90 + side * spread + c.sway(i + side, 3)}) scale(${s * sx} ${s})`}
              >
                <path d="M0 0 L0 -8" stroke={stem} strokeWidth={3} strokeLinecap="round" />
                <path d={LEAF} fill={color} />
                <path d={FOLD} fill={shade(color, -0.1)} />
                <path d="M0 -8 L0 -62" stroke={shade(color, -0.26)} strokeWidth={2} />
                {[22, 34, 46].map((y) =>
                  [-1, 1].map((v) => (
                    <path
                      key={`${y}${v}`}
                      d={`M0 ${-y} Q ${v * 10} ${-y - 3} ${v * 17} ${-y - 13}`}
                      stroke={shade(color, -0.2)}
                      strokeWidth={1.4}
                      fill="none"
                    />
                  )),
                )}
                <path d="M-11 -18 C -20 -30 -19 -43 -10 -54" stroke="#fff" strokeOpacity={0.32} strokeWidth={4} fill="none" strokeLinecap="round" />
              </g>
            );
          }),
        )}
      </g>

      <HerbPot color={c.pot} />
    </g>
  );
};

const SPECKS: Pt[] = [
  [146, 392], [170, 410], [214, 384], [238, 420], [258, 398], [184, 444], [228, 452], [156, 440], [250, 446], [200, 418], [176, 380], [262, 430],
];

/** A glazed ceramic herb pot with a drip line over an unglazed foot, standing in a saucer. */
const HerbPot: React.FC<{ color: string }> = ({ color }) => {
  const clay = "#CDA683";
  return (
    <g>
      <path d="M122 360 L278 360 L268 482 Q 266 494 254 494 L146 494 Q 134 494 132 482 Z" fill={color} />
      {/* The glaze stops in a wavy drip line above the bare clay foot. */}
      <path d="M130.6 466 Q 150 474 168 468 Q 186 462 202 470 Q 222 478 240 468 Q 256 462 269.4 466 L268 482 Q 266 494 254 494 L146 494 Q 134 494 132 482 Z" fill={clay} />
      {SPECKS.map(([x, y], k) => (
        <circle key={k} cx={x} cy={y} r={k % 3 ? 1.6 : 2.2} fill={shade(color, -0.35)} opacity={0.6} />
      ))}
      <path d="M142 378 C 139 410 141 438 146 458" stroke="#fff" strokeOpacity={0.34} strokeWidth={8} fill="none" strokeLinecap="round" />
      <path d="M262 380 C 262 410 260 436 256 456" stroke="#000" strokeOpacity={0.12} strokeWidth={10} fill="none" strokeLinecap="round" />
      <rect x={114} y={338} width={172} height={26} rx={7} fill={shade(color, 0.06)} />
      <path d="M118 362 L282 362" stroke={shade(color, -0.2)} strokeWidth={2.5} />
      <rect x={120} y={341} width={160} height={5} rx={2.5} fill="#fff" opacity={0.32} />
      {/* Saucer. */}
      <rect x={106} y={484} width={188} height={10} rx={5} fill={shade(color, -0.04)} />
      <path d="M110 492 L290 492 Q 287 508 270 508 L130 508 Q 113 508 110 492 Z" fill={shade(color, -0.14)} />
      <rect x={112} y={486} width={176} height={3} rx={1.5} fill="#fff" opacity={0.28} />
    </g>
  );
};

export const drawing: PlantDrawing = { id: "sweet-basil", Component: SweetBasil, anchors: { soil: [200, 340], snip: [203, 80], snipR: 40 } };
