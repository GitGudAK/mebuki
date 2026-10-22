import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, leafTone } from "./kit";

const X = 200;
const Y = 392;

// Paddle leaves on long stalks fanning from the clump. splits: number of wind tears.
const LEAVES = [
  { a: -36, stalk: 96, L: 116, splits: 0, d: 10 },
  { a: 38, stalk: 112, L: 122, splits: 0, d: 12 },
  { a: -16, stalk: 96, L: 120, splits: 0, d: 4 },
  { a: 22, stalk: 172, L: 134, splits: 3, d: 6 },
  { a: 5, stalk: 212, L: 140, splits: 0, d: 0 },
  { a: 12, stalk: 136, L: 124, splits: 2, d: 8 },
];

// Unit paddle: length 100, half-width 30, blunt rounded tip.
const PADDLE = "M0 0 C -20 -4 -25 -20 -26 -48 C -27 -82 -16 -100 0 -100 C 16 -100 27 -82 26 -48 C 25 -20 20 -4 0 0 Z";
const TEARS: Record<number, { y: number; s: number }[]> = {
  0: [],
  1: [{ y: -58, s: 1 }],
  2: [{ y: -40, s: -1 }, { y: -70, s: 1 }],
  3: [{ y: -34, s: 1 }, { y: -56, s: -1 }, { y: -76, s: 1 }],
};

export const BirdOfParadise: React.FC<{ c: Ctx }> = ({ c }) => {
  const rib = mix(c.leaf, "#E6EDC2", 0.5);
  const stalkColor = shade(c.leaf, -0.18);
  return (
    <g>
      <defs>
        {[0, 1, 2, 3].map((n) => (
          <mask key={n} id={`${c.id}-bop${n}`} maskUnits="userSpaceOnUse" x={-40} y={-110} width={80} height={120}>
            <path d={PADDLE} fill="#fff" />
            {TEARS[n].map((t, k) => (
              <path key={k} d={`M${t.s * 3} ${t.y} L${t.s * 40} ${t.y - 12}`} stroke="#000" strokeWidth={5} />
            ))}
          </mask>
        ))}
      </defs>

      {LEAVES.map((lf, i) => {
        const g = c.grow(lf.d);
        const shown = Math.min(1, g);
        if (shown <= 0.01) return null;
        const h = lf.stalk * shown;
        const color = leafTone(c.leaf, i);
        const open = Math.max(0, (g - 0.4) / 0.6);
        return (
          <g key={i} transform={`translate(${X + lf.a * 0.5} ${Y}) rotate(${lf.a + c.sway(i, 1.2)})`}>
            <path d={`M0 0 L0 ${-h}`} stroke={stalkColor} strokeWidth={6} strokeLinecap="round" />
            <path d={`M-1.5 -4 L-1.5 ${-h + 4}`} stroke="#fff" strokeOpacity={0.15} strokeWidth={2} />
            <g transform={`translate(0 ${-h + 4}) rotate(${Math.sign(lf.a) * 6}) scale(${(lf.L / 100) * open * 0.92} ${(lf.L / 100) * open})`}>
              <g mask={`url(#${c.id}-bop${lf.splits})`}>
                <path d={PADDLE} fill={color} />
                <path d="M0 -50 C 18 -50 30 -36 30 -50 C 30 -80 18 -100 0 -100 Z" fill="#000" opacity={0.08} />
                {Array.from({ length: 9 }, (_, k) => {
                  const y = -14 - k * 9;
                  return [-1, 1].map((s) => (
                    <path key={`${k}${s}`} d={`M${s * 2} ${y} L${s * 30} ${y - 10}`} stroke={shade(color, -0.16)} strokeWidth={0.9} />
                  ));
                })}
                <path d="M0 2 L0 -96" stroke={rib} strokeWidth={3.2} strokeLinecap="round" />
                <path d="M-18 -22 C -26 -40 -26 -66 -16 -84" stroke="#fff" strokeOpacity={0.2} strokeWidth={5} fill="none" strokeLinecap="round" />
              </g>
            </g>
          </g>
        );
      })}

      <CraneFlower c={c} />
      <RibbedUrn color={c.pot} />
    </g>
  );
};

/** Strelitzia's crane: a beaked green-purple spathe, a crest of orange sepals, a blue tongue. */
const CraneFlower: React.FC<{ c: Ctx }> = ({ c }) => {
  const g = c.grow(34);
  const shown = Math.min(1, g);
  if (shown <= 0.01) return null;
  const bloom = Math.max(0, (c.grow(44) - 0.1) / 0.9);
  const spathe = mix(c.leaf, "#6B3A57", 0.45);
  const orange = c.accent;
  const blue = "#2F62D6";
  // Stalk rises from the clump and bends over to hold the beak level.
  const top = { x: 188, y: 150 };
  return (
    <g transform={`rotate(${c.sway(11, 0.8)} ${X} ${Y})`}>
      <path
        d={`M${X - 6} ${Y} C ${X - 10} ${Y - 90} ${top.x + 10} ${top.y + 60} ${top.x} ${top.y}`}
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - shown}
        stroke={shade(c.leaf, -0.1)}
        strokeWidth={6}
        fill="none"
        strokeLinecap="round"
      />
      <g transform={`translate(${top.x} ${top.y}) scale(${-shown * 2} ${shown * 2}) rotate(6)`}>
        {/* Orange sepals fanning up and back like a crest. */}
        {[
          { x: 26, r: -40, L: 52 },
          { x: 31, r: -20, L: 58 },
          { x: 36, r: -2, L: 50 },
        ].map((sp, k) => (
          <g key={k} transform={`translate(${sp.x} -6) rotate(${sp.r}) scale(${bloom})`}>
            <path d={`M0 0 C -7 ${-sp.L * 0.3} -5 ${-sp.L * 0.7} 0 ${-sp.L} C 5 ${-sp.L * 0.7} 7 ${-sp.L * 0.3} 0 0 Z`} fill={shade(orange, k === 1 ? 0.06 : -0.04)} />
            <path d={`M-1.5 -6 L-1 ${-sp.L * 0.85}`} stroke="#fff" strokeOpacity={0.35} strokeWidth={1.6} />
          </g>
        ))}
        {/* Blue arrow-shaped petals. */}
        <g transform={`translate(38 -6) rotate(14) scale(${bloom})`}>
          <path d="M0 0 C -4 -16 -2 -34 2 -46 L8 -40 C 6 -28 6 -14 4 0 Z" fill={blue} />
          <path d="M2 -46 L-4 -36 L8 -40 Z" fill={shade(blue, 0.2)} />
        </g>
        {/* The beak-shaped spathe. */}
        <path d="M-4 -2 C 16 -16 52 -14 84 -2 C 56 9 21 12 -4 6 Z" fill={spathe} />
        <path d="M2 0 C 24 -7 53 -9 84 -3" stroke="#fff" strokeOpacity={0.2} strokeWidth={2} fill="none" />
        <path d="M-4 6 C 21 12 56 9 84 -2" stroke={orange} strokeOpacity={0.6} strokeWidth={1.6} fill="none" />
      </g>
    </g>
  );
};

/** A large ribbed terracotta urn with a rolled lip and a narrow foot. */
const RibbedUrn: React.FC<{ color: string }> = ({ color }) => {
  const body = "M130 398 L270 398 C 296 424 296 462 262 488 L246 496 L154 496 L138 488 C 104 462 104 424 130 398 Z";
  return (
    <g>
      <rect x={150} y={492} width={100} height={16} rx={4} fill={shade(color, -0.1)} />
      <rect x={150} y={492} width={100} height={4} fill="#000" opacity={0.15} />
      <path d={body} fill={color} />
      {[-0.8, -0.55, -0.3, -0.05, 0.2, 0.45, 0.7].map((u, k) => {
        const xt = 200 + u * 70;
        const xm = 200 + u * 92;
        const xb = 200 + u * 50;
        return <path key={k} d={`M${xt} 404 C ${xm} 430 ${xm} 460 ${xb} 492`} stroke={shade(color, -0.16)} strokeWidth={3} fill="none" />;
      })}
      <path d="M134 416 C 120 440 124 466 146 484" stroke="#fff" strokeOpacity={0.22} strokeWidth={9} fill="none" strokeLinecap="round" />
      <path d="M268 414 C 282 440 278 466 256 484" stroke="#000" strokeOpacity={0.14} strokeWidth={12} fill="none" strokeLinecap="round" />
      <rect x={118} y={382} width={164} height={20} rx={10} fill={shade(color, 0.06)} />
      <rect x={124} y={384} width={152} height={5} rx={2.5} fill="#fff" opacity={0.28} />
      <rect x={122} y={398} width={156} height={4} fill="#000" opacity={0.12} />
    </g>
  );
};

export const drawing: PlantDrawing = { id: "bird-of-paradise", Component: BirdOfParadise };
