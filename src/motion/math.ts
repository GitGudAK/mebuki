// Frame-math helpers for the animation engine: interpolate, Easing, spring, random.

export type EasingFn = (t: number) => number;

type Extrapolate = "extend" | "clamp" | "identity";

export type InterpolateOptions = {
  easing?: EasingFn;
  extrapolateLeft?: Extrapolate;
  extrapolateRight?: Extrapolate;
};

/** Map `input` from one range to another, piecewise-linear across matching stops. */
export const interpolate = (
  input: number,
  inputRange: readonly number[],
  outputRange: readonly number[],
  options: InterpolateOptions = {},
): number => {
  if (inputRange.length !== outputRange.length || inputRange.length < 2) {
    throw new Error("interpolate: inputRange and outputRange need the same length (>= 2)");
  }
  const { easing = (t: number) => t, extrapolateLeft = "extend", extrapolateRight = "extend" } = options;

  let seg = 1;
  while (seg < inputRange.length - 1 && input > inputRange[seg]) seg++;
  const inMin = inputRange[seg - 1];
  const inMax = inputRange[seg];
  const outMin = outputRange[seg - 1];
  const outMax = outputRange[seg];

  if (input < inMin) {
    if (extrapolateLeft === "clamp") return outMin;
    if (extrapolateLeft === "identity") return input;
  }
  if (input > inMax) {
    if (extrapolateRight === "clamp") return outMax;
    if (extrapolateRight === "identity") return input;
  }
  if (inMax === inMin) return outMin;

  const progress = easing((input - inMin) / (inMax - inMin));
  return outMin + progress * (outMax - outMin);
};

const bezier = (x1: number, y1: number, x2: number, y2: number): EasingFn => {
  const a = (a1: number, a2: number) => 1 - 3 * a2 + 3 * a1;
  const b = (a1: number, a2: number) => 3 * a2 - 6 * a1;
  const c = (a1: number) => 3 * a1;
  const calc = (t: number, a1: number, a2: number) => ((a(a1, a2) * t + b(a1, a2)) * t + c(a1)) * t;
  const slope = (t: number, a1: number, a2: number) => 3 * a(a1, a2) * t * t + 2 * b(a1, a2) * t + c(a1);
  return (x) => {
    if (x <= 0 || x >= 1) return x;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const s = slope(t, x1, x2);
      if (s === 0) break;
      t -= (calc(t, x1, x2) - x) / s;
    }
    return calc(Math.min(1, Math.max(0, t)), y1, y2);
  };
};

const bounce: EasingFn = (t) => {
  if (t < 1 / 2.75) return 7.5625 * t * t;
  if (t < 2 / 2.75) {
    const u = t - 1.5 / 2.75;
    return 7.5625 * u * u + 0.75;
  }
  if (t < 2.5 / 2.75) {
    const u = t - 2.25 / 2.75;
    return 7.5625 * u * u + 0.9375;
  }
  const u = t - 2.625 / 2.75;
  return 7.5625 * u * u + 0.984375;
};

/** Same shape as the familiar React Native Easing module. */
export const Easing = {
  linear: ((t) => t) as EasingFn,
  ease: bezier(0.42, 0, 1, 1),
  quad: ((t) => t * t) as EasingFn,
  cubic: ((t) => t * t * t) as EasingFn,
  poly: (n: number): EasingFn => (t) => Math.pow(t, n),
  sin: ((t) => 1 - Math.cos((t * Math.PI) / 2)) as EasingFn,
  circle: ((t) => 1 - Math.sqrt(1 - t * t)) as EasingFn,
  exp: ((t) => Math.pow(2, 10 * (t - 1))) as EasingFn,
  back: (s = 1.70158): EasingFn => (t) => t * t * ((s + 1) * t - s),
  elastic: (bounciness = 1): EasingFn => {
    const p = bounciness * Math.PI;
    return (t) => 1 - Math.pow(Math.cos((t * Math.PI) / 2), 3) * Math.cos(t * p);
  },
  bounce,
  bezier,
  in: (fn: EasingFn): EasingFn => fn,
  out: (fn: EasingFn): EasingFn => (t) => 1 - fn(1 - t),
  inOut: (fn: EasingFn): EasingFn => (t) => (t < 0.5 ? fn(t * 2) / 2 : 1 - fn((1 - t) * 2) / 2),
};

export type SpringConfig = {
  damping: number;
  mass: number;
  stiffness: number;
  overshootClamping: boolean;
};

export type SpringOptions = {
  frame: number;
  fps: number;
  config?: Partial<SpringConfig>;
  from?: number;
  to?: number;
  /** Frames to wait before the spring starts moving. */
  delay?: number;
};

/** Closed-form damped harmonic oscillator, starting at rest at `from` and settling at `to`. */
export const spring = ({ frame, fps, config = {}, from = 0, to = 1, delay = 0 }: SpringOptions): number => {
  const { damping = 10, mass = 1, stiffness = 100, overshootClamping = false } = config;
  const t = (frame - delay) / fps;
  if (t <= 0) return from;

  const x0 = to - from;
  const omega0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));

  let displacement: number;
  if (zeta < 1) {
    const omega1 = omega0 * Math.sqrt(1 - zeta * zeta);
    const envelope = Math.exp(-zeta * omega0 * t);
    displacement = envelope * (x0 * Math.cos(omega1 * t) + ((zeta * omega0 * x0) / omega1) * Math.sin(omega1 * t));
  } else if (zeta === 1) {
    displacement = Math.exp(-omega0 * t) * (x0 + omega0 * x0 * t);
  } else {
    const r = omega0 * Math.sqrt(zeta * zeta - 1);
    const envelope = Math.exp(-zeta * omega0 * t);
    displacement = envelope * (x0 * Math.cosh(r * t) + ((zeta * omega0 * x0) / r) * Math.sinh(r * t));
  }

  const value = to - displacement;
  if (overshootClamping) return from < to ? Math.min(value, to) : Math.max(value, to);
  return value;
};

/** Deterministic pseudo-random number in [0, 1) for a given seed (FNV-1a hash into mulberry32). */
export const random = (seed: string | number): number => {
  const str = String(seed);
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let x = (h += 0x6d2b79f5);
  x = Math.imul(x ^ (x >>> 15), x | 1);
  x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
};
