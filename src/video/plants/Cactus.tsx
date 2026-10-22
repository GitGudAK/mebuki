import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import type { Ctx } from "./kit";

// A Mammillaria clump: one big globe with two offsets nestled at its feet.
const GLOBES = [
  { x: 138, y: 352, r: 46, delay: 10, flowers: false },
  { x: 268, y: 362, r: 40, delay: 14, flowers: false },
  { x: 202, y: 322, r: 68, delay: 0, flowers: true },
];

const TILT = 0.28; // we look down on the globes a little

type Areole = { x: number; y: number; k: number };

/** Areoles laid out on spiralling rows over the visible face of a globe. */
const areoles = (r: number): Areole[] => {
  const out: Areole[] = [];
  const rows = Math.round(r / 6.5);
  for (let i = 0; i < rows; i++) {
    const phi = -0.95 + (i / (rows - 1)) * 2.35; // latitude, bottom to crown
    const cols = Math.max(4, Math.round(Math.cos(phi) * r / 5.2));
    for (let j = 0; j < cols; j++) {
      const th = (j / cols) * Math.PI * 2 + phi * 0.9 + (i % 2) * (Math.PI / cols);
      const cx = Math.cos(phi) * Math.sin(th);
      const front = Math.cos(phi) * Math.cos(th) * Math.cos(TILT) + Math.sin(phi) * Math.sin(TILT);
      if (front < 0.12 || phi > 1.25) continue;
      const cy = Math.sin(phi) * Math.cos(TILT) - Math.cos(phi) * Math.cos(th) * Math.sin(TILT);
      out.push({ x: cx * r, y: -cy * r * 1.04, k: front });
    }
  }
  return out;
};

const STAR = [0, 50, 100, 150, 200, 250, 300];

const Flower: React.FC<{ color: string; s: number }> = ({ color, s }) => (
  <g transform={`scale(${s} ${s * 0.8})`}>
    {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
      <path key={a} d="M0 0 C -3 -4 -3 -10 0 -14 C 3 -10 3 -4 0 0 Z" fill={color} transform={`rotate(${a})`} />
    ))}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
      <path key={a} d="M0 -2 L0 -10" stroke={shade(color, -0.28)} strokeWidth={1.2} transform={`rotate(${a + 22})`} />
    ))}
    <circle r={3.4} fill="#F3E07A" />
  </g>
);

export const Cactus: React.FC<{ c: Ctx }> = ({ c }) => {
  const ring = Array.from({ length: 12 }, (_, k) => {
    const th = (k / 12) * Math.PI * 2;
    const phi = 1.0;
    const front = Math.cos(phi) * Math.cos(th) * Math.cos(TILT) + Math.sin(phi) * Math.sin(TILT);
    const cy = Math.sin(phi) * Math.cos(TILT) - Math.cos(phi) * Math.cos(th) * Math.sin(TILT);
    return { x: Math.cos(phi) * Math.sin(th), y: -cy * 1.04, front, k };
  });
  const main = GLOBES[2];
  const flowerAt = (f: (typeof ring)[number]) => {
    const s = c.grow(40 + f.k * 2) * 0.95;
    return (
      <g key={f.k} transform={`translate(${main.x + f.x * main.r} ${main.y + f.y * main.r - 6}) rotate(${f.x * 30 + c.sway(f.k, 4)})`}>
        <Flower color={f.front > 0.3 ? c.accent : shade(c.accent, -0.12)} s={s} />
      </g>
    );
  };
  return (
    <g>
      {/* Back half of the flower crown peeps over the top of the main globe. */}
      {ring.filter((f) => f.front <= 0.3).map(flowerAt)}

      {GLOBES.map((gl, i) => {
        const g = c.grow(gl.delay);
        const body = shade(c.leaf, i === 2 ? 0 : -0.05);
        const id = `${c.id}-globe${i}`;
        return (
          <g key={i} transform={`translate(${gl.x} ${gl.y + gl.r}) scale(${g}) translate(0 ${-gl.r})`}>
            <defs>
              <clipPath id={id}>
                <ellipse cx={0} cy={0} rx={gl.r} ry={gl.r * 1.04} />
              </clipPath>
            </defs>
            <ellipse cx={0} cy={0} rx={gl.r} ry={gl.r * 1.04} fill={body} />
            <g clipPath={`url(#${id})`}>
              <ellipse cx={gl.r * 0.55} cy={gl.r * 0.2} rx={gl.r * 0.7} ry={gl.r * 1.1} fill={shade(body, -0.16)} />
              <ellipse cx={-gl.r * 0.4} cy={-gl.r * 0.35} rx={gl.r * 0.35} ry={gl.r * 0.5} fill="#fff" opacity={0.1} />
            </g>
            {/* Tubercles, each tipped with a star of fine white spines and a dark hooked central. */}
            {areoles(gl.r).map((a, k) => {
              const sz = 0.45 + a.k * 0.6;
              return (
                <g key={k} transform={`translate(${a.x} ${a.y}) scale(${sz})`}>
                  <circle r={4.4} fill={mix(body, "#D8E8B0", 0.22)} />
                  {STAR.map((ang) => (
                    <path key={ang} d="M0 0 L0 -7.5" stroke="#F7F5EC" strokeWidth={1.1} opacity={0.9} transform={`rotate(${ang + k * 7})`} />
                  ))}
                  <circle r={1.5} fill="#6B3F2A" />
                </g>
              );
            })}
            {/* White wool in the crown. */}
            <ellipse cx={0} cy={0} rx={gl.r} ry={gl.r * 1.04} fill="none" stroke={shade(body, -0.35)} strokeWidth={2.5} />
            <ellipse cx={0} cy={-gl.r * 0.88} rx={gl.r * 0.32} ry={gl.r * 0.1} fill="#F4F1E6" opacity={0.75} />
          </g>
        );
      })}

      {ring.filter((f) => f.front > 0.3).map(flowerAt)}

      <SquatPot color={c.pot} />
    </g>
  );
};

/** A small squat terracotta pot topped with a dressing of grit. */
const SquatPot: React.FC<{ color: string }> = ({ color }) => {
  const stones = Array.from({ length: 26 }, (_, k) => ({
    x: 118 + ((k * 61) % 166),
    y: 392 + ((k * 17) % 9),
    r: 4 + ((k * 13) % 4),
    col: ["#B9AE9C", "#8E8576", "#D8D0C0", "#A39782"][k % 4],
  }));
  return (
    <g>
      <ellipse cx={200} cy={398} rx={84} ry={9} fill="#6D6253" />
      {stones.map((s, k) => (
        <ellipse key={k} cx={s.x} cy={s.y} rx={s.r} ry={s.r * 0.75} fill={s.col} />
      ))}
      <path d="M128 420 L272 420 L260 497 Q 258 508 246 508 L154 508 Q 142 508 140 497 Z" fill={color} />
      <path d="M148 430 C 146 456 148 480 154 498" stroke="#fff" strokeOpacity={0.22} strokeWidth={8} fill="none" strokeLinecap="round" />
      <path d="M256 430 C 256 456 252 480 246 498" stroke="#000" strokeOpacity={0.12} strokeWidth={9} fill="none" strokeLinecap="round" />
      <rect x={114} y={398} width={172} height={26} rx={6} fill={shade(color, 0.06)} />
      <rect x={120} y={400} width={160} height={5} rx={2.5} fill="#fff" opacity={0.25} />
      <rect x={114} y={418} width={172} height={6} rx={3} fill={shade(color, -0.14)} />
    </g>
  );
};

export const drawing: PlantDrawing = { id: "cactus", Component: Cactus };
