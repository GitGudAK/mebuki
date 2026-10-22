import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, type Pt, along, leafTone, taperPath } from "./kit";

// A single slim trunk, bare below, carrying a head of big leaves.
const TRUNK: Pt[] = [[200, 414], [194, 350], [204, 290], [198, 220], [203, 150]];

// t along the trunk, angle from vertical, blade length, foreshortening.
const LEAVES = [
  { t: 0.42, a: -76, L: 118, f: 0.92 },
  { t: 0.5, a: 72, L: 122, f: 1 },
  { t: 0.58, a: -50, L: 118, f: 1 },
  { t: 0.66, a: 50, L: 112, f: 0.85 },
  { t: 0.74, a: -82, L: 104, f: 0.95 },
  { t: 0.8, a: 30, L: 102, f: 0.9 },
  { t: 0.86, a: -30, L: 96, f: 0.95 },
  { t: 0.92, a: 66, L: 88, f: 1 },
  { t: 1, a: -6, L: 80, f: 1 },
];

/** Violin outline: narrow base, pinched waist, broad wavy shoulders, a blunt notched tip. */
const fiddle = (L: number) => {
  const w = L * 0.4;
  const half = (s: number) =>
    `C ${s * w * 0.5} ${-L * 0.04} ${s * w * 0.74} ${-L * 0.24} ${s * w * 0.6} ${-L * 0.44} ` +
    `C ${s * w * 0.5} ${-L * 0.56} ${s * w * 1.06} ${-L * 0.58} ${s * w * 1.02} ${-L * 0.74} ` +
    `C ${s * w * 1.1} ${-L * 0.84} ${s * w * 0.86} ${-L * 0.92} ${s * w * 0.88} ${-L * 0.94} ` +
    `C ${s * w * 0.7} ${-L * 1.04} ${s * w * 0.2} ${-L * 1.04} 0 ${-L * 0.97}`;
  const back = (s: number) =>
    `C ${s * w * 0.2} ${-L * 1.04} ${s * w * 0.7} ${-L * 1.04} ${s * w * 0.88} ${-L * 0.94} ` +
    `C ${s * w * 0.86} ${-L * 0.92} ${s * w * 1.1} ${-L * 0.84} ${s * w * 1.02} ${-L * 0.74} ` +
    `C ${s * w * 1.06} ${-L * 0.58} ${s * w * 0.5} ${-L * 0.56} ${s * w * 0.6} ${-L * 0.44} ` +
    `C ${s * w * 0.74} ${-L * 0.24} ${s * w * 0.5} ${-L * 0.04} 0 0`;
  return `M0 0 ${half(-1)} ${back(1)} Z`;
};

export const FiddleLeafFig: React.FC<{ c: Ctx }> = ({ c }) => {
  const bark = "#8A7663";
  const g = c.grow(0);
  const vein = mix(c.leaf, "#EEF2C8", 0.5);
  const lean = c.sway(1, 0.5);
  return (
    <g>
      <g transform={`rotate(${lean} 200 414)`}>
        <path d={taperPath(TRUNK, 15, 6, Math.min(1, g))} fill={bark} />
        <path d={taperPath(TRUNK.map(([x, y]) => [x - 3, y] as Pt), 4, 1.5, Math.min(1, g) * 0.95)} fill="#fff" opacity={0.14} />
        {LEAVES.map((lf, i) => {
          const s = c.grow(8 + i * 2.2);
          if (s <= 0.01) return null;
          const p = along(TRUNK, lf.t * Math.min(1, g));
          const L = lf.L;
          const color = leafTone(shade(c.leaf, -0.04), i);
          return (
            <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${lf.a + c.sway(i + 2, 2.2)}) scale(${s * lf.f} ${s})`}>
              <path d="M0 0 L0 -12" stroke={shade(bark, 0.1)} strokeWidth={4} strokeLinecap="round" />
              <g transform="translate(0 -10)">
                <path d={fiddle(L)} fill={color} />
                <path d={`M0 0 L0 ${-L * 0.93}`} stroke={vein} strokeWidth={2.6} strokeLinecap="round" />
                {[0.2, 0.36, 0.52, 0.68, 0.82].map((t) =>
                  [-1, 1].map((v) => (
                    <path
                      key={`${t}${v}`}
                      d={`M0 ${-L * t} Q ${v * L * 0.12} ${-L * (t + 0.03)} ${v * L * (t > 0.5 ? 0.33 : 0.22)} ${-L * (t + 0.12)}`}
                      stroke={vein}
                      strokeOpacity={0.55}
                      strokeWidth={1.4}
                      fill="none"
                    />
                  )),
                )}
                <path
                  d={`M${-L * 0.12} ${-L * 0.5} C ${-L * 0.3} ${-L * 0.62} ${-L * 0.3} ${-L * 0.82} ${-L * 0.14} ${-L * 0.92}`}
                  stroke="#fff"
                  strokeOpacity={0.2}
                  strokeWidth={5}
                  fill="none"
                  strokeLinecap="round"
                />
              </g>
            </g>
          );
        })}
      </g>
      <SeagrassBasket color={c.pot} id={`${c.id}-basket`} />
    </g>
  );
};

/** A woven seagrass belly basket with a twisted rope rim. */
const SeagrassBasket: React.FC<{ color: string; id: string }> = ({ color, id }) => {
  const body = "M130 410 L270 410 C 280 448 274 488 258 506 L142 506 C 126 488 120 448 130 410 Z";
  const rows = Array.from({ length: 10 }, (_, r) => 412 + r * 10.5);
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <path d={body} />
        </clipPath>
      </defs>
      <path d={body} fill={shade(color, -0.22)} />
      <g clipPath={`url(#${id})`}>
        {rows.map((y, r) =>
          Array.from({ length: 10 }, (_, k) => {
            const x = 112 + k * 18 + (r % 2) * 9;
            return <rect key={`${r}-${k}`} x={x} y={y} width={15} height={8} rx={4} fill={shade(color, ((k + r) % 3) * 0.05 - 0.04)} />;
          }),
        )}
        <path d="M150 416 C 140 446 142 480 154 500" stroke="#fff" strokeOpacity={0.18} strokeWidth={10} fill="none" strokeLinecap="round" />
        <path d="M256 418 C 264 450 260 482 248 502" stroke="#000" strokeOpacity={0.16} strokeWidth={14} fill="none" strokeLinecap="round" />
      </g>
      <rect x={124} y={398} width={152} height={16} rx={8} fill={shade(color, 0.05)} />
      {Array.from({ length: 15 }, (_, k) => (
        <path key={k} d={`M${130 + k * 10} 412 L${138 + k * 10} 400`} stroke={shade(color, -0.25)} strokeWidth={2} strokeLinecap="round" />
      ))}
      <rect x={128} y={399} width={144} height={4} rx={2} fill="#fff" opacity={0.25} />
    </g>
  );
};

export const drawing: PlantDrawing = { id: "fiddle-leaf-fig", Component: FiddleLeafFig };
