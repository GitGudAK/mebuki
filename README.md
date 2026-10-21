# Niwa: Animated Plant Care Guide

*Niwa* is Japanese for "garden". It teaches urban gardeners (apartment, balcony and windowsill growers) how to keep
their plants alive with short, vertical, animated care guides. It runs as a web app and
as a free iPhone app, and every guide also renders to a 1080×1920 MP4 for Reels, Shorts
or TikTok.

The whole stack is open source. Guides are animated by a small engine in `src/motion/`
(part of this repo): each guide is a React + SVG component that reads the current frame.
The app plays it live at the display's refresh rate, and `npm run render` captures it
frame by frame with [Playwright](https://playwright.dev) and encodes it with
[ffmpeg](https://ffmpeg.org).

- **Plant library**: a searchable grid of guides with difficulty and tag filters
  (low light, pet safe, edible, beginner and more).
- **Guide view**: the animated guide in a phone frame next to a written care routine.
  Tap a step to jump to it; the step that's playing is highlighted.
- **Tiny and sharp**: the app ships no video files. Guides are vector animations drawn
  live, so all 17 weigh well under 1 MB and stay crisp on any screen.
- **Export**: `npm run render` turns any guide into a social-ready MP4.

## Getting started

Requires Node 22+ and ffmpeg (`brew install ffmpeg`).

```bash
npm install
npx playwright install chromium   # one time, for MP4 rendering
npm run dev                       # web app at http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server for the web app. |
| `npm run build` | Type-check and build the web app into `dist/`. |
| `npm run typecheck` | Run `tsc --noEmit` only. |
| `npm run render` | Render every guide to `out/<id>.mp4`. |
| `npm run render -- <id> [<id>…]` | Render just these guides, e.g. `npm run render -- golden-pothos`. |
| `npm run render:thumbnails` | Render a cover image per guide to `out/<id>-thumbnail.png`. |

Render options:

```bash
npm run render -- --list              # print the guide ids and exit
npm run render -- --concurrency=6     # browser tabs per video (default: half your CPU cores)
```

## iPhone app

The iOS app is a [Capacitor](https://capacitorjs.com) shell around the same web app
(`ios/App`, bundle id `com.gitgudak.niwa`). It uses Swift Package Manager, so no
CocoaPods is needed.

```bash
npm run build && npx cap sync ios     # copy the latest web build into the iOS project
npx cap open ios                      # open in Xcode to run on a simulator or device
```

Inside the app the desktop-only bits (the export panel and footer) are hidden, the
layout respects the notch and home indicator, and fonts are bundled so it works offline.

## Project structure

```
index.html                  Web/iOS app entry; mounts src/app/main.tsx
render.html                 Headless render target used by scripts/render.mjs
src/
  types.ts                  Shared PlantGuide / GuideStep / StepKind types
  data/guides.ts            All plant guides (the content) + getGuide(id)
  motion/                   Open-source animation engine
    timeline.tsx            Frame clock, useCurrentFrame, Sequence, Series, AbsoluteFill
    math.ts                 interpolate, Easing, spring, seeded random
    Player.tsx              Live player with controls and seek/play events
  video/
    GuideVideo.tsx          The animated guide (intro, one scene per step, outro)
    PlantIllustration.tsx   SVG potted plant per leaf shape
    StepIcons.tsx           Animated motif per step kind
    timing.ts               FPS, size and per-scene frame counts
    fonts.ts                Bundled Inter weights shared by app and renderer
  render/main.tsx           Mounts one guide for frame-by-frame capture
  app/
    main.tsx                React root
    App.tsx                 Header, routing between library and guide view
    platform.ts             Detects the iOS app shell
    router.ts               Tiny hash router (#/ and #/plant/<id>)
    meta.ts                 Step icons and labels, difficulty labels, render command
    components/             Library, GuideCard, GuideDetail, ExportPanel, ...
    styles.css              All app styles (plain CSS, light and dark)
scripts/render.mjs          MP4 / thumbnail renderer (Vite + Playwright + ffmpeg)
ios/                        Capacitor iOS project
capacitor.config.ts         Capacitor config
```

### Timing

A guide has an intro, one scene per step and an outro (`src/video/timing.ts`):

```
duration = INTRO_FRAMES + steps.length * STEP_FRAMES + OUTRO_FRAMES   (at 30 fps)
step i starts at INTRO_FRAMES + i * STEP_FRAMES
```

The app uses the same constants to seek to a step and to highlight the one that's
playing, so changing the timings keeps everything in sync. Animations are written
against fractional frames, so the live player renders smoothly between them.

## Adding a new plant guide

1. Open `src/data/guides.ts` and add a `PlantGuide` object to the `guides` array:

   ```ts
   {
     id: "rubber-plant",                 // kebab-case; also the URL and MP4 name
     name: "Rubber Plant",
     scientificName: "Ficus elastica",
     hook: "Glossy leaves, zero drama, if you don't move it.",  // ≤ ~60 chars
     difficulty: "easy",                 // "easy" | "moderate" | "tricky"
     tags: ["bright indirect", "beginner", "toxic to pets"],
     leafShape: "round",                 // round | long | split | succulent | trailing | herb | cactus | flowering | oval
     palette: { background: "#1E3A2E", accent: "#E8B04B", leaf: "#2F6B45", pot: "#B86B45" },
     steps: [                            // 4–6 steps
       { kind: "light", title: "Bright, indirect light", tip: "…", stat: "6+ hrs" },
       { kind: "water", title: "Water when top 3 cm is dry", tip: "…", stat: "7–10 days" },
       // kind: water | light | soil | humidity | fertilize | prune | repot | pests | temperature | propagate
     ],
     outro: "Find it a bright spot, then leave it be.",   // ≤ ~70 chars
     sources: [                          // pages the facts were checked against; shown under the guide
       { title: "RHS: Ficus elastica", url: "https://www.rhs.org.uk/plants/95720/ficus-elastica/details" },
     ],
   }
   ```

   Keep step titles to about 28 characters and tips to about 110 so they fit the video.

2. That's it. The library card, the guide page (`#/plant/rubber-plant`) and the video
   are all generated from the data. Check it with `npm run dev`, then render it with
   `npm run render -- rubber-plant`.

Tags are free-form; any new tag shows up as a filter chip automatically.
