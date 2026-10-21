import type { Difficulty } from "../../types";
import { DIFFICULTY_LABEL } from "../meta";

export const DifficultyBadge = ({ difficulty }: { difficulty: Difficulty }) => (
  <span className={`badge diff-${difficulty}`}>{DIFFICULTY_LABEL[difficulty]}</span>
);
