# Mebuki

**Open Source Plant Care.** Free plant guides, written in the open, that become an iPhone app.

*Mebuki* is Japanese for "sprouting", a plant coming into leaf.

## How a guide grows

Priya kept killing basil on her kitchen windowsill. One evening she found the fix in a
university extension leaflet: water the soil in the morning, pinch the flower spikes,
keep it above 10°C. She opened a pull request that edited one file,
`content/guides/sweet-basil.json`, and added a link to back up every tip.

A stranger in Osaka reviewed it and suggested pinching just above a leaf pair. A retired
gardener in Leeds tightened the night temperature and linked the RHS page that said so.
The checks went green, the pull request was merged, and the next build of the app
shipped a basil guide that three people on two continents had made better.

That is the whole idea. Every guide is one small file anyone can improve, every tip is
backed by a real source, and every merge grows the app.

## What you get

- **Fully open source.** The guides, the app and its animation engine all live here.
- **Sourced advice.** Each guide cites at least two trusted sources (the RHS, university
  extension services, the ASPCA for pet safety). The checks will not pass without them.
- **An iPhone app.** The same guides ship as a free, offline iOS app.

## Add or fix a guide

1. Copy `content/template/plant-guide.template.json` to `content/guides/<plant-id>.json`.
2. Fill it in and add your sources.
3. Run `npm run validate:guides`, then open a pull request.

[CONTRIBUTING.md](CONTRIBUTING.md) has the details. Not ready to write one? Open an issue
to suggest a plant or a correction.

## Run it

Requires Node 22+.

```bash
npm install
npm run dev
```

Then open http://localhost:5173 to browse every guide.

## Built with

React and SVG, animated by a small open-source engine in `src/motion/`. Vite and
TypeScript build it, Capacitor turns it into the iPhone app, and GitHub Actions sends
each release to TestFlight.
