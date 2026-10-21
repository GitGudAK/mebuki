// In-browser player: drives a composition's frame clock from requestAnimationFrame,
// scales the fixed-size canvas to fit its container, and exposes an imperative API.

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
} from "react";
import { Timeline } from "./timeline";

export type PlayerEvent = "frameupdate" | "seeked" | "play" | "pause" | "ended";
export type PlayerEventDetail = { frame: number };
type Listener = (e: CustomEvent<PlayerEventDetail>) => void;

export type PlayerRef = {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seekTo: (frame: number) => void;
  getCurrentFrame: () => number;
  isPlaying: () => boolean;
  addEventListener: (type: PlayerEvent, fn: Listener) => void;
  removeEventListener: (type: PlayerEvent, fn: Listener) => void;
};

type PlayerProps<P extends object> = {
  component: ComponentType<P>;
  inputProps: P;
  durationInFrames: number;
  compositionWidth: number;
  compositionHeight: number;
  fps: number;
  controls?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  clickToPlay?: boolean;
  /** Frame shown before playback first starts, e.g. a fully-built intro instead of an empty frame 0. */
  posterFrame?: number;
  style?: CSSProperties;
};

const formatTime = (frame: number, fps: number) => {
  const s = Math.floor(frame / fps);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const PlayerInner = <P extends object>(
  {
    component: Component,
    inputProps,
    durationInFrames,
    compositionWidth,
    compositionHeight,
    fps,
    controls = false,
    loop = false,
    autoPlay = false,
    clickToPlay = true,
    posterFrame,
    style,
  }: PlayerProps<P>,
  ref: React.ForwardedRef<PlayerRef>,
) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const events = useMemo(() => new EventTarget(), []);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [scale, setScale] = useState(1);
  const [started, setStarted] = useState(autoPlay);
  const frameRef = useRef(0);
  /** Fractional playhead; frameRef is its whole-frame part. */
  const positionRef = useRef(0);
  const playingRef = useRef(autoPlay);

  const emit = useCallback(
    (type: PlayerEvent, f: number) => events.dispatchEvent(new CustomEvent(type, { detail: { frame: f } })),
    [events],
  );

  const setPlayingState = useCallback(
    (next: boolean) => {
      if (next) setStarted(true);
      if (playingRef.current === next) return;
      playingRef.current = next;
      setPlaying(next);
      emit(next ? "play" : "pause", frameRef.current);
    },
    [emit],
  );

  const goTo = useCallback(
    (f: number) => {
      const clamped = Math.max(0, Math.min(durationInFrames - 1, Math.round(f)));
      frameRef.current = clamped;
      positionRef.current = clamped;
      setFrame(clamped);
      return clamped;
    },
    [durationInFrames],
  );

  // Advance the clock on wall time and render fractional frames, so animations run at
  // the display's refresh rate (60/120 Hz) instead of stepping at the composition fps.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      let position = positionRef.current + ((now - last) / 1000) * fps;
      last = now;
      if (position >= durationInFrames) {
        if (loop) position %= durationInFrames;
        else {
          goTo(durationInFrames - 1);
          emit("frameupdate", durationInFrames - 1);
          setPlayingState(false);
          emit("ended", durationInFrames - 1);
          return;
        }
      }
      positionRef.current = position;
      const whole = Math.floor(position);
      const changed = whole !== frameRef.current;
      frameRef.current = whole;
      setFrame(position);
      if (changed) emit("frameupdate", whole);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, fps, durationInFrames, loop, goTo, emit, setPlayingState]);

  // Scale the fixed-size composition to fit the container (letterboxed).
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width && height) setScale(Math.min(width / compositionWidth, height / compositionHeight));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [compositionWidth, compositionHeight]);

  const play = useCallback(() => {
    if (frameRef.current >= durationInFrames - 1) goTo(0);
    setPlayingState(true);
  }, [durationInFrames, goTo, setPlayingState]);
  const pause = useCallback(() => setPlayingState(false), [setPlayingState]);
  const toggle = useCallback(() => (playingRef.current ? pause() : play()), [play, pause]);
  const seekTo = useCallback(
    (f: number) => {
      setStarted(true);
      emit("seeked", goTo(f));
    },
    [emit, goTo],
  );

  useImperativeHandle(
    ref,
    () => ({
      play,
      pause,
      toggle,
      seekTo,
      getCurrentFrame: () => frameRef.current,
      isPlaying: () => playingRef.current,
      addEventListener: (type, fn) => events.addEventListener(type, fn as EventListener),
      removeEventListener: (type, fn) => events.removeEventListener(type, fn as EventListener),
    }),
    [play, pause, toggle, seekTo, events],
  );

  const config = useMemo(
    () => ({ fps, width: compositionWidth, height: compositionHeight, durationInFrames }),
    [fps, compositionWidth, compositionHeight, durationInFrames],
  );

  return (
    <div className="motion-player" style={style}>
      <div
        ref={containerRef}
        className="motion-player-stage"
        onClick={clickToPlay ? toggle : undefined}
        role={clickToPlay ? "button" : undefined}
        aria-label={clickToPlay ? (playing ? "Pause" : "Play") : undefined}
      >
        <div
          className="motion-player-canvas"
          style={{
            width: compositionWidth,
            height: compositionHeight,
            transform: `translate(-50%, -50%) scale(${scale})`,
          }}
        >
          <Timeline frame={started || posterFrame === undefined ? frame : posterFrame} config={config}>
            <Component {...inputProps} />
          </Timeline>
        </div>
        {clickToPlay && !playing && (
          <span className="motion-player-big-play" aria-hidden="true">
            ▶
          </span>
        )}
      </div>

      {controls && (
        <div className="motion-player-controls">
          <button type="button" className="motion-player-button" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
            {playing ? "❚❚" : "▶"}
          </button>
          <input
            className="motion-player-scrubber"
            type="range"
            min={0}
            max={durationInFrames - 1}
            value={frame}
            aria-label="Seek"
            onChange={(e) => seekTo(Number(e.currentTarget.value))}
          />
          <span className="motion-player-time">
            {formatTime(frame, fps)} / {formatTime(durationInFrames, fps)}
          </span>
        </div>
      )}
    </div>
  );
};

export const Player = forwardRef(PlayerInner) as <P extends object>(
  props: PlayerProps<P> & { ref?: React.Ref<PlayerRef> },
) => ReturnType<typeof PlayerInner>;
