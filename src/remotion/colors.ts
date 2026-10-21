// Small deterministic colour helpers used across the video components.

type RGB = { r: number; g: number; b: number };

const clamp = (v: number, min = 0, max = 255) => Math.min(max, Math.max(min, v));

export const hexToRgb = (hex: string): RGB => {
  let h = hex.trim().replace("#", "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}/.test(h)) {
    // Unknown format: fall back to a neutral mid-grey so maths still works.
    return { r: 128, g: 128, b: 128 };
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
};

const toHex = ({ r, g, b }: RGB) =>
  "#" +
  [r, g, b]
    .map((v) => Math.round(clamp(v)).toString(16).padStart(2, "0"))
    .join("");

/** Linear mix between two hex colours, t in [0, 1]. */
export const mix = (a: string, b: string, t: number): string => {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return toHex({
    r: ca.r + (cb.r - ca.r) * t,
    g: ca.g + (cb.g - ca.g) * t,
    b: ca.b + (cb.b - ca.b) * t,
  });
};

/** amount > 0 lightens towards white, amount < 0 darkens towards black. */
export const shade = (hex: string, amount: number): string =>
  amount >= 0 ? mix(hex, "#ffffff", amount) : mix(hex, "#000000", -amount);

export const withAlpha = (hex: string, alpha: number): string => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** Relative luminance (WCAG). */
export const luminance = (hex: string): number => {
  const { r, g, b } = hexToRgb(hex);
  const ch = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
};

export const contrast = (a: string, b: string): number => {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

export const DARK_INK = "#1E2B1F";
export const LIGHT_INK = "#FFF9EE";

/** Text colour that reads well on the given background. */
export const inkFor = (bg: string): string =>
  contrast(DARK_INK, bg) >= contrast(LIGHT_INK, bg) ? DARK_INK : LIGHT_INK;

/**
 * Returns `color` nudged darker/lighter until it has at least `min` contrast
 * against `bg` (so palette accents stay legible as text).
 */
export const readableOn = (color: string, bg: string, min = 3): string => {
  const darken = luminance(bg) > 0.4;
  let c = color;
  for (let i = 0; i < 10 && contrast(c, bg) < min; i++) {
    c = shade(c, darken ? -0.12 : 0.12);
  }
  return c;
};
