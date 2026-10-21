import type { PlantGuide } from "../types";

export const FPS = 30;
export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;

export const INTRO_FRAMES = 90;
export const STEP_FRAMES = 135;
export const OUTRO_FRAMES = 105;

export const getGuideDurationInFrames = (guide: PlantGuide) =>
  INTRO_FRAMES + guide.steps.length * STEP_FRAMES + OUTRO_FRAMES;

/** Intro frame where everything has animated in; used for thumbnails and the player poster. */
export const POSTER_FRAME = 70;
