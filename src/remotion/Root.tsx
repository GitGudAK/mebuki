import React from "react";
import { Composition, Still } from "remotion";
import { guides } from "../data/guides";
import { GuideThumbnail, GuideVideo } from "./GuideVideo";
import { FPS, VIDEO_HEIGHT, VIDEO_WIDTH, getGuideDurationInFrames } from "./timing";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {guides.map((guide) => (
        <React.Fragment key={guide.id}>
          <Composition
            id={guide.id}
            component={GuideVideo}
            durationInFrames={getGuideDurationInFrames(guide)}
            fps={FPS}
            width={VIDEO_WIDTH}
            height={VIDEO_HEIGHT}
            defaultProps={{ guide }}
          />
          <Still
            id={`${guide.id}-thumbnail`}
            component={GuideThumbnail}
            width={VIDEO_WIDTH}
            height={VIDEO_HEIGHT}
            defaultProps={{ guide }}
          />
        </React.Fragment>
      ))}
    </>
  );
};
