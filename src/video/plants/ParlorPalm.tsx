import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, type Pt, along, polyline, ramp, spline, taperPath } from "./kit";

const SOIL_Y = 404;

// Thin canes of different heights; each ends in an arching pinnate frond.
const CANES = [
  { x: 186, top: [166, 300] as Pt, frond: -118, len: 160, bend: 20, delay: 4 },
  { x: 214, top: [234, 296] as Pt, frond: -62, len: 160, bend: 20, delay: 6 },
  { x: 194, top: [178, 238] as Pt, frond: -104, len: 200, bend: 15, delay: 0 },
  { x: 206, top: [224, 230] as Pt, frond: -76, len: 206, bend: 15, delay: 2 },
  { x: 200, top: [202, 214] as Pt, frond: -96, len: 160, bend: 9, delay: 8 },
  { x: 182, top: [150, 346] as Pt, frond: -140, len: 150, bend: 24, delay: 10 },
  { x: 218, top: [250, 342] as Pt, frond: -40, len: 150, bend: 24, delay: 12 },
];

const frondPts = (x: number, y: number, a: number, len: number, bend: number): Pt[] => {
  const side = Math.cos((a * Math.PI) / 180) < -0.1 ? -1 : Math.cos((a * Math.PI) / 180) > 0.1 ? 1 : 0;
  const n = 5;
  let h = a;
  const pts: Pt[] = [[x, y]];
  for (let k = 0; k < n; k++) {
    x += Math.cos((h * Math.PI) / 180) * (len / n);
    y += Math.sin((h * Math.PI) / 180) * (len / n);
    pts.push([x, y]);
    h += (side || (k % 2 ? 1 : -1) * 0.3) * bend * (0.6 + k * 0.3);
  }
  return pts;
};

const LEAFLET = (L: number) => `M0 0 C -2.8 ${-L * 0.25} -2.6 ${-L * 0.7} 0 ${-L} C 2.6 ${-L * 0.7} 2.8 ${-L * 0.25} 0 0 Z`;

export const ParlorPalm: React.FC<{ c: Ctx }> = ({ c }) => {
  const cane = mix(c.leaf, "#A9B86A", 0.35);
  const rachis = shade(c.leaf, -0.25);
  return (
    <g>
      <ellipse cx={200} cy={SOIL_Y} rx={74} ry={9} fill="#3B2A1E" />

      {CANES.map((cn, i) => {
        const g = Math.min(1, c.grow(cn.delay));
        const base: Pt = [cn.x, SOIL_Y];
        const mid: Pt = [cn.x + (cn.top[0] - cn.x) * 0.35, (SOIL_Y + cn.top[1]) / 2];
        const canePts: Pt[] = [base, mid, cn.top];
        const fg = Math.min(1, c.grow(cn.delay + 12));
        const top = along(canePts, Math.min(1, g));
        const fpts = frondPts(cn.top[0], cn.top[1], cn.frond, cn.len, cn.bend);
        const n = Math.round(cn.len / 8);
        const sw = c.sway(i, 1);
        return (
          <g key={i} transform={`rotate(${sw} ${cn.x} ${SOIL_Y})`}>
            <path d={taperPath(canePts, 7, 4, g, 16)} fill={cane} />
            {/* Leaf-scar rings on the cane. */}
            {[0.2, 0.4, 0.6, 0.8].map((t) => {
              if (t > g) return null;
              const p = along(canePts, t);
              return <path key={t} d={`M-3.5 0 L3.5 0`} stroke={shade(cane, -0.25)} strokeWidth={1.6} transform={`translate(${p.x} ${p.y}) rotate(${p.angle + 90})`} />;
            })}
            {g >= 0.99 && (
              <g transform={`rotate(${c.sway(i + 7, 2.5)} ${top.x} ${top.y})`}>
                <path d={polyline(spline(fpts, fg, 24))} stroke={rachis} strokeWidth={2.4} fill="none" strokeLinecap="round" />
                {Array.from({ length: n }).map((_, k) => {
                  const t = 0.06 + (k / (n - 1)) * 0.92;
                  if (t > fg) return null;
                  const p = along(fpts, t);
                  const open = ramp(fg - t, 0, 0.2);
                  // Even spacing; leaflets longest near the base and shrinking towards the tip.
                  const L = 34 * (t < 0.22 ? 0.75 + t * 1.1 : 1 - (t - 0.22) * 0.85) * open;
                  return [-1, 1].map((sd) => {
                    // Leaflets angle forward and droop towards the ground.
                    let a = p.angle + sd * 44;
                    const down = 90;
                    const diff = ((down - a + 540) % 360) - 180;
                    a += diff * 0.14;
                    const tone = shade(c.leaf, (((k + i) % 3) - 1) * 0.06 + (sd > 0 ? 0.03 : -0.03));
                    return (
                      <g key={`${k}${sd}`} transform={`translate(${p.x} ${p.y}) rotate(${a + 90})`}>
                        <path d={LEAFLET(L)} fill={tone} />
                        <path d={`M0 -2 L0 ${-L * 0.9}`} stroke={shade(tone, -0.18)} strokeWidth={0.8} />
                      </g>
                    );
                  });
                })}
              </g>
            )}
          </g>
        );
      })}

      <RattanBasket color={c.pot} />
    </g>
  );
};

/** A woven rattan basket with a braided rim. */
const RattanBasket: React.FC<{ color: string }> = ({ color }) => {
  const dark = shade(color, -0.22);
  const light = shade(color, 0.14);
  const rows = [418, 436, 454, 472, 490];
  const body = "M124 408 L276 408 L264 494 Q 262 508 248 508 L152 508 Q 138 508 136 494 Z";
  return (
    <g>
      <path d={body} fill={dark} />
      {/* Basket weave: horizontal strands passing over and under upright stakes. */}
      {rows.map((y, r) => {
        const inset = ((y - 408) / 100) * 12;
        const x0 = 127 + inset;
        const x1 = 273 - inset;
        return (
          <g key={r}>
            <rect x={x0} y={y - 7} width={x1 - x0} height={14} rx={7} fill={r % 2 ? color : light} />
            <rect x={x0 + 4} y={y - 5} width={x1 - x0 - 8} height={3} rx={1.5} fill="#fff" opacity={0.18} />
            {Array.from({ length: 7 }).map((_, k) => {
              if ((k + r) % 2) return null;
              const x = 136 + k * 21.3;
              const xx = 200 + (x - 200) * (1 - ((y - 408) / 100) * 0.12);
              return <rect key={k} x={xx - 4.5} y={y - 8} width={9} height={16} rx={3} fill={dark} />;
            })}
          </g>
        );
      })}
      <path d="M140 418 L150 496" stroke="#fff" strokeOpacity={0.18} strokeWidth={8} strokeLinecap="round" />
      <path d="M262 420 L254 496" stroke="#000" strokeOpacity={0.15} strokeWidth={9} strokeLinecap="round" />
      {/* Braided rim. */}
      <rect x={116} y={396} width={168} height={16} rx={8} fill={dark} />
      {Array.from({ length: 16 }).map((_, k) => (
        <ellipse key={k} cx={122 + k * 10.4} cy={404} rx={7} ry={4.5} fill={k % 2 ? color : light} transform={`rotate(-35 ${122 + k * 10.4} 404)`} />
      ))}
      <rect x={120} y={397} width={160} height={2.5} rx={1.2} fill="#fff" opacity={0.25} />
    </g>
  );
};

export const drawing: PlantDrawing = { id: "parlor-palm", Component: ParlorPalm };
