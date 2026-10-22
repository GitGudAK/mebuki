import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, type Pt, along, polyline, ramp, taperPath } from "./kit";

// A rounded shrub: several woody stems from the pot, each branching once.
const STEMS: { pts: Pt[]; w: [number, number]; delay: number }[] = [
  { pts: [[200, 386], [196, 320], [204, 250], [200, 180], [206, 116]], w: [10, 4], delay: 0 },
  { pts: [[196, 376], [164, 330], [126, 284], [96, 226]], w: [8, 3], delay: 4 },
  { pts: [[204, 374], [240, 330], [278, 284], [306, 222]], w: [8, 3], delay: 5 },
  { pts: [[200, 300], [166, 254], [136, 200], [124, 150]], w: [6, 3], delay: 10 },
  { pts: [[202, 276], [240, 236], [266, 184], [278, 140]], w: [6, 3], delay: 11 },
  { pts: [[194, 352], [150, 344], [108, 320], [76, 296]], w: [6, 2.5], delay: 8 },
  { pts: [[206, 350], [254, 344], [296, 320], [326, 294]], w: [6, 2.5], delay: 9 },
];

const leafSpots: { s: number; t: number; side: number; k: number }[] = [];
STEMS.forEach((_, s) => {
  [0.3, 0.45, 0.6, 0.75, 0.9, 1].forEach((t, j) => {
    if (s === 0 && t < 0.4) return;
    leafSpots.push({ s, t, side: j % 2 ? 1 : -1, k: s * 7 + j });
  });
});

const FLOWERS = [
  { x: 112, y: 214, s: 0.95, col: -24, delay: 40 },
  { x: 290, y: 206, s: 1, col: 30, delay: 44 },
  { x: 206, y: 128, s: 0.9, col: 10, delay: 48 },
  { x: 182, y: 286, s: 0.82, col: -30, delay: 52 },
];
const BUDS = [
  { stem: 3, a: -20 },
  { stem: 4, a: 18 },
  { stem: 6, a: 40 },
];

/** An ovate leaf with a toothed margin and three veins fanning from the base. */
const serrated = (L: number, W: number) => {
  const N = 22;
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let k = 0; k <= N; k++) {
    const t = k / N;
    const w = W * 0.5 * Math.sin(Math.PI * Math.pow(t, 0.75)) * (1 - t * 0.15);
    const tooth = k % 2 && k > 2 && k < N ? 2.2 : 0;
    left.push([-(w + tooth), -L * t - tooth * 0.8]);
    right.push([w + tooth, -L * t - tooth * 0.8]);
  }
  return `${polyline(left)} ${polyline(right.reverse()).replace("M", "L")} Z`;
};
const LEAF = serrated(58, 40);

const Flower: React.FC<{ red: string; col: number }> = ({ red, col }) => {
  const dark = shade(red, -0.45);
  const petal = "M0 0 C -26 -8 -40 -38 -28 -56 C -16 -70 12 -68 24 -56 C 38 -42 26 -10 0 0 Z";
  return (
    <g>
      {[0, 72, 144, 216, 288].map((a, k) => (
        <g key={a} transform={`rotate(${a + 8})`}>
          <path d={petal} fill={k % 2 ? shade(red, -0.06) : red} />
          <path d={petal} fill="none" stroke={shade(red, -0.2)} strokeWidth={1.5} />
          {[-14, -4, 6].map((v) => (
            <path key={v} d={`M0 -6 Q ${v} -30 ${v * 1.6} -50`} stroke={shade(red, -0.18)} strokeWidth={1.2} fill="none" opacity={0.7} />
          ))}
          <path d="M-18 -46 C -12 -58 2 -62 12 -58" stroke="#fff" strokeOpacity={0.22} strokeWidth={4} fill="none" strokeLinecap="round" />
        </g>
      ))}
      {/* Dark eye at the throat. */}
      <circle r={15} fill={dark} />
      {[0, 72, 144, 216, 288].map((a) => (
        <path key={a} d="M0 0 L0 -22" stroke={dark} strokeWidth={4} strokeLinecap="round" transform={`rotate(${a + 44})`} />
      ))}
      {/* The staminal column: pollen-dusted tube ending in five velvety stigma pads. */}
      <g transform={`rotate(${col})`}>
        <path d="M0 0 L0 -58" stroke={mix(red, "#FFE4D6", 0.35)} strokeWidth={5} strokeLinecap="round" />
        {[-30, -36, -42, -48].map((y, k) => (
          <g key={y}>
            <circle cx={-4} cy={y + k} r={2.6} fill="#F6C93C" />
            <circle cx={4} cy={y - 2} r={2.6} fill="#F6C93C" />
          </g>
        ))}
        {[-2, -1, 0, 1, 2].map((v) => (
          <circle key={v} cx={v * 3.6} cy={-60 - Math.abs(v) * -1.5} r={2.6} fill={shade(red, -0.25)} />
        ))}
      </g>
    </g>
  );
};

export const Hibiscus: React.FC<{ c: Ctx }> = ({ c }) => {
  const wood = "#6B5A44";
  const gs = STEMS.map((s) => c.grow(s.delay));
  return (
    <g>
      <ellipse cx={200} cy={384} rx={92} ry={10} fill="#3B2A1E" />
      <g transform={`rotate(${c.sway(1, 0.6)} 200 386)`}>
        {STEMS.map((s, i) => (
          <path key={i} d={taperPath(s.pts, s.w[0], s.w[1], Math.min(1, gs[i]), 20)} fill={wood} />
        ))}
        {leafSpots.map((lf, i) => {
          const st = STEMS[lf.s];
          const p = along(st.pts, lf.t);
          const s = ramp(gs[lf.s], lf.t - 0.15, lf.t + 0.2) * (0.85 + (lf.k % 3) * 0.1);
          const color = shade(c.leaf, ((lf.k % 3) - 1) * 0.08);
          return (
            <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.angle + 90 + lf.side * 62 + c.sway(i, 3)}) scale(${s})`}>
              <path d={LEAF} fill={color} />
              <path d="M0 -2 L0 -54 M0 -4 L-12 -30 M0 -4 L12 -30" stroke={shade(color, -0.25)} strokeWidth={1.6} fill="none" />
              <path d="M-8 -44 C -13 -32 -12 -20 -7 -12" stroke="#fff" strokeOpacity={0.3} strokeWidth={4} fill="none" strokeLinecap="round" />
            </g>
          );
        })}
        {BUDS.map((b, i) => {
          const p = along(STEMS[b.stem].pts, 1);
          const s = c.grow(36 + i * 4);
          return (
            <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${b.a + c.sway(i + 7, 3)}) scale(${s})`}>
              <path d="M0 -6 C -7 -14 -6 -30 0 -40 C 6 -30 7 -14 0 -6 Z" fill={c.accent} />
              <path d="M-3 -12 Q 2 -24 0 -38" stroke={shade(c.accent, -0.25)} strokeWidth={1.4} fill="none" />
              <path d="M0 2 L-8 -16 L-3 -12 L0 -20 L3 -12 L8 -16 Z" fill={shade(c.leaf, 0.05)} />
            </g>
          );
        })}
        {FLOWERS.map((f, i) => (
          <g key={i} transform={`translate(${f.x} ${f.y}) rotate(${c.sway(i + 3, 2)}) scale(${c.grow(f.delay) * f.s * 0.95})`}>
            <Flower red={c.accent} col={f.col} />
          </g>
        ))}
      </g>

      <PatioPot color={c.pot} />
    </g>
  );
};

/** A large glazed patio pot: thick rolled lip, rounded shoulders, a glaze drip band. */
const PatioPot: React.FC<{ color: string }> = ({ color }) => (
  <g>
    <path d="M110 396 L290 396 C 300 440 290 486 264 504 Q 258 508 248 508 L152 508 Q 142 508 136 504 C 110 486 100 440 110 396 Z" fill={color} />
    <path d="M108 418 C 160 428 240 428 292 418" stroke={shade(color, 0.18)} strokeWidth={6} fill="none" opacity={0.6} />
    <path d="M110 430 C 160 440 240 440 290 430" stroke={shade(color, -0.2)} strokeWidth={3} fill="none" />
    {[136, 170, 210, 250].map((x, k) => (
      <path key={x} d={`M${x} 432 q 3 ${10 + (k % 2) * 8} 0 ${18 + (k % 2) * 10}`} stroke={shade(color, -0.2)} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.6} />
    ))}
    <path d="M128 444 C 124 470 132 490 146 500" stroke="#fff" strokeOpacity={0.3} strokeWidth={10} fill="none" strokeLinecap="round" />
    <path d="M280 444 C 280 470 270 490 256 500" stroke="#000" strokeOpacity={0.15} strokeWidth={12} fill="none" strokeLinecap="round" />
    <rect x={98} y={378} width={204} height={24} rx={12} fill={shade(color, 0.08)} />
    <rect x={106} y={380} width={188} height={6} rx={3} fill="#fff" opacity={0.35} />
  </g>
);

export const drawing: PlantDrawing = { id: "hibiscus", Component: Hibiscus };
