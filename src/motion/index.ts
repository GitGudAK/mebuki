// Sprout's open-source animation engine (MIT, part of this repo).
// Compositions are React components that read the current frame; the Player
// plays them live and scripts/render.mjs captures them to MP4 with Playwright + ffmpeg.

export { AbsoluteFill, Sequence, Series, Timeline, useCurrentFrame, useVideoConfig } from "./timeline";
export type { VideoConfig } from "./timeline";
export { Easing, interpolate, random, spring } from "./math";
export type { EasingFn, InterpolateOptions, SpringConfig, SpringOptions } from "./math";
export { Player } from "./Player";
export type { PlayerEvent, PlayerEventDetail, PlayerRef } from "./Player";
