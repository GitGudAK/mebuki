import { shade } from "../colors";

/** Everything a plant drawing needs from the illustration wrapper. */
export type Ctx = {
  frame: number;
  /** 0 → 1 spring for a part that starts growing `delay` frames after the plant does. */
  grow: (delay: number) => number;
  /** Gentle sway in degrees; `i` desynchronises parts. */
  sway: (i: number, amp?: number) => number;
  leaf: string;
  accent: string;
  bg: string;
  pot: string;
  id: string;
};

/** Where the generic shapes root: the soil line of the shared terracotta pot. */
export const BASE_X = 200;
export const BASE_Y = 344;
export const SOIL = "#5A3D29";

export const leafTone = (leaf: string, i: number) => shade(leaf, ((i % 3) - 1) * 0.08);

export type Pt = [number, number];

/** Point and direction on a quadratic bezier, for laying leaves along a curved stem. */
export const qbez = (p0: number[], p1: number[], p2: number[], t: number) => {
  const u = 1 - t;
  const x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0];
  const y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
  const dx = 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
  const dy = 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
  return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
};

/** Catmull-Rom point at t in [0, 1] through every control point. */
const catmull = (pts: Pt[], t: number): Pt => {
  const n = pts.length - 1;
  const f = Math.max(0, Math.min(1, t)) * n;
  const i = Math.min(n - 1, Math.floor(f));
  const u = f - i;
  const p0 = pts[Math.max(0, i - 1)];
  const p1 = pts[i];
  const p2 = pts[i + 1];
  const p3 = pts[Math.min(n, i + 2)];
  const c = (a: number, b: number, d: number, e: number) =>
    0.5 * (2 * b + (-a + d) * u + (2 * a - 5 * b + 4 * d - e) * u * u + (-a + 3 * b - 3 * d + e) * u * u * u);
  return [c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])];
};

/** Samples a smooth curve through `pts`, stopping at `upto` of its length (for growing in). */
export const spline = (pts: Pt[], upto = 1, samples = 24): Pt[] =>
  Array.from({ length: samples + 1 }, (_, k) => catmull(pts, (k / samples) * upto));

/** Point and heading (degrees) at t along the curve. */
export const along = (pts: Pt[], t: number) => {
  const [x, y] = catmull(pts, t);
  const [x2, y2] = catmull(pts, Math.min(1, t + 0.01));
  const [x1, y1] = catmull(pts, Math.max(0, t - 0.01));
  return { x, y, angle: (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI };
};

export const polyline = (pts: Pt[]) =>
  pts.map(([x, y], k) => `${k ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");

/** A filled limb (trunk, cane, stem) that tapers from w0 at its base to w1 at its tip. */
export const taperPath = (pts: Pt[], w0: number, w1: number, upto = 1, samples = 28) => {
  const line = spline(pts, upto, samples);
  const left: Pt[] = [];
  const right: Pt[] = [];
  line.forEach(([x, y], k) => {
    const [ax, ay] = line[Math.max(0, k - 1)];
    const [bx, by] = line[Math.min(line.length - 1, k + 1)];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    const nx = -(by - ay) / len;
    const ny = (bx - ax) / len;
    const w = (w0 + (w1 - w0) * (k / samples) * upto) / 2;
    left.push([x + nx * w, y + ny * w]);
    right.push([x - nx * w, y - ny * w]);
  });
  return `${polyline(left)} ${polyline(right.reverse()).replace("M", "L")} Z`;
};

/** Clamped 0 → 1 ramp of `v` between a and b. */
export const ramp = (v: number, a: number, b: number) => Math.max(0, Math.min(1, (v - a) / (b - a)));
