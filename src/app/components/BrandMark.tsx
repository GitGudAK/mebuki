// The Mebuki mark: roots dig into brown earth to form a centred "m", and two
// shoots break the soil from its left stem. Drawn in a 128x128 tile so it
// scales cleanly from favicon to app icon.

export const BRAND_COLORS = {
  earth: "#5a3d29",
  earthDeep: "#4a3222",
  soilLine: "#8a6448",
  pebble: "#6e4d35",
  root: "#ead7b4",
  leafA: "#7cc497",
  leafB: "#9fd8a8",
};

export const BRAND_MARK_PATHS = {
  roots:
    "M34 104 V74 C34 62 41 56 49 56 C57 56 64 62 64 74 V104 M64 74 C64 62 71 56 79 56 C87 56 94 62 94 74 V104",
  rootTips: "M34 104 L33 114 M64 104 L65 113 M94 104 L95 114",
  rootlets: "M34 86 L25 93 M34 96 L42 103 M64 90 L72 97 M94 82 L103 89 M94 95 L86 102",
  shoot: "M34 74 C34 58 32 44 26 32",
  leafRight: "M26 32 C34 32 42 26 42 18 C34 18 27 24 26 32 Z",
  leafLeft: "M26 32 C24 24 18 18 12 20 C14 28 20 32 26 32 Z",
};

const PEBBLES: [number, number, number][] = [
  [18, 66, 2],
  [110, 70, 2.5],
  [22, 104, 2],
  [108, 110, 2],
  [50, 114, 1.6],
];

type BrandMarkProps = {
  size: number;
  /** Rounded tile corners; off for the App Store icon, which iOS masks itself. */
  rounded?: boolean;
};

export const BrandMark = ({ size, rounded = true }: BrandMarkProps) => {
  const c = BRAND_COLORS;
  const r = rounded ? 28 : 0;
  return (
    <svg viewBox="0 0 128 128" width={size} height={size} fill="none" aria-hidden="true">
      <rect width="128" height="128" rx={r} fill={c.earth} />
      <path
        d={rounded ? "M0 48 H128 V100 Q128 128 100 128 H28 Q0 128 0 100 Z" : "M0 48 H128 V128 H0 Z"}
        fill={c.earthDeep}
      />
      <path d="M8 48 Q64 44 120 48" stroke={c.soilLine} strokeWidth={3} strokeLinecap="round" />
      {PEBBLES.map(([x, y, pr]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={pr} fill={c.pebble} />
      ))}
      <path d={BRAND_MARK_PATHS.roots} stroke={c.root} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      <path d={BRAND_MARK_PATHS.rootTips} stroke={c.root} strokeWidth={3.5} strokeLinecap="round" />
      <path d={BRAND_MARK_PATHS.rootlets} stroke={c.root} strokeWidth={2.5} strokeLinecap="round" />
      <path d={BRAND_MARK_PATHS.shoot} stroke={c.root} strokeWidth={5} strokeLinecap="round" />
      <path d={BRAND_MARK_PATHS.leafRight} fill={c.leafA} />
      <path d={BRAND_MARK_PATHS.leafLeft} fill={c.leafB} />
    </svg>
  );
};
