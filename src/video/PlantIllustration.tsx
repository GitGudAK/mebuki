import React from "react";
import { spring, useCurrentFrame, useVideoConfig, interpolate } from "../motion";
import type { PlantGuide } from "../types";
import { mix, shade } from "./colors";

type LeafShape = PlantGuide["leafShape"];
type Palette = PlantGuide["palette"];

export type PlantIllustrationProps = {
  leafShape: LeafShape;
  palette: Palette;
  /** Rendered width in px; height follows the 400:560 viewBox. */
  width?: number;
  /** Frame (relative to the parent Sequence) at which the plant starts growing. */
  growStart?: number;
  /** Unique-ish prefix for SVG defs ids (needed if several plants render at once). */
  idPrefix?: string;
  style?: React.CSSProperties;
};

export const PLANT_VIEWBOX = { width: 400, height: 560 };

const BASE_X = 200;
const BASE_Y = 344;
const SOIL = "#5A3D29";

type Ctx = {
  frame: number;
  grow: (delay: number) => number;
  sway: (i: number, amp?: number) => number;
  leaf: string;
  accent: string;
  bg: string;
  id: string;
};

const leafTone = (leaf: string, i: number) =>
  shade(leaf, ((i % 3) - 1) * 0.08);

/* ---------------------------------------------------------------- shapes */

const RoundPlant: React.FC<{ c: Ctx }> = ({ c }) => {
  const angles = [-62, -40, -18, 2, 20, 42, 64];
  const lengths = [140, 195, 240, 270, 235, 190, 145];
  // Draw outer leaves first so the centre sits on top.
  const order = [0, 6, 1, 5, 2, 4, 3];
  return (
    <g>
      {order.map((i) => {
        const g = c.grow(4 + Math.abs(i - 3) * 4);
        const len = lengths[i] * Math.min(1, g);
        const r = 46 * g;
        const color = leafTone(c.leaf, i);
        return (
          <g
            key={i}
            transform={`translate(${BASE_X} ${BASE_Y}) rotate(${angles[i] + c.sway(i)})`}
          >
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={-len}
              stroke={shade(c.leaf, -0.25)}
              strokeWidth={6}
              strokeLinecap="round"
            />
            <g transform={`translate(0 ${-len - r * 0.7}) rotate(${-angles[i] * 0.4})`}>
              <circle r={r} fill={color} />
              <circle r={r} fill="none" stroke={shade(color, -0.18)} strokeWidth={3} />
              <circle cx={0} cy={r * 0.25} r={4 * g} fill={shade(color, -0.3)} />
              {[-50, -10, 30, 70, 110, 150, 190].map((a) => (
                <line
                  key={a}
                  x1={0}
                  y1={r * 0.25}
                  x2={Math.cos((a * Math.PI) / 180) * r * 0.8}
                  y2={r * 0.25 - Math.sin((a * Math.PI) / 180) * r * 0.75}
                  stroke={shade(color, 0.18)}
                  strokeWidth={2}
                  opacity={0.6}
                />
              ))}
              <ellipse cx={-r * 0.35} cy={-r * 0.4} rx={r * 0.25} ry={r * 0.12} fill="#fff" opacity={0.18} transform={`rotate(-30 ${-r * 0.35} ${-r * 0.4})`} />
            </g>
          </g>
        );
      })}
    </g>
  );
};

const LongPlant: React.FC<{ c: Ctx }> = ({ c }) => {
  const blades = [
    { a: -24, h: 250, w: 38 },
    { a: 24, h: 245, w: 38 },
    { a: -13, h: 320, w: 44 },
    { a: 12, h: 310, w: 44 },
    { a: -2, h: 365, w: 48 },
  ];
  const edge = mix(c.leaf, "#E7D86A", 0.7);
  return (
    <g>
      {blades.map((b, i) => {
        const g = c.grow(i * 5);
        const d = `M0 0 C ${-b.w} ${-b.h * 0.25} ${-b.w * 0.8} ${-b.h * 0.75} 0 ${-b.h} C ${b.w * 0.8} ${-b.h * 0.75} ${b.w} ${-b.h * 0.25} 0 0 Z`;
        const color = leafTone(c.leaf, i);
        const clip = `${c.id}-blade-${i}`;
        return (
          <g
            key={i}
            transform={`translate(${BASE_X + b.a * 0.6} ${BASE_Y}) rotate(${b.a + c.sway(i, 2)}) scale(${Math.min(1.05, 0.3 + g * 0.7)} ${g})`}
          >
            <defs>
              <clipPath id={clip}>
                <path d={d} />
              </clipPath>
            </defs>
            <path d={d} fill={color} />
            <g clipPath={`url(#${clip})`}>
              {[0.18, 0.32, 0.46, 0.6, 0.74].map((t) => (
                <path
                  key={t}
                  d={`M${-b.w} ${-b.h * t + 10} Q 0 ${-b.h * t - 14} ${b.w} ${-b.h * t + 10}`}
                  stroke={shade(color, -0.25)}
                  strokeWidth={7}
                  fill="none"
                  opacity={0.55}
                />
              ))}
            </g>
            <path d={d} fill="none" stroke={edge} strokeWidth={5} />
          </g>
        );
      })}
    </g>
  );
};

const SplitPlant: React.FC<{ c: Ctx }> = ({ c }) => {
  const leaves = [
    { a: -58, len: 150, s: 0.72 },
    { a: 56, len: 145, s: 0.7 },
    { a: -28, len: 215, s: 0.86 },
    { a: 26, len: 205, s: 0.84 },
    { a: -2, len: 255, s: 0.95 },
  ];
  const maskId = `${c.id}-monstera`;
  const leafPath =
    "M0 0 C -70 -8 -112 -78 -84 -148 C -60 -200 -16 -206 0 -184 C 16 -206 60 -200 84 -148 C 112 -78 70 -8 0 0 Z";
  const slits: [number, number, number, number][] = [
    [-22, -40, -105, -58],
    [-26, -82, -115, -108],
    [-22, -125, -100, -160],
    [22, -40, 105, -58],
    [26, -82, 115, -108],
    [22, -125, 100, -160],
  ];
  return (
    <g>
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x={-200} y={-260} width={400} height={300}>
          <rect x={-200} y={-260} width={400} height={300} fill="#000" />
          <path d={leafPath} fill="#fff" />
          {slits.map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000" strokeWidth={11} strokeLinecap="round" />
          ))}
          <circle cx={-48} cy={-100} r={7} fill="#000" />
          <circle cx={48} cy={-100} r={7} fill="#000" />
        </mask>
      </defs>
      {leaves.map((l, i) => {
        const g = c.grow(i * 5);
        const len = l.len * Math.min(1, g);
        const color = leafTone(c.leaf, i);
        return (
          <g
            key={i}
            transform={`translate(${BASE_X} ${BASE_Y}) rotate(${l.a + c.sway(i)})`}
          >
            <path
              d={`M0 0 Q ${l.a * 0.3} ${-len * 0.5} 0 ${-len}`}
              stroke={shade(c.leaf, -0.28)}
              strokeWidth={7}
              fill="none"
              strokeLinecap="round"
            />
            <g transform={`translate(0 ${-len + 12}) scale(${l.s * g})`}>
              <g mask={`url(#${maskId})`}>
                <path d={leafPath} fill={color} />
                <path d="M0 0 L0 -180" stroke={shade(color, -0.25)} strokeWidth={5} />
                <path d="M-84 -148 C -60 -200 -16 -206 0 -184" stroke="#fff" strokeOpacity={0.15} strokeWidth={8} fill="none" />
              </g>
            </g>
          </g>
        );
      })}
    </g>
  );
};

const SucculentPlant: React.FC<{ c: Ctx }> = ({ c }) => {
  const leafD = (len: number, w: number) =>
    `M0 0 C ${-w} ${-len * 0.2} ${-w * 1.05} ${-len * 0.72} 0 ${-len} C ${w * 1.05} ${-len * 0.72} ${w} ${-len * 0.2} 0 0 Z`;
  const rings = [
    { count: 9, spread: 92, len: 118, w: 30, tone: 0.18, delay: 0 },
    { count: 7, spread: 66, len: 100, w: 28, tone: 0.06, delay: 8 },
    { count: 5, spread: 40, len: 80, w: 24, tone: -0.06, delay: 16 },
    { count: 3, spread: 16, len: 58, w: 20, tone: -0.14, delay: 24 },
  ];
  const tip = mix(c.leaf, c.accent, 0.55);
  const baseY = BASE_Y - 4;
  return (
    <g transform={`translate(${BASE_X} ${baseY}) scale(1.5) translate(${-BASE_X} ${-baseY})`}>
      {/* small pup on the side */}
      {[-1, 1].map((side) => {
        const g = c.grow(30 + (side > 0 ? 6 : 0));
        return (
          <g key={side} transform={`translate(${BASE_X + side * 52} ${baseY + 2}) scale(${g * 0.4})`}>
            {[-60, -30, 0, 30, 60].map((a) => (
              <path key={a} d={leafD(90, 26)} transform={`rotate(${a})`} fill={shade(c.leaf, 0.12)} stroke={tip} strokeWidth={3} />
            ))}
          </g>
        );
      })}
      {rings.map((ring, ri) => (
        <g key={ri}>
          {Array.from({ length: ring.count }).map((_, k) => {
            const a = ring.count === 1 ? 0 : -ring.spread + (2 * ring.spread * k) / (ring.count - 1);
            const g = c.grow(ring.delay + Math.abs(k - (ring.count - 1) / 2) * 2);
            const color = shade(c.leaf, ring.tone);
            return (
              <g
                key={k}
                transform={`translate(${BASE_X} ${baseY}) rotate(${a + c.sway(ri * 10 + k, 0.8)}) scale(${g})`}
              >
                <path d={leafD(ring.len, ring.w)} fill={color} />
                <path d={leafD(ring.len, ring.w)} fill="none" stroke={tip} strokeWidth={3} opacity={0.8} />
                <path d={`M0 ${-ring.len * 0.15} L0 ${-ring.len * 0.8}`} stroke="#fff" strokeOpacity={0.2} strokeWidth={4} strokeLinecap="round" />
              </g>
            );
          })}
        </g>
      ))}
    </g>
  );
};

const heart = (s: number) =>
  `M0 0 C ${-22 * s} ${-8 * s} ${-30 * s} ${-32 * s} ${-14 * s} ${-42 * s} C ${-6 * s} ${-46 * s} 0 ${-40 * s} 0 ${-36 * s} C 0 ${-40 * s} ${6 * s} ${-46 * s} ${14 * s} ${-42 * s} C ${30 * s} ${-32 * s} ${22 * s} ${-8 * s} 0 0 Z`;

const TrailingTop: React.FC<{ c: Ctx }> = ({ c }) => {
  const top = [
    { a: -45, len: 70, s: 1.9 },
    { a: 40, len: 80, s: 1.9 },
    { a: -15, len: 120, s: 2.1 },
    { a: 14, len: 105, s: 2.0 },
  ];
  return (
    <g>
      {top.map((t, i) => {
        const g = c.grow(i * 4);
        const color = leafTone(c.leaf, i);
        return (
          <g key={i} transform={`translate(${BASE_X} ${BASE_Y}) rotate(${t.a + c.sway(i)})`}>
            <line x1={0} y1={0} x2={0} y2={-t.len * g} stroke={shade(c.leaf, -0.25)} strokeWidth={5} strokeLinecap="round" />
            <g transform={`translate(0 ${-t.len * g}) scale(${g})`}>
              <path d={heart(t.s)} fill={color} />
              <path d={`M0 0 L0 ${-34 * t.s}`} stroke={shade(color, 0.2)} strokeWidth={3} />
              <path d={heart(t.s)} fill="none" stroke={mix(color, "#F2E7A0", 0.5)} strokeWidth={2} opacity={0.5} />
            </g>
          </g>
        );
      })}
    </g>
  );
};

const TrailingVines: React.FC<{ c: Ctx }> = ({ c }) => {
  const vines = [
    {
      d: "M112 350 C 70 372 62 430 78 470 C 92 506 74 536 62 552",
      pivot: [112, 350],
      leaves: [
        { x: 84, y: 378, a: -70, t: 0.15 },
        { x: 68, y: 425, a: 70, t: 0.35 },
        { x: 80, y: 470, a: -60, t: 0.6 },
        { x: 80, y: 512, a: 60, t: 0.8 },
        { x: 64, y: 548, a: -30, t: 0.97 },
      ],
      delay: 18,
    },
    {
      d: "M290 350 C 332 376 340 420 326 458 C 314 488 330 508 336 520",
      pivot: [290, 350],
      leaves: [
        { x: 318, y: 375, a: 70, t: 0.18 },
        { x: 336, y: 420, a: -70, t: 0.45 },
        { x: 322, y: 466, a: 60, t: 0.72 },
        { x: 334, y: 516, a: -40, t: 0.97 },
      ],
      delay: 26,
    },
  ];
  return (
    <g>
      {vines.map((v, vi) => {
        const g = interpolate(c.grow(v.delay), [0, 1], [0, 1], { extrapolateRight: "clamp" });
        const rot = c.sway(vi + 5, 2.5);
        return (
          <g key={vi} transform={`rotate(${rot} ${v.pivot[0]} ${v.pivot[1]})`}>
            <path d={v.d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - g} stroke={shade(c.leaf, -0.3)} strokeWidth={5} fill="none" strokeLinecap="round" />
            {v.leaves.map((l, li) => {
              const s = interpolate(g, [l.t - 0.05, l.t + 0.12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              const color = leafTone(c.leaf, li + vi);
              return (
                <g key={li} transform={`translate(${l.x} ${l.y}) rotate(${l.a + c.sway(li + vi * 3, 6)}) scale(${s})`}>
                  <path d={heart(1.15)} fill={color} />
                  <path d={`M0 0 L0 -40`} stroke={shade(color, 0.2)} strokeWidth={2.5} />
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
};

const HerbPlant: React.FC<{ c: Ctx }> = ({ c }) => {
  const stems = [
    { a: -20, len: 215 },
    { a: 20, len: 205 },
    { a: -2, len: 275 },
  ];
  const leafD = "M0 0 C -20 -10 -26 -48 0 -66 C 26 -48 20 -10 0 0 Z";
  return (
    <g>
      {stems.map((st, i) => {
        const g = c.grow(i * 6);
        const len = st.len * Math.min(1, g);
        const nodes = [0.32, 0.56, 0.78];
        return (
          <g key={i} transform={`translate(${BASE_X} ${BASE_Y}) rotate(${st.a + c.sway(i, 2.5)})`}>
            <line x1={0} y1={0} x2={0} y2={-len} stroke={shade(c.leaf, -0.2)} strokeWidth={7} strokeLinecap="round" />
            {nodes.map((n, ni) => {
              const s = interpolate(g, [n - 0.05, n + 0.25], [0, 1 - ni * 0.12], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              return [-1, 1].map((side) => {
                const color = leafTone(c.leaf, ni + side + i);
                return (
                  <g key={`${ni}-${side}`} transform={`translate(0 ${-st.len * n}) rotate(${side * (62 - ni * 6) + c.sway(ni + side * 4 + i, 4)}) scale(${s * 1.15})`}>
                    <path d={leafD} fill={color} />
                    <path d="M0 -4 L0 -58" stroke={shade(color, 0.22)} strokeWidth={3} />
                    {[-1, 1].map((v) => (
                      <path key={v} d={`M0 -26 L${v * 12} -38 M0 -42 L${v * 9} -52`} stroke={shade(color, 0.22)} strokeWidth={2} />
                    ))}
                  </g>
                );
              });
            })}
            {/* top cluster */}
            {[-28, 28, 0].map((a, k) => {
              const s = interpolate(g, [0.85, 1.05], [0, 0.75 - (k === 2 ? 0.15 : 0)], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              return (
                <g key={k} transform={`translate(0 ${-len}) rotate(${a}) scale(${s})`}>
                  <path d={leafD} fill={shade(c.leaf, 0.14)} />
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
};

const CactusPlant: React.FC<{ c: Ctx }> = ({ c }) => {
  const body = c.leaf;
  const rib = shade(body, -0.22);
  const spine = mix(body, "#FFF6DA", 0.75);
  const column = "M-46 0 L-46 -205 A46 46 0 0 1 46 -205 L46 0 Z";
  const clip = `${c.id}-cactus`;
  const g = c.grow(0);
  const arms = [
    { d: "M-20 -105 H-78 V-178", delay: 14, spines: [[-78, -130], [-78, -158], [-52, -105]] },
    { d: "M20 -150 H76 V-222", delay: 20, spines: [[76, -175], [76, -203], [50, -150]] },
  ];
  const Spine = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x} ${y})`} stroke={spine} strokeWidth={2.5} strokeLinecap="round">
      <line x1={-6} y1={-4} x2={6} y2={4} />
      <line x1={-6} y1={4} x2={6} y2={-4} />
      <line x1={0} y1={-7} x2={0} y2={7} />
    </g>
  );
  return (
    <g transform={`translate(${BASE_X} ${BASE_Y}) rotate(${c.sway(1, 0.6)})`}>
      {arms.map((arm, i) => {
        const s = c.grow(arm.delay);
        return (
          <g key={i} opacity={Math.min(1, s * 2)}>
            <path
              d={arm.d}
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - Math.min(1, s)}
              stroke={shade(body, 0.04)}
              strokeWidth={46}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d={arm.d}
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - Math.min(1, s)}
              stroke={rib}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={0.7}
            />
            {s > 0.9 && arm.spines.map(([x, y], k) => <Spine key={k} x={x} y={y} />)}
          </g>
        );
      })}
      <g transform={`scale(${0.4 + 0.6 * Math.min(1, g)} ${g})`}>
        <defs>
          <clipPath id={clip}>
            <path d={column} />
          </clipPath>
        </defs>
        <path d={column} fill={body} />
        <g clipPath={`url(#${clip})`}>
          {[-30, -15, 0, 15, 30].map((x) => (
            <path key={x} d={`M${x} 0 L${x * 0.8} -252`} stroke={rib} strokeWidth={5} opacity={0.65} />
          ))}
          <rect x={-46} y={-260} width={22} height={260} fill="#fff" opacity={0.1} />
        </g>
        {[-30, 0, 30].flatMap((x) =>
          [-40, -90, -140, -190].map((y) => <Spine key={`${x}${y}`} x={x * (1 + y / 1260)} y={y + (x === 0 ? 22 : 0)} />),
        )}
      </g>
      {/* A small flower crowns the column once it has grown. */}
      <g transform={`translate(0 ${-250 * Math.min(1, g)}) scale(${c.grow(32) * 0.9})`}>
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <ellipse key={a} cx={0} cy={-14} rx={8} ry={16} fill={c.accent} transform={`rotate(${a})`} />
        ))}
        <circle r={8} fill={shade(c.accent, 0.35)} />
        <circle r={4} fill="#F7D54A" />
      </g>
    </g>
  );
};

const FloweringPlant: React.FC<{ c: Ctx }> = ({ c }) => {
  const stems = [
    { a: -30, len: 215, flower: true },
    { a: 26, len: 230, flower: true },
    { a: -4, len: 290, flower: true },
  ];
  const leafD = "M0 0 C -24 -10 -30 -46 -10 -64 L0 -78 L10 -64 C 30 -46 24 -10 0 0 Z";
  const petal = "M0 0 C -30 -14 -38 -54 -16 -64 C -6 -70 6 -70 16 -64 C 38 -54 30 -14 0 0 Z";
  const bloom = c.accent;
  return (
    <g>
      {stems.map((st, i) => {
        const g = c.grow(i * 6);
        const len = st.len * Math.min(1, g);
        const nodes = [0.3, 0.5, 0.7, 0.86];
        const f = c.grow(30 + i * 6);
        return (
          <g key={i} transform={`translate(${BASE_X} ${BASE_Y}) rotate(${st.a + c.sway(i, 2)})`}>
            <path d={`M0 0 Q ${st.a * 0.2} ${-len * 0.5} 0 ${-len}`} stroke={shade(c.leaf, -0.45)} strokeWidth={6} fill="none" strokeLinecap="round" />
            {nodes.map((n, ni) => {
              const side = ni % 2 === 0 ? -1 : 1;
              const s = interpolate(g, [n - 0.1, n + 0.2], [0, 1.25 - ni * 0.08], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              const color = leafTone(c.leaf, ni + i);
              return (
                <g key={ni} transform={`translate(0 ${-st.len * n}) rotate(${side * 58 + c.sway(ni + i * 4, 4)}) scale(${s})`}>
                  <path d={leafD} fill={color} />
                  <path d="M0 -4 L0 -70" stroke={shade(color, 0.2)} strokeWidth={2.5} />
                  <path d="M-8 -56 C -16 -40 -18 -24 -12 -12" stroke="#fff" strokeOpacity={0.18} strokeWidth={4} fill="none" strokeLinecap="round" />
                </g>
              );
            })}
            {st.flower && (
              <g transform={`translate(0 ${-len - 10}) rotate(${-st.a * 0.6}) scale(${f * 0.92})`}>
                {[0, 72, 144, 216, 288].map((a) => (
                  <g key={a} transform={`rotate(${a})`}>
                    <path d={petal} fill={bloom} />
                    <path d={petal} fill="none" stroke={shade(bloom, -0.18)} strokeWidth={2} />
                    <path d="M0 -6 L0 -50" stroke={shade(bloom, -0.25)} strokeWidth={2} opacity={0.5} />
                  </g>
                ))}
                <circle r={16} fill={shade(bloom, -0.45)} />
                {/* Hibiscus staminal column with pollen tips. */}
                <path d="M0 0 L22 -40" stroke={mix(bloom, "#FFF2C2", 0.5)} strokeWidth={4} strokeLinecap="round" />
                {[[18, -36], [24, -40], [20, -44], [26, -46]].map(([x, y], k) => (
                  <circle key={k} cx={x} cy={y} r={3.2} fill="#F7D54A" />
                ))}
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};

/** Point and direction on a quadratic bezier, for laying leaflets along a curved frond. */
const qbez = (p0: number[], p1: number[], p2: number[], t: number) => {
  const u = 1 - t;
  const x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0];
  const y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
  const dx = 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
  const dy = 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
  return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
};

/** A frond: an arching midrib with paired leaflets that shrink towards the tip. */
const Frond: React.FC<{
  c: Ctx;
  i: number;
  angle: number;
  length: number;
  bend: number;
  grow: number;
  leaflet: number;
  pairs: number;
  slender?: boolean;
  /** Where leaflets begin along the frond (0 = base); palms have a bare stalk. */
  leafStart?: number;
}> = ({ c, i, angle, length, bend, grow, leaflet, pairs, slender = false, leafStart = 0.18 }) => {
  const p0 = [0, 0];
  const p1 = [0, -length * 0.85];
  const p2 = [bend * length * 0.55, -length * 0.7];
  const color = leafTone(c.leaf, i);
  const shown = Math.min(1, grow);
  const steps = 22;
  const rib = Array.from({ length: steps + 1 }, (_, k) => qbez(p0, p1, p2, (k / steps) * shown));
  const d = rib.map((p, k) => `${k ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  return (
    <g transform={`translate(${BASE_X} ${BASE_Y}) rotate(${angle + c.sway(i, 2)})`}>
      <path d={d} stroke={shade(c.leaf, -0.3)} strokeWidth={slender ? 4 : 3.5} fill="none" strokeLinecap="round" />
      {Array.from({ length: pairs }).map((_, k) => {
        const t = leafStart + (k / pairs) * (0.98 - leafStart);
        if (t > shown) return null;
        const p = qbez(p0, p1, p2, t);
        const size = leaflet * (1 - (t - leafStart) * 0.7) * Math.min(1, (shown - t) * 6);
        return [-1, 1].map((side) => (
          <ellipse
            key={`${k}${side}`}
            cx={0}
            cy={-size}
            rx={slender ? size * 0.16 : size * 0.32}
            ry={size}
            fill={side > 0 ? color : shade(color, -0.08)}
            transform={`translate(${p.x} ${p.y}) rotate(${p.angle + 90 + side * (slender ? 62 : 70)})`}
          />
        ));
      })}
    </g>
  );
};

const FernPlant: React.FC<{ c: Ctx }> = ({ c }) => {
  const fronds = [
    { a: -64, l: 230, b: -1 },
    { a: 62, l: 225, b: 1 },
    { a: -40, l: 280, b: -1 },
    { a: 38, l: 275, b: 1 },
    { a: -16, l: 310, b: -1 },
    { a: 14, l: 305, b: 1 },
    { a: -1, l: 260, b: 1 },
  ];
  return (
    <g>
      {fronds.map((f, i) => (
        <Frond key={i} c={c} i={i} angle={f.a} length={f.l} bend={f.b} grow={c.grow(i * 3)} leaflet={26} pairs={16} />
      ))}
    </g>
  );
};

const PalmPlant: React.FC<{ c: Ctx }> = ({ c }) => {
  const fronds = [
    { a: -34, l: 300, b: -0.8 },
    { a: 32, l: 295, b: 0.8 },
    { a: -14, l: 360, b: -0.7 },
    { a: 12, l: 355, b: 0.7 },
    { a: -2, l: 390, b: 0.5 },
  ];
  return (
    <g>
      {fronds.map((f, i) => (
        <Frond key={i} c={c} i={i} angle={f.a} length={f.l} bend={f.b} grow={c.grow(i * 4)} leaflet={44} pairs={12} slender leafStart={0.42} />
      ))}
    </g>
  );
};

const OvalPlant: React.FC<{ c: Ctx }> = ({ c }) => {
  const leafD = "M0 0 C -50 -10 -58 -96 0 -134 C 58 -96 50 -10 0 0 Z";
  const leaves = [
    { t: 0.16, side: -1, s: 1.0 },
    { t: 0.3, side: 1, s: 1.02 },
    { t: 0.46, side: -1, s: 0.98 },
    { t: 0.62, side: 1, s: 0.92 },
    { t: 0.78, side: -1, s: 0.82 },
    { t: 0.9, side: 1, s: 0.7 },
  ];
  const stemLen = 300;
  const g = c.grow(0);
  const len = stemLen * Math.min(1, g);
  const sheath = shade(c.accent, -0.15);
  return (
    <g transform={`translate(${BASE_X} ${BASE_Y}) rotate(${c.sway(2, 1.2)})`}>
      <line x1={0} y1={0} x2={0} y2={-len} stroke={shade(c.leaf, -0.4)} strokeWidth={9} strokeLinecap="round" />
      {leaves.map((l, i) => {
        const s = interpolate(g, [l.t - 0.08, l.t + 0.22], [0, l.s], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const color = leafTone(c.leaf, i);
        return (
          <g key={i} transform={`translate(0 ${-stemLen * l.t}) rotate(${l.side * (64 - i * 3) + c.sway(i + 3, 2.5)}) scale(${s})`}>
            <line x1={0} y1={0} x2={0} y2={-18} stroke={shade(c.leaf, -0.35)} strokeWidth={5} />
            <g transform="translate(0 -14)">
              <path d={leafD} fill={color} />
              <path d="M0 -2 L0 -126" stroke={mix(color, "#F3E9C8", 0.55)} strokeWidth={3} />
              <path d="M-20 -102 C -34 -76 -34 -44 -22 -22" stroke="#fff" strokeOpacity={0.22} strokeWidth={6} fill="none" strokeLinecap="round" />
            </g>
          </g>
        );
      })}
      {/* The new leaf unfurls from a rosy sheath at the tip. */}
      <g transform={`translate(0 ${-len}) scale(${c.grow(24)})`}>
        <path d="M0 6 C -10 -10 -8 -40 0 -58 C 8 -40 10 -10 0 6 Z" fill={sheath} />
        <path d="M0 0 L0 -50" stroke={shade(sheath, 0.3)} strokeWidth={2} />
      </g>
    </g>
  );
};

/* -------------------------------------------------------------------- pot */

const Pot: React.FC<{ pot: string }> = ({ pot }) => (
  <g>
    <path
      d="M112 362 L288 362 L266 498 Q264 508 254 508 L146 508 Q136 508 134 498 Z"
      fill={pot}
    />
    <path d="M150 380 L162 492" stroke="#fff" strokeOpacity={0.18} strokeWidth={12} strokeLinecap="round" />
    <path d="M112 362 L288 362 L284 388 L116 388 Z" fill={shade(pot, -0.18)} opacity={0.45} />
    <rect x={96} y={330} width={208} height={40} rx={12} fill={shade(pot, 0.08)} />
    <rect x={96} y={330} width={208} height={12} rx={6} fill="#fff" opacity={0.14} />
  </g>
);

/* ------------------------------------------------------------- component */

export const PlantIllustration: React.FC<PlantIllustrationProps> = ({
  leafShape,
  palette,
  width = 400,
  growStart = 0,
  idPrefix = "plant",
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - growStart;

  const potIn = spring({ frame: local, fps, config: { damping: 14, stiffness: 140 } });

  const grow = (delay: number) =>
    spring({
      frame: local - 8 - delay,
      fps,
      config: { damping: 11, stiffness: 90, mass: 0.9 },
    });

  const sway = (i: number, amp = 3) => {
    const settle = interpolate(local, [10, 40], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return Math.sin((frame + i * 17) / 16) * amp * settle;
  };

  const c: Ctx = {
    frame,
    grow,
    sway,
    leaf: palette.leaf,
    accent: palette.accent,
    bg: palette.background,
    id: idPrefix,
  };

  const height = (width * PLANT_VIEWBOX.height) / PLANT_VIEWBOX.width;

  return (
    <svg
      viewBox={`0 0 ${PLANT_VIEWBOX.width} ${PLANT_VIEWBOX.height}`}
      width={width}
      height={height}
      style={{ overflow: "visible", ...style }}
    >
      <ellipse cx={200} cy={514} rx={110 * potIn} ry={12} fill="#000" opacity={0.12} />
      <g
        transform={`translate(0 ${(1 - potIn) * 80})`}
        opacity={Math.min(1, potIn * 1.5)}
      >
        <ellipse cx={200} cy={340} rx={96} ry={14} fill={SOIL} />
        {leafShape === "round" && <RoundPlant c={c} />}
        {leafShape === "long" && <LongPlant c={c} />}
        {leafShape === "split" && <SplitPlant c={c} />}
        {leafShape === "succulent" && <SucculentPlant c={c} />}
        {leafShape === "trailing" && <TrailingTop c={c} />}
        {leafShape === "herb" && <HerbPlant c={c} />}
        {leafShape === "cactus" && <CactusPlant c={c} />}
        {leafShape === "flowering" && <FloweringPlant c={c} />}
        {leafShape === "oval" && <OvalPlant c={c} />}
        {leafShape === "fern" && <FernPlant c={c} />}
        {leafShape === "palm" && <PalmPlant c={c} />}
        <Pot pot={palette.pot} />
        {leafShape === "trailing" && <TrailingVines c={c} />}
      </g>
    </svg>
  );
};
