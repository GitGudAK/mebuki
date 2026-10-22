import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, type Pt, along, ramp, taperPath } from "./kit";

const SOIL_Y = 306;

// Upright woody stems fanning slightly out of the long tom.
const STEMS: { x0: number; tip: Pt; delay: number }[] = [
  { x0: 194, tip: [146, 60], delay: 0 },
  { x0: 206, tip: [252, 66], delay: 2 },
  { x0: 200, tip: [202, 34], delay: 1 },
  { x0: 186, tip: [96, 112], delay: 5 },
  { x0: 214, tip: [304, 118], delay: 6 },
  { x0: 196, tip: [172, 84], delay: 4 },
  { x0: 204, tip: [228, 90], delay: 4 },
  { x0: 184, tip: [78, 186], delay: 8 },
  { x0: 216, tip: [322, 192], delay: 9 },
  { x0: 190, tip: [122, 146], delay: 7 },
  { x0: 210, tip: [280, 152], delay: 7 },
  { x0: 198, tip: [186, 132], delay: 10 },
  { x0: 202, tip: [214, 140], delay: 10 },
];

const stemPts = (s: (typeof STEMS)[number]): Pt[] => {
  const H = SOIL_Y - s.tip[1];
  const dx = s.tip[0] - s.x0;
  return [
    [s.x0, SOIL_Y + 4],
    [s.x0 + dx * 0.12, SOIL_Y - H * 0.33],
    [s.x0 + dx * 0.5, SOIL_Y - H * 0.68],
    s.tip,
  ];
};

export const Rosemary: React.FC<{ c: Ctx }> = ({ c }) => {
  const wood = "#7A5B44";
  const dark = shade(c.leaf, -0.18);
  const silver = mix(c.leaf, "#E2E8DE", 0.42);
  return (
    <g>
      <ellipse cx={200} cy={302} rx={60} ry={8} fill="#3B2A1E" />

      {STEMS.map((st, i) => {
        const g = c.grow(st.delay);
        const pts = stemPts(st);
        const H = SOIL_Y - st.tip[1];
        const nodes = Math.round(H / 5);
        const needles = Array.from({ length: nodes }, (_, k) => {
          const t = 0.16 + (k / nodes) * 0.84;
          const p = along(pts, t);
          const side = k % 2 ? 1 : -1;
          const len = (21 - t * 10) * (0.85 + ((k * 7) % 5) * 0.06);
          return { t, p, side, len, k };
        });
        return (
          <g key={i} transform={`rotate(${c.sway(i, 1)} ${st.x0} ${SOIL_Y})`}>
            {/* Woody and bare low down, green and leafy above. */}
            <path d={taperPath(pts, 7, 2, Math.min(1, g))} fill={wood} />
            {[0, 1].map((layer) =>
              needles.map(({ t, p, side, len, k }) => {
                if ((k % 3 === 0) !== (layer === 0)) return null;
                const s = ramp(g, t - 0.08, t + 0.12);
                const a = ((p.angle + side * (36 + (k % 4) * 6)) * Math.PI) / 180;
                const l = len * s;
                return (
                  <path
                    key={`${layer}${k}`}
                    d={`M${p.x.toFixed(1)} ${p.y.toFixed(1)} l${(Math.cos(a) * l).toFixed(1)} ${(Math.sin(a) * l).toFixed(1)}`}
                    stroke={layer === 0 ? silver : shade(dark, ((k % 5) - 2) * 0.04)}
                    strokeWidth={4.4}
                    strokeLinecap="round"
                  />
                );
              }),
            )}
            <path d={taperPath(pts.slice(1), 2.4, 1.2, Math.min(1, g))} fill={shade(c.leaf, -0.32)} opacity={0.6} />

            {/* Small two-lipped pale blue flowers in the leaf axils. */}
            {[0.42, 0.56, 0.7].map((t, k) => {
              if ((i + k) % 2) return null;
              const s = c.grow(44 + i * 2 + k * 4) * 0.95;
              const p = along(pts, t);
              const side = (i + k) % 3 ? 1 : -1;
              return (
                <g key={`f${k}`} transform={`translate(${p.x} ${p.y}) rotate(${p.angle + 90 + side * 50}) translate(0 -7) scale(${s})`}>
                  <ellipse cx={0} cy={-3} rx={4.2} ry={5} fill={c.accent} />
                  <ellipse cx={-4} cy={1} rx={2.6} ry={3.2} fill={shade(c.accent, 0.15)} />
                  <ellipse cx={4} cy={1} rx={2.6} ry={3.2} fill={shade(c.accent, 0.15)} />
                  <ellipse cx={0} cy={3.5} rx={3.4} ry={2.6} fill={shade(c.accent, 0.25)} />
                  <circle cx={0} cy={0} r={1.3} fill={shade(c.accent, -0.4)} />
                </g>
              );
            })}
          </g>
        );
      })}

      <LongTom color={c.pot} />
    </g>
  );
};

/** A tall, narrow terracotta long tom, weathered with lime bloom and a little moss. */
const LongTom: React.FC<{ color: string }> = ({ color }) => (
  <g>
    <path d="M140 314 L260 314 L251 498 Q 250 508 240 508 L160 508 Q 150 508 149 498 Z" fill={color} />
    {/* Lime bloom wicking up from the base and down from the rim. */}
    <path d="M149.6 470 C 162 462 172 474 186 466 C 200 458 214 472 228 464 C 238 458 246 466 250.8 462 L251 498 Q 250 508 240 508 L160 508 Q 150 508 149 498 Z" fill="#F4EEE2" opacity={0.2} />
    <path d="M152 488 C 160 480 170 492 178 486 L 178 506 L 160 506 Q 152 506 151 498 Z" fill="#6F8A4A" opacity={0.45} />
    <path d="M200 340 C 210 352 204 368 214 380" stroke="#F4EEE2" strokeOpacity={0.22} strokeWidth={6} fill="none" strokeLinecap="round" />
    <path d="M232 330 C 236 344 230 352 236 362" stroke="#F4EEE2" strokeOpacity={0.18} strokeWidth={5} fill="none" strokeLinecap="round" />
    {/* A hairline crack. */}
    <path d="M226 318 L222 336 L228 348 L224 362" stroke={shade(color, -0.35)} strokeWidth={1.4} fill="none" />
    <path d="M154 332 C 152 380 156 430 160 470" stroke="#fff" strokeOpacity={0.24} strokeWidth={8} fill="none" strokeLinecap="round" />
    <path d="M246 334 C 246 380 243 430 240 470" stroke="#000" strokeOpacity={0.13} strokeWidth={10} fill="none" strokeLinecap="round" />
    <rect x={130} y={292} width={140} height={26} rx={5} fill={shade(color, 0.06)} />
    <path d="M134 316 L266 316" stroke={shade(color, -0.22)} strokeWidth={2.5} />
    <path d="M150 300 C 170 304 180 296 200 300 C 214 303 224 298 240 302" stroke="#F4EEE2" strokeOpacity={0.3} strokeWidth={4} fill="none" strokeLinecap="round" />
    <rect x={134} y={294} width={132} height={4} rx={2} fill="#fff" opacity={0.28} />
  </g>
);

export const drawing: PlantDrawing = { id: "rosemary", Component: Rosemary, anchors: { soil: [200, 293], snip: [295, 128], snipR: 30 } };
