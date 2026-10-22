import React from "react";
import type { PlantDrawing } from ".";
import { mix, shade } from "../colors";
import { type Ctx, type Pt, along, polyline, ramp, spline } from "./kit";

const SHELF_Y = 268;

/** A slim heart with an acuminate drip tip: petiole at the origin, tip at (0, -L). */
const heart = (L: number) => {
  const W = L * 0.36;
  return `M0 0 C ${-W * 0.5} ${L * 0.12} ${-W} ${L * 0.02} ${-W} ${-L * 0.26} C ${-W} ${-L * 0.52} ${-W * 0.5} ${-L * 0.7} ${-W * 0.12} ${-L * 0.86} Q ${-W * 0.03} ${-L * 0.94} 0 ${-L} Q ${W * 0.03} ${-L * 0.94} ${W * 0.12} ${-L * 0.86} C ${W * 0.5} ${-L * 0.7} ${W} ${-L * 0.52} ${W} ${-L * 0.26} C ${W} ${L * 0.02} ${W * 0.5} ${L * 0.12} 0 0 Z`;
};

const HeartLeaf: React.FC<{ L: number; color: string }> = ({ L, color }) => {
  const W = L * 0.36;
  const vein = shade(color, -0.2);
  return (
    <g>
      <path d={heart(L)} fill={color} />
      {/* Velvety sheen: a soft lighter band rather than a glossy streak. */}
      <path d={`M${-W * 0.6} ${-L * 0.12} C ${-W * 0.75} ${-L * 0.35} ${-W * 0.5} ${-L * 0.6} ${-W * 0.12} ${-L * 0.78}`} stroke={mix(color, "#E8F5D0", 0.4)} strokeOpacity={0.35} strokeWidth={L * 0.14} fill="none" strokeLinecap="round" />
      <path d={`M0 0 Q ${W * 0.06} ${-L * 0.5} 0 ${-L * 0.95}`} stroke={vein} strokeWidth={Math.max(1.1, L * 0.04)} fill="none" />
      {[0.2, 0.42].map((t) =>
        [-1, 1].map((s) => (
          <path key={`${t}${s}`} d={`M0 ${-L * t} Q ${s * W * 0.5} ${-L * (t + 0.04)} ${s * W * 0.75} ${-L * (t + 0.18)}`} stroke={vein} strokeWidth={Math.max(0.8, L * 0.025)} fill="none" opacity={0.8} />
        )),
      )}
    </g>
  );
};

// Vines leave the pot, cross the shelf top and drop over its front edge.
const VINES: { pts: Pt[]; delay: number; n: number }[] = [
  { pts: [[166, 204], [124, 218], [80, 252], [48, 266], [30, 296], [28, 356], [36, 420]], delay: 10, n: 12 },
  { pts: [[234, 204], [278, 220], [322, 252], [354, 266], [370, 298], [372, 362], [364, 404]], delay: 12, n: 11 },
  { pts: [[172, 206], [146, 226], [128, 256], [118, 282], [112, 350], [120, 420], [110, 496]], delay: 4, n: 13 },
  { pts: [[228, 206], [252, 228], [270, 258], [278, 284], [284, 350], [276, 430], [284, 470]], delay: 6, n: 12 },
  { pts: [[190, 208], [182, 236], [178, 270], [176, 300], [168, 370], [176, 440]], delay: 8, n: 10 },
  { pts: [[210, 208], [220, 240], [226, 272], [232, 300], [226, 380], [234, 452], [226, 506]], delay: 2, n: 13 },
];

const CROWN = [
  { x: 182, a: -132, L: 34 },
  { x: 218, a: -48, L: 34 },
  { x: 194, a: -104, L: 38 },
  { x: 206, a: -76, L: 38 },
];

export const HeartleafPhilodendron: React.FC<{ c: Ctx }> = ({ c }) => {
  const wood = "#A8794C";
  const stem = shade(c.leaf, -0.25);
  const pot = c.pot;
  return (
    <g>
      {/* Floating wall shelf: a soft shadow on the wall, a lit top and a grained front edge. */}
      <rect x={44} y={SHELF_Y + 18} width={312} height={16} rx={8} fill="#000" opacity={0.14} />
      <path d={`M40 ${SHELF_Y - 12} L360 ${SHELF_Y - 12} L366 ${SHELF_Y} L34 ${SHELF_Y} Z`} fill={shade(wood, 0.14)} />
      <rect x={34} y={SHELF_Y} width={332} height={22} rx={2} fill={wood} />
      <path d={`M44 ${SHELF_Y + 8} C 110 ${SHELF_Y + 5} 170 ${SHELF_Y + 12} 250 ${SHELF_Y + 8} S 340 ${SHELF_Y + 10} 358 ${SHELF_Y + 7}`} stroke={shade(wood, -0.18)} strokeWidth={1.6} fill="none" />
      <path d={`M60 ${SHELF_Y + 15} C 140 ${SHELF_Y + 13} 230 ${SHELF_Y + 17} 340 ${SHELF_Y + 14}`} stroke={shade(wood, -0.14)} strokeWidth={1.4} fill="none" />
      <ellipse cx={300} cy={SHELF_Y + 11} rx={8} ry={3} fill="none" stroke={shade(wood, -0.2)} strokeWidth={1.4} />
      <rect x={34} y={SHELF_Y} width={332} height={3} fill="#fff" opacity={0.2} />
      <rect x={34} y={SHELF_Y + 19} width={332} height={3} fill="#000" opacity={0.15} />

      {/* Small cylinder pot sitting near the front edge. */}
      <ellipse cx={200} cy={SHELF_Y - 4} rx={48} ry={5} fill="#000" opacity={0.2} />
      <ellipse cx={200} cy={203} rx={40} ry={6} fill="#3B2A1E" />
      {CROWN.map((cr, i) => {
        const s = Math.min(1.05, c.grow(22 + i * 2));
        return (
          <g key={i} transform={`translate(${cr.x} 204) rotate(${cr.a + 90 + c.sway(i + 1, 2.5)}) scale(${s})`}>
            <path d="M0 0 L0 -16" stroke={stem} strokeWidth={2.6} />
            <g transform="translate(0 -14)">
              <HeartLeaf L={cr.L} color={shade(c.leaf, i % 2 ? -0.08 : 0)} />
            </g>
          </g>
        );
      })}
      <path d={`M160 206 L240 206 L236 ${SHELF_Y - 8} Q 236 ${SHELF_Y - 4} 230 ${SHELF_Y - 4} L170 ${SHELF_Y - 4} Q 164 ${SHELF_Y - 4} 164 ${SHELF_Y - 8} Z`} fill={pot} />
      <path d={`M172 214 L174 ${SHELF_Y - 12}`} stroke="#fff" strokeOpacity={0.3} strokeWidth={7} strokeLinecap="round" />
      <path d={`M230 216 L228 ${SHELF_Y - 12}`} stroke="#000" strokeOpacity={0.12} strokeWidth={7} strokeLinecap="round" />
      <path d={`M162 236 L238 236`} stroke={shade(pot, -0.15)} strokeWidth={2.5} />
      <rect x={156} y={198} width={88} height={10} rx={5} fill={shade(pot, 0.08)} />
      <rect x={162} y={199} width={76} height={3} rx={1.5} fill="#fff" opacity={0.3} />

      {VINES.map((v, i) => {
        const g = Math.min(1, c.grow(v.delay));
        const [ox, oy] = v.pts[0];
        // Only the part below the shelf edge swings.
        return (
          <g key={i}>
            <path d={polyline(spline(v.pts, g, 36))} stroke={stem} strokeWidth={2.4} fill="none" strokeLinecap="round" transform={`rotate(${c.sway(i, 0.5)} ${ox} ${oy})`} />
            {Array.from({ length: v.n }).map((_, k) => {
              const t = 0.12 + (k / (v.n - 1)) * 0.86;
              if (g < t) return null;
              const q = along(v.pts, t);
              if (Math.abs(q.x - 200) < 46 && q.y < SHELF_Y) return null;
              const s = ramp(c.grow(v.delay + 5 + k * 2), 0, 1);
              const p = along(v.pts, t);
              const side = (k + i) % 2 ? 1 : -1;
              const onShelf = p.y < SHELF_Y + 6;
              // On the shelf leaves lie forward; hanging ones fan out from the vine.
              const a = onShelf ? -90 + side * 50 : p.angle + side * 60;
              const L = (34 - t * 12) * Math.min(1.05, s);
              return (
                <g key={k} transform={`rotate(${c.sway(i, 0.5)} ${ox} ${oy}) translate(${p.x} ${p.y}) rotate(${a + 90 + c.sway(i * 7 + k, 3)})`}>
                  <path d="M0 0 L0 -6" stroke={stem} strokeWidth={1.8} />
                  <g transform="translate(0 -5)">
                    <HeartLeaf L={L} color={shade(c.leaf, ((k + i) % 3 - 1) * 0.07)} />
                  </g>
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
};

export const drawing: PlantDrawing = { id: "heartleaf-philodendron", Component: HeartleafPhilodendron, shadow: false };
