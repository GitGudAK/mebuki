#!/usr/bin/env node
// Render plant guides to MP4 with open-source tools only: Vite serves render.html,
// Playwright's Chromium screenshots every frame, ffmpeg encodes them to H.264.
//
//   npm run render                         -> every guide to out/<id>.mp4
//   npm run render -- golden-pothos mint   -> only these ids
//   npm run render -- --thumbnail          -> cover images to out/<id>-thumbnail.png
//   npm run render -- --brand              -> iOS app icon + launch screen into ios/App
//   npm run render -- --list               -> print ids and exit
//   npm run render -- --concurrency=6      -> browser tabs per video (default: half your CPU cores)

import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createServer } from "vite";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "out");
const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;

const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
const listOnly = Boolean(flag("list"));
const thumbnail = Boolean(flag("thumbnail"));
const brand = Boolean(flag("brand"));
const concurrency = Math.max(1, Number(flag("concurrency")?.split("=")[1]) || Math.ceil(os.cpus().length / 2));
const filters = args.filter((a) => !a.startsWith("--"));

const ffmpeg = (ffArgs) =>
  new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", ffArgs, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", (err) =>
      reject(err.code === "ENOENT" ? new Error("ffmpeg not found on PATH (brew install ffmpeg)") : err),
    );
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg failed:\n${stderr.slice(-2000)}`))));
  });

const openRenderPage = async (browser, baseUrl, query, viewport = { width: WIDTH, height: HEIGHT }) => {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  let pageError;
  page.on("pageerror", (err) => (pageError ??= err));
  await page.goto(`${baseUrl}/render.html?${query}`);
  await Promise.race([
    page.waitForFunction(() => window.mebukiRender !== undefined, null, { timeout: 60_000 }),
    new Promise((_, reject) => page.on("pageerror", reject)),
  ]);
  if (pageError) throw pageError;
  return page;
};

const guideQuery = (id) => `id=${encodeURIComponent(id)}${thumbnail ? "&thumbnail" : ""}`;

const captureFrame = async (page, frame, file) => {
  const { width, height } = await page.evaluate(async (f) => {
    await window.mebukiRender.setFrame(f);
    return { width: window.mebukiRender.width, height: window.mebukiRender.height };
  }, frame);
  await page.screenshot({ path: file, type: "png", clip: { x: 0, y: 0, width, height } });
};

const renderVideo = async (browser, baseUrl, id) => {
  const first = await openRenderPage(browser, baseUrl, guideQuery(id));
  const total = await first.evaluate(() => window.mebukiRender.durationInFrames);
  const pages = [first];
  for (let i = 1; i < Math.min(concurrency, total); i++) pages.push(await openRenderPage(browser, baseUrl, guideQuery(id)));

  const tmp = mkdtempSync(path.join(os.tmpdir(), `mebuki-${id}-`));
  try {
    let next = 0;
    let done = 0;
    const started = Date.now();
    await Promise.all(
      pages.map(async (page) => {
        while (next < total) {
          const frame = next++;
          await captureFrame(page, frame, path.join(tmp, `frame-${String(frame).padStart(5, "0")}.png`));
          done++;
          if (done % 30 === 0 || done === total) {
            process.stdout.write(`\r  frames ${done}/${total} (${((Date.now() - started) / 1000).toFixed(0)}s)`);
          }
        }
      }),
    );
    process.stdout.write("\n  encoding…\n");
    const out = path.join(OUT_DIR, `${id}.mp4`);
    // prettier-ignore
    await ffmpeg([
      "-y",
      "-framerate", String(FPS),
      "-i", path.join(tmp, "frame-%05d.png"),
      "-c:v", "libx264",
      "-preset", "slow",
      "-crf", "16",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      out,
    ]);
    return out;
  } finally {
    await Promise.all(pages.map((p) => p.close()));
    rmSync(tmp, { recursive: true, force: true });
  }
};

const renderThumbnail = async (browser, baseUrl, id) => {
  const page = await openRenderPage(browser, baseUrl, guideQuery(id));
  try {
    const out = path.join(OUT_DIR, `${id}-thumbnail.png`);
    await captureFrame(page, 0, out);
    return out;
  } finally {
    await page.close();
  }
};

// App Store icons must be opaque, so every brand PNG is re-encoded as RGB without alpha.
const BRAND_ASSETS = [
  { asset: "icon", size: 1024, outputs: ["ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"] },
  {
    asset: "splash",
    size: 2732,
    outputs: ["", "-1", "-2"].map((s) => `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732${s}.png`),
  },
];

const renderBrand = async (browser, baseUrl) => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), "mebuki-brand-"));
  try {
    for (const { asset, size, outputs } of BRAND_ASSETS) {
      const page = await openRenderPage(browser, baseUrl, `brand=${asset}`, { width: size, height: size });
      const raw = path.join(tmp, `${asset}.png`);
      await captureFrame(page, 0, raw);
      await page.close();
      for (const out of outputs) {
        await ffmpeg(["-y", "-i", raw, "-pix_fmt", "rgb24", path.join(ROOT, out)]);
        console.log(`  ✓ ${out}`);
      }
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
};

const main = async () => {
  const server = await createServer({ root: ROOT, logLevel: "error", server: { port: 0, host: "127.0.0.1" } });
  await server.listen();
  const baseUrl = server.resolvedUrls.local[0].replace(/\/$/, "");
  let browser;
  try {
    if (brand) {
      browser = await chromium.launch();
      await renderBrand(browser, baseUrl);
      return;
    }

    const { guides } = await server.ssrLoadModule("/src/data/guides.ts");
    const allIds = guides.map((g) => g.id);
    const unknown = filters.filter((f) => !allIds.includes(f));
    if (unknown.length) {
      throw new Error(`Unknown guide id(s): ${unknown.join(", ")}\nAvailable: ${allIds.join(", ")}`);
    }
    const ids = filters.length ? filters : allIds;
    if (listOnly) {
      console.log(ids.join("\n"));
      return;
    }

    mkdirSync(OUT_DIR, { recursive: true });
    browser = await chromium.launch();
    const failed = [];
    const started = Date.now();
    for (const [i, id] of ids.entries()) {
      console.log(`[${i + 1}/${ids.length}] ${id}`);
      try {
        const out = thumbnail ? await renderThumbnail(browser, baseUrl, id) : await renderVideo(browser, baseUrl, id);
        console.log(`  ✓ ${path.relative(ROOT, out)}`);
      } catch (err) {
        console.error(`  ✗ ${id}: ${err.message}`);
        failed.push(id);
      }
    }
    const secs = ((Date.now() - started) / 1000).toFixed(1);
    console.log(`\nDone in ${secs}s: ${ids.length - failed.length} rendered, ${failed.length} failed.`);
    if (failed.length) process.exitCode = 1;
  } finally {
    await browser?.close();
    await server.close();
  }
};

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
