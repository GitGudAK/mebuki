#!/usr/bin/env node
// Assembles the GitHub Pages site in site/:
//   /                docs/ (landing, privacy, support)
//   /app/            the web app (dist/)
//   /p/<id>.html     one share page per plant, with a link-preview image,
//                    that opens the plant in the web app
//
// Run after `npm run build` and `npm run render:thumbnails`.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = path.join(ROOT, "site");
const BASE_URL = process.env.SITE_URL ?? "https://gitgudak.github.io/mebuki";

// Where a shared link sends people. iPhone and iPad go to the App Store, Android to
// Google Play once there is an Android app (set PLAY_STORE_ID), everyone else to
// the web app. Until then Android also gets the web app.
const APP_STORE_URL = "https://apps.apple.com/app/id6825408150";
const PLAY_STORE_ID = process.env.PLAY_STORE_ID ?? "";
const PLAY_STORE_URL = PLAY_STORE_ID ? `https://play.google.com/store/apps/details?id=${PLAY_STORE_ID}` : "";

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const sharePage = (g) => {
  const title = `${g.name} care · Mebuki`;
  const description = g.hook;
  const image = `${BASE_URL}/p/${g.id}.png`;
  const appUrl = `../app/#/plant/${g.id}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Mebuki">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1080">
<meta property="og:image:height" content="1920">
<meta property="og:url" content="${BASE_URL}/p/${g.id}.html">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${image}">
<link rel="icon" type="image/svg+xml" href="../favicon.svg">
<link rel="stylesheet" href="../style.css">
<meta name="apple-itunes-app" content="app-id=6825408150, app-argument=${BASE_URL}/p/${g.id}.html">
<script>
(function () {
  var ua = navigator.userAgent;
  var ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var android = /Android/.test(ua);
  var target = ${JSON.stringify(appUrl)};
  if (ios) target = ${JSON.stringify(APP_STORE_URL)};
  else if (android && ${JSON.stringify(PLAY_STORE_URL)}) target = ${JSON.stringify(PLAY_STORE_URL)};
  location.replace(target);
})();
</script>
</head>
<body>
<main>
<h1>${esc(g.name)}</h1>
<p class="muted">${esc(g.scientificName)}</p>
<p>${esc(g.hook)}</p>
<p><a href="${APP_STORE_URL}">Get Mebuki on the App Store</a></p>
<p><a href="${appUrl}">Open the ${esc(g.name)} guide on the web</a></p>
</main>
</body>
</html>
`;
};

const main = async () => {
  if (!existsSync(path.join(ROOT, "dist", "index.html"))) throw new Error("Run `npm run build` first.");

  rmSync(SITE, { recursive: true, force: true });
  cpSync(path.join(ROOT, "docs"), SITE, { recursive: true });
  cpSync(path.join(ROOT, "dist"), path.join(SITE, "app"), { recursive: true });
  mkdirSync(path.join(SITE, "p"), { recursive: true });

  const server = await createServer({ root: ROOT, logLevel: "error", server: { middlewareMode: true } });
  try {
    const { guides } = await server.ssrLoadModule("/src/data/guides.ts");
    for (const g of guides) {
      const thumb = path.join(ROOT, "out", `${g.id}-thumbnail.png`);
      if (!existsSync(thumb)) throw new Error(`Missing ${path.relative(ROOT, thumb)}; run npm run render:thumbnails.`);
      cpSync(thumb, path.join(SITE, "p", `${g.id}.png`));
      writeFileSync(path.join(SITE, "p", `${g.id}.html`), sharePage(g));
    }
    console.log(`Built site/ with ${guides.length} share pages.`);
  } finally {
    await server.close();
  }
};

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
