# Sprout: Animated Plant Care Guide

Sprout teaches urban gardeners (apartment, balcony and windowsill growers) how to keep
their plants alive with short, vertical, animated care guides. Every guide is a
[Remotion](https://www.remotion.dev) composition: the web app plays it live in the
browser with `@remotion/player`, and the same composition renders to a 1080×1920 MP4
for Reels, Shorts or TikTok.

- **Plant library**: a searchable grid of guides with difficulty and tag filters
  (low light, pet safe, edible, beginner and more).
- **Guide view**: the animated video in a phone frame next to a written care routine.
  Click a step to jump the video to it; the step that's playing is highlighted.
- **Export**: each guide shows the exact CLI command that renders it to MP4.
- **Linkable**: hash routes, `#/` for the library and `#/plant/<id>` for a guide.

## Getting started

Requires Node 18+.

```bash
npm install
npm run dev          # web app at http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server for the web app. |
| `npm run build` | Type-check and build the web app into `dist/`. |
| `npm run typecheck` | Run `tsc --noEmit` only. |
| `npm run studio` | Open Remotion Studio to preview and tweak every composition. |
| `npm run render -- <id> out/<id>.mp4` | Render one guide, e.g. `npm run render -- golden-pothos out/golden-pothos.mp4`. |
| `npm run render:all` | Render every guide to `out/<id>.mp4`, one after another. |

`render:all` accepts optional composition ids to render just those, plus any
`remotion render` flags:

```bash
npm run render:all -- snake-plant mint      # only these two
npm run render:all -- --list                # print the ids and exit
npm run render:all -- --concurrency=2       # pass flags through to remotion render
```

The first render downloads Chrome Headless Shell automatically (about 100 MB, one time).

## Project structure

```
index.html                  Vite entry; mounts src/app/main.tsx
src/
  types.ts                  Shared PlantGuide / GuideStep / StepKind types
  data/guides.ts            All plant guides (the content) + getGuide(id)
  remotion/
    index.ts                Remotion entry (registerRoot)
    Root.tsx                One <Composition> per guide; id = guide.id
    GuideVideo.tsx          The animated guide video ({ guide } props)
    timing.ts               FPS, size and per-scene frame counts
  app/
    main.tsx                React root
    App.tsx                 Header, routing between library and guide view
    router.ts               Tiny hash router (#/ and #/plant/<id>)
    meta.ts                 Step icons and labels, difficulty labels, render command
    components/             Library, GuideCard, GuideDetail, ExportPanel, ...
    styles.css              All app styles (plain CSS, light and dark)
scripts/render-all.mjs      Batch renderer used by `npm run render:all`
remotion.config.ts          Remotion CLI config
```

### Timing

A guide video has an intro, one scene per step and an outro
(`src/remotion/timing.ts`):

```
duration = INTRO_FRAMES + steps.length * STEP_FRAMES + OUTRO_FRAMES   (at 30 fps)
step i starts at INTRO_FRAMES + i * STEP_FRAMES
```

The web app uses the same constants to seek to a step and to highlight the one that's
playing, so changing the timings keeps everything in sync.

## Adding a new plant guide

1. Open `src/data/guides.ts` and add a `PlantGuide` object to the `guides` array:

   ```ts
   {
     id: "rubber-plant",                 // kebab-case; also the composition id and URL
     name: "Rubber Plant",
     scientificName: "Ficus elastica",
     hook: "Glossy leaves, zero drama, if you don't move it.",  // ≤ ~60 chars
     difficulty: "easy",                 // "easy" | "moderate" | "tricky"
     tags: ["bright indirect", "beginner", "toxic to pets"],
     leafShape: "round",                 // round | long | split | succulent | trailing | herb
     palette: { background: "#1E3A2E", accent: "#E8B04B", leaf: "#2F6B45", pot: "#B86B45" },
     steps: [                            // 4–6 steps
       { kind: "light", title: "Bright, indirect light", tip: "…", stat: "6+ hrs" },
       { kind: "water", title: "Water when top 3 cm is dry", tip: "…", stat: "7–10 days" },
       // kind: water | light | soil | humidity | fertilize | prune | repot | pests | temperature | propagate
     ],
     outro: "Find it a bright spot, then leave it be.",   // ≤ ~70 chars
   }
   ```

   Keep step titles to about 28 characters and tips to about 110 so they fit the video.

2. That's it. The library card, the guide page (`#/plant/rubber-plant`) and the Remotion
   composition are all generated from the data. Check it with `npm run dev` or
   `npm run studio`, then render it with
   `npm run render -- rubber-plant out/rubber-plant.mp4`.

Tags are free-form; any new tag shows up as a filter chip automatically.
