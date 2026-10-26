// The Mebuki mark, "Arched Roots": a soft lowercase m hangs below the soil line as
// roots, and its middle leg rises through the surface as a two-leaf seedling.
// Flat gold on black, drawn in a 1024 tile so it scales cleanly from favicon to app icon.

export const BRAND_COLORS = {
  black: "#1E2127",
  blackDeep: "#08090B",
  gold: "#D4AF37",
  goldDeep: "#8A6D3B",
};

export const BRAND_MARK_PATHS = {
  soil: "M208 518 H816",
  roots: "M322 840 V680 A95 95 0 0 1 512 680 A95 95 0 0 1 702 680 V840 M512 680 V840",
  stem: "M512 600 V380",
  leafLeft: "M512 380 Q447.9 226.6 282 237.4 Q346.1 390.8 512 380 Z",
  leafRight: "M512 380 Q576.1 226.6 742 237.4 Q677.9 390.8 512 380 Z",
};

type BrandMarkProps = {
  size: number;
  /** Rounded tile corners; off for the App Store icon, which iOS masks itself. */
  rounded?: boolean;
  /** Kept for callers that render several marks on one page; the mark needs no ids. */
  id?: string;
};

export const BrandMark = ({ size, rounded = true }: BrandMarkProps) => {
  const c = BRAND_COLORS;
  const p = BRAND_MARK_PATHS;
  return (
    <svg viewBox="0 0 1024 1024" width={size} height={size} fill="none" aria-hidden="true">
      <rect width="1024" height="1024" rx={rounded ? 224 : 0} fill={c.blackDeep} />
      <path d={p.soil} stroke={c.goldDeep} strokeWidth="36" strokeLinecap="round" />
      <path d={p.roots} stroke={c.gold} strokeWidth="76" strokeLinecap="round" />
      <path d={p.stem} stroke={c.gold} strokeWidth="64" strokeLinecap="round" />
      <path d={p.leafLeft} fill={c.gold} />
      <path d={p.leafRight} fill={c.gold} />
    </svg>
  );
};
