# Mebuki

**Open Source Plant Care.** Free care guides for real-life plants, written in the open
and backed by trusted sources.

Everyone is welcome here, from first-time plant owners to horticulturists. Know a plant
well? Add a guide or fix one: it's a single JSON file, and
[CONTRIBUTING.md](CONTRIBUTING.md) walks you through it.

*Mebuki* is Japanese for "sprouting", a plant coming into leaf. It teaches urban gardeners (apartment, balcony and windowsill growers) how to keep
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
| `npm run validate:guides` | Check every guide in `content/guides/` against the schema and the source rules. |
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
(`ios/App`, bundle id `com.gitgudak.mebuki`). It uses Swift Package Manager, so no
CocoaPods is needed.

```bash
npm run build && npx cap sync ios     # copy the latest web build into the iOS project
npx cap open ios                      # open in Xcode to run on a simulator or device
```

Inside the app the desktop-only bits (the export panel and footer) are hidden, the
layout respects the notch and home indicator, and fonts are bundled so it works offline.

## Project structure

```
content/
  guides/<id>.json          One file per plant guide (the content)
  schema/                   JSON Schema every guide is validated against
  template/                 Starter file for a new guide
index.html                  Web/iOS app entry; mounts src/app/main.tsx
render.html                 Headless render target used by scripts/render.mjs
src/
  types.ts                  Shared PlantGuide / GuideStep / StepKind types
  data/guides.ts            Loads content/guides/*.json in library order + getGuide(id)
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
scripts/validate-guides.mjs Guide validator (schema + source rules, optional link check)
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

Each guide is one JSON file in `content/guides/`, checked against
[`content/schema/plant-guide.schema.json`](content/schema/plant-guide.schema.json).

1. Copy the template and name the file after the guide's id:

   ```bash
   cp content/template/plant-guide.template.json content/guides/rubber-plant.json
   ```

2. Fill it in. The id is kebab-case and must match the file name. Limits: hook 60
   characters, outro 70, step title 28, tip 110, stat 16, and 4 to 6 steps that include
   `water` and `light`. Editors that understand `$schema` will flag mistakes as you type.

3. Add at least 2 `sources`, including at least one from an authoritative publisher
   (RHS, Kew, a university extension service, ASPCA). Pet tags need an ASPCA or extension
   source.

4. Check it:

   ```bash
   npm run validate:guides
   npm run dev                      # find it in the library
   npm run render -- rubber-plant   # optional: render the MP4
   ```

The library card, the guide page (`#/plant/rubber-plant`) and the video are all generated
from the file. New guides appear at the end of the library; the order lives in
`LIBRARY_ORDER` in `src/data/guides.ts`. Tags are free-form, and any new tag shows up as a
filter chip automatically.

## Contributing plant guides

Guides are open for contributions, and every guide must cite its sources. Read
[CONTRIBUTING.md](CONTRIBUTING.md) for the source policy, field reference and pull request
checklist, or [open an issue](https://github.com/GitGudAK/mebuki/issues/new/choose) to
suggest a plant or report a wrong fact.
