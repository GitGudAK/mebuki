import type React from "react";
import type { Ctx } from "./kit";

export type PlantDrawing = {
  /** Guide id this drawing belongs to. */
  id: string;
  /** Draws the plant and its container in the 400×560 viewBox. */
  Component: React.FC<{ c: Ctx }>;
  /** False for containers that hang or float, which cast no floor shadow. */
  shadow?: boolean;
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
