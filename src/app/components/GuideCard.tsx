import type { CSSProperties } from "react";
import type { PlantGuide } from "../../types";
import { LEAF_EMOJI } from "../meta";
import { hrefFor } from "../router";
import { DifficultyBadge } from "./DifficultyBadge";

export const GuideCard = ({ guide }: { guide: PlantGuide }) => {
  const style = {
    "--card-bg": guide.palette.background,
    "--card-accent": guide.palette.accent,
    "--card-leaf": guide.palette.leaf,
    "--card-pot": guide.palette.pot,
  } as CSSProperties;

  return (
    <a className="guide-card" href={hrefFor({ name: "plant", id: guide.id })} style={style}>
      <div className="guide-card-art" aria-hidden="true">
        <span className="guide-card-emoji">{LEAF_EMOJI[guide.leafShape]}</span>
        <span className="swatches">
          {(["background", "accent", "leaf", "pot"] as const).map((k) => (
            <span key={k} className="swatch" style={{ background: guide.palette[k] }} />
          ))}
        </span>
      </div>
      <div className="guide-card-body">
        <div className="guide-card-title-row">
          <h2 className="guide-card-name">{guide.name}</h2>
          <DifficultyBadge difficulty={guide.difficulty} />
        </div>
        <p className="guide-card-sci">{guide.scientificName}</p>
        <p className="guide-card-hook">{guide.hook}</p>
        <ul className="tag-list" aria-label="Tags">
          {guide.tags.map((t) => (
            <li key={t} className="tag">
              {t}
            </li>
          ))}
        </ul>
      </div>
    </a>
  );
};
