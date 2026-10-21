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

## Why Mebuki

Most plant care apps follow the same playbook: snap a photo, then hit a subscription.
Their care tips come with no sources, most of them track you, and your plants live in
their cloud. Mebuki takes the opposite path.

- **Every tip shows its source.** Each guide cites at least two trusted references (the
  RHS, university extension services, the ASPCA for pet safety). The checks will not
  pass without them.
- **Free, with nothing to unlock.** No subscription, no trial, no ads.
- **Private by default.** No account, no tracking, no data collected. Everything works
  offline on your phone.
- **Save your plants, no account needed.** Tap the heart to keep a plant close. Your list
  syncs through your own iCloud, never through us.
- **Learn by watching.** Each plant's routine plays out step by step, and you can jump
  to any step.
- **Pet safety you can check.** Toxicity tags come from the ASPCA, with a pet-safe filter.
- **Plants people actually grow.** Kitchen herbs, balcony tomatoes and plants like Tulasi
  sit next to the usual houseplants.
- **Fully open source.** The guides, the app and its animation engine all live here, and
  the same guides ship as a free iPhone app.

## Add or fix a guide

1. Copy `content/template/plant-guide.template.json` to `content/guides/<plant-id>.json`.
2. Fill it in and add your sources.
3. Run `npm run validate:guides`, then open a pull request.

[CONTRIBUTING.md](CONTRIBUTING.md) has the details. Not ready to write one? Open an issue
to suggest a plant or a correction.

## What's next

Ideas we would love help with, roughly in order:

1. **Watering reminders that stay on your phone.** Free forever, no account, and easy to
   adjust to your home.
2. **My shelf.** Saved plants are here; next comes a watering log and notes, kept on the
   device and in your own iCloud.
3. **More plants, from more places.** Curry leaf, jasmine, neem and the herbs people
   grow on balconies from Mumbai to Mexico City.
4. **Point and learn.** Optional plant recognition that runs on the phone, used only to
   open the right guide.

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
