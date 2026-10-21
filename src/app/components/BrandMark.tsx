// The Mebuki mark: a lowercase "m" whose left stem sprouts two leaves.
// Drawn in a 128x128 box so it scales cleanly from favicon to app icon.

export const BRAND_MARK_PATHS = {
  stem: "M46 108 V70 C46 56 54 50 62 50 C70 50 76 56 76 70 V108 M76 70 C76 56 82 50 90 50 C98 50 106 56 106 70 V108",
  shoot: "M46 70 C46 54 42 40 32 34",
  leafRight: "M32 34 C40 34 48 28 48 20 C40 20 33 26 32 34 Z",
  leafLeft: "M32 34 C30 26 24 20 18 22 C20 30 26 34 32 34 Z",
};

type BrandMarkProps = {
  size: number;
  /** Colour of the m and its shoot. */
  ink?: string;
  leafA?: string;
  leafB?: string;
};

export const BrandMark = ({ size, ink = "currentColor", leafA = "#7cc497", leafB = "#9fd8a8" }: BrandMarkProps) => (
  <svg viewBox="0 0 128 128" width={size} height={size} fill="none" aria-hidden="true">
    <path d={BRAND_MARK_PATHS.stem} stroke={ink} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
    <path d={BRAND_MARK_PATHS.shoot} stroke={ink} strokeWidth={6} strokeLinecap="round" />
    <path d={BRAND_MARK_PATHS.leafRight} fill={leafA} />
    <path d={BRAND_MARK_PATHS.leafLeft} fill={leafB} />
  </svg>
);
