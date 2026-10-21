# Contributing to Mebuki

Thanks for helping people keep their plants alive! The easiest and most useful way to
contribute is to add a plant guide or fix one. Each guide is a single JSON file, so you
don't need to know React or TypeScript.

Not ready to write a guide? [Open an issue](https://github.com/GitGudAK/mebuki/issues/new/choose)
to suggest a plant or report a wrong care fact.

## The one rule: every fact needs a source

Mebuki gives care advice people act on, and a wrong tip can kill a plant or hurt a pet.
So **references are mandatory**:

- Every guide lists **at least 2 sources** in `sources`.
- **At least 1 source must come from an authoritative publisher** (see the list below).
- If the guide makes a pet claim (a tag like `pet safe`, `toxic to pets` or
  `leaves toxic to pets`), **at least 1 source must be the ASPCA or a university
  extension service**. The ASPCA toxic and non-toxic plants list is the best fit.
- Every care fact in the guide (watering, light, temperature, toxicity and so on) must be
  backed by one of the listed sources. Don't add advice from memory.
- Links must use `https://`, and the same page can't be listed twice.
- Corrections follow the same rule: link the source that supports the change.

### Sources we accept

The validator treats these publishers as authoritative:

| Type | Examples |
| --- | --- |
| Horticultural societies | Royal Horticultural Society (`rhs.org.uk`) |
| Botanic gardens | Kew (`kew.org`), Royal Botanic Garden Edinburgh (`rbge.org.uk`), Missouri Botanical Garden (`missouribotanicalgarden.org`) |
| University extension services | Any `.edu` site with "extension" in the host name (`extension.psu.edu`, `extension.umn.edu`, `hort.extension.wisc.edu`), plus NC State Plant Toolbox (`plants.ces.ncsu.edu`), Clemson HGIC (`hgic.clemson.edu`), UF/IFAS (`ifas.ufl.edu`), UC ANR (`ucanr.edu`) |
| Pet toxicity | ASPCA Animal Poison Control (`aspca.org`) |
| Government plant databases | USDA (`usda.gov`) |

Other reputable pages (another university, a national plant society) are welcome as
extra sources alongside an authoritative one. Shop blogs, forums, AI answers and social
posts are not accepted as sources.

If you think a publisher belongs on the list, open an issue or add it to
`AUTHORITATIVE_DOMAINS` in `scripts/validate-guides.mjs` in your pull request and explain why.

## Add a new guide

1. **Fork and clone** the repo, then install:

   ```bash
   npm install
   ```

2. **Copy the template** to a new file named after the plant's id:

   ```bash
   cp content/template/plant-guide.template.json content/guides/rubber-plant.json
   ```

   The id is kebab-case (lowercase words joined by `-`) and must match the file name.
   It's also used in the app URL (`#/plant/rubber-plant`).

3. **Fill in the fields.** Most editors (VS Code, WebStorm, Zed) read the `$schema` line
   at the top of the file and will flag mistakes and show hints as you type.

4. **Validate and preview:**

   ```bash
   npm run validate:guides   # checks every guide against the schema and the source rules
   npm run dev               # open http://localhost:5173 and find your plant in the library
   ```

   Play the guide in the app and make sure the text fits and reads well.

5. **Open a pull request** and fill in the checklist.

New guides appear at the end of the library. The maintainers may move it in the library
order (`LIBRARY_ORDER` in `src/data/guides.ts`).

## Fields

The full contract is the JSON Schema in
[`content/schema/plant-guide.schema.json`](content/schema/plant-guide.schema.json).

| Field | What it is | Limits |
| --- | --- | --- |
| `id` | kebab-case id, same as the file name | `^[a-z0-9]+(-[a-z0-9]+)*$` |
| `name` | Common name, e.g. `"Golden Pothos"` | 32 characters |
| `scientificName` | Botanical name, e.g. `"Epipremnum aureum"` | 60 characters |
| `hook` | Opening line of the guide | 60 characters |
| `difficulty` | `easy`, `moderate` or `tricky` | |
| `tags` | Lowercase filters, e.g. `low light`, `balcony`, `edible`, `pet safe`, `toxic to pets` | 1 to 8 tags, 24 characters each |
| `leafShape` | Which plant drawing to use: `round`, `long`, `split`, `succulent`, `trailing`, `herb`, `cactus`, `flowering` or `oval` | |
| `palette` | `background`, `accent`, `leaf` and `pot` colors | 6-digit hex, e.g. `"#2E7D4F"` |
| `steps` | The care routine, one scene each | 4 to 6 steps, must include `water` and `light` |
| `steps[].kind` | `water`, `light`, `soil`, `humidity`, `fertilize`, `prune`, `repot`, `pests`, `temperature` or `propagate` | |
| `steps[].title` | Short headline, e.g. `"Water every 7–10 days"` | 28 characters |
| `steps[].tip` | One practical sentence | 110 characters |
| `steps[].stat` | Optional big number, e.g. `"7–10 days"`, `"6+ hrs"`, `"60%"` | 16 characters |
| `outro` | Closing takeaway | 70 characters |
| `sources` | `{ "title", "url" }` for each page the facts came from | At least 2, `https://` only |

Tips for good guides:

- Write for someone with a small apartment, balcony or windowsill.
- Lead with the action: "Water when the top 3 cm is dry" beats "Watering is important".
- Use metric units first. Ranges use an en dash without spaces (`7–10 days`).
- Name sources as `Publisher: Page title`, e.g. `"RHS: How to grow Swiss cheese plants"`.
- Pick palette colors with enough contrast between `background`, `accent` and `leaf`.
  The validator can't judge colors, so check the guide in the app.

## Link sources to chapters (optional)

Each step shows a small Sources drawer in the app. Add `sourceRefs` to a step to list
which of the guide's `sources` back it, by position starting at 0:

```json
{ "kind": "water", "title": "Soak, then let dry", "tip": "…", "sourceRefs": [0, 1] }
```

Without `sourceRefs`, the drawer shows every source for the guide.

## Add a question from growers (optional)

Common questions can be added to a guide as `faqs`. Each answer needs at least one source
from an authoritative publisher, the same rule as the guide itself:

```json
"faqs": [
  {
    "question": "Why are the tips turning brown?",
    "answer": "Usually too much direct sun after a move outdoors. Shift it gradually.",
    "sources": [{ "title": "Penn State Extension: Aloe, a Hardy Houseplant", "url": "https://extension.psu.edu/aloe-a-hardy-houseplant" }],
    "contributor": "your-github-username"
  }
]
```

The app only shows the "Questions from growers" section when a guide has at least one.

## Fix an existing guide

Edit the guide's file in `content/guides/`, add or update the source that supports the
change, run `npm run validate:guides`, and open a pull request. Keep the `id` the same so
existing links keep working.

## Check that source links still work

```bash
npm run validate:guides -- --check-links
```

This requests every source URL and lists the ones that didn't load. It only warns,
because some sites block scripted requests even though the page is fine in a browser.
Open anything it lists in a browser before changing it.

## What CI checks

Every pull request that touches `content/` or `src/` runs `npm run validate:guides` and
`npx tsc --noEmit`. Both must pass before a guide is merged.

## Code changes

Code contributions are welcome too. The app is built with React + SVG and its own small
open-source animation engine in `src/motion/`. Run `npm run build` before opening a pull
request.

| Path | What lives there |
| --- | --- |
| `content/guides/` | One JSON file per plant guide |
| `content/schema/` | The guide schema that every file is checked against |
| `src/motion/` | The animation engine: frame clock, springs, easing, player |
| `src/video/` | The guide scenes, plant drawings and step animations |
| `src/app/` | The library and guide screens |
| `scripts/` | Guide validator and the MP4 renderer |
| `ios/` | The iPhone app (Capacitor) |

| Command | What it does |
| --- | --- |
| `npm run dev` | Run the app at http://localhost:5173 |
| `npm run validate:guides` | Check every guide against the schema and source rules |
| `npm run build` | Type-check and build the app |
| `npm run render -- <id>` | Render a guide to `out/<id>.mp4` (needs ffmpeg and `npx playwright install chromium`) |
| `npm run render:thumbnails` | Render a cover image per guide |

## App Store listing

The App Store text lives in `fastlane/metadata/` (one plain text file per field) and the
screenshots in `fastlane/screenshots/en-US/` (1206 × 2622 PNGs, no transparency). When a
change to either is merged, the "App Store listing" workflow uploads it to App Store
Connect. It never uploads a build or submits the app for review.
