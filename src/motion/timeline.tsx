// Frame clock and sequencing primitives. A composition is plain React that reads
// the current frame from context, so the same tree renders in the live Player and
// frame-by-frame in the MP4 renderer.

import { Children, createContext, isValidElement, useContext, type CSSProperties, type ReactNode } from "react";

export type VideoConfig = {
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
};

const FrameContext = createContext(0);
const VideoConfigContext = createContext<VideoConfig | null>(null);

export const useCurrentFrame = () => useContext(FrameContext);

export const useVideoConfig = (): VideoConfig => {
  const config = useContext(VideoConfigContext);
  if (!config) throw new Error("useVideoConfig must be used inside <Timeline>");
  return config;
};

/** Provides the frame clock and video config to everything below it. */
export const Timeline = ({ frame, config, children }: { frame: number; config: VideoConfig; children: ReactNode }) => (
  <VideoConfigContext.Provider value={config}>
    <FrameContext.Provider value={frame}>{children}</FrameContext.Provider>
  </VideoConfigContext.Provider>
);

const fillStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
};

export const AbsoluteFill = ({ style, children }: { style?: CSSProperties; children?: ReactNode }) => (
  <div style={{ ...fillStyle, ...style }}>{children}</div>
);

type SequenceProps = {
  /** Frame (in the parent's time) at which children start; their frame 0. */
  from?: number;
  durationInFrames?: number;
  /** "absolute-fill" wraps children in an AbsoluteFill; "none" renders them as-is. */
  layout?: "absolute-fill" | "none";
  name?: string;
  children?: ReactNode;
};

/** Shows children only during [from, from + durationInFrames) and shifts their clock to start at 0. */
export const Sequence = ({ from = 0, durationInFrames = Infinity, layout = "absolute-fill", children }: SequenceProps) => {
  const parentFrame = useCurrentFrame();
  const local = parentFrame - from;
  if (local < 0 || local >= durationInFrames) return null;
  return (
    <FrameContext.Provider value={local}>
      {layout === "none" ? children : <AbsoluteFill>{children}</AbsoluteFill>}
    </FrameContext.Provider>
  );
};

type SeriesSequenceProps = Omit<SequenceProps, "from" | "durationInFrames"> & { durationInFrames: number };

const SeriesSequence = (_props: SeriesSequenceProps): null => {
  throw new Error("<Series.Sequence> must be a direct child of <Series>");
};

/** Plays its <Series.Sequence> children back to back. */
export const Series = ({ children }: { children?: ReactNode }) => {
  let offset = 0;
  const items = Children.toArray(children).map((child) => {
    if (!isValidElement<SeriesSequenceProps>(child) || child.type !== SeriesSequence) {
      throw new Error("<Series> only accepts <Series.Sequence> children");
    }
    const { durationInFrames, ...rest } = child.props;
    const item = <Sequence key={child.key} {...rest} from={offset} durationInFrames={durationInFrames} />;
    offset += durationInFrames;
    return item;
  });
  return <>{items}</>;
};

Series.Sequence = SeriesSequence;
