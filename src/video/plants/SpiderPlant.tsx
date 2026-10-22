import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, type Pt, along, polyline, ramp, spline, taperPath } from "./kit";

const CX = 200;
const CROWN_Y = 322;

/** A blade that sets off at `a` degrees and arches over under its own weight. */
const bladePts = (x: number, y: number, a: number, len: number, bend: number): Pt[] => {
  const side = Math.cos((a * Math.PI) / 180) < 0 ? -1 : 1;
  const n = 5;
  let h = a;
  const pts: Pt[] = [[x, y]];
  for (let k = 0; k < n; k++) {
    x += Math.cos((h * Math.PI) / 180) * (len / n);
    y += Math.sin((h * Math.PI) / 180) * (len / n);
    pts.push([x, y]);
    h += side * bend * (0.5 + k * 0.35);
  }
  return pts;
};

// Back (upright) blades first, outer arching blades last.
const BLADES = [
  { a: -98, len: 156, bend: 6 },
  { a: -82, len: 163, bend: 6 },
  { a: -112, len: 182, bend: 10 },
  { a: -68, len: 176, bend: 10 },
  { a: -126, len: 195, bend: 14 },
  { a: -54, len: 195, bend: 14 },
  { a: -90, len: 135, bend: 12 },
  { a: -140, len: 208, bend: 17 },
  { a: -40, len: 202, bend: 17 },
  { a: -154, len: 208, bend: 20 },
  { a: -26, len: 205, bend: 20 },
  { a: -104, len: 150, bend: 18 },
  { a: -76, len: 148, bend: 18 },
  { a: -168, len: 176, bend: 24 },
  { a: -12, len: 174, bend: 24 },
  { a: -134, len: 143, bend: 30 },
  { a: -46, len: 140, bend: 30 },
];

// Runners (stolons) arch out of the clump and dangle a baby plant beside the stand.
const RUNNERS: { pts: Pt[]; delay: number; s: number }[] = [
  { pts: [[188, 318], [130, 240], [70, 250], [44, 330], [46, 420]], delay: 22, s: 1 },
  { pts: [[212, 318], [270, 236], [330, 254], [354, 350], [352, 448]], delay: 26, s: 1.05 },
  { pts: [[204, 320], [250, 268], [300, 300], [316, 380], [312, 404]], delay: 32, s: 0.75 },
];

const Blade: React.FC<{ pts: Pt[]; g: number; w: number; green: string; stripe: string }> = ({ pts, g, w, green, stripe }) => (
  <g>
    <path d={taperPath(pts, w, 3.5, g, 22)} fill={green} />
    <path d={taperPath(pts, w * 0.3, 0.3, g * 0.96, 22)} fill={stripe} />
  </g>
);

/** A baby rosette with a few aerial roots, hanging from the runner tip. */
const Plantlet: React.FC<{ s: number; green: string; stripe: string }> = ({ s, green, stripe }) => (
  <g transform={`scale(${s})`}>
    {[-1, 0, 1].map((k) => (
      <path key={k} d={`M${k * 3} 2 Q ${k * 6} 12 ${k * 9 + 1} 20`} stroke="#C9B48A" strokeWidth={1.8} fill="none" strokeLinecap="round" />
    ))}
    {[-150, -30, -120, -60, -96, -84].map((a, k) => (
      <Blade key={k} pts={bladePts(0, 0, a, 40 + (k % 2) * 8, 18 + k * 2)} g={1} w={9} green={shade(green, (k % 3) * 0.04)} stripe={stripe} />
    ))}
    <ellipse cx={0} cy={1} rx={5} ry={3} fill={shade(green, -0.2)} />
  </g>
);

export const SpiderPlant: React.FC<{ c: Ctx }> = ({ c }) => {
  const stripe = mix(c.accent, "#FFFFFF", 0.65);
  const runner = mix(c.accent, "#C8D69A", 0.45);
  return (
    <g>
      <WoodStand />

      {RUNNERS.map((r, i) => {
        const g = Math.min(1, c.grow(r.delay));
        const tip = along(r.pts, 1);
        const baby = ramp(c.grow(r.delay + 14), 0, 1);
        const [ox, oy] = r.pts[0];
        return (
          <g key={i} transform={`rotate(${c.sway(i + 11, 1.2)} ${ox} ${oy})`}>
            <path d={polyline(spline(r.pts, g, 30))} stroke={runner} strokeWidth={2.4} fill="none" strokeLinecap="round" />
            {/* Little white flowers along the runner. */}
            {[0.35, 0.55].map((t, k) => {
              if (g < t + 0.1) return null;
              const p = along(r.pts, t);
              const fs = ramp(c.grow(r.delay + 18 + k * 4), 0, 1);
              return (
                <g key={k} transform={`translate(${p.x} ${p.y - 3}) scale(${fs})`}>
                  {[0, 60, 120, 180, 240, 300].map((a) => (
                    <ellipse key={a} cx={0} cy={-4} rx={2.2} ry={4} fill="#FFFDF4" transform={`rotate(${a})`} />
                  ))}
                  <circle r={1.8} fill={c.accent} />
                </g>
              );
            })}
            {g > 0.98 && (
              <g transform={`translate(${tip.x} ${tip.y}) rotate(${c.sway(i + 5, 4)})`}>
                <Plantlet s={baby * r.s} green={c.leaf} stripe={stripe} />
              </g>
            )}
          </g>
        );
      })}

      {/* Pot, then the arching fountain of striped blades over its rim. */}
      <ellipse cx={CX} cy={CROWN_Y + 2} rx={52} ry={7} fill="#3B2A1E" />
      {BLADES.map((b, i) => {
        const g = Math.min(1, c.grow(4 + (i % 9) * 1.5));
        const pts = bladePts(CX + (i % 5 - 2) * 4, CROWN_Y, b.a, b.len, b.bend);
        return (
          <g key={i} transform={`rotate(${c.sway(i, 1.4)} ${CX} ${CROWN_Y})`}>
            <Blade pts={pts} g={g} w={19} green={shade(c.leaf, ((i % 3) - 1) * 0.06)} stripe={stripe} />
          </g>
        );
      })}
      <path d="M150 330 L250 330 L242 398 Q 240 404 232 404 L168 404 Q 160 404 158 398 Z" fill={c.pot} />
      <path d="M164 340 L170 392" stroke="#fff" strokeOpacity={0.28} strokeWidth={7} strokeLinecap="round" />
      <path d="M238 342 L232 392" stroke="#000" strokeOpacity={0.12} strokeWidth={7} strokeLinecap="round" />
      <rect x={144} y={318} width={112} height={16} rx={6} fill={shade(c.pot, 0.06)} />
      <rect x={150} y={319} width={100} height={4} rx={2} fill="#fff" opacity={0.3} />
      {/* The front blades spill over the rim. */}
      {[{ a: -160, len: 150, bend: 30 }, { a: -20, len: 148, bend: 30 }, { a: -150, len: 112, bend: 42 }, { a: -30, len: 110, bend: 42 }].map((b, i) => {
        const g = Math.min(1, c.grow(16 + i * 2));
        const pts = bladePts(CX + (i % 2 ? 12 : -12), CROWN_Y - 2, b.a, b.len, b.bend);
        return (
          <g key={i} transform={`rotate(${c.sway(i + 20, 1.4)} ${CX} ${CROWN_Y})`}>
            <Blade pts={pts} g={g} w={19} green={shade(c.leaf, i % 2 ? 0.04 : -0.04)} stripe={stripe} />
          </g>
        );
      })}
    </g>
  );
};

/** A low wooden plant stool with splayed legs and a stretcher. */
const WoodStand: React.FC = () => {
  const wood = "#B88A5A";
  const dark = shade(wood, -0.25);
  return (
    <g>
      <path d="M186 412 L194 412 L192 500 L186 500 Z" fill={dark} />
      <path d="M216 412 L208 412 L210 500 L216 500 Z" fill={dark} />
      <rect x={150} y={462} width={100} height={7} rx={2} fill={dark} />
      <path d="M150 412 L164 412 L150 508 L138 508 Z" fill={wood} />
      <path d="M236 412 L250 412 L262 508 L250 508 Z" fill={wood} />
      <path d="M154 414 L144 500" stroke="#fff" strokeOpacity={0.2} strokeWidth={2.5} />
      <rect x={136} y={402} width={128} height={12} rx={3} fill={shade(wood, 0.08)} />
      <rect x={136} y={402} width={128} height={3} fill="#fff" opacity={0.22} />
      <path d="M148 409 L252 409" stroke={shade(wood, -0.12)} strokeWidth={1.2} />
    </g>
  );
};

export const drawing: PlantDrawing = { id: "spider-plant", Component: SpiderPlant, anchors: { soil: [200, 320], snip: [352, 430], snipR: 40 } };
