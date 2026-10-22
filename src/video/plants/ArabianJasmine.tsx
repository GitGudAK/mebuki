import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, type Pt, along, ramp, taperPath } from "./kit";

// A bushy shrub of slender stems, each set with opposite pairs of leaves.
const STEMS: { pts: Pt[]; delay: number }[] = [
  { pts: [[200, 398], [198, 330], [204, 262], [200, 196], [196, 140]], delay: 0 },
  { pts: [[198, 392], [166, 344], [134, 292], [112, 236]], delay: 3 },
  { pts: [[202, 392], [236, 344], [270, 294], [292, 240]], delay: 4 },
  { pts: [[198, 398], [152, 384], [112, 356], [84, 318]], delay: 7 },
  { pts: [[202, 398], [250, 386], [290, 358], [318, 322]], delay: 8 },
  { pts: [[200, 300], [174, 256], [152, 200]], delay: 12 },
  { pts: [[202, 286], [234, 244], [250, 190]], delay: 13 },
];
const NODES = [0.34, 0.52, 0.7, 0.86];

/** Glossy oval leaf with a blunt point. */
const LEAF = "M0 0 C -14 -6 -16 -30 -6 -42 C -3 -46 3 -46 6 -42 C 16 -30 14 -6 0 0 Z";

/** A double 'Grand Duke' style flower: rings of rounded petals packed into a rosette. */
const Double: React.FC<{ white: string }> = ({ white }) => (
  <g>
    {Array.from({ length: 8 }, (_, k) => (
      <ellipse key={`o${k}`} cx={0} cy={-9} rx={6} ry={9} fill={shade(white, -0.06)} transform={`rotate(${k * 45})`} />
    ))}
    {Array.from({ length: 6 }, (_, k) => (
      <ellipse key={`m${k}`} cx={0} cy={-6} rx={5} ry={7} fill={white} transform={`rotate(${k * 60 + 22})`} />
    ))}
    {Array.from({ length: 5 }, (_, k) => (
      <ellipse key={`i${k}`} cx={0} cy={-3} rx={3.4} ry={4.6} fill={shade(white, 0.4)} stroke={mix(white, "#C9B98A", 0.4)} strokeWidth={0.8} transform={`rotate(${k * 72 + 10})`} />
    ))}
    <circle r={2.4} fill={mix(white, "#D8C27A", 0.5)} />
  </g>
);

const Bud: React.FC<{ white: string; leaf: string }> = ({ white, leaf }) => (
  <g>
    <path d="M0 0 C -5 -6 -5 -16 0 -22 C 5 -16 5 -6 0 0 Z" fill={white} />
    <path d="M0 1 L-4 -6 L0 -3 L4 -6 Z" fill={leaf} />
  </g>
);

const CLUSTER = [
  { dx: 0, dy: -6, kind: "f", s: 1 },
  { dx: -16, dy: 6, kind: "f", s: 0.85 },
  { dx: 15, dy: 4, kind: "f", s: 0.8 },
  { dx: -6, dy: -22, kind: "b", s: 1, a: -14 },
  { dx: 8, dy: -20, kind: "b", s: 0.85, a: 18 },
];

export const ArabianJasmine: React.FC<{ c: Ctx }> = ({ c }) => {
  const stem = shade(c.leaf, -0.35);
  const gs = STEMS.map((s) => c.grow(s.delay));
  return (
    <g>
      <ellipse cx={200} cy={400} rx={80} ry={8} fill="#3B2A1E" />
      <g transform={`rotate(${c.sway(1, 0.6)} 200 398)`}>
        {STEMS.map((s, i) => (
          <path key={i} d={taperPath(s.pts, 6, 2.5, Math.min(1, gs[i]), 20)} fill={stem} />
        ))}
        {STEMS.map((s, si) =>
          NODES.map((t, ni) => {
            const p = along(s.pts, t);
            const sc = ramp(gs[si], t - 0.1, t + 0.25) * (1.05 - ni * 0.08);
            return [-1, 1].map((side) => {
              const color = shade(c.leaf, (((si + ni + side) % 3) - 1) * 0.07);
              return (
                <g key={`${si}${ni}${side}`} transform={`translate(${p.x} ${p.y}) rotate(${p.angle + 90 + side * 56 + c.sway(si * 4 + ni, 3)}) scale(${sc})`}>
                  <path d={LEAF} fill={color} />
                  <path d="M0 -2 L0 -40" stroke={shade(color, -0.22)} strokeWidth={1.6} />
                  {[14, 24, 32].map((y) => (
                    <path key={y} d={`M0 ${-y} l-7 -6 M0 ${-y} l7 -6`} stroke={shade(color, -0.16)} strokeWidth={1} />
                  ))}
                  <path d="M-6 -34 C -10 -26 -10 -16 -6 -8" stroke="#fff" strokeOpacity={0.35} strokeWidth={3.5} fill="none" strokeLinecap="round" />
                </g>
              );
            });
          }),
        )}
        {STEMS.map((s, si) => {
          const p = along(s.pts, 1);
          return (
            <g key={si} transform={`translate(${p.x} ${p.y}) rotate(${c.sway(si + 11, 3)})`}>
              {CLUSTER.map((f, k) => {
                const g = c.grow(36 + si * 3 + k * 2) * f.s;
                return (
                  <g key={k} transform={`translate(${f.dx} ${f.dy}) rotate(${f.a ?? 0}) scale(${g})`}>
                    {f.kind === "f" ? <Double white={c.accent} /> : <Bud white={c.accent} leaf={c.leaf} />}
                  </g>
                );
              })}
            </g>
          );
        })}
      </g>

      <BrassPot color={c.pot} />
    </g>
  );
};

/** A polished, round-bellied brass pot with a flared lip and engraved bands. */
const BrassPot: React.FC<{ color: string }> = ({ color }) => {
  const dark = shade(color, -0.35);
  const shine = mix(color, "#FFF6D0", 0.65);
  return (
    <g>
      <rect x={156} y={496} width={88} height={12} rx={4} fill={shade(color, -0.2)} />
      <path d="M128 408 L272 408 C 300 430 306 470 282 492 Q 270 502 240 502 L160 502 Q 130 502 118 492 C 94 470 100 430 128 408 Z" fill={color} />
      {/* Warm reflections: a dark band, a broad glow and a hard specular streak. */}
      <path d="M266 420 C 290 444 290 478 266 494" stroke={dark} strokeWidth={12} fill="none" strokeLinecap="round" opacity={0.45} />
      <path d="M140 424 C 120 444 120 474 140 492" stroke={shine} strokeWidth={14} fill="none" strokeLinecap="round" opacity={0.45} />
      <path d="M150 428 C 138 446 138 468 148 484" stroke="#fff" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.8} />
      <path d="M108 446 C 160 456 240 456 292 446" stroke={dark} strokeWidth={2} fill="none" opacity={0.7} />
      <path d="M108 452 C 160 462 240 462 292 452" stroke={shine} strokeWidth={1.5} fill="none" opacity={0.6} />
      <path d="M106 470 C 160 480 240 480 294 470" stroke={dark} strokeWidth={2} fill="none" opacity={0.6} />
      <path d="M134 410 L266 410 L270 418 L130 418 Z" fill={dark} opacity={0.5} />
      {/* Flared lip. */}
      <path d="M112 394 L288 394 Q 292 404 276 410 L124 410 Q 108 404 112 394 Z" fill={shade(color, 0.08)} />
      <rect x={118} y={395} width={164} height={3.5} rx={1.5} fill="#fff" opacity={0.6} />
      <circle cx={146} cy={440} r={4} fill="#fff" opacity={0.7} />
    </g>
  );
};

export const drawing: PlantDrawing = { id: "arabian-jasmine", Component: ArabianJasmine };
