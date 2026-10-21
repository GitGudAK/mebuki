// App icon and launch screen artwork, drawn with the same plant illustration as the guides.

import { Timeline } from "../motion";
import type { PlantGuide } from "../types";
import { PlantIllustration } from "../video/PlantIllustration";

export const BRAND = {
  background: "#173a29",
  backgroundDeep: "#0e2519",
  glow: "#e8b04b",
};

const palette: PlantGuide["palette"] = {
  background: BRAND.background,
  accent: BRAND.glow,
  leaf: "#4f9a63",
  pot: "#d07a4f",
};

/** A grown plant needs a frame past every grow-in spring. */
const STILL = { fps: 30, width: 1024, height: 1024, durationInFrames: 1 };

export type BrandAsset = "icon" | "splash";

export const BRAND_SIZES: Record<BrandAsset, number> = { icon: 1024, splash: 2732 };

export const BrandArt = ({ asset }: { asset: BrandAsset }) => {
  const size = BRAND_SIZES[asset];
  // The icon fills its tile; the splash keeps the plant small and centred.
  const plantWidth = asset === "icon" ? size * 0.5 : size * 0.16;
  const plantHeight = (plantWidth * 560) / 400;

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        overflow: "hidden",
        background: `radial-gradient(circle at 72% 22%, ${BRAND.glow}55, transparent 46%),
          radial-gradient(circle at 50% 60%, ${BRAND.background}, ${BRAND.backgroundDeep} 78%)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: plantWidth,
          height: plantHeight,
          transform: `translate(-50%, ${asset === "icon" ? "-46%" : "-50%"})`,
          filter: `drop-shadow(0 ${size * 0.02}px ${size * 0.03}px rgba(0, 0, 0, 0.3))`,
        }}
      >
        <Timeline frame={150} config={STILL}>
          <PlantIllustration leafShape="split" palette={palette} width={plantWidth} idPrefix="brand" />
        </Timeline>
      </div>
    </div>
  );
};
