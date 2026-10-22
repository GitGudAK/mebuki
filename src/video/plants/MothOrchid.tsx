import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, type Pt, along, polyline, ramp, spline } from "./kit";

const X = 200;
const Y = 372;

// Broad, leathery strap leaves fanning almost flat from the crown.
const LEAVES = [
  { a: -100, L: 112, W: 50, delay: 0 },
  { a: 96, L: 128, W: 54, delay: 2 },
  { a: -74, L: 134, W: 56, delay: 4 },
  { a: 66, L: 96, W: 46, delay: 8 },
];

const SPIKE: Pt[] = [[206, 366], [212, 300], [214, 230], [216, 172], [230, 132], [264, 112], [304, 118], [334, 146], [348, 182]];

// Flowers open from the base of the arch outward; the tip still carries buds.
const BLOOMS = [
  { t: 0.44, s: 0.95 },
  { t: 0.6, s: 1 },
  { t: 0.76, s: 0.94 },
  { t: 0.9, s: 0.8 },
];
const BUDS = [0.97, 1];

const ROOTS: Pt[][] = [
  [[186, 376], [160, 380], [142, 394], [132, 424]],
  [[214, 376], [248, 374], [276, 388], [292, 418]],
  [[196, 372], [176, 360], [150, 362], [128, 352]],
];

const strap = (L: number, W: number) =>
  `M0 0 C ${-W * 0.5} ${-L * 0.06} ${-W * 0.58} ${-L * 0.78} ${-W * 0.16} ${-L * 0.97} Q 0 ${-L * 1.03} ${W * 0.16} ${-L * 0.97} C ${W * 0.58} ${-L * 0.78} ${W * 0.5} ${-L * 0.06} 0 0 Z`;
const half = (L: number, W: number) =>
  `M0 0 C ${-W * 0.5} ${-L * 0.06} ${-W * 0.58} ${-L * 0.78} ${-W * 0.16} ${-L * 0.97} Q 0 ${-L * 1.03} 0 ${-L * 0.99} Z`;

/** A moth orchid flower face-on: three sepals, two broad round petals and a small lip. */
const Bloom: React.FC<{ color: string }> = ({ color }) => {
  const vein = mix(color, "#A0215F", 0.35);
  const lip = mix(color, "#9E1A55", 0.7);
  return (
    <g>
      {[0, 128, -128].map((a) => (
        <path key={a} d="M0 0 C -10 -6 -12 -26 0 -32 C 12 -26 10 -6 0 0 Z" fill={shade(color, 0.08)} transform={`rotate(${a})`} />
      ))}
      {[-1, 1].map((v) => (
        <g key={v} transform={`scale(${v} 1)`}>
          <path d="M0 0 C 8 -18 26 -26 36 -18 C 44 -10 38 6 24 10 C 14 12 4 6 0 0 Z" fill={color} />
          {[-12, 0, 12].map((a) => (
            <path key={a} d="M2 -1 L30 -8" stroke={vein} strokeWidth={1} opacity={0.5} transform={`rotate(${a})`} />
          ))}
          <path d="M14 -14 C 22 -20 30 -20 34 -16" stroke="#fff" strokeOpacity={0.35} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </g>
      ))}
      {/* Lip with its two curled side lobes and yellow callus; the white column above. */}
      <path d="M-8 2 C -12 -4 -6 -8 0 -4 C 6 -8 12 -4 8 2 C 6 12 4 18 0 20 C -4 18 -6 12 -8 2 Z" fill={lip} />
      <ellipse cx={0} cy={2} rx={4} ry={3} fill="#F2C94C" />
      <ellipse cx={0} cy={-5} rx={3} ry={4} fill="#FFF6FA" />
    </g>
  );
};

export const MothOrchid: React.FC<{ c: Ctx }> = ({ c }) => {
  const sp = c.grow(14);
  const shown = Math.min(1, sp);
  const spikeCol = mix(c.leaf, "#6B4A5A", 0.45);
  const root = "#C9CEBF";
  return (
    <g>
      <ClearPot />

      {/* Bamboo stake with clips, the spike trained up it and arching over. */}
      <path d="M214 400 L216 168" stroke="#B89A62" strokeWidth={4} strokeLinecap="round" opacity={Math.min(1, c.grow(4))} />
      <g transform={`rotate(${c.sway(2, 0.7)} 206 366)`}>
        <path d={polyline(spline(SPIKE, shown, 40))} stroke={spikeCol} strokeWidth={4} fill="none" strokeLinecap="round" />
        {[0.12, 0.3].map((t) => {
          const p = along(SPIKE, t);
          return <rect key={t} x={p.x - 4} y={p.y - 3} width={10} height={5} rx={2} fill="#E9E6DA" opacity={ramp(sp, t, t + 0.1)} />;
        })}
        {BUDS.map((t, k) => {
          const p = along(SPIKE, Math.min(t, shown));
          const s = ramp(sp, t - 0.1, t) * (k ? 0.7 : 0.9);
          return <ellipse key={t} cx={p.x} cy={p.y + 6} rx={8 * s} ry={10 * s} fill={mix(c.accent, c.leaf, 0.35)} />;
        })}
        {BLOOMS.map((b, i) => {
          const p = along(SPIKE, b.t);
          const s = c.grow(40 + i * 5) * b.s * 1.4;
          return (
            <g key={i}>
              <path d={`M${p.x} ${p.y} q 4 10 0 22`} stroke={spikeCol} strokeWidth={2.5} fill="none" opacity={ramp(sp, b.t, b.t + 0.05)} />
              <g transform={`translate(${p.x} ${p.y + 34}) rotate(${(i - 1.5) * 6 + c.sway(i + 4, 3)}) scale(${s})`}>
                <Bloom color={c.accent} />
              </g>
            </g>
          );
        })}
      </g>

      {/* Silvery aerial roots with green growing tips, wandering over the rim. */}
      {ROOTS.map((r, i) => {
        const g = Math.min(1, c.grow(18 + i * 4));
        const line = spline(r, g, 16);
        const tip = line[line.length - 1];
        return (
          <g key={i}>
            <path d={polyline(line)} stroke={root} strokeWidth={7} fill="none" strokeLinecap="round" />
            <path d={polyline(line)} stroke="#fff" strokeOpacity={0.3} strokeWidth={2} fill="none" strokeLinecap="round" />
            <circle cx={tip[0]} cy={tip[1]} r={3.6} fill="#7FB06A" opacity={g} />
          </g>
        );
      })}

      {LEAVES.map((lf, i) => {
        const g = c.grow(lf.delay);
        const col = shade(c.leaf, ((i % 3) - 1) * 0.06);
        return (
          <g key={i} transform={`translate(${X} ${Y}) rotate(${lf.a + c.sway(i, 1)}) scale(${Math.min(1.05, 0.4 + 0.6 * g)} ${g})`}>
            <path d={strap(lf.L, lf.W)} fill={col} />
            {/* Keeled: one half of the blade catches more light. */}
            <path d={half(lf.L, lf.W)} fill={shade(col, 0.1)} />
            <path d={`M0 -4 L0 ${-lf.L * 0.95}`} stroke={shade(col, -0.22)} strokeWidth={2} />
            <path d={`M${-lf.W * 0.28} ${-lf.L * 0.2} C ${-lf.W * 0.36} ${-lf.L * 0.45} ${-lf.W * 0.32} ${-lf.L * 0.7} ${-lf.W * 0.18} ${-lf.L * 0.86}`} stroke="#fff" strokeOpacity={0.25} strokeWidth={4} fill="none" strokeLinecap="round" />
          </g>
        );
      })}

      <Cachepot color={c.pot} />
    </g>
  );
};

/** The clear nursery pot: bark chips and roots showing through the plastic. */
const ClearPot: React.FC = () => {
  const chips = Array.from({ length: 30 }, (_, k) => ({
    x: 150 + ((k * 41) % 100),
    y: 378 + ((k * 23) % 60),
    w: 12 + ((k * 7) % 8),
    a: (k * 47) % 180,
    col: ["#8A5A3A", "#A8714A", "#6E452C", "#B88458"][k % 4],
  }));
  return (
    <g>
      <path d="M142 374 L258 374 L252 446 L148 446 Z" fill="#5A3D29" />
      {chips.map((ch, k) => (
        <rect key={k} x={ch.x - ch.w / 2} y={ch.y - 4} width={ch.w} height={8} rx={2} fill={ch.col} transform={`rotate(${ch.a} ${ch.x} ${ch.y})`} />
      ))}
      <path d="M160 384 C 172 400 168 418 178 436 M236 382 C 226 402 236 420 228 440" stroke="#C9CEBF" strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d="M142 374 L258 374 L252 446 L148 446 Z" fill="#E8F2F6" opacity={0.18} />
      <path d="M150 382 L146 440" stroke="#fff" strokeOpacity={0.55} strokeWidth={4} strokeLinecap="round" />
      <path d="M248 382 L250 440" stroke="#fff" strokeOpacity={0.2} strokeWidth={3} strokeLinecap="round" />
      <rect x={138} y={368} width={124} height={8} rx={3} fill="#EEF5F8" opacity={0.75} />
    </g>
  );
};

/** A glossy ceramic cachepot with a rolled foot. */
const Cachepot: React.FC<{ color: string }> = ({ color }) => (
  <g>
    <path d="M132 432 L268 432 L262 500 Q 261 508 252 508 L148 508 Q 139 508 138 500 Z" fill={color} />
    <path d="M136 470 L264 470" stroke={shade(color, -0.12)} strokeWidth={2.5} />
    <path d="M136 478 L264 478" stroke={shade(color, -0.12)} strokeWidth={2.5} />
    <path d="M150 444 L148 496" stroke="#fff" strokeOpacity={0.55} strokeWidth={8} strokeLinecap="round" />
    <path d="M254 444 L252 496" stroke="#000" strokeOpacity={0.1} strokeWidth={10} strokeLinecap="round" />
    <rect x={126} y={424} width={148} height={14} rx={7} fill={shade(color, 0.05)} />
    <rect x={132} y={425} width={136} height={4} rx={2} fill="#fff" opacity={0.6} />
  </g>
);

export const drawing: PlantDrawing = { id: "moth-orchid", Component: MothOrchid, anchors: { soil: [200, 410], snip: [244, 352], snipR: 48 } };
