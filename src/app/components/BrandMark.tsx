// The Mebuki mark: a plant rises from the middle of the soil line, and its roots
// spread below to form an "M" on a 45°/90° grid. Polished gold on black, with a
// faint engraved grid under the soil. Drawn in a 128x128 tile so it scales
// cleanly from favicon to app icon.

export const BRAND_COLORS = {
  black: "#1E2127",
  blackDeep: "#08090B",
  goldLight: "#F6E9C6",
  goldBright: "#E2C25A",
  gold: "#D4AF37",
  goldDeep: "#8A6D3B",
};

const SOIL = 52;

// Every point sits on a 4-unit grid, and every segment runs at 0°, 45° or 90°.
export const BRAND_MARK_PATHS = {
  // Outer legs and diagonals that meet at the centre taproot: collectively an M.
  frame: "M32 108 V60 L64 84 L96 60 V108",
  taproot: "M64 84 V112",
  rootlets:
    "M32 76 L24 84 M32 92 L40 100 M32 108 L24 116 M32 108 L36 116 " +
    "M96 76 L104 84 M96 92 L88 100 M96 108 L104 116 M96 108 L92 116 " +
    "M64 96 L56 104 M64 96 L72 104 M64 112 L60 118 M64 112 L68 118 " +
    "M48 72 L40 80 M80 72 L88 80",
  stem: "M64 84 V28",
  leafLeft: "M64 44 L52 36 L40 36 L52 44 Z",
  leafRight: "M64 36 L76 28 L88 28 L76 36 Z",
  bud: "M64 20 L68 24 L64 30 L60 24 Z",
};

type BrandMarkProps = {
  size: number;
  /** Rounded tile corners; off for the App Store icon, which iOS masks itself. */
  rounded?: boolean;
  /** Prefix for gradient and filter ids, unique per page. */
  id?: string;
};

export const BrandMark = ({ size, rounded = true, id = "mebuki" }: BrandMarkProps) => {
  const c = BRAND_COLORS;
  const p = BRAND_MARK_PATHS;
  const r = rounded ? 28 : 0;
  const gold = `url(#${id}-gold)`;
  return (
    <svg viewBox="0 0 128 128" width={size} height={size} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-gold`} gradientUnits="userSpaceOnUse" x1="20" y1="16" x2="108" y2="120">
          <stop offset="0" stopColor={c.goldLight} />
          <stop offset="0.35" stopColor={c.goldBright} />
          <stop offset="0.6" stopColor={c.gold} />
          <stop offset="1" stopColor={c.goldDeep} />
        </linearGradient>
        <radialGradient id={`${id}-ground`} cx="0.5" cy="0.42" r="0.75">
          <stop offset="0" stopColor={c.black} />
          <stop offset="1" stopColor={c.blackDeep} />
        </radialGradient>
        <pattern id={`${id}-grid`} width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M8 0 H0 V8" stroke={c.gold} strokeOpacity="0.09" strokeWidth="0.5" />
        </pattern>
        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.4" stdDeviation="1" floodColor="#000" floodOpacity="0.55" />
        </filter>
        <clipPath id={`${id}-tile`}>
          <rect width="128" height="128" rx={r} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-tile)`}>
        <rect width="128" height="128" fill={`url(#${id}-ground)`} />
        <rect y={SOIL} width="128" height={128 - SOIL} fill={`url(#${id}-grid)`} />
      </g>
      <path d={`M12 ${SOIL} H116`} stroke={c.goldDeep} strokeWidth="1.6" />
      <g filter={`url(#${id}-shadow)`} strokeLinejoin="miter" strokeLinecap="square">
        <path d={p.frame} stroke={gold} strokeWidth="6.5" />
        <path d={p.taproot} stroke={gold} strokeWidth="5" />
        <path d={p.stem} stroke={gold} strokeWidth="4" />
        <path d={p.rootlets} stroke={gold} strokeWidth="2.6" />
        <path d={p.leafLeft} fill={gold} />
        <path d={p.leafRight} fill={gold} />
        <path d={p.bud} fill={gold} />
        <path d={p.frame} stroke={c.goldLight} strokeOpacity="0.35" strokeWidth="1.4" />
      </g>
    </svg>
  );
};
