import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, type Pt, polyline, ramp } from "./kit";

// Wire hoop: a circle with two legs pushed into the soil.
const CX = 200;
const CY = 236;
const R = 118;
const SOIL_Y = 382;
const LEG = 30;

const onHoop = (deg: number, off = 0): Pt => {
  const a = (deg * Math.PI) / 180;
  return [CX + Math.cos(a) * (R + off), CY + Math.sin(a) * (R + off)];
};

// Two vines climb from either leg and twine round the hoop in opposite directions.
const VINES = [
  { from: 104, to: 335, delay: 2 },
  { from: 76, to: -152, delay: 6 },
];

// Umbels hang from points on the hoop (degrees, 0 = right, -90 = top).
const UMBELS = [
  { at: -138, delay: 40, s: 1 },
  { at: -32, delay: 46, s: 0.92 },
  { at: 178, delay: 52, s: 0.85 },
];

const LEAF = "M0 0 C -13 -5 -15 -30 0 -42 C 15 -30 13 -5 0 0 Z";

const vinePts = (from: number, to: number, upto: number): Pt[] => {
  const n = 60;
  const legX = CX + Math.cos((from * Math.PI) / 180) * R;
  const out: Pt[] = [[legX, SOIL_Y]];
  for (let k = 0; k <= n * upto; k++) {
    const d = from + ((to - from) * k) / n;
    out.push(onHoop(d, Math.sin((d * Math.PI) / 22) * 5));
  }
  return out;
};

/** A ball of waxy five-pointed stars, each with a darker star-shaped corona. */
const Umbel: React.FC<{ s: number; pink: string }> = ({ s, pink }) => {
  const star = (r: number, ri: number) =>
    Array.from({ length: 10 }, (_, k) => {
      const a = (k * 36 - 90) * (Math.PI / 180);
      const rr = k % 2 ? ri : r;
      return `${k ? "L" : "M"}${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)}`;
    }).join(" ") + " Z";
  const flowers: { x: number; y: number }[] = [];
  [0, 6, 12].forEach((n, ring) => {
    if (!n) flowers.push({ x: 0, y: 24 });
    for (let k = 0; k < n; k++) {
      const a = ((k + ring * 0.5) / n) * Math.PI * 2;
      const rr = ring * 13;
      flowers.push({ x: Math.cos(a) * rr, y: 24 + Math.sin(a) * rr * 0.8 });
    }
  });
  const corona = "#A8324F";
  return (
    <g transform={`scale(${s})`}>
      {flowers.map((f, k) => (
        <path key={`p${k}`} d={`M0 0 L${f.x * 0.9} ${f.y - 6}`} stroke="#B78A6E" strokeWidth={1.2} />
      ))}
      {flowers
        .slice()
        .sort((a, b) => a.y - b.y)
        .map((f, k) => (
          <g key={k} transform={`translate(${f.x} ${f.y}) rotate(${k * 17})`}>
            <path d={star(10, 4.5)} fill={pink} stroke={shade(pink, -0.12)} strokeWidth={0.8} strokeLinejoin="round" />
            <path d={star(4.2, 2)} fill={corona} />
            <circle r={1.3} fill="#fff" opacity={0.85} />
            <circle cx={-3} cy={-4} r={1.6} fill="#fff" opacity={0.5} />
          </g>
        ))}
    </g>
  );
};

export const Hoya: React.FC<{ c: Ctx }> = ({ c }) => {
  const wire = "#9A8F84";
  const stem = mix(shade(c.leaf, -0.3), "#7A5A44", 0.35);
  const pink = c.accent;
  const legL = onHoop(104);
  const legR = onHoop(76);
  const hoop = c.grow(0);
  return (
    <g>
      {/* The wire hoop. */}
      <g opacity={Math.min(1, hoop * 1.4)}>
        <path
          d={`M${legL[0]} ${SOIL_Y + LEG} L${legL[0]} ${legL[1]} A ${R} ${R} 0 1 1 ${legR[0]} ${legR[1]} L${legR[0]} ${SOIL_Y + LEG}`}
          stroke={wire}
          strokeWidth={4}
          fill="none"
        />
        <path d={`M${legL[0]} ${legL[1]} A ${R} ${R} 0 0 1 ${CX - 70} ${CY - 95}`} stroke="#fff" strokeOpacity={0.3} strokeWidth={1.5} fill="none" transform={`translate(1 0)`} />
      </g>

      {VINES.map((v, i) => {
        const g = Math.min(1, c.grow(v.delay));
        const pts = vinePts(v.from, v.to, g);
        const total = Math.abs(v.to - v.from);
        const nodes = Math.floor(total / 21);
        return (
          <g key={i}>
            <path d={polyline(pts)} stroke={stem} strokeWidth={3.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            {Array.from({ length: nodes }).map((_, k) => {
              const t = (k + 0.6) / nodes;
              if (t > g) return null;
              const d = v.from + (v.to - v.from) * t;
              const [x, y] = onHoop(d, Math.sin((d * Math.PI) / 22) * 5);
              const s = Math.min(1.05, ramp(c.grow(v.delay + 8 + k * 2.2), 0, 1)) * (0.98 + ((k * 7) % 5) * 0.06);
              // Opposite pair at each node, leaning outward and inward from the hoop.
              return [-1, 1].map((side) => {
                const dir = d + side * (70 + ((k + i) % 3) * 10) + (i ? 180 : 0) * 0;
                const tone = shade(c.leaf, (((k + i + side) % 3) - 1) * 0.07);
                return (
                  <g key={`${k}${side}`} transform={`translate(${x} ${y}) rotate(${dir + 90 + c.sway(k * 3 + i + side, 2.5)}) scale(${s})`}>
                    <path d="M0 0 L0 -6" stroke={stem} strokeWidth={2.4} />
                    <g transform="translate(0 -5)">
                      <path d={LEAF} fill={tone} />
                      <path d="M0 -3 L0 -36" stroke={shade(tone, -0.18)} strokeWidth={1.4} />
                      <path d="M-6 -10 C -9 -20 -7 -29 -2 -35" stroke="#fff" strokeOpacity={0.4} strokeWidth={3.2} fill="none" strokeLinecap="round" />
                      {[[4, -14], [6, -22], [3, -28], [-5, -24]].map(([sx, sy], q) => (
                        <circle key={q} cx={sx} cy={sy} r={1.1} fill="#E6F0DD" opacity={0.6} />
                      ))}
                    </g>
                  </g>
                );
              });
            })}
          </g>
        );
      })}

      {/* Clusters of waxy pink stars hanging from short spurs. */}
      {UMBELS.map((u, i) => {
        const s = Math.min(1.05, c.grow(u.delay)) * u.s * 1.12;
        const [x, y] = onHoop(u.at);
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${c.sway(i + 20, 3)})`}>
            <path d={`M0 0 L0 ${18 * Math.min(1, c.grow(u.delay - 8))}`} stroke="#8F6A55" strokeWidth={2.6} strokeLinecap="round" />
            <g transform="translate(0 16)">
              <Umbel s={s} pink={pink} />
            </g>
          </g>
        );
      })}

      <GlazedPot color={c.pot} />
    </g>
  );
};

/** A round-bellied stoneware pot with a darker glaze running down from the rim. */
const GlazedPot: React.FC<{ color: string }> = ({ color }) => {
  const glaze = mix(shade(color, -0.35), "#2E5E6E", 0.45);
  return (
    <g>
      <ellipse cx={200} cy={SOIL_Y + 2} rx={64} ry={9} fill="#3B2A1E" />
      <path d="M132 386 L268 386 C 292 420 286 474 258 498 Q 250 508 236 508 L164 508 Q 150 508 142 498 C 114 474 108 420 132 386 Z" fill={color} />
      <path d="M132 386 L268 386 C 278 400 282 414 283 428 C 274 440 266 424 258 436 C 250 452 242 430 232 440 C 220 450 214 432 202 438 C 190 446 182 428 170 438 C 160 448 152 428 142 436 C 132 444 122 430 118 428 C 119 414 123 400 132 386 Z" fill={glaze} />
      <path d="M146 400 C 132 430 136 466 156 490" stroke="#fff" strokeOpacity={0.3} strokeWidth={9} fill="none" strokeLinecap="round" />
      <path d="M262 410 C 268 440 262 470 248 488" stroke="#000" strokeOpacity={0.13} strokeWidth={11} fill="none" strokeLinecap="round" />
      <rect x={124} y={374} width={152} height={16} rx={8} fill={shade(glaze, 0.08)} />
      <rect x={130} y={375} width={140} height={4.5} rx={2.2} fill="#fff" opacity={0.32} />
    </g>
  );
};

export const drawing: PlantDrawing = { id: "hoya", Component: Hoya };
