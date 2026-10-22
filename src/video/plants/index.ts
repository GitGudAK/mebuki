import type React from "react";
import type { Ctx } from "./kit";

export type PlantDrawing = {
  /** Guide id this drawing belongs to. */
  id: string;
  /** Draws the plant and its container in the 400×560 viewBox. */
  Component: React.FC<{ c: Ctx }>;
  /** False for containers that hang or float, which cast no floor shadow. */
  shadow?: boolean;
  /** Points in the 400×560 viewBox that care scenes aim at. */
  anchors?: {
    /** Middle of the visible soil (or water, or the rosette base) where feed lands. */
    soil: [number, number];
    /** A tip, flower or shoot the shears cut in the pruning scene. */
    snip: [number, number];
    /** Radius of the piece that comes away with the cut. */
    snipR?: number;
  };
};

/**
 * Every file in this folder that exports a `drawing` registers itself here. Guides without
 * one fall back to the generic shape for their `leafShape`.
 */
const modules = import.meta.glob<{ drawing?: PlantDrawing }>("./*.tsx", { eager: true });

export const PLANT_DRAWINGS: Record<string, PlantDrawing> = Object.fromEntries(
  Object.values(modules)
    .map((m) => m.drawing)
    .filter((d): d is PlantDrawing => !!d)
    .map((d) => [d.id, d]),
);
