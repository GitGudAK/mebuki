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
  /** Optional indexes into the guide's sources that back this step. */
  sourceRefs?: number[];
};

export type GuideSource = { title: string; url: string };

/** A grower question added through a contribution; every answer is sourced. */
export type GuideFaq = {
  question: string;
  answer: string;
  sources: GuideSource[];
  /** GitHub username of the contributor, without @. */
  contributor?: string;
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
  leafShape: "round" | "long" | "split" | "succulent" | "trailing" | "herb" | "cactus" | "flowering" | "oval" | "fern" | "palm";
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
  /**
   * Authoritative pages the care facts were checked against (shown under the guide).
   * Required: at least 2, see content/schema/plant-guide.schema.json and CONTRIBUTING.md.
   */
  sources: GuideSource[];
  /** Where the plant is native to, e.g. "India and Sri Lanka". */
  origin?: string;
  /** Optional questions from growers, shown as an FAQ under the guide. */
  faqs?: GuideFaq[];
  /** Weather the plant tolerates, for advice based on the user's local forecast. */
  climate?: GuideClimate;
};

export type GuideClimate = {
  /** Lowest temperature it survives without damage, °C. */
  minTempC: number;
  /** Comfortable range [low, high], °C. */
  idealTempC: [number, number];
  /** Heat stress starts above this, °C. */
  maxTempC: number;
  humidity: "low" | "average" | "high";
  /** Whether a small-space grower can keep it outside. */
  outdoors: "never" | "summer" | "year-round";
  /** Indexes into sources that back these numbers. */
  sourceRefs: number[];
};
