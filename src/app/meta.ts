import type { Difficulty, PlantGuide, StepKind } from "../types";

export const STEP_META: Record<StepKind, { icon: string; label: string }> = {
  water: { icon: "💧", label: "Water" },
  light: { icon: "☀️", label: "Light" },
  soil: { icon: "🪴", label: "Soil" },
  humidity: { icon: "🌫️", label: "Humidity" },
  fertilize: { icon: "🧪", label: "Feed" },
  prune: { icon: "✂️", label: "Prune" },
  repot: { icon: "🏺", label: "Repot" },
  pests: { icon: "🐞", label: "Pests" },
  temperature: { icon: "🌡️", label: "Temperature" },
  propagate: { icon: "🌱", label: "Propagate" },
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Easy",
  moderate: "Moderate",
  tricky: "Tricky",
};

export const DIFFICULTIES: Difficulty[] = ["easy", "moderate", "tricky"];

export const LEAF_EMOJI: Record<PlantGuide["leafShape"], string> = {
  round: "🍃",
  long: "🌿",
  split: "🌴",
  succulent: "🌵",
  trailing: "🌱",
  herb: "🌿",
};

export const renderCommand = (id: string) =>
  `npx remotion render src/remotion/index.ts ${id} out/${id}.mp4`;
