// App icon and launch screen artwork: the Mebuki earth-and-roots mark.

import { BRAND_COLORS, BrandMark } from "../app/components/BrandMark";

export type BrandAsset = "icon" | "splash";

export const BRAND_SIZES: Record<BrandAsset, number> = { icon: 1024, splash: 2732 };

export const BrandArt = ({ asset }: { asset: BrandAsset }) => {
  const size = BRAND_SIZES[asset];

  // The icon is the full-bleed tile (iOS rounds the corners itself); the launch
  // screen shows the rounded tile small and centred on matching soil.
  if (asset === "icon") return <BrandMark size={size} rounded={false} />;

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        width: size,
        height: size,
        background: BRAND_COLORS.earthDeep,
      }}
    >
      <BrandMark size={size * 0.2} />
    </div>
  );
};
