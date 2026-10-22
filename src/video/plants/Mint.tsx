import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, type Pt, along, polyline, ramp, taperPath } from "./kit";

const SOIL_Y = 398;

// Upright square stems across the trough; back row first, front row drawn over it.
const STEMS: { x: number; h: number; lean: number; delay: number }[] = [
  { x: 120, h: 236, lean: -12, delay: 4 },
  { x: 212, h: 262, lean: 4, delay: 0 },
  { x: 290, h: 228, lean: 14, delay: 6 },
  { x: 166, h: 248, lean: -4, delay: 3 },
  { x: 252, h: 244, lean: 8, delay: 5 },
  { x: 70, h: 176, lean: -26, delay: 10 },
  { x: 336, h: 182, lean: 26, delay: 12 },
  { x: 196, h: 150, lean: -6, delay: 9 },
];

const stemPts = (s: (typeof STEMS)[number]): Pt[] => [
  [s.x, SOIL_Y + 4],
  [s.x + s.lean * 0.25, SOIL_Y - s.h * 0.4],
  [s.x + s.lean * 0.65, SOIL_Y - s.h * 0.75],
  [s.x + s.lean, SOIL_Y - s.h],
];

// Runners that have crept over the rim and down the front of the box.
const RUNNERS: { pts: Pt[]; delay: number }[] = [
  { pts: [[78, 398], [70, 392], [58, 410], [54, 446], [62, 476]], delay: 30 },
  { pts: [[196, 398], [192, 393], [182, 414], [178, 442]], delay: 36 },
  { pts: [[318, 398], [330, 393], [344, 414], [346, 452], [338, 482]], delay: 33 },
  { pts: [[350, 398], [366, 398], [380, 424], [382, 462]], delay: 40 },
];

/** A lance leaf with a serrated margin, pointing up from its base at the origin. */
const toothed = (L: number, W: number, teeth: number, depth = 0.2) => {
  const N = teeth * 2;
  const right: Pt[] = [];
  for (let k = 0; k <= N; k++) {
    const s = k / N;
    const base = W * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.72)), 0.8);
    const tooth = k % 2 === 1 && s > 0.12 && k < N - 1;
    right.push([tooth ? base * (1 + depth) : base, -L * s - (tooth ? L * 0.03 : 0)]);
  }
  const left = right.slice(0, -1).reverse().map(([x, y]): Pt => [-x, y]);
  return `${polyline([...right, ...left])} Z`;
};
const LEAF = toothed(44, 16.5, 8);

/** A sessile, puckered spearmint leaf: sunken veins with raised, lit blistering between them. */
const MintLeaf: React.FC<{ color: string }> = ({ color }) => (
  <g>
    <path d={LEAF} fill={color} />
    <path d="M0 0 L0 -40" stroke={shade(color, -0.28)} strokeWidth={1.8} />
    {[9, 17, 25, 33].map((y) =>
      [-1, 1].map((v) => (
        <g key={`${y}${v}`}>
          <path d={`M0 ${-y} Q ${v * 6} ${-y - 2} ${v * 12} ${-y - 8}`} stroke={shade(color, -0.24)} strokeWidth={1.3} fill="none" />
          <circle cx={v * 6.5} cy={-y - 6.5} r={1.5} fill="#fff" opacity={0.2} />
        </g>
      )),
    )}
  </g>
);

export const Mint: React.FC<{ c: Ctx }> = ({ c }) => {
  const stem = shade(c.leaf, -0.22);
  const tone = (i: number) => shade(c.leaf, (((i * 7) % 5) - 2.6) * 0.07);
  return (
    <g>
      <rect x={44} y={386} width={312} height={16} rx={7} fill="#3B2A1E" />

      {STEMS.map((st, i) => {
        const g = c.grow(st.delay);
        const pts = stemPts(st);
        const nodes = Math.round(st.h / 38);
        return (
          <g key={i} transform={`rotate(${c.sway(i, 1.2)} ${st.x} ${SOIL_Y})`}>
            <path d={taperPath(pts, 5, 2.5, Math.min(1, g))} fill={stem} />
            {Array.from({ length: nodes }, (_, k) => {
              const t = 0.14 + (k / nodes) * 0.86;
              const s = ramp(g, t - 0.12, t + 0.15) * (1.05 - t * 0.35);
              const p = along(pts, Math.min(1, t));
              const cross = k % 2 === 1;
              const young = ramp(t, 0.8, 1) * 0.35;
              return [-1, 1].map((side) => {
                const color = mix(tone(i + k + side), c.accent, young);
                return (
                  <g
                    key={`${k}${side}`}
                    transform={`translate(${p.x} ${p.y}) rotate(${p.angle + 90 + side * (cross ? 22 : 74) + c.sway(i + k, 3)}) scale(${s * (cross ? 0.7 : 1)} ${s * (cross ? 0.72 : 1)})`}
                  >
                    <MintLeaf color={color} />
                  </g>
                );
              });
            })}
            {/* A tight crown of new leaves at the tip. */}
            {(() => {
              const p = along(pts, 1);
              const s = ramp(g, 0.85, 1.05) * 0.5;
              return [-1, 1].map((side) => (
                <g key={side} transform={`translate(${p.x} ${p.y}) rotate(${p.angle + 90 + side * 14}) scale(${s})`}>
                  <MintLeaf color={mix(c.leaf, c.accent, 0.4)} />
                </g>
              ));
            })()}
          </g>
        );
      })}

      <WindowBox color={c.pot} />

      {RUNNERS.map((r, i) => {
        const g = c.grow(r.delay);
        return (
          <g key={i}>
            <path d={taperPath(r.pts, 4, 2.5, Math.min(1, g))} fill={stem} />
            {[0.35, 0.6, 0.85, 1].map((t, k) => {
              const s = ramp(g, t - 0.1, t + 0.15) * (0.75 - t * 0.2);
              const p = along(r.pts, t);
              return [-1, 1].map((side) => (
                <g key={`${k}${side}`} transform={`translate(${p.x} ${p.y}) rotate(${p.angle + 90 + side * (k % 2 ? 40 : 70) + c.sway(i + k, 4)}) scale(${s})`}>
                  <MintLeaf color={tone(i + k + side + 2)} />
                </g>
              ));
            })}
          </g>
        );
      })}
    </g>
  );
};

/** A long wooden window box: planked front, corner battens, a capping board and little feet. */
const WindowBox: React.FC<{ color: string }> = ({ color }) => {
  const dark = shade(color, -0.22);
  return (
    <g>
      {[64, 318].map((x) => (
        <rect key={x} x={x} y={496} width={18} height={12} rx={2} fill={dark} />
      ))}
      <rect x={40} y={402} width={320} height={96} fill={color} />
      {[434, 466].map((y) => (
        <path key={y} d={`M44 ${y} L356 ${y}`} stroke={dark} strokeWidth={2.5} />
      ))}
      {/* Grain. */}
      {[
        "M70 416 C 120 412 160 422 220 416 S 300 412 330 418",
        "M90 450 C 140 446 190 456 250 450 S 310 446 340 452",
        "M66 482 C 110 478 170 488 230 482 S 300 478 324 484",
      ].map((d) => (
        <path key={d} d={d} stroke={shade(color, 0.14)} strokeWidth={2} fill="none" opacity={0.6} />
      ))}
      <circle cx={150} cy={424} r={4} fill="none" stroke={shade(color, -0.12)} strokeWidth={1.6} />
      <rect x={34} y={398} width={18} height={104} rx={3} fill={shade(color, -0.1)} />
      <rect x={348} y={398} width={18} height={104} rx={3} fill={shade(color, -0.1)} />
      {[34, 348].map((x) =>
        [412, 488].map((y) => <circle key={`${x}${y}`} cx={x + 9} cy={y} r={2} fill={shade(color, -0.4)} />),
      )}
      <rect x={28} y={390} width={344} height={14} rx={4} fill={shade(color, 0.08)} />
      <rect x={32} y={391} width={336} height={4} rx={2} fill="#fff" opacity={0.25} />
      <rect x={40} y={404} width={320} height={6} fill="#000" opacity={0.12} />
    </g>
  );
};

export const drawing: PlantDrawing = { id: "mint", Component: Mint, anchors: { soil: [230, 388], snip: [260, 160], snipR: 32 } };
