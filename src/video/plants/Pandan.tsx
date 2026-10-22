import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, type Pt, polyline, spline } from "./kit";

const N = 17;
const TRUNK_TOP = 306;

// Leaves spiral up the short trunk (golden angle): old ones splay wide and droop, young ones stand up.
const LEAVES = Array.from({ length: N }, (_, i) => {
  const age = 1 - i / (N - 1);
  const lateral = Math.sin((i * 137.5 * Math.PI) / 180);
  const side = lateral >= 0 ? 1 : -1;
  return {
    i,
    angle: side * (4 + age * 52) * (0.5 + 0.5 * Math.abs(lateral)),
    L: 236 + age * 14 - Math.max(0, lateral * lateral - 0.3) * 50 - age * age * 40,
    bend: side * (16 + age * 60),
    base: [200 + lateral * 6, TRUNK_TOP + 10 - i * 1.6] as Pt,
    W: 15 + age * 4,
    delay: 4 + i * 2.2,
    depth: Math.cos((i * 137.5 * Math.PI) / 180),
  };
});

/** Centre line of a strap leaf that keeps turning outward and down as it goes. */
const centre = (base: Pt, angle: number, bend: number, L: number): Pt[] => {
  const pts: Pt[] = [base];
  let a = angle;
  const steps = 5;
  for (let k = 0; k < steps; k++) {
    a += (bend / steps) * (0.4 + (k / steps) * 1.2);
    const r = (a * Math.PI) / 180;
    const [x, y] = pts[pts.length - 1];
    pts.push([x + Math.sin(r) * (L / steps), y - Math.cos(r) * (L / steps)]);
  }
  return pts;
};

/** Outline, one lit half (for the V-shaped fold) and keel of a parallel-sided strap leaf. */
const strap = (pts: Pt[], W: number, upto: number) => {
  const line = spline(pts, upto, 40);
  const left: Pt[] = [];
  const right: Pt[] = [];
  line.forEach(([x, y], k) => {
    const s = (k / 40) * upto;
    const [ax, ay] = line[Math.max(0, k - 1)];
    const [bx, by] = line[Math.min(line.length - 1, k + 1)];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    const nx = -(by - ay) / len;
    const ny = (bx - ax) / len;
    const w = (W / 2) * (s < 0.08 ? 0.55 + s * 5.6 : s > 0.72 ? Math.max(0.04, (1 - s) / 0.28) : 1) * (k === 40 ? 0.04 : 1);
    left.push([x + nx * w, y + ny * w]);
    right.push([x - nx * w, y - ny * w]);
  });
  const back = (p: Pt[]) => polyline(p.slice().reverse()).replace("M", "L");
  return {
    outline: `${polyline(left)} ${back(right)} Z`,
    half: `${polyline(left)} ${back(line)} Z`,
    keel: polyline(line),
    gloss: polyline(line.slice(6, 26).map(([x, y], k) => {
      const [lx, ly] = left[k + 6];
      return [x + (lx - x) * 0.5, y + (ly - y) * 0.5] as Pt;
    })),
  };
};

export const Pandan: React.FC<{ c: Ctx }> = ({ c }) => {
  const trunkG = Math.min(1, c.grow(0));
  const root = "#A08060";
  const order = [...LEAVES].sort((a, b) => a.depth - b.depth);
  return (
    <g>
      <ellipse cx={200} cy={380} rx={84} ry={9} fill="#3B2A1E" />
      {/* Short, ringed trunk. */}
      <rect x={191} y={TRUNK_TOP + 72 - 72 * trunkG} width={18} height={72 * trunkG} rx={6} fill="#8A7458" />
      {[0, 1, 2, 3, 4, 5, 6].map((k) => (
        <path key={k} d={`M191 ${TRUNK_TOP + 10 + k * 9} q 9 3 18 0`} stroke="#6C5842" strokeWidth={1.6} fill="none" opacity={trunkG} />
      ))}
      {/* Prop roots bracing the trunk into the soil. */}
      {[
        { from: [192, 330] as Pt, to: [156, 382] as Pt, d: 12 },
        { from: [208, 326] as Pt, to: [246, 382] as Pt, d: 14 },
        { from: [194, 346] as Pt, to: [174, 384] as Pt, d: 18 },
        { from: [206, 344] as Pt, to: [226, 384] as Pt, d: 20 },
        { from: [200, 352] as Pt, to: [198, 386] as Pt, d: 22 },
      ].map((r, k) => {
        const g = Math.min(1, c.grow(r.d));
        const mid: Pt = [(r.from[0] + r.to[0]) / 2 + (r.to[0] > 200 ? -2 : 2), (r.from[1] + r.to[1]) / 2 - 6];
        const pts = spline([r.from, mid, r.to], g, 12);
        return (
          <g key={k}>
            <path d={polyline(pts)} stroke={root} strokeWidth={5} fill="none" strokeLinecap="round" />
            <path d={polyline(pts)} stroke="#fff" strokeOpacity={0.2} strokeWidth={1.5} fill="none" strokeLinecap="round" transform="translate(-1 -1)" />
          </g>
        );
      })}

      {order.map((lf) => {
        const g = c.grow(lf.delay);
        const shown = Math.min(1, g);
        const pts = centre(lf.base, lf.angle + c.sway(lf.i, 1.4), lf.bend, lf.L);
        const sh = strap(pts, lf.W, shown);
        const young = 1 - lf.L / 224;
        const color = mix(shade(c.leaf, ((lf.i % 3) - 1) * 0.06 - Math.max(0, -lf.depth) * 0.08), c.accent, young * 0.35);
        return (
          <g key={lf.i}>
            <path d={sh.outline} fill={color} />
            <path d={sh.half} fill={shade(color, 0.1)} />
            <path d={sh.keel} stroke={shade(color, -0.25)} strokeWidth={1.6} fill="none" />
            <path d={sh.gloss} stroke="#fff" strokeOpacity={0.28 * shown} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          </g>
        );
      })}

      <GlazedPot color={c.pot} />
    </g>
  );
};

/** A deep-toned glazed pot, the glaze breaking paler where it pooled under the rim. */
const GlazedPot: React.FC<{ color: string }> = ({ color }) => (
  <g>
    <path d="M114 386 L286 386 C 296 430 288 474 264 498 Q 255 508 240 508 L160 508 Q 145 508 136 498 C 112 474 104 430 114 386 Z" fill={color} />
    <path d="M113.5 386 L286.5 386 C 288 396 289 404 289.5 410 C 270 404 256 418 236 410 C 216 402 200 420 178 410 C 158 402 140 416 111 410 C 111.5 402 112.5 394 113.5 386 Z" fill={shade(color, 0.28)} />
    <path d="M150 412 C 150 420 148 428 152 432" stroke={shade(color, 0.28)} strokeWidth={4} strokeLinecap="round" fill="none" />
    <path d="M226 412 C 228 422 226 432 230 438" stroke={shade(color, 0.28)} strokeWidth={4} strokeLinecap="round" fill="none" />
    <path d="M132 420 C 128 446 134 470 148 488" stroke="#fff" strokeOpacity={0.3} strokeWidth={9} fill="none" strokeLinecap="round" />
    <ellipse cx={142} cy={432} rx={3.5} ry={6} fill="#fff" opacity={0.55} />
    <path d="M276 420 C 278 448 270 472 256 490" stroke="#000" strokeOpacity={0.2} strokeWidth={12} fill="none" strokeLinecap="round" />
    <rect x={104} y={372} width={192} height={18} rx={9} fill={shade(color, 0.12)} />
    <rect x={112} y={374} width={176} height={4} rx={2} fill="#fff" opacity={0.4} />
  </g>
);

export const drawing: PlantDrawing = { id: "pandan", Component: Pandan, anchors: { soil: [200, 372], snip: [320, 250], snipR: 40 } };
