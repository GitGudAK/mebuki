#!/usr/bin/env node
// Validate plant guides in content/guides/*.json.
//
//   npm run validate:guides                         -> check every guide (no network)
//   npm run validate:guides -- --check-links        -> also request every source URL (warns only)
//   node scripts/validate-guides.mjs path/to/x.json -> check specific files or folders
//
// Two layers:
//   1. JSON Schema (content/schema/plant-guide.schema.json): fields, enums, limits,
//      and at least 2 https sources per guide.
//   2. Reference and content rules the schema can't express (see RULES below and
//      CONTRIBUTING.md).

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GUIDES_DIR = path.join(ROOT, "content/guides");
const SCHEMA_PATH = path.join(ROOT, "content/schema/plant-guide.schema.json");
const TEMPLATE_PATH = path.join(ROOT, "content/template/plant-guide.template.json");

// Authoritative publishers. A host matches if it equals an entry or is a subdomain of it.
export const AUTHORITATIVE_DOMAINS = [
  // Horticultural societies and botanic gardens
  "rhs.org.uk", // Royal Horticultural Society
  "kew.org", // Royal Botanic Gardens, Kew
  "rbge.org.uk", // Royal Botanic Garden Edinburgh
  "missouribotanicalgarden.org",
  // Animal poison control (toxicity facts)
  "aspca.org",
  // Government plant databases
  "usda.gov",
  // University extension services whose host name has no "extension" label
  "ces.ncsu.edu", // NC State Extension Plant Toolbox (plants.ces.ncsu.edu)
  "hgic.clemson.edu", // Clemson Home & Garden Information Center
  "ifas.ufl.edu", // UF/IFAS Extension (ask.ifas.ufl.edu, gardeningsolutions.ifas.ufl.edu)
  "ucanr.edu", // University of California Agriculture and Natural Resources
];

const hostOf = (url) => {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
};

const matchesDomain = (host, domain) => host === domain || host.endsWith(`.${domain}`);

/** A US university extension service: a .edu host with a label containing "extension"
 *  (extension.psu.edu, hort.extension.wisc.edu, agrilifeextension.tamu.edu) or a known
 *  extension host from the list above. */
export const isExtensionService = (host) =>
  host.endsWith(".edu") &&
  (host.split(".").some((label) => label.includes("extension")) ||
    ["ces.ncsu.edu", "hgic.clemson.edu", "ifas.ufl.edu", "ucanr.edu"].some((d) => matchesDomain(host, d)));

export const isAuthoritative = (host) =>
  isExtensionService(host) || AUTHORITATIVE_DOMAINS.some((d) => matchesDomain(host, d));

const PET_TAG = /\bpets?\b/; // "pet safe", "toxic to pets", "leaves toxic to pets"
const REQUIRED_STEP_KINDS = ["water", "light"];

const normalizeUrl = (url) => {
  try {
    const u = new URL(url);
    u.hash = "";
    return `${u.hostname.replace(/^www\./, "").toLowerCase()}${u.pathname.replace(/\/+$/, "")}${u.search}`;
  } catch {
    return url;
  }
};

/** Rules beyond the schema. Returns a list of error strings. */
export const checkRules = (guide, fileName) => {
  const errors = [];
  const expectedId = path.basename(fileName, ".json");
  if (guide.id !== expectedId) errors.push(`id "${guide.id}" must match the file name "${expectedId}.json"`);

  const sources = Array.isArray(guide.sources) ? guide.sources : [];
  const hosts = sources.map((s) => hostOf(s?.url));

  if (sources.length && !hosts.some(isAuthoritative)) {
    errors.push(
      `needs at least one source from an authoritative publisher (RHS, Kew, a university extension service, ASPCA, Missouri Botanical Garden...); got: ${[...new Set(hosts)].join(", ")}`,
    );
  }

  const tags = Array.isArray(guide.tags) ? guide.tags : [];
  const petTags = tags.filter((t) => PET_TAG.test(String(t).toLowerCase()));
  if (petTags.length && !hosts.some((h) => matchesDomain(h, "aspca.org") || isExtensionService(h))) {
    errors.push(
      `tag "${petTags[0]}" makes a pet toxicity claim, so a source from aspca.org or a university extension service is required`,
    );
  }

  const seen = new Map();
  sources.forEach((s, i) => {
    const key = normalizeUrl(s?.url ?? "");
    if (seen.has(key)) errors.push(`sources[${i}] repeats the URL of sources[${seen.get(key)}]: ${s.url}`);
    else seen.set(key, i);
  });

  const kinds = new Set((Array.isArray(guide.steps) ? guide.steps : []).map((s) => s?.kind));
  for (const kind of REQUIRED_STEP_KINDS) {
    if (!kinds.has(kind)) errors.push(`needs a "${kind}" step`);
  }
  return errors;
};

const formatAjvError = (e) => {
  const where = e.instancePath || "(root)";
  if (e.keyword === "additionalProperties") return `${where}: unknown field "${e.params.additionalProperty}"`;
  if (e.keyword === "enum") return `${where}: must be one of ${e.params.allowedValues.join(", ")}`;
  if (e.keyword === "maxLength") return `${where}: too long (max ${e.params.limit} characters)`;
  return `${where}: ${e.message}`;
};

const listJsonFiles = (target) => {
  const abs = path.resolve(target);
  if (statSync(abs).isDirectory()) {
    return readdirSync(abs)
      .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
      .sort()
      .map((f) => path.join(abs, f));
  }
  return [abs];
};

const checkLinks = async (entries) => {
  const urls = [...new Set(entries.flatMap(({ guide }) => (guide.sources ?? []).map((s) => s.url)))];
  const problems = { errors: [], warnings: [] };
  const request = async (url, method) =>
    fetch(url, {
      method,
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; mebuki-guide-validator; +https://github.com/GitGudAK/mebuki)",
        accept: "text/html,application/xhtml+xml,*/*;q=0.8",
      },
    });
  const queue = [...urls];
  const worker = async () => {
    while (queue.length) {
      const url = queue.shift();
      try {
        let res = await request(url, "HEAD");
        if (!res.ok) res = await request(url, "GET"); // some servers reject HEAD
        if (res.ok) continue;
        const msg = `${res.status} ${url}`;
        // 404/410 usually means the page moved. Some sites (rhs.org.uk for one) also
        // answer scripted requests with 404 or 403 while serving browsers fine, so link
        // problems never fail the run: open the page in a browser to confirm.
        if (res.status === 404 || res.status === 410) problems.errors.push(msg);
        else problems.warnings.push(msg);
      } catch (err) {
        problems.warnings.push(`${err.name === "TimeoutError" ? "timeout" : err.message} ${url}`);
      }
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  return { count: urls.length, ...problems };
};

const main = async () => {
  const args = process.argv.slice(2);
  const linkCheck = args.includes("--check-links");
  const targets = args.filter((a) => !a.startsWith("--"));
  const files = (targets.length ? targets : [GUIDES_DIR]).flatMap(listJsonFiles);

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(JSON.parse(readFileSync(SCHEMA_PATH, "utf8")));

  let failed = 0;
  const entries = [];
  const ids = new Map();

  for (const file of files) {
    const rel = file.startsWith(ROOT + path.sep) ? path.relative(ROOT, file) : file;
    const errors = [];
    let guide;
    try {
      guide = JSON.parse(readFileSync(file, "utf8"));
    } catch (err) {
      errors.push(`not valid JSON: ${err.message}`);
    }
    if (guide) {
      if (!validate(guide)) errors.push(...validate.errors.map(formatAjvError));
      errors.push(...checkRules(guide, file));
      if (typeof guide.id === "string") {
        if (ids.has(guide.id)) errors.push(`duplicate id "${guide.id}" (also in ${ids.get(guide.id)})`);
        else ids.set(guide.id, rel);
      }
      entries.push({ rel, guide });
    }
    if (errors.length) {
      failed++;
      console.error(`✗ ${rel}`);
      for (const e of errors) console.error(`    ${e}`);
    } else {
      console.log(`✓ ${rel}`);
    }
  }

  // Keep the contributor template in step with the schema (structure only).
  if (!targets.length) {
    const template = JSON.parse(readFileSync(TEMPLATE_PATH, "utf8"));
    if (!validate(template)) {
      failed++;
      console.error(`✗ ${path.relative(ROOT, TEMPLATE_PATH)} no longer matches the schema`);
      for (const e of validate.errors) console.error(`    ${formatAjvError(e)}`);
    }
  }

  if (linkCheck) {
    console.log("\nChecking source links...");
    const { count, errors, warnings } = await checkLinks(entries);
    for (const w of warnings) console.warn(`  warning:  ${w}`);
    for (const e of errors) console.warn(`  not found: ${e}`);
    console.log(`  ${count} URLs, ${errors.length} not found, ${warnings.length} other warnings`);
    if (errors.length || warnings.length) console.log("  Open these in a browser to confirm; some sites block scripted requests.");
  }

  console.log(`\n${files.length - failed}/${files.length} guides valid`);
  if (failed) process.exit(1);
};

main();
