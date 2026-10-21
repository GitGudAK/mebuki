// Headless render target for scripts/render.mjs. Mounts one guide (or a piece of brand
// art) at full size and exposes window.mebukiRender so the script can step the frame
// clock and screenshot it.

import "../video/fonts";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { getGuide } from "../data/guides";
import { Timeline } from "../motion";
import { GuideThumbnail, GuideVideo } from "../video/GuideVideo";
import { FPS, VIDEO_HEIGHT, VIDEO_WIDTH, getGuideDurationInFrames } from "../video/timing";
import { BRAND_SIZES, BrandArt, type BrandAsset } from "./BrandArt";

declare global {
  interface Window {
    mebukiRender?: {
      durationInFrames: number;
      width: number;
      height: number;
      setFrame: (frame: number) => Promise<void>;
    };
  }
}

type Target = { width: number; height: number; durationInFrames: number; render: () => ReactNode };

const resolveTarget = (params: URLSearchParams): Target => {
  const brand = params.get("brand") as BrandAsset | null;
  if (brand) {
    if (!(brand in BRAND_SIZES)) throw new Error(`Unknown brand asset: ${brand}`);
    const size = BRAND_SIZES[brand];
    return { width: size, height: size, durationInFrames: 1, render: () => <BrandArt asset={brand} /> };
  }

  const id = params.get("id") ?? "";
  const guide = getGuide(id);
  if (!guide) throw new Error(`Unknown guide id: ${id}`);
  const thumbnail = params.has("thumbnail");
  const Component = thumbnail ? GuideThumbnail : GuideVideo;
  return {
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    durationInFrames: thumbnail ? 1 : getGuideDurationInFrames(guide),
    render: () => <Component guide={guide} />,
  };
};

const target = resolveTarget(new URLSearchParams(location.search));
const config = { fps: FPS, width: target.width, height: target.height, durationInFrames: target.durationInFrames };

const rootEl = document.getElementById("root")!;
Object.assign(rootEl.style, {
  position: "relative",
  width: `${target.width}px`,
  height: `${target.height}px`,
  overflow: "hidden",
});
const root = createRoot(rootEl);

const renderFrame = (frame: number) =>
  flushSync(() =>
    root.render(
      <Timeline frame={frame} config={config}>
        {target.render()}
      </Timeline>,
    ),
  );

renderFrame(0);

document.fonts.ready.then(() => {
  window.mebukiRender = {
    durationInFrames: config.durationInFrames,
    width: target.width,
    height: target.height,
    setFrame: async (frame) => {
      renderFrame(frame);
      await new Promise((r) => requestAnimationFrame(() => r(undefined)));
    },
  };
});
