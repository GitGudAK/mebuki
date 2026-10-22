import type { CSSProperties } from "react";
import { Timeline } from "../../motion";
import type { PlantGuide } from "../../types";
import { PlantIllustration } from "../../video/PlantIllustration";
import { FPS, VIDEO_HEIGHT, VIDEO_WIDTH, getGuideDurationInFrames } from "../../video/timing";
import { useFavorites } from "../favorites";
import { DIFFICULTY_LABEL } from "../meta";
import { hrefFor } from "../router";

// A still of the guide's own illustrated plant, fully grown (frame 150 is past every grow-in spring).
const STILL_CONFIG = { fps: FPS, width: VIDEO_WIDTH, height: VIDEO_HEIGHT, durationInFrames: 1 };

/** One plant in the library grid: its illustration on its own colour, a name, one line of facts. */
export const GuideCard = ({ guide }: { guide: PlantGuide }) => {
  const saved = useFavorites().includes(guide.id);
  const seconds = Math.round(getGuideDurationInFrames(guide) / FPS);

  return (
    <a
      className="tile"
      href={hrefFor({ name: "plant", id: guide.id })}
      style={{ "--tile-bg": guide.palette.background } as CSSProperties}
    >
      <span className="tile-art" aria-hidden="true">
        <Timeline frame={150} config={STILL_CONFIG}>
          <PlantIllustration
            leafShape={guide.leafShape}
            palette={guide.palette}
            width={78}
            idPrefix={`tile-${guide.id}`}
            style={{ overflow: "visible" }}
          />
        </Timeline>
        {saved && (
          <svg className="tile-saved" viewBox="0 0 24 24" width="16" height="16">
            <path
              d="M12 20.5s-7.5-4.6-7.5-10.1C4.5 7.6 6.6 5.5 9.2 5.5c1.3 0 2.3.6 2.8 1.5.5-.9 1.5-1.5 2.8-1.5 2.6 0 4.7 2.1 4.7 4.9 0 5.5-7.5 10.1-7.5 10.1z"
              fill="currentColor"
            />
          </svg>
        )}
      </span>
      <span className="tile-name">{guide.name}</span>
      <span className="tile-meta">
        {DIFFICULTY_LABEL[guide.difficulty]} · {seconds}s
        {saved && <span className="sr-only">, saved</span>}
      </span>
    </a>
  );
};
