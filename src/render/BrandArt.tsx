// App icon and launch screen artwork: the Mebuki mark (a sprouting "m") on deep green.

import { BrandMark } from "../app/components/BrandMark";

export const BRAND = {
  background: "#2f6b45",
  backgroundDeep: "#173a29",
  ink: "#f6f3ea",
  leafA: "#9fd8a8",
  leafB: "#cfe8d3",
};

export type BrandAsset = "icon" | "splash";

export const BRAND_SIZES: Record<BrandAsset, number> = { icon: 1024, splash: 2732 };

export const BrandArt = ({ asset }: { asset: BrandAsset }) => {
  const size = BRAND_SIZES[asset];
  // The icon fills its tile; the splash keeps the mark small and centred.
  const markSize = asset === "icon" ? size * 0.78 : size * 0.2;

  return (
    <div
      style={{
        position: "relative",
        display: "grid",
        placeItems: "center",
        width: size,
        height: size,
        overflow: "hidden",
        background: `radial-gradient(circle at 50% 40%, ${BRAND.background}, ${BRAND.backgroundDeep} 82%)`,
      }}
    >
      <BrandMark size={markSize} ink={BRAND.ink} leafA={BRAND.leafA} leafB={BRAND.leafB} />
    </div>
  );
};
