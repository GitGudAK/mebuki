import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, ramp } from "./kit";

const X = 200;
const Y = 352;

// Pointed leaves on sheathed petioles rising from a short clump, arching outwards.
// `pink` is how much of the blade is flushed pink (newer leaves are pinker).
const LEAVES: { a: number; p: number; rot: number; L: number; pink: number; d: number }[] = [
  { a: -70, p: 70, rot: -96, L: 142, pink: 0.35, d: 6 },
  { a: 70, p: 72, rot: 98, L: 138, pink: 0.4, d: 8 },
  { a: -48, p: 100, rot: -64, L: 150, pink: 0.45, d: 10 },
  { a: 46, p: 104, rot: 62, L: 148, pink: 0.5, d: 12 },
  { a: -26, p: 130, rot: -34, L: 146, pink: 0.6, d: 16 },
  { a: 24, p: 126, rot: 36, L: 150, pink: 0.55, d: 18 },
  { a: -8, p: 150, rot: -10, L: 136, pink: 0.75, d: 22 },
  { a: 10, p: 140, rot: 14, L: 128, pink: 0.85, d: 26 },
  { a: -36, p: 80, rot: -46, L: 120, pink: 0.5, d: 20 },
  { a: 34, p: 78, rot: 48, L: 118, pink: 0.6, d: 24 },
];

/** Ovate blade drawn out into a fine acuminate tip. */
const blade = (L: number) => {
  const W = L * 0.42;
  return `M0 0 C ${W * 0.6} ${-L * 0.04} ${W * 0.72} ${-L * 0.42} ${W * 0.4} ${-L * 0.7} C ${W * 0.2} ${-L * 0.86} ${W * 0.04} ${-L * 0.94} 0 ${-L} C ${-W * 0.04} ${-L * 0.94} ${-W * 0.2} ${-L * 0.86} ${-W * 0.4} ${-L * 0.7} C ${-W * 0.72} ${-L * 0.42} ${-W * 0.6} ${-L * 0.04} 0 0 Z`;
};

const rnd = (n: number) => {
  const x = Math.sin(n * 91.7 + 47.3) * 43758.5453;
  return x - Math.floor(x);
};

export const ChineseEvergreen: React.FC<{ c: Ctx }> = ({ c }) => {
  const pink = c.accent;
  const deepPink = shade(mix(c.accent, "#C2185B", 0.3), -0.05);
  const petiole = mix(shade(c.leaf, -0.1), pink, 0.35);
  return (
    <g>
      <ellipse cx={X} cy={Y} rx={82} ry={9} fill="#3B2A1E" />
      {LEAVES.map((lf, i) => {
        const g = c.grow(lf.d);
        const len = lf.p * Math.min(1, g);
        const r = (lf.a * Math.PI) / 180;
        const tx = Math.sin(r) * len;
        const ty = -Math.cos(r) * len;
        const s = ramp(g, 0.3, 1);
        const L = lf.L;
        const W = L * 0.42;
        const green = shade(c.leaf, ((i % 3) - 1) * 0.06 - 0.04);
        const clip = `${c.id}-aglao-${i}`;
        // Splashes: irregular pink flecks either side of the midrib, more of them on pinker leaves.
        const n = Math.round(6 + lf.pink * 10);
        return (
          <g key={i} transform={`translate(${X} ${Y}) rotate(${c.sway(i, 1.6)})`}>
            <path d={`M0 0 Q ${tx * 0.1} ${ty * 0.7} ${tx} ${ty}`} stroke={petiole} strokeWidth={5} fill="none" strokeLinecap="round" />
            <g transform={`translate(${tx} ${ty}) rotate(${lf.rot}) scale(${s})`}>
              <defs>
                <clipPath id={clip}>
                  <path d={blade(L)} />
                </clipPath>
              </defs>
              <path d={blade(L)} fill={green} />
              <g clipPath={`url(#${clip})`}>
                {/* A broad pink flush feathering out from the midrib. */}
                <path
                  d={`M0 ${-L * 0.02} C ${W * lf.pink * 0.7} ${-L * 0.2} ${W * lf.pink * 0.75} ${-L * 0.55} 0 ${-L * 0.9} C ${-W * lf.pink * 0.75} ${-L * 0.55} ${-W * lf.pink * 0.7} ${-L * 0.2} 0 ${-L * 0.02} Z`}
                  fill={pink}
                />
                {Array.from({ length: n }, (_, k) => {
                  const t = 0.12 + rnd(i * 31 + k) * 0.72;
                  const v = k % 2 ? 1 : -1;
                  const x = v * W * (0.12 + rnd(i * 17 + k * 3) * 0.3);
                  return (
                    <ellipse
                      key={k}
                      cx={x}
                      cy={-L * t}
                      rx={W * (0.05 + rnd(k * 7 + i) * 0.08)}
                      ry={W * (0.03 + rnd(k * 5 + i) * 0.04)}
                      fill={k % 3 ? pink : mix(pink, "#fff", 0.25)}
                      transform={`rotate(${v * (30 + rnd(k + i) * 30)} ${x} ${-L * t})`}
                    />
                  );
                })}
                {/* Green flecks breaking up the pink near the midrib. */}
                {Array.from({ length: 5 }, (_, k) => {
                  const t = 0.2 + rnd(i * 13 + k * 9) * 0.6;
                  const x = (k % 2 ? 1 : -1) * W * (0.05 + rnd(i + k * 2) * 0.1);
                  return <ellipse key={`g${k}`} cx={x} cy={-L * t} rx={3.2} ry={2} fill={shade(green, 0.05)} opacity={0.85} />;
                })}
              </g>
              <path d={blade(L)} fill="none" stroke={mix(pink, green, 0.2)} strokeWidth={2.4} />
              <path d={`M0 0 L0 ${-L * 0.94}`} stroke={deepPink} strokeWidth={3.5} strokeLinecap="round" />
              <path d={`M${-W * 0.2} ${-L * 0.2} C ${-W * 0.3} ${-L * 0.4} ${-W * 0.26} ${-L * 0.58} ${-W * 0.12} ${-L * 0.74}`} stroke="#fff" strokeOpacity={0.22} strokeWidth={5} fill="none" strokeLinecap="round" />
            </g>
          </g>
        );
      })}
      <FacetedPot color={c.pot} />
    </g>
  );
};

type P = [number, number];

/** Triangulates a band between two rows of points, left to right. */
const strip = (top: P[], bot: P[]) => {
  const tris: P[][] = [];
  let i = 0;
  let j = 0;
  while (i < top.length - 1 || j < bot.length - 1) {
    const advanceTop = j >= bot.length - 1 || (i < top.length - 1 && top[i + 1][0] <= bot[j + 1][0]);
    if (advanceTop) {
      tris.push([top[i], top[i + 1], bot[j]]);
      i++;
    } else {
      tris.push([top[i], bot[j + 1], bot[j]]);
      j++;
    }
  }
  return tris;
};

/** A low-poly planter: triangular facets catching the light from the upper left. */
const FacetedPot: React.FC<{ color: string }> = ({ color }) => {
  const top: P[] = [[112, 356], [156, 356], [200, 356], [244, 356], [288, 356]];
  const mid: P[] = [[100, 420], [134, 422], [178, 424], [222, 424], [266, 422], [300, 420]];
  const bot: P[] = [[146, 508], [173, 508], [200, 508], [227, 508], [254, 508]];
  const tris = [...strip(top, mid), ...strip(mid, bot)];
  return (
    <g>
      {/* Inside back wall, seen over the front edge. */}
      <path d="M112 356 L124 346 L276 346 L288 356 Z" fill={shade(color, -0.35)} />
      {tris.map((t, k) => {
        const cx = (t[0][0] + t[1][0] + t[2][0]) / 3;
        const cy = (t[0][1] + t[1][1] + t[2][1]) / 3;
        const light = (200 - cx) / 100; // +1 at left, -1 at right
        const lower = cy > 422 ? -0.06 : 0.02;
        const amt = light * 0.22 + lower + (k % 2 ? -0.04 : 0.03);
        const fill = shade(color, Math.max(-0.4, Math.min(0.4, amt)));
        const d = `M${t[0][0]} ${t[0][1]} L${t[1][0]} ${t[1][1]} L${t[2][0]} ${t[2][1]} Z`;
        return <path key={k} d={d} fill={fill} stroke={fill} strokeWidth={0.8} strokeLinejoin="round" />;
      })}
      {/* Crisp facet edges. */}
      {tris.map((t, k) => (
        <path key={`e${k}`} d={`M${t[0][0]} ${t[0][1]} L${t[1][0]} ${t[1][1]} L${t[2][0]} ${t[2][1]} Z`} fill="none" stroke="#fff" strokeOpacity={0.14} strokeWidth={1} />
      ))}
      <path d="M112 356 L288 356" stroke={shade(color, 0.3)} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};

export const drawing: PlantDrawing = { id: "chinese-evergreen", Component: ChineseEvergreen, anchors: { soil: [196, 350], snip: [333, 331], snipR: 45 } };
