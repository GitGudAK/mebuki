import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, type Pt, along, leafTone, ramp, taperPath } from "./kit";

// A branching bush: a short main stem forking into arms, each forking again.
const BRANCHES: { pts: Pt[]; w: [number, number]; delay: number }[] = [
  { pts: [[200, 352], [199, 300], [201, 252], [203, 196], [206, 140]], w: [11, 4], delay: 0 },
  { pts: [[199, 304], [176, 268], [154, 228], [138, 180]], w: [7, 3], delay: 6 },
  { pts: [[201, 262], [228, 230], [254, 196], [270, 152]], w: [7, 3], delay: 9 },
  { pts: [[162, 244], [134, 230], [110, 210], [96, 188]], w: [5, 2.5], delay: 14 },
  { pts: [[244, 210], [272, 206], [296, 194], [312, 176]], w: [5, 2.5], delay: 16 },
];

// Leaves sit along each branch at t, alternating sides.
const LEAVES: { b: number; t: number; side: number; s: number }[] = [
  { b: 0, t: 0.42, side: -1, s: 0.9 }, { b: 0, t: 0.6, side: 1, s: 1 }, { b: 0, t: 0.78, side: -1, s: 0.95 },
  { b: 0, t: 0.95, side: 1, s: 0.8 }, { b: 0, t: 1, side: -1, s: 0.7 },
  { b: 1, t: 0.4, side: 1, s: 0.9 }, { b: 1, t: 0.7, side: -1, s: 1 }, { b: 1, t: 1, side: 1, s: 0.8 },
  { b: 2, t: 0.45, side: -1, s: 0.95 }, { b: 2, t: 0.72, side: 1, s: 1 }, { b: 2, t: 1, side: -1, s: 0.8 },
  { b: 3, t: 0.6, side: 1, s: 0.85 }, { b: 3, t: 1, side: -1, s: 0.75 },
  { b: 4, t: 0.55, side: -1, s: 0.85 }, { b: 4, t: 1, side: 1, s: 0.75 },
  { b: 0, t: 0.52, side: 1, s: 0.85 }, { b: 1, t: 0.85, side: -1, s: 0.85 }, { b: 2, t: 0.86, side: 1, s: 0.85 },
  { b: 3, t: 0.82, side: 1, s: 0.7 }, { b: 4, t: 0.8, side: -1, s: 0.7 }, { b: 1, t: 0.2, side: -1, s: 0.75 },
];

// Pods hang from the arms; most have ripened red, one is still turning, one is green.
const PODS: { b: number; t: number; a: number; len: number; ripe: number }[] = [
  { b: 1, t: 0.55, a: 14, len: 74, ripe: 1 },
  { b: 3, t: 0.45, a: -8, len: 64, ripe: 1 },
  { b: 2, t: 0.6, a: -12, len: 78, ripe: 1 },
  { b: 4, t: 0.5, a: 6, len: 66, ripe: 0.6 },
  { b: 0, t: 0.7, a: 18, len: 60, ripe: 1 },
  { b: 2, t: 0.92, a: 10, len: 56, ripe: 0 },
  { b: 1, t: 0.88, a: -16, len: 58, ripe: 1 },
];

const FLOWERS: { b: number; t: number }[] = [
  { b: 0, t: 0.88 },
  { b: 3, t: 0.85 },
  { b: 4, t: 0.9 },
];

const LEAF = "M0 0 C -15 -9 -17 -42 0 -58 C 17 -42 15 -9 0 0 Z";

/** A tapering, slightly curved pepper pod hanging tip down from its calyx. */
const pod = (len: number) => {
  const w = len * 0.17;
  return `M0 0 C ${w} ${len * 0.08} ${w * 1.1} ${len * 0.45} ${w * 0.35} ${len * 0.9} C ${w * 0.1} ${len * 1.02} ${-w * 0.25} ${len * 0.98} ${-w * 0.35} ${len * 0.88} C ${-w * 0.95} ${len * 0.5} ${-w} ${len * 0.1} 0 0 Z`;
};

export const ChiliPepper: React.FC<{ c: Ctx }> = ({ c }) => {
  const stem = shade(c.leaf, -0.32);
  const unripe = shade(c.leaf, 0.02);
  const growOf = BRANCHES.map((b) => c.grow(b.delay));
  return (
    <g>
      <ellipse cx={200} cy={350} rx={84} ry={11} fill="#3B2A1E" />
      <g transform={`rotate(${c.sway(1, 0.8)} 200 352) translate(200 352) scale(1.28) translate(-200 -352)`}>
        {BRANCHES.map((b, i) => (
          <path key={i} d={taperPath(b.pts, b.w[0], b.w[1], Math.min(1, growOf[i]))} fill={stem} />
        ))}

        {LEAVES.map((lf, i) => {
          const s = ramp(growOf[lf.b], lf.t - 0.1, lf.t + 0.25) * lf.s;
          const p = along(BRANCHES[lf.b].pts, lf.t);
          const color = leafTone(c.leaf, i);
          return (
            <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.angle + 90 + lf.side * 58 + c.sway(i, 4)}) scale(${s})`}>
              <path d={LEAF} fill={color} />
              <path d="M0 -3 L0 -52" stroke={shade(color, -0.2)} strokeWidth={2} />
              <path d="M-6 -44 C -11 -32 -11 -18 -7 -9" stroke="#fff" strokeOpacity={0.2} strokeWidth={3.5} fill="none" strokeLinecap="round" />
            </g>
          );
        })}

        {FLOWERS.map((f, i) => {
          const s = c.grow(28 + i * 4) * 0.9;
          const p = along(BRANCHES[f.b].pts, f.t);
          return (
            <g key={i} transform={`translate(${p.x + 6} ${p.y + 10}) scale(${s})`}>
              {[0, 72, 144, 216, 288].map((a) => (
                <ellipse key={a} cx={0} cy={-6} rx={3.6} ry={7} fill="#F6F2E4" transform={`rotate(${a})`} />
              ))}
              <circle r={3} fill="#B9C76A" />
            </g>
          );
        })}

        {PODS.map((pd, i) => {
          const g = c.grow(34 + i * 4);
          // Pods set green, then colour up a beat later.
          const ripen = c.grow(54 + i * 5) * pd.ripe;
          const color = pd.ripe < 1 && pd.ripe > 0 ? mix(unripe, "#F08A24", ripen / pd.ripe) : mix(unripe, c.accent, ripen);
          const p = along(BRANCHES[pd.b].pts, pd.t);
          const len = pd.len;
          return (
            <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${pd.a + c.sway(i + 4, 3)}) scale(${g})`}>
              <path d="M0 -4 C 2 2 1 6 0 10" stroke={stem} strokeWidth={3} fill="none" strokeLinecap="round" />
              <g transform="translate(0 9)">
                <path d={pod(len)} fill={color} />
                <path d={pod(len)} fill="none" stroke={shade(color, -0.2)} strokeWidth={1.5} />
                <path d={`M${-len * 0.06} ${len * 0.12} C ${-len * 0.1} ${len * 0.35} ${-len * 0.08} ${len * 0.6} ${-len * 0.03} ${len * 0.78}`} stroke="#fff" strokeOpacity={0.35} strokeWidth={3} fill="none" strokeLinecap="round" />
                {/* Calyx cap where the pod meets its stalk. */}
                <path d={`M${-len * 0.17} ${len * 0.05} Q 0 ${-len * 0.06} ${len * 0.17} ${len * 0.05} Q 0 ${len * 0.12} ${-len * 0.17} ${len * 0.05} Z`} fill={shade(c.leaf, -0.1)} />
              </g>
            </g>
          );
        })}
      </g>

      <GrowBag color={c.pot} />
    </g>
  );
};

/** A felt grow bag with a rolled cuff and side handles: the balcony chilli grower's pot. */
const GrowBag: React.FC<{ color: string }> = ({ color }) => (
  <g>
    {[-1, 1].map((side) => (
      <path
        key={side}
        d={`M${200 + side * 78} 360 C ${200 + side * 112} 352 ${200 + side * 116} 394 ${200 + side * 92} 404`}
        stroke={shade(color, -0.2)}
        strokeWidth={9}
        fill="none"
        strokeLinecap="round"
      />
    ))}
    <path d="M110 354 L290 354 L284 496 Q 283 508 270 508 L130 508 Q 117 508 116 496 Z" fill={color} />
    {[150, 182, 222, 256].map((x, k) => (
      <path key={x} d={`M${x} 380 C ${x + (k % 2 ? 4 : -4)} 420 ${x + (k % 2 ? -3 : 3)} 460 ${x} 500`} stroke={shade(color, -0.14)} strokeWidth={2.5} fill="none" opacity={0.7} />
    ))}
    <path d="M128 500 Q 200 494 272 500" stroke={shade(color, -0.2)} strokeWidth={3} fill="none" />
    {/* Rolled cuff with a stitch line. */}
    <rect x={104} y={340} width={192} height={30} rx={8} fill={shade(color, 0.1)} />
    <path d="M112 362 L288 362" stroke={shade(color, -0.22)} strokeWidth={2} strokeDasharray="6 5" />
    <rect x={110} y={342} width={180} height={6} rx={3} fill="#fff" opacity={0.18} />
  </g>
);

export const drawing: PlantDrawing = { id: "chili-pepper", Component: ChiliPepper };
