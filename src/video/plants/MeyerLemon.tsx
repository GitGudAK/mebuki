import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, type Pt, ramp, taperPath } from "./kit";

// A short standard: one trunk forking into three scaffold limbs under a rounded crown.
const TRUNK: Pt[] = [[200, 372], [198, 330], [202, 290], [200, 256]];
const LIMBS: { pts: Pt[]; d: number }[] = [
  { pts: [[200, 258], [176, 228], [146, 196], [120, 170]], d: 6 },
  { pts: [[200, 258], [204, 214], [198, 170], [202, 120]], d: 8 },
  { pts: [[200, 258], [228, 230], [258, 198], [282, 168]], d: 10 },
];
const CROWN = { x: 200, y: 172, rx: 150, ry: 108 };

const rnd = (n: number) => {
  const x = Math.sin(n * 71.3 + 13.7) * 43758.5453;
  return x - Math.floor(x);
};

// Leaves scattered through the crown, denser at the rim so the silhouette stays leafy.
const LEAVES = Array.from({ length: 110 }, (_, k) => {
  const ang = rnd(k * 3 + 1) * Math.PI * 2;
  const rad = Math.sqrt(0.15 + rnd(k * 5 + 2) * 0.85);
  return {
    x: CROWN.x + Math.cos(ang) * CROWN.rx * rad,
    y: CROWN.y + Math.sin(ang) * CROWN.ry * rad,
    rot: (ang * 180) / Math.PI + 90 + (rnd(k * 7) - 0.5) * 70,
    L: 30 + rnd(k * 11) * 12,
    d: 10 + rad * 12 + rnd(k) * 6,
  };
});

const LEMONS = [
  { x: 132, y: 218, r: -10 }, { x: 186, y: 236, r: 6 }, { x: 258, y: 226, r: -6 }, { x: 300, y: 178, r: 12 },
  { x: 104, y: 160, r: 8 }, { x: 222, y: 150, r: -14 }, { x: 160, y: 120, r: 4 },
];
const BLOSSOMS = [
  { x: 150, y: 86 }, { x: 246, y: 98 }, { x: 318, y: 214 }, { x: 84, y: 200 }, { x: 274, y: 136 },
];

const LEAF_PATH = (L: number) => `M0 0 C ${L * 0.26} ${-L * 0.2} ${L * 0.24} ${-L * 0.72} 0 ${-L} C ${-L * 0.24} ${-L * 0.72} ${-L * 0.26} ${-L * 0.2} 0 0 Z`;

export const MeyerLemon: React.FC<{ c: Ctx }> = ({ c }) => {
  const bark = "#7A6150";
  const gT = c.grow(0);
  const crownG = c.grow(24);
  return (
    <g>
      <g transform={`rotate(${c.sway(1, 0.5)} 200 372)`}>
        <path d={taperPath(TRUNK, 18, 12, Math.min(1, gT))} fill={bark} />
        <path d={taperPath(TRUNK.map(([x, y]) => [x - 4, y] as Pt), 4, 2, Math.min(1, gT) * 0.9)} fill="#fff" opacity={0.12} />
        {LIMBS.map((l, i) => (
          <path key={i} d={taperPath(l.pts, 11, 4, Math.min(1, c.grow(l.d)))} fill={bark} />
        ))}

        {/* Massed dark crown behind the individual leaves. */}
        <g transform={`translate(${CROWN.x} ${CROWN.y}) scale(${crownG}) translate(${-CROWN.x} ${-CROWN.y})`}>
          {[[-90, 20, 62], [-48, -36, 70], [6, -54, 72], [60, -30, 70], [96, 22, 60], [-30, 40, 66], [40, 40, 66], [0, 0, 80]].map(([dx, dy, r], k) => (
            <circle key={k} cx={CROWN.x + dx} cy={CROWN.y + dy} r={r} fill={shade(c.leaf, -0.28)} />
          ))}
        </g>

        {/* Limbs show through the lower crown. */}
        {LIMBS.map((l, i) => (
          <path key={`v${i}`} d={taperPath(l.pts.slice(0, 3), 10, 6, ramp(c.grow(l.d), 0.2, 1) * 0.9)} fill={shade(bark, -0.05)} />
        ))}

        {LEAVES.map((lf, i) => {
          const s = c.grow(lf.d);
          const color = shade(c.leaf, ((i * 5) % 4) * 0.05 - 0.08);
          return (
            <g key={i} transform={`translate(${lf.x} ${lf.y}) rotate(${lf.rot + c.sway(i, 3)}) scale(${s})`}>
              <path d={LEAF_PATH(lf.L)} fill={color} />
              <path d={`M0 -2 L0 ${-lf.L * 0.9}`} stroke={shade(color, -0.22)} strokeWidth={1.4} />
              <path d={`M${-lf.L * 0.1} ${-lf.L * 0.25} Q ${-lf.L * 0.16} ${-lf.L * 0.5} ${-lf.L * 0.07} ${-lf.L * 0.75}`} stroke="#fff" strokeOpacity={0.3} strokeWidth={2.5} fill="none" strokeLinecap="round" />
            </g>
          );
        })}

        {BLOSSOMS.map((b, i) => {
          const s = c.grow(34 + i * 4) * 0.95;
          return (
            <g key={`f${i}`} transform={`translate(${b.x} ${b.y}) rotate(${i * 23}) scale(${s})`}>
              {[0, 72, 144, 216, 288].map((a) => (
                <ellipse key={a} cx={0} cy={-7} rx={4.6} ry={8} fill="#FBF8F1" transform={`rotate(${a})`} />
              ))}
              {/* Meyer buds and petal backs carry a purple blush. */}
              {[36, 180].map((a) => (
                <ellipse key={a} cx={0} cy={-8} rx={2} ry={5} fill="#C9A0C8" opacity={0.6} transform={`rotate(${a})`} />
              ))}
              <circle r={3.6} fill="#F2D35B" />
              {[0, 60, 120, 180, 240, 300].map((a) => (
                <circle key={a} cx={0} cy={-5} r={1} fill="#E5B92E" transform={`rotate(${a})`} />
              ))}
            </g>
          );
        })}

        {LEMONS.map((l, i) => {
          const g = c.grow(44 + i * 4);
          const ripe = c.grow(62 + i * 4);
          const color = mix(shade(c.leaf, 0.25), c.accent, ripe);
          return (
            <g key={`l${i}`} transform={`translate(${l.x} ${l.y}) rotate(${l.r + c.sway(i + 7, 2.5)})`}>
              <path d="M0 -14 L0 -4" stroke={bark} strokeWidth={2} />
              <g transform={`translate(0 14) scale(${g})`}>
                <ellipse cx={0} cy={0} rx={17} ry={21} fill={color} />
                {/* The nipple at the blossom end and the button where the stalk joins. */}
                <path d="M-4 16 Q 0 25 4 16 Z" fill={color} />
                <ellipse cx={0} cy={-17} rx={4} ry={2.4} fill={shade(c.leaf, -0.1)} />
                <ellipse cx={5} cy={2} rx={10} ry={15} fill={shade(color, -0.12)} opacity={0.5} />
                <ellipse cx={-6} cy={-6} rx={4} ry={7} fill="#fff" opacity={0.38} transform="rotate(14 -6 -6)" />
                {[[-3, 6], [4, -8], [6, 9], [-8, 2]].map(([x, y], k) => (
                  <circle key={k} cx={x} cy={y} r={0.9} fill={shade(color, -0.25)} opacity={0.6} />
                ))}
              </g>
            </g>
          );
        })}
      </g>
      <VersaillesPlanter color={c.pot} />
    </g>
  );
};

/** A square orangery box: corner posts with ball finials, framed panels of vertical boards. */
const VersaillesPlanter: React.FC<{ color: string }> = ({ color }) => {
  const dark = shade(color, -0.16);
  const post = shade(color, 0.04);
  return (
    <g>
      <rect x={116} y={366} width={168} height={12} fill="#3B2A1E" />
      {/* Panel boards */}
      <rect x={120} y={380} width={160} height={116} fill={shade(color, -0.04)} />
      {[136, 152, 168, 184, 200, 216, 232, 248, 264].map((x) => (
        <path key={x} d={`M${x} 392 L${x} 486`} stroke={dark} strokeWidth={1.5} opacity={0.6} />
      ))}
      {/* Inner frame moulding */}
      <rect x={132} y={390} width={136} height={98} fill="none" stroke={shade(color, 0.14)} strokeWidth={5} />
      <rect x={132} y={390} width={136} height={98} fill="none" stroke={dark} strokeWidth={1.2} />
      {/* Top and bottom rails */}
      <rect x={108} y={372} width={184} height={14} rx={2} fill={post} />
      <rect x={108} y={372} width={184} height={4} rx={2} fill="#fff" opacity={0.3} />
      <rect x={112} y={488} width={176} height={10} fill={dark} />
      {/* Corner posts, feet and finials */}
      {[96, 282].map((x) => (
        <g key={x}>
          <rect x={x} y={366} width={22} height={134} rx={2} fill={post} />
          <rect x={x + 3} y={368} width={5} height={130} fill="#fff" opacity={0.22} />
          <rect x={x + 16} y={368} width={4} height={130} fill="#000" opacity={0.1} />
          <rect x={x - 2} y={360} width={26} height={8} rx={2} fill={shade(color, 0.1)} />
          <rect x={x + 7} y={354} width={8} height={7} fill={dark} />
          <circle cx={x + 11} cy={346} r={10} fill={shade(color, 0.08)} />
          <circle cx={x + 8} cy={343} r={3.5} fill="#fff" opacity={0.4} />
          <rect x={x + 2} y={500} width={18} height={8} rx={1.5} fill={shade(color, -0.25)} />
        </g>
      ))}
    </g>
  );
};

export const drawing: PlantDrawing = { id: "meyer-lemon", Component: MeyerLemon };
