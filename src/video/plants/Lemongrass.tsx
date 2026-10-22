import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, type Pt, along, polyline, spline, taperPath } from "./kit";

const TOP = 306; // where the pale stalks hand over to green blades

// Long arching blades: base x, how far out the tip travels, peak height and how far the tip falls back.
const BLADES: { x: number; dx: number; peak: number; fall: number; w: number; delay: number }[] = [
  { x: 186, dx: -170, peak: 120, fall: 120, w: 17, delay: 10 },
  { x: 214, dx: 172, peak: 116, fall: 126, w: 17, delay: 12 },
  { x: 190, dx: -132, peak: 74, fall: 70, w: 18, delay: 6 },
  { x: 210, dx: 138, peak: 70, fall: 80, w: 18, delay: 7 },
  { x: 194, dx: -96, peak: 40, fall: 40, w: 18, delay: 3 },
  { x: 206, dx: 92, peak: 36, fall: 44, w: 18, delay: 4 },
  { x: 198, dx: -54, peak: 22, fall: 14, w: 18, delay: 0 },
  { x: 202, dx: 60, peak: 26, fall: 20, w: 18, delay: 1 },
  { x: 200, dx: 20, peak: 16, fall: -6, w: 17, delay: 2 },
  { x: 196, dx: -150, peak: 160, fall: 160, w: 15, delay: 14 },
  { x: 204, dx: 156, peak: 158, fall: 150, w: 15, delay: 15 },
  { x: 192, dx: -28, peak: 30, fall: 0, w: 16, delay: 5 },
  { x: 208, dx: 34, peak: 34, fall: 4, w: 16, delay: 5 },
  { x: 188, dx: -112, peak: 56, fall: 30, w: 16, delay: 9 },
  { x: 212, dx: 116, peak: 54, fall: 34, w: 16, delay: 9 },
  { x: 184, dx: -186, peak: 190, fall: 140, w: 14, delay: 16 },
  { x: 216, dx: 190, peak: 196, fall: 130, w: 14, delay: 17 },
  { x: 200, dx: -70, peak: 8, fall: 36, w: 16, delay: 2 },
  { x: 200, dx: 76, peak: 12, fall: 40, w: 16, delay: 3 },
];

/** Blade path: up out of the clump, arching over, the tip falling back towards the side. */
const bladePts = (b: (typeof BLADES)[number]): Pt[] => {
  const peakY = 30 + b.peak;
  return [
    [b.x, TOP + 4],
    [b.x + b.dx * 0.12, TOP - (TOP - peakY) * 0.5],
    [b.x + b.dx * 0.42, peakY + 6],
    [b.x + b.dx * 0.72, peakY + b.fall * 0.3],
    [b.x + b.dx, peakY + b.fall],
  ];
};

// The bulbous, pale stalk bases bundled at the soil.
const STALKS: { x: number; lean: number; w: number }[] = [
  { x: 174, lean: 2, w: 20 },
  { x: 226, lean: -2, w: 20 },
  { x: 186, lean: -5, w: 24 },
  { x: 214, lean: 5, w: 24 },
  { x: 200, lean: 0, w: 26 },
];

export const Lemongrass: React.FC<{ c: Ctx }> = ({ c }) => {
  const pale = mix(c.leaf, "#F2EBD0", 0.62);
  const sorted = BLADES.map((b, i) => ({ b, i })).sort((p, q) => q.b.peak - p.b.peak);
  return (
    <g>
      <ellipse cx={200} cy={364} rx={76} ry={9} fill="#3B2A1E" />
      {/* Stalks: swollen bulbs at the base, narrowing up into the leaf sheaths, with a purple-pink blush. */}
      {STALKS.map((s, i) => {
        const g = Math.min(1, c.grow(i));
        const B = 368;
        const h = 78 * g;
        const x0 = s.x;
        const x1 = s.x + s.lean;
        const w = s.w;
        // Swollen bulb just above the rim, narrowing up into the leaf sheath.
        const d = `M${x0 - w * 0.42} ${B} C ${x0 - w * 0.75} ${B - h * 0.12} ${x0 - w * 0.72} ${B - h * 0.32} ${x0 - w * 0.48} ${B - h * 0.45} C ${x1 - w * 0.34} ${B - h * 0.62} ${x1 - w * 0.3} ${B - h * 0.85} ${x1 - w * 0.26} ${B - h} Q ${x1 + w * 0.1} ${B - h - 16} ${x1 + w * 0.26} ${B - h} C ${x1 + w * 0.3} ${B - h * 0.85} ${x1 + w * 0.34} ${B - h * 0.62} ${x0 + w * 0.48} ${B - h * 0.45} C ${x0 + w * 0.72} ${B - h * 0.32} ${x0 + w * 0.75} ${B - h * 0.12} ${x0 + w * 0.42} ${B} Z`;
        return (
          <g key={i}>
            <path d={d} fill={shade(pale, ((i % 2) - 0.5) * 0.1)} />
            <path d={`M${x0 - w * 0.6} ${B} C ${x0 - w * 0.8} ${B - h * 0.3} ${x0 + w * 0.8} ${B - h * 0.3} ${x0 + w * 0.6} ${B} Z`} fill="#B7738A" opacity={0.5} />
            <path d={`M${x0 - w * 0.3} ${B - h * 0.12} C ${x0 - w * 0.45} ${B - h * 0.3} ${x1 - w * 0.15} ${B - h * 0.7} ${x1 - w * 0.12} ${B - h * 0.95}`} stroke="#fff" strokeOpacity={0.4} strokeWidth={2.5} fill="none" strokeLinecap="round" />
            <path d={`M${x0 + w * 0.3} ${B - h * 0.4} L${x1 + w * 0.12} ${B - h * 0.98}`} stroke={shade(pale, -0.2)} strokeWidth={1.2} />
          </g>
        );
      })}

      {sorted.map(({ b, i }) => {
        const g = c.grow(b.delay);
        const pts = bladePts(b);
        const color = mix(shade(c.leaf, ((i % 3) - 1) * 0.07), "#6E8F3A", (i % 4 === 0 ? 0.3 : 0));
        const shown = Math.min(1, g);
        return (
          <g key={i} transform={`rotate(${c.sway(i, 1.4)} ${b.x} ${TOP})`}>
            <path d={taperPath(pts, b.w, 0.6, shown, 36)} fill={color} />
            {/* The pale midrib lemongrass blades are known for. */}
            <path d={polyline(spline(pts, shown * 0.9, 30))} stroke={mix(color, "#F4F2D8", 0.45)} strokeWidth={1.4} fill="none" opacity={0.8} />
            {/* Dry, sun-yellowed tip. */}
            {g > 0.92 && (
              <path d={taperPath([[along(pts, 0.82).x, along(pts, 0.82).y], [along(pts, 0.92).x, along(pts, 0.92).y], pts[4]], b.w * 0.32, 0.5, 1, 10)} fill={mix(color, c.accent, 0.45)} opacity={0.8} />
            )}
          </g>
        );
      })}

      <Bucket color={c.pot} />
    </g>
  );
};

/** A galvanised steel bucket: rolled rim, pressed ribs, riveted ears and a wire bail resting forward. */
const Bucket: React.FC<{ color: string }> = ({ color }) => {
  const dark = shade(color, -0.25);
  const light = shade(color, 0.3);
  return (
    <g>
      <path d="M120 370 L280 370 L264 498 Q 263 506 254 506 L146 506 Q 137 506 136 498 Z" fill={color} />
      {/* Spangle: the crystalline sheen of zinc coating. */}
      {[
        "M150 392 l14 -6 l10 10 l-8 12 z",
        "M222 420 l16 -4 l6 14 l-14 6 z",
        "M168 450 l12 2 l2 14 l-14 -4 z",
        "M238 466 l10 -8 l8 10 l-10 8 z",
        "M196 398 l10 4 l-2 12 l-12 -4 z",
      ].map((d) => (
        <path key={d} d={d} fill={light} opacity={0.22} />
      ))}
      {/* Pressed ribs. */}
      {[408, 470].map((y) => {
        const inset = ((y - 370) / 136) * 16;
        return (
          <g key={y}>
            <path d={`M${121 + inset} ${y} L${279 - inset} ${y}`} stroke={light} strokeWidth={4} opacity={0.7} />
            <path d={`M${121 + inset} ${y + 4} L${279 - inset} ${y + 4}`} stroke={dark} strokeWidth={2.5} />
          </g>
        );
      })}
      <path d="M140 384 L152 494" stroke="#fff" strokeOpacity={0.35} strokeWidth={9} strokeLinecap="round" />
      <path d="M164 384 L172 494" stroke="#fff" strokeOpacity={0.15} strokeWidth={4} strokeLinecap="round" />
      <path d="M262 384 L250 494" stroke="#000" strokeOpacity={0.15} strokeWidth={12} strokeLinecap="round" />
      <path d="M140 500 L260 500" stroke={dark} strokeWidth={3} />
      {/* Rolled rim. */}
      <rect x={112} y={360} width={176} height={14} rx={7} fill={shade(color, 0.1)} />
      <rect x={118} y={362} width={164} height={3.5} rx={1.75} fill="#fff" opacity={0.5} />
      {/* Ears and the bail. */}
      <path d="M126 384 C 130 452 270 452 274 384" stroke={shade(color, -0.35)} strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d="M126 384 C 130 452 270 452 274 384" stroke={light} strokeWidth={1.2} fill="none" opacity={0.6} transform="translate(-1 -1.5)" />
      {[126, 274].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={384} rx={9} ry={10} fill={shade(color, -0.08)} />
          <circle cx={x} cy={384} r={3} fill={dark} />
          <circle cx={x} cy={377} r={1.6} fill={light} />
        </g>
      ))}
    </g>
  );
};

export const drawing: PlantDrawing = { id: "lemongrass", Component: Lemongrass, anchors: { soil: [240, 359], snip: [228, 340], snipR: 26 } };
