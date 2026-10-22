import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, type Pt, polyline, spline } from "./kit";

const HOOK: Pt = [200, 22];
const RIM_Y = 206;
const behind = (x: number) => Math.abs(x - 200) < 48;

// Each strand leaves the soil, rolls over the rim and drops; `x` is where it leaves the rim.
const STRANDS = [
  { x: 128, dx: -18, len: 210, delay: 8 },
  { x: 138, dx: -6, len: 290, delay: 4 },
  { x: 150, dx: -14, len: 170, delay: 12 },
  { x: 160, dx: 4, len: 250, delay: 6 },
  { x: 172, dx: -8, len: 130, delay: 14 },
  { x: 182, dx: 6, len: 300, delay: 2 },
  { x: 194, dx: -4, len: 200, delay: 10 },
  { x: 206, dx: 8, len: 270, delay: 3 },
  { x: 218, dx: -2, len: 150, delay: 13 },
  { x: 228, dx: 10, len: 280, delay: 5 },
  { x: 240, dx: -6, len: 190, delay: 9 },
  { x: 252, dx: 12, len: 240, delay: 7 },
  { x: 262, dx: 6, len: 160, delay: 11 },
  { x: 272, dx: 20, len: 220, delay: 6 },
];

/** Points every `gap` px along a polyline, with headings. */
const beads = (line: Pt[], gap: number, upto: number) => {
  const out: { x: number; y: number; angle: number; d: number }[] = [];
  let acc = 0;
  let next = gap * 0.5;
  for (let k = 1; k < line.length; k++) {
    const [ax, ay] = line[k - 1];
    const [bx, by] = line[k];
    const seg = Math.hypot(bx - ax, by - ay);
    while (next <= acc + seg && next <= upto) {
      const u = (next - acc) / seg;
      out.push({ x: ax + (bx - ax) * u, y: ay + (by - ay) * u, angle: (Math.atan2(by - ay, bx - ax) * 180) / Math.PI, d: next });
      next += gap;
    }
    acc += seg;
  }
  return out;
};

/** A round leaf with its little pointed tip and translucent "window" stripe. */
const Pearl: React.FC<{ r: number; color: string; flip: number }> = ({ r, color, flip }) => (
  <g>
    <path d={`M${flip * r * 0.55} ${-r * 0.75} L${flip * r * 1.45} ${-r * 0.2} L${flip * r * 0.9} ${r * 0.1} Z`} fill={shade(color, -0.08)} />
    <circle r={r} fill={color} />
    <circle r={r} fill="none" stroke={shade(color, -0.25)} strokeWidth={0.9} />
    <path d={`M${-r * 0.55} ${r * 0.1} Q 0 ${-r * 0.35} ${r * 0.6} ${r * 0.05}`} stroke={mix(color, "#E9F6D8", 0.5)} strokeWidth={r * 0.22} fill="none" opacity={0.7} strokeLinecap="round" />
    <circle cx={-r * 0.35} cy={-r * 0.4} r={r * 0.28} fill="#fff" opacity={0.45} />
  </g>
);

export const StringOfPearls: React.FC<{ c: Ctx }> = ({ c }) => {
  const pot = c.pot;
  const chain = "#B9B2A6";
  const stem = mix(c.leaf, "#8A6E4B", 0.45);
  const anchors: Pt[] = [[124, RIM_Y - 2], [276, RIM_Y - 2], [200, RIM_Y + 6]];
  const swing = c.sway(0, 0.6);

  const Chain: React.FC<{ to: Pt }> = ({ to }) => {
    const [x0, y0] = [HOOK[0], HOOK[1] + 8];
    const n = Math.round(Math.hypot(to[0] - x0, to[1] - y0) / 9);
    const ang = (Math.atan2(to[1] - y0, to[0] - x0) * 180) / Math.PI;
    return (
      <g>
        {Array.from({ length: n }).map((_, k) => {
          const u = (k + 0.5) / n;
          const x = x0 + (to[0] - x0) * u;
          const y = y0 + (to[1] - y0) * u;
          return k % 2 ? (
            <rect key={k} x={x - 4.5} y={y - 1.4} width={9} height={2.8} rx={1.4} fill={shade(chain, -0.2)} transform={`rotate(${ang} ${x} ${y})`} />
          ) : (
            <ellipse key={k} cx={x} cy={y} rx={5.5} ry={3} fill="none" stroke={chain} strokeWidth={2} transform={`rotate(${ang} ${x} ${y})`} />
          );
        })}
      </g>
    );
  };

  const strand = (st: (typeof STRANDS)[number]) => {
    const i = STRANDS.indexOf(st);

        const g = Math.min(1, c.grow(st.delay));
        const out = st.x < 200 ? -1 : 1;
        const back = behind(st.x);
        const pts: Pt[] = [
          [st.x - out * 6, RIM_Y - 10],
          [st.x + out * 4, RIM_Y - 2],
          back ? [st.x + out * 4, RIM_Y + 40] : [st.x + out * 7, RIM_Y + 18],
          [st.x + st.dx * 0.5, RIM_Y + st.len * 0.5],
          [st.x + st.dx, RIM_Y + st.len],
        ];
        const line = spline(pts, 1, 40);
        const shown = st.len * 1.05 * g;
        const bs = beads(line, 12.5, shown);
        const sw = c.sway(i + 2, 1.6);
        return (
          <g key={i} transform={`rotate(${sw} ${pts[1][0]} ${pts[1][1]})`}>
            <path d={polyline(spline(pts, Math.min(1, g * 1.02), 40))} stroke={stem} strokeWidth={1.4} fill="none" />
            {bs.map((b, k) => {
              const r = 6.4 - (b.d / st.len) * 1.8;
              const age = Math.min(1, (shown - b.d) / 18);
              return (
                <g key={k} transform={`translate(${b.x + (k % 2 ? 1.5 : -1.5)} ${b.y})`}>
                  <g transform={`scale(${age})`}>
                    <Pearl r={r} color={shade(c.leaf, ((k + i) % 3 - 1) * 0.05)} flip={k % 2 ? 1 : -1} />
                  </g>
                </g>
              );
            })}
          </g>
        );
        };

  return (
    <g transform={`rotate(${swing} ${HOOK[0]} ${HOOK[1]})`}>
      <path d="M200 6 L200 14" stroke="#7D7468" strokeWidth={4} strokeLinecap="round" />
      <path d="M200 14 C 192 14 192 26 200 26 C 206 26 207 22 206 20" stroke="#8C8478" strokeWidth={3.5} fill="none" strokeLinecap="round" />
      <Chain to={anchors[0]} />
      <Chain to={anchors[1]} />

      {/* Middle strands hang behind the bowl and show below it. */}
      {STRANDS.filter((st) => behind(st.x)).map(strand)}

      {/* A low mound of pearls heaped over the soil. */}
      <ellipse cx={200} cy={RIM_Y - 4} rx={76} ry={8} fill="#3B2A1E" />
      {Array.from({ length: 26 }).map((_, k) => {
        const s = Math.min(1.05, c.grow(14 + (k % 7) * 2));
        const x = 134 + ((k * 37) % 132);
        const y = RIM_Y - 8 - ((k * 13) % 3) * 7 - Math.sin(((x - 130) / 140) * Math.PI) * 12;
        return (
          <g key={k} transform={`translate(${x} ${y}) scale(${s})`}>
            <Pearl r={6.5} color={shade(c.leaf, ((k % 3) - 1) * 0.06)} flip={k % 2 ? 1 : -1} />
          </g>
        );
      })}

      {/* Shallow terracotta bowl with a rolled rim and drainage foot. */}
      <path d={`M122 ${RIM_Y} L278 ${RIM_Y} C 276 236 252 258 214 262 L186 262 C 148 258 124 236 122 ${RIM_Y} Z`} fill={pot} />
      <path d={`M138 ${RIM_Y + 14} C 146 236 162 248 184 254`} stroke="#fff" strokeOpacity={0.26} strokeWidth={7} fill="none" strokeLinecap="round" />
      <path d={`M264 ${RIM_Y + 16} C 258 236 244 248 226 254`} stroke="#000" strokeOpacity={0.14} strokeWidth={8} fill="none" strokeLinecap="round" />
      <path d="M144 236 C 180 244 220 244 256 236" stroke={shade(pot, -0.15)} strokeWidth={2} fill="none" />
      <rect x={184} y={260} width={32} height={8} rx={3} fill={shade(pot, -0.18)} />
      <rect x={116} y={RIM_Y - 7} width={168} height={13} rx={6.5} fill={shade(pot, 0.06)} />
      <rect x={122} y={RIM_Y - 6} width={156} height={3.5} rx={1.75} fill="#fff" opacity={0.28} />

      {STRANDS.filter((st) => !behind(st.x)).map(strand)}

      <Chain to={anchors[2]} />
    </g>
  );
};

export const drawing: PlantDrawing = { id: "string-of-pearls", Component: StringOfPearls, shadow: false, anchors: { soil: [200, 197], snip: [291, 414], snipR: 26 } };
