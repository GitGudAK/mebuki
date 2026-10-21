// Shared contract between the video compositions, the guide data and the web app.

export type StepKind =
  | "water"
  | "light"
  | "soil"
  | "humidity"
  | "fertilize"
  | "prune"
  | "repot"
  | "pests"
  | "temperature"
  | "propagate";

export type Difficulty = "easy" | "moderate" | "tricky";

export type GuideStep = {
  kind: StepKind;
  /** Short headline, max ~28 chars, e.g. "Water every 7–10 days" */
  title: string;
  /** One-sentence actionable tip, max ~110 chars. */
  tip: string;
  /** Optional big stat shown in the animation, e.g. "7–10 days", "6+ hrs", "60%". */
  stat?: string;
};

export type PlantGuide = {
  /** kebab-case, also used as the video id (out/<id>.mp4). */
  id: string;
  name: string;
  scientificName: string;
  /** Hook line for the intro scene, max ~60 chars. */
  hook: string;
  difficulty: Difficulty;
  /** Urban-gardener friendly tags, e.g. "low light", "balcony", "pet safe". */
  tags: string[];
  /** Leaf shape drives which illustrated plant the animation draws. */
  leafShape: "round" | "long" | "split" | "succulent" | "trailing" | "herb" | "cactus" | "flowering" | "oval";
  palette: {
    background: string;
    accent: string;
    leaf: string;
    pot: string;
  };
  /** 4–6 steps. */
  steps: GuideStep[];
  /** Closing takeaway, max ~70 chars. */
  outro: string;
  /** Authoritative pages the care facts were checked against (shown under the guide). */
  sources?: { title: string; url: string }[];
};
