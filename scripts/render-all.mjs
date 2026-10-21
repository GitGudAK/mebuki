#!/usr/bin/env node
// Render every plant-guide composition to out/<id>.mp4, one after another.
//
//   npm run render:all                    -> render everything
//   npm run render:all -- pothos monstera -> only these ids
//   npm run render:all -- --list          -> print ids and exit
//
// Extra flags after "--" that start with "--" (other than --list) are passed
// straight to `remotion render`, e.g. `npm run render:all -- --concurrency=2`.

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENTRY = process.env.REMOTION_ENTRY ?? "src/remotion/index.ts";
const OUT_DIR = "out";
const NPX = process.platform === "win32" ? "npx.cmd" : "npx";

const args = process.argv.slice(2);
const listOnly = args.includes("--list");
const passthrough = args.filter((a) => a.startsWith("--") && a !== "--list");
const filters = args.filter((a) => !a.startsWith("--"));

/** Run a command; resolve with stdout (when captured) or reject on non-zero exit. */
const run = (cmdArgs, { capture = false } = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(NPX, cmdArgs, {
      cwd: ROOT,
      stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
      shell: process.platform === "win32",
    });
    let stdout = "";
    child.stdout?.on("data", (d) => (stdout += d));
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve(stdout) : reject(new Error(`npx ${cmdArgs.join(" ")} exited with code ${code}`)),
    );
  });

const getCompositionIds = async () => {
  // With --quiet, `remotion compositions` prints the ids space-separated on the last stdout line.
  const stdout = await run(["remotion", "compositions", ENTRY, "--quiet"], { capture: true });
  const lastLine = stdout.trim().split(/\r?\n/).filter(Boolean).pop() ?? "";
  const ids = lastLine.split(/\s+/).filter((id) => /^[A-Za-z0-9-]+$/.test(id));
  if (ids.length === 0) throw new Error(`Could not parse composition ids from:\n${stdout}`);
  return ids;
};

const main = async () => {
  console.log(`Looking up compositions in ${ENTRY}…`);
  const allIds = await getCompositionIds();

  const unknown = filters.filter((f) => !allIds.includes(f));
  if (unknown.length) {
    console.error(`Unknown composition id(s): ${unknown.join(", ")}`);
    console.error(`Available: ${allIds.join(", ")}`);
    process.exit(1);
  }
  const ids = filters.length ? filters : allIds;

  if (listOnly) {
    console.log(ids.join("\n"));
    return;
  }

  mkdirSync(path.join(ROOT, OUT_DIR), { recursive: true });
  const failed = [];
  const started = Date.now();

  for (const [i, id] of ids.entries()) {
    const out = `${OUT_DIR}/${id}.mp4`;
    console.log(`\n[${i + 1}/${ids.length}] Rendering ${id} -> ${out}`);
    try {
      await run(["remotion", "render", ENTRY, id, out, ...passthrough]);
    } catch (err) {
      console.error(`  ✗ ${id}: ${err.message}`);
      failed.push(id);
    }
  }

  const secs = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`\nDone in ${secs}s: ${ids.length - failed.length} rendered, ${failed.length} failed.`);
  if (failed.length) {
    console.error(`Failed: ${failed.join(", ")}`);
    process.exit(1);
  }
};

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
