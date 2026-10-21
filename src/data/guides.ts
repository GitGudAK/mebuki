/// <reference types="vite/client" />
import type { PlantGuide } from "../types";

// Each guide lives in content/guides/<id>.json and is validated against
// content/schema/plant-guide.schema.json (npm run validate:guides).
const modules = import.meta.glob<{ default: PlantGuide & { $schema?: string } }>(
  ["../../content/guides/*.json", "!../../content/guides/_*.json"],
  { eager: true },
);

// Library order. Guides not listed here are shown after these, sorted by id,
// so a new guide only needs its JSON file.
const LIBRARY_ORDER = [
  "monstera-deliciosa",
  "golden-pothos",
  "snake-plant",
  "fiddle-leaf-fig",
  "zz-plant",
  "peace-lily",
  "spider-plant",
  "aloe-vera",
  "sweet-basil",
  "mint",
  "balcony-cherry-tomato",
  "string-of-pearls",
  "hibiscus",
  "tulasi",
  "cactus",
  "rubber-plant",
  "chinese-money-plant",
];

const rank = (id: string) => {
  const i = LIBRARY_ORDER.indexOf(id);
  return i === -1 ? LIBRARY_ORDER.length : i;
};

export const guides: PlantGuide[] = Object.values(modules)
  .map(({ default: { $schema: _schema, ...guide } }) => guide as PlantGuide)
  .sort((a, b) => rank(a.id) - rank(b.id) || a.id.localeCompare(b.id));

export const getGuide = (id: string) => guides.find((g) => g.id === id);
