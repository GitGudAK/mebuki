import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, type Pt, along, polyline, ramp, spline, taperPath } from "./kit";

const STAKE_X = 222;

// The main vine zig-zags up the bamboo stake.
const VINE: Pt[] = [[196, 384], [208, 332], [228, 282], [212, 232], [228, 182], [214, 132], [224, 86], [218, 52]];

// Compound leaves alternate up the vine.
const LEAVES: { t: number; a: number; L: number; droop: number }[] = [
  { t: 0.1, a: 196, L: 112, droop: 30 },
  { t: 0.2, a: -14, L: 116, droop: 32 },
  { t: 0.33, a: 204, L: 108, droop: 28 },
  { t: 0.44, a: -22, L: 104, droop: 28 },
  { t: 0.56, a: 200, L: 100, droop: 24 },
  { t: 0.67, a: -18, L: 96, droop: 24 },
  { t: 0.78, a: 214, L: 84, droop: 18 },
  { t: 0.88, a: -34, L: 76, droop: 16 },
  { t: 0.97, a: 240, L: 56, droop: 8 },
];

// Hanging trusses: where they leave the vine, which side, and how ripe each fruit is (1 red, 0.5 orange, 0 green).
const TRUSSES: { t: number; side: number; ripe: number[]; delay: number }[] = [
  { t: 0.26, side: 1, ripe: [1, 1, 1, 1, 1, 1], delay: 40 },
  { t: 0.38, side: -1, ripe: [1, 1, 1, 0.5, 1, 0.5], delay: 46 },
  { t: 0.52, side: 1, ripe: [1, 1, 0.5, 0, 0], delay: 52 },
  { t: 0.64, side: -1, ripe: [0.5, 0, 0, 0], delay: 58 },
];
const FRUIT: Pt[] = [[4, 16], [-11, 28], [12, 38], [-9, 52], [9, 63], [-5, 77]];

/** A toothed, lobed leaflet pointing up from its base at the origin. */
const leaflet = (L: number, W: number, teeth: number) => {
  const N = teeth * 2;
  const right: Pt[] = [];
  for (let k = 0; k <= N; k++) {
    const s = k / N;
    const base = W * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.85)), 0.8);
    const tooth = k % 2 === 1 && s > 0.15 && k < N - 1;
    right.push([tooth ? base * 1.14 : base * 0.97, -L * s - (tooth ? L * 0.04 : 0)]);
  }
  const left = right.slice(0, -1).reverse().map(([x, y]): Pt => [-x, y]);
  return `${polyline([...right, ...left])} Z`;
};
const LEAFLET = leaflet(34, 14, 6);

const Leaflet: React.FC<{ color: string }> = ({ color }) => (
  <g>
    <path d={LEAFLET} fill={color} />
    <path d="M0 0 L0 -28" stroke={shade(color, -0.24)} strokeWidth={1.4} />
    {[9, 16, 23].map((y) =>
      [-1, 1].map((v) => <path key={`${y}${v}`} d={`M0 ${-y} L${v * 7} ${-y - 6}`} stroke={shade(color, -0.2)} strokeWidth={1} />),
    )}
  </g>
);

/** A tomato leaf: drooping rachis, three pairs of big leaflets with tiny ones between, a terminal leaflet. */
const TomatoLeaf: React.FC<{ from: Pt; a: number; L: number; droop: number; g: number; color: string; stem: string }> = ({
  from, a, L, droop, g, color, stem,
}) => {
  const r = (a * Math.PI) / 180;
  const pts: Pt[] = [
    from,
    [from[0] + Math.cos(r) * L * 0.5, from[1] + Math.sin(r) * L * 0.5 - droop * 0.3],
    [from[0] + Math.cos(r) * L, from[1] + Math.sin(r) * L + droop],
  ];
  const items: { t: number; side: number; s: number }[] = [
    { t: 0.3, side: -1, s: 0.9 }, { t: 0.3, side: 1, s: 0.9 },
    { t: 0.44, side: -1, s: 0.35 }, { t: 0.44, side: 1, s: 0.35 },
    { t: 0.58, side: -1, s: 1 }, { t: 0.58, side: 1, s: 1 },
    { t: 0.7, side: -1, s: 0.35 }, { t: 0.7, side: 1, s: 0.35 },
    { t: 0.84, side: -1, s: 0.9 }, { t: 0.84, side: 1, s: 0.9 },
    { t: 1, side: 0, s: 1.1 },
  ];
  return (
    <g>
      <path d={polyline(spline(pts, Math.min(1, g), 14))} stroke={stem} strokeWidth={2.6} fill="none" strokeLinecap="round" />
      {items.map((it, k) => {
        const p = along(pts, it.t);
        const s = ramp(g, it.t - 0.1, it.t + 0.15) * it.s * (L / 110 + 0.1);
        return (
          <g key={k} transform={`translate(${p.x} ${p.y}) rotate(${p.angle + 90 + it.side * 64}) scale(${s})`}>
            <Leaflet color={shade(color, ((k % 3) - 1) * 0.05)} />
          </g>
        );
      })}
    </g>
  );
};

export const CherryTomato: React.FC<{ c: Ctx }> = ({ c }) => {
  const stem = shade(c.leaf, -0.12);
  const unripe = mix(c.leaf, "#C9E67E", 0.45);
  const vineG = c.grow(0);
  return (
    <g>
      <ellipse cx={200} cy={378} rx={96} ry={10} fill="#3B2A1E" />
      <Stake />
      <g transform={`rotate(${c.sway(1, 0.5)} 200 384)`}>
        {LEAVES.map((lf, i) => {
          const p = along(VINE, lf.t);
          return (
            <TomatoLeaf
              key={i}
              from={[p.x, p.y]}
              a={lf.a + c.sway(i, 3)}
              L={lf.L}
              droop={lf.droop}
              g={c.grow(lf.t * 30 + 8)}
              color={shade(c.leaf, ((i % 3) - 1) * 0.05)}
              stem={stem}
            />
          );
        })}
        <path d={taperPath(VINE, 9, 3, Math.min(1, vineG), 40)} fill={stem} />
        {/* Soft twine ties holding the vine to the stake. */}
        {[0.16, 0.45, 0.74].map((t) => {
          const p = along(VINE, t);
          return (
            <g key={t} opacity={ramp(vineG, t, t + 0.1)}>
              <ellipse cx={(p.x + STAKE_X) / 2} cy={p.y} rx={Math.abs(p.x - STAKE_X) / 2 + 7} ry={3.2} fill="none" stroke="#EADCB4" strokeWidth={2.4} />
            </g>
          );
        })}

        {TRUSSES.map((tr, i) => {
          const p = along(VINE, tr.t);
          const g = c.grow(tr.delay - 10);
          const ripenG = c.grow(tr.delay + 10);
          const hang = c.sway(i + 6, 3);
          return (
            <g key={i} transform={`translate(${p.x} ${p.y}) scale(${tr.side} 1)`}>
              <g transform={`translate(28 -4) rotate(${hang})`}>
                <path d="M-28 4 Q -10 -10 0 4" stroke={stem} strokeWidth={2.6} fill="none" strokeLinecap="round" opacity={ramp(g, 0, 0.3)} />
                <path d={polyline(spline([[0, 4], ...FRUIT.slice(0, tr.ripe.length).map(([x, y]): Pt => [x * 0.3, y - 6])], Math.min(1, g), 14))} stroke={stem} strokeWidth={2} fill="none" strokeLinecap="round" />
                {tr.ripe.map((ripe, k) => {
                  const [x, y] = FRUIT[k];
                  const s = ramp(g, 0.2 + k * 0.1, 0.5 + k * 0.1);
                  const rr = ripenG * ripe;
                  const color = ripe === 0.5 ? mix(unripe, "#F59A2E", ripenG) : mix(unripe, c.accent, rr);
                  return (
                    <g key={k} transform={`translate(${x} ${y}) scale(${s})`}>
                      <path d={`M${-x * 0.7} ${-10 - 6} L0 -8`} stroke={stem} strokeWidth={1.6} />
                      <circle r={13} fill={color} />
                      <path d="M-8 4 A 9 9 0 0 0 6 8" stroke={shade(color, -0.2)} strokeWidth={2} fill="none" />
                      <ellipse cx={-4} cy={-4} rx={3.6} ry={2.4} fill="#fff" opacity={0.55} transform="rotate(-30 -4 -4)" />
                      {/* Star-shaped calyx. */}
                      {[0, 72, 144, 216, 288].map((a) => (
                        <path key={a} d="M0 0 L-1.6 -1 L0 -7 L1.6 -1 Z" fill={shade(c.leaf, -0.05)} transform={`translate(0 -11) rotate(${a})`} />
                      ))}
                    </g>
                  );
                })}
              </g>
            </g>
          );
        })}

        {/* Yellow star flowers with swept-back petals near the growing tip. */}
        {[{ t: 0.8, side: 1, n: 3 }, { t: 0.9, side: -1, n: 2 }].map((fl, i) => {
          const p = along(VINE, fl.t);
          const g = c.grow(48 + i * 8);
          return (
            <g key={i} transform={`translate(${p.x} ${p.y}) scale(${fl.side} 1)`}>
              <path d="M0 0 Q 16 -8 24 2" stroke={stem} strokeWidth={2} fill="none" opacity={ramp(g, 0, 0.3)} />
              {Array.from({ length: fl.n }, (_, k) => {
                const fx = 18 + k * 10;
                const fy = 10 + (k % 2) * 8;
                const s = ramp(g, k * 0.15, 0.5 + k * 0.15);
                return (
                  <g key={k} transform={`translate(${fx} ${fy}) rotate(${-20 + k * 25}) scale(${s})`}>
                    <path d={`M${-fx + 22} ${-fy + 2} L0 -2`} stroke={stem} strokeWidth={1.2} />
                    {[0, 60, 120, 180, 240, 300].map((a) => (
                      <path key={a} d="M0 0 L-2.2 -3 L0 -11 L2.2 -3 Z" fill="#F7D23E" transform={`rotate(${a})`} />
                    ))}
                    <path d="M-2.4 0 L0 7 L2.4 0 Z" fill="#E0A81E" />
                    <circle r={2.4} fill="#E8B526" />
                  </g>
                );
              })}
            </g>
          );
        })}
      </g>
      <BalconyPot color={c.pot} />
    </g>
  );
};

/** The bamboo cane, with its nodes. */
const Stake: React.FC = () => (
  <g>
    <rect x={STAKE_X - 3.5} y={36} width={7} height={350} rx={3.5} fill="#D6B878" />
    <rect x={STAKE_X - 3.5} y={36} width={2.2} height={350} rx={1.1} fill="#fff" opacity={0.25} />
    {[90, 156, 222, 288, 352].map((y) => (
      <rect key={y} x={STAKE_X - 4.5} y={y} width={9} height={3.5} rx={1.75} fill="#B0925A" />
    ))}
  </g>
);

/** A big moulded balcony pot with a thick rolled lip and a raised band. */
const BalconyPot: React.FC<{ color: string }> = ({ color }) => (
  <g>
    <path d="M102 390 L298 390 L282 494 Q 280 508 266 508 L134 508 Q 120 508 118 494 Z" fill={color} />
    <path d="M108 418 L292 418" stroke={shade(color, 0.12)} strokeWidth={6} />
    <path d="M108 424 L292 424" stroke={shade(color, -0.18)} strokeWidth={2} />
    <path d="M122 496 L278 496" stroke={shade(color, -0.2)} strokeWidth={3} />
    <path d="M128 434 L136 488" stroke="#fff" strokeOpacity={0.25} strokeWidth={9} strokeLinecap="round" />
    <path d="M276 434 L266 488" stroke="#000" strokeOpacity={0.14} strokeWidth={12} strokeLinecap="round" />
    <rect x={90} y={370} width={220} height={24} rx={10} fill={shade(color, 0.08)} />
    <path d="M96 388 L304 388" stroke={shade(color, -0.15)} strokeWidth={2} />
    <rect x={98} y={373} width={204} height={4.5} rx={2.2} fill="#fff" opacity={0.3} />
  </g>
);

export const drawing: PlantDrawing = { id: "balcony-cherry-tomato", Component: CherryTomato, anchors: { soil: [199, 372], snip: [242, 152], snipR: 28 } };
