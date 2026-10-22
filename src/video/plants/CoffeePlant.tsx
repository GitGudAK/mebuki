import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, type Pt, along, polyline, ramp, taperPath } from "./kit";

// One upright leader with nearly horizontal side branches in four loose tiers. Lengths vary
// side to side so the outline stays an irregular shrub, not a neat cone.
const TRUNK: Pt[] = [[200, 352], [199, 280], [202, 200], [200, 120], [201, 78]];
const TIERS = [
  { y: 290, len: [128, 120], d: 6 },
  { y: 226, len: [146, 156], d: 11 },
  { y: 164, len: [136, 124], d: 16 },
  { y: 112, len: [92, 100], d: 21 },
];

type Branch = { pts: Pt[]; side: number; tier: number; d: number; scale: number };
const BRANCHES: Branch[] = TIERS.flatMap((t, tier) =>
  [-1, 1].map((side) => {
    const len = t.len[side < 0 ? 0 : 1];
    return {
      pts: [
        [200, t.y],
        [200 + side * len * 0.5, t.y - 5],
        [200 + side * len, t.y + 5],
      ] as Pt[],
      side,
      tier,
      d: t.d + (side > 0 ? 2 : 0),
      scale: 1 - tier * 0.06,
    };
  }),
);

// Opposite leaf pairs at these points along every branch, plus a terminal leaf.
const NODES = [0.48];

// Cherry clusters packed round the branch at the leaf axils.
const CHERRIES: { b: number; t: number; n: number }[] = [
  { b: 0, t: 0.48, n: 7 }, { b: 0, t: 0.82, n: 5 }, { b: 1, t: 0.48, n: 7 }, { b: 1, t: 0.2, n: 4 },
  { b: 2, t: 0.48, n: 6 }, { b: 2, t: 0.84, n: 4 }, { b: 3, t: 0.48, n: 7 }, { b: 3, t: 0.2, n: 4 },
  { b: 4, t: 0.48, n: 5 }, { b: 5, t: 0.48, n: 5 },
];
// Slots in a cluster, straddling the branch line: the first ones sit on top, the rest below.
const SLOTS: Pt[] = [[-3, -4], [4, -5], [-9, 1], [9, 0], [-4, 5], [3, 6], [-1, 0]];

const rnd = (n: number) => {
  const x = Math.sin(n * 57.3 + 19.1) * 43758.5453;
  return x - Math.floor(x);
};

/** A broad glossy elliptic leaf with a gently wavy (undulate) margin and drawn-out tip. */
const wavyLeaf = (L: number) => {
  const W = L * 0.27;
  const n = 22;
  const right: Pt[] = [];
  const left: Pt[] = [];
  for (let k = 0; k <= n; k++) {
    const s = k / n;
    const body = Math.pow(Math.sin(Math.PI * Math.min(1, s * 1.04)), 0.8) * (s > 0.8 ? 1 - (s - 0.8) * 2.4 : 1);
    const w = W * Math.max(0, body) * (1 + 0.05 * Math.sin(s * Math.PI * 5));
    right.push([w, -L * s]);
    left.push([-w * (1 + 0.04 * Math.cos(s * Math.PI * 5)), -L * s]);
  }
  return `${polyline(right)} ${polyline(left.reverse()).replace("M", "L")} Z`;
};

export const CoffeePlant: React.FC<{ c: Ctx }> = ({ c }) => {
  const bark = mix(shade(c.leaf, -0.4), "#6B5040", 0.55);
  const deep = shade(c.leaf, -0.2);
  const gT = c.grow(0);
  const growOf = BRANCHES.map((b) => c.grow(b.d));
  const leaf = (L: number, color: string, key: string, transform: string) => (
    <g key={key} transform={transform}>
      <path d={wavyLeaf(L)} fill={color} />
      <path d={`M0 -2 L0 ${-L * 0.9}`} stroke={shade(color, -0.3)} strokeWidth={2} />
      {[0.2, 0.36, 0.52, 0.68].map((t) =>
        [-1, 1].map((v) => (
          <path key={`${t}${v}`} d={`M0 ${-L * t} Q ${v * L * 0.1} ${-L * (t + 0.03)} ${v * L * 0.2} ${-L * (t + 0.11)}`} stroke={shade(color, -0.26)} strokeWidth={1.3} fill="none" />
        )),
      )}
      {/* Strong gloss: a long sheen down one half and a bright glint. */}
      <path d={`M${-L * 0.11} ${-L * 0.16} C ${-L * 0.18} ${-L * 0.36} ${-L * 0.17} ${-L * 0.56} ${-L * 0.07} ${-L * 0.76}`} stroke="#fff" strokeOpacity={0.24} strokeWidth={L * 0.04} fill="none" strokeLinecap="round" />
      <ellipse cx={-L * 0.12} cy={-L * 0.3} rx={L * 0.02} ry={L * 0.04} fill="#fff" opacity={0.5} />
    </g>
  );
  return (
    <g>
      <ellipse cx={200} cy={350} rx={80} ry={10} fill="#3B2A1E" />
      <g transform={`rotate(${c.sway(1, 0.6)} 200 352)`}>
        <path d={taperPath(TRUNK, 12, 4, Math.min(1, gT))} fill={bark} />
        {BRANCHES.map((b, i) => (
          <g key={`b${i}`} transform={`rotate(${c.sway(i + 2, 1)} 200 ${b.pts[0][1]})`}>
            <path d={taperPath(b.pts, 6 - b.tier * 0.6, 2, Math.min(1, growOf[i]), 16)} fill={bark} />
          </g>
        ))}

        {BRANCHES.map((b, i) => (
          <g key={`l${i}`} transform={`rotate(${c.sway(i + 2, 1)} 200 ${b.pts[0][1]})`}>
            {NODES.map((t, k) => {
              const s = ramp(growOf[i], t * 0.6, t * 0.6 + 0.35);
              const p = along(b.pts, t);
              const L = 90 * b.scale;
              const heading = p.angle + 90; // leaf axis along the branch, pointing outward
              const color = shade(deep, ((i + k) % 3 - 1) * 0.05);
              // An opposite pair, both sloping down a little from the branch.
              const lowDroop = b.tier === 0 ? 18 : 22;
              return [-1, 1].map((v) =>
                leaf(L, shade(color, v * 0.04), `${k}${v}`, `translate(${p.x} ${p.y}) rotate(${heading + b.side * (v < 0 ? -18 : lowDroop) + c.sway(i * 3 + k + v, 2.5)}) scale(${s})`),
              );
            })}
            {(() => {
              const p = along(b.pts, 1);
              const s = ramp(growOf[i], 0.7, 1);
              return leaf(84 * b.scale, shade(deep, 0.04), "tip", `translate(${p.x} ${p.y}) rotate(${p.angle + 90 - b.side * 6 + c.sway(i * 5, 2.5)}) scale(${s})`);
            })()}
          </g>
        ))}

        {/* Branches again over the leaf bases, so the tiers read as horizontal shelves. */}
        {BRANCHES.map((b, i) => (
          <g key={`bo${i}`} transform={`rotate(${c.sway(i + 2, 1)} 200 ${b.pts[0][1]})`}>
            <path d={taperPath(b.pts, 5.5 - b.tier * 0.6, 1.8, Math.min(1, growOf[i]) * 0.97, 16)} fill={bark} />
          </g>
        ))}

        <g transform={`translate(201 ${78 + (1 - Math.min(1, gT)) * 274})`}>
          {[-1, 1].map((v) => leaf(52, shade(deep, 0.08), `top${v}`, `rotate(${v * 30}) scale(${c.grow(26)})`))}
        </g>

        {CHERRIES.map((ch, i) => {
          const b = BRANCHES[ch.b];
          const p = along(b.pts, ch.t);
          const ripen = c.grow(56 + i * 4);
          return (
            <g key={`c${i}`} transform={`rotate(${c.sway(ch.b + 2, 1)} 200 ${b.pts[0][1]}) translate(${p.x} ${p.y})`}>
              {SLOTS.slice(0, ch.n).map(([ox, oy], k) => {
                const g = c.grow(36 + i * 3 + k);
                const stage = rnd(i * 11 + k);
                // Mostly red and deep red, the odd one still green.
                const target = stage < 0.15 ? null : stage < 0.55 ? c.accent : shade(c.accent, -0.3);
                const green = shade(c.leaf, 0.2);
                const fill = target ? mix(green, target, ripen) : green;
                return (
                  <g key={k} transform={`translate(${ox} ${oy}) scale(${g})`}>
                    <ellipse rx={6.4} ry={7} fill={fill} />
                    <ellipse rx={6.4} ry={7} fill="none" stroke={shade(fill, -0.3)} strokeWidth={0.8} />
                    <ellipse cx={-2} cy={-2.6} rx={1.9} ry={1.4} fill="#fff" opacity={0.55} />
                    <circle cx={0} cy={5.4} r={1.2} fill={shade(fill, -0.45)} />
                  </g>
                );
              })}
            </g>
          );
        })}
      </g>
      <BurlapPot color={c.pot} id={c.id} />
    </g>
  );
};

/** A nursery pot wrapped in hessian, gathered under a twine tie with a bow, the cloth frilled above. */
const BurlapPot: React.FC<{ color: string; id: string }> = ({ color, id }) => {
  const weave = `${id}-burlap`;
  const twine = "#8C6B45";
  const frill = "M104 384 L100 346 L112 352 L122 340 L134 350 L148 338 L160 349 L174 337 L188 348 L200 336 L214 348 L228 337 L240 349 L254 338 L266 350 L278 340 L288 352 L300 346 L296 384 Z";
  return (
    <g>
      <defs>
        <pattern id={weave} width={6} height={6} patternUnits="userSpaceOnUse">
          <path d="M0 1.5 H6 M0 4.5 H6" stroke="#000" strokeOpacity={0.09} strokeWidth={1.2} />
          <path d="M1.5 0 V6 M4.5 0 V6" stroke="#fff" strokeOpacity={0.1} strokeWidth={1.2} />
        </pattern>
      </defs>
      {/* Frill of cloth above the tie. */}
      <path d={frill} fill={shade(color, -0.06)} />
      <path d={frill} fill={`url(#${weave})`} />
      {[120, 150, 182, 216, 250, 282].map((x) => (
        <path key={x} d={`M${x} 350 L${x + 3} 378`} stroke={shade(color, -0.22)} strokeWidth={2} opacity={0.6} />
      ))}
      {/* Wrapped body, bunched into soft vertical folds. */}
      <path d="M116 380 L284 380 C 292 420 286 470 272 498 Q 268 508 256 508 L144 508 Q 132 508 128 498 C 114 470 108 420 116 380 Z" fill={color} />
      <path d="M116 380 L284 380 C 292 420 286 470 272 498 Q 268 508 256 508 L144 508 Q 132 508 128 498 C 114 470 108 420 116 380 Z" fill={`url(#${weave})`} />
      {[136, 166, 200, 234, 264].map((x, k) => (
        <path key={x} d={`M${x} 390 C ${x + (k % 2 ? 6 : -6)} 430 ${x + (k % 2 ? -4 : 4)} 466 ${x + (x - 200) * 0.08} 500`} stroke={shade(color, -0.18)} strokeWidth={3} fill="none" opacity={0.55} strokeLinecap="round" />
      ))}
      <path d="M128 398 C 122 440 128 474 140 494" stroke="#fff" strokeOpacity={0.2} strokeWidth={9} fill="none" strokeLinecap="round" />
      {/* Frayed threads at the hem. */}
      {[150, 176, 214, 240].map((x) => (
        <path key={x} d={`M${x} 506 l -2 5`} stroke={shade(color, -0.25)} strokeWidth={1.5} />
      ))}
      {/* Twine: two turns and a bow at the front. */}
      <path d="M110 380 Q 200 390 290 380" stroke={twine} strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d="M110 387 Q 200 397 290 387" stroke={shade(twine, -0.15)} strokeWidth={3.5} fill="none" strokeLinecap="round" />
      <path d="M200 386 C 186 372 172 376 176 386 C 180 396 192 392 200 386 Z" fill="none" stroke={twine} strokeWidth={3.5} />
      <path d="M200 386 C 214 372 228 376 224 386 C 220 396 208 392 200 386 Z" fill="none" stroke={twine} strokeWidth={3.5} />
      <path d="M198 388 C 194 400 190 410 186 420 M202 388 C 206 400 212 408 216 418" stroke={twine} strokeWidth={3} fill="none" strokeLinecap="round" />
      <circle cx={200} cy={387} r={4} fill={shade(twine, -0.1)} />
    </g>
  );
};

export const drawing: PlantDrawing = { id: "coffee-plant", Component: CoffeePlant };
