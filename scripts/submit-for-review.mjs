// Prepares the App Store version for review and, with MODE=submit, submits it.
// Talks to the App Store Connect API directly; run by .github/workflows/app-review.yml.
//
// Env: ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_P8 (the .p8 contents), BUNDLE_ID, APP_VERSION,
//      BUILD_NUMBER, MODE (check | submit), and for submit the App Review contact:
//      REVIEW_FIRST_NAME, REVIEW_LAST_NAME, REVIEW_PHONE, REVIEW_EMAIL.
//
// check  reads everything and reports what is missing. It changes nothing.
// notes  only saves the review contact and the notes in fastlane/app-review-notes.txt.
// submit sets the build, a free price in every territory, the age rating (all "none"),
//        the content rights answer and the review contact, then submits for review.
//
// App Privacy ("data not collected") has no API; publish it on the website first.

import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";

const env = (k, fallback) => {
  const v = process.env[k] ?? fallback;
  if (v === undefined || v === "") throw new Error(`Missing ${k}`);
  return v;
};

const MODE = env("MODE", "check");
const BUNDLE_ID = env("BUNDLE_ID", "com.gitgudak.mebuki");
const APP_VERSION = env("APP_VERSION", "1.0");
const BUILD_NUMBER = env("BUILD_NUMBER");
const API = "https://api.appstoreconnect.apple.com";

const b64url = (buf) => Buffer.from(buf).toString("base64url");
const token = () => {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "ES256", kid: env("ASC_KEY_ID"), typ: "JWT" }));
  const body = b64url(JSON.stringify({ iss: env("ASC_ISSUER_ID"), iat: now, exp: now + 15 * 60, aud: "appstoreconnect-v1" }));
  const sig = createSign("SHA256").update(`${head}.${body}`).sign({ key: env("ASC_KEY_P8"), dsaEncoding: "ieee-p1363" });
  return `${head}.${body}.${b64url(sig)}`;
};

const call = async (method, path, payload, { allow404 = false } = {}) => {
  const res = await fetch(API + path, {
    method,
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  if (allow404 && res.status === 404) return null;
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}\n${text}`);
  return text ? JSON.parse(text) : {};
};
const get = (path, opts) => call("GET", path, undefined, opts);

const report = [];
const note = (ok, line) => {
  report.push(`${ok ? "✓" : "✗"} ${line}`);
  console.log(`${ok ? "✓" : "✗"} ${line}`);
};
const submitting = MODE === "submit";

// --- app, version, build
const app = (await get(`/v1/apps?filter[bundleId]=${BUNDLE_ID}`)).data[0];
if (!app) throw new Error(`No app with bundle id ${BUNDLE_ID}`);
note(true, `App: ${app.attributes.name} (${app.id})`);

const versions = (await get(`/v1/apps/${app.id}/appStoreVersions?filter[platform]=IOS&limit=50`)).data;
const version = versions.find((v) => v.attributes.versionString === APP_VERSION);
if (!version) throw new Error(`No App Store version ${APP_VERSION}`);
note(true, `Version ${APP_VERSION}: ${version.attributes.appStoreState}`);

const build = (
  await get(`/v1/builds?filter[app]=${app.id}&filter[version]=${BUILD_NUMBER}&filter[preReleaseVersion.version]=${APP_VERSION}&limit=1`)
).data[0];
note(!!build && build.attributes.processingState === "VALID", `Build ${BUILD_NUMBER}: ${build ? build.attributes.processingState : "not found"}`);
if (!build || build.attributes.processingState !== "VALID") {
  if (submitting) throw new Error("Build is not processed yet; try again later.");
}

const attached = (await get(`/v1/appStoreVersions/${version.id}/relationships/build`)).data;
note(attached?.id === build?.id, `Build attached to version: ${attached ? (attached.id === build?.id ? "yes" : "a different build") : "no"}`);
if (submitting && attached?.id !== build.id) {
  await call("PATCH", `/v1/appStoreVersions/${version.id}/relationships/build`, { data: { type: "builds", id: build.id } });
  note(true, `  → attached build ${BUILD_NUMBER}`);
}

if (build && build.attributes.usesNonExemptEncryption == null) {
  note(false, "Export compliance not answered");
  if (submitting) {
    await call("PATCH", `/v1/builds/${build.id}`, { data: { type: "builds", id: build.id, attributes: { usesNonExemptEncryption: false } } });
    note(true, "  → set: no non-exempt encryption");
  }
} else if (build) {
  note(true, `Export compliance: uses non-exempt encryption = ${build.attributes.usesNonExemptEncryption}`);
}

// --- price (free) and availability (every territory)
const manualPrices = await get(`/v1/appPriceSchedules/${app.id}/manualPrices?limit=1`, { allow404: true });
const hasPrice = !!manualPrices?.data?.length;
note(hasPrice, `Price: ${hasPrice ? "set" : "not set"}`);
if (submitting && !hasPrice) {
  const points = (await get(`/v1/apps/${app.id}/appPricePoints?filter[territory]=USA&limit=200`)).data;
  const free = points.find((p) => Number(p.attributes.customerPrice) === 0);
  if (!free) throw new Error("No free price point found");
  await call("POST", "/v1/appPriceSchedules", {
    data: {
      type: "appPriceSchedules",
      relationships: {
        app: { data: { type: "apps", id: app.id } },
        baseTerritory: { data: { type: "territories", id: "USA" } },
        manualPrices: { data: [{ type: "appPrices", id: "${free}" }] },
      },
    },
    included: [
      {
        type: "appPrices",
        id: "${free}",
        attributes: { startDate: null },
        relationships: { appPricePoint: { data: { type: "appPricePoints", id: free.id } } },
      },
    ],
  });
  note(true, "  → set price: free");
}

const availability = await get(`/v1/apps/${app.id}/appAvailabilityV2`, { allow404: true });
note(!!availability?.data, `Availability: ${availability?.data ? "set" : "not set"}`);
if (submitting && !availability?.data) {
  const territories = (await get("/v1/territories?limit=200")).data.map((t) => t.id);
  await call("POST", "/v2/appAvailabilities", {
    data: {
      type: "appAvailabilities",
      attributes: { availableInNewTerritories: true },
      relationships: {
        app: { data: { type: "apps", id: app.id } },
        territoryAvailabilities: { data: territories.map((t) => ({ type: "territoryAvailabilities", id: `\${${t}}` })) },
      },
    },
    included: territories.map((t) => ({
      type: "territoryAvailabilities",
      id: `\${${t}}`,
      attributes: { available: true },
      relationships: { territory: { data: { type: "territories", id: t } } },
    })),
  });
  note(true, `  → available in all ${territories.length} territories`);
}

// --- age rating: Mebuki has none of these
const ENUM_NONE = [
  "alcoholTobaccoOrDrugUseOrReferences", "contests", "gamblingSimulated", "gunsOrOtherWeapons",
  "horrorOrFearThemes", "matureOrSuggestiveThemes", "medicalOrTreatmentInformation", "profanityOrCrudeHumor",
  "sexualContentGraphicAndNudity", "sexualContentOrNudity", "violenceCartoonOrFantasy", "violenceRealistic",
  "violenceRealisticProlongedGraphicOrSadistic",
];
const BOOL_FALSE = [
  "gambling", "unrestrictedWebAccess", "lootBox", "messagingAndChat", "parentalControls", "ageAssurance",
  "userGeneratedContent", "advertising", "healthOrWellnessTopics", "seventeenPlus", "socialMedia",
  "socialMediaAgeRestricted",
];
// Optional, for other regions' ratings or a developer's own policy page.
const OPTIONAL = ["kidsAgeBand", "gracRatingClassificationNumber", "developerAgeRatingInfoUrl", "koreaAgeRatingOverride"];
const infos = (await get(`/v1/apps/${app.id}/appInfos`)).data;
const info = infos.find((i) => !["READY_FOR_DISTRIBUTION", "READY_FOR_SALE"].includes(i.attributes.appStoreState ?? i.attributes.state)) ?? infos[0];
const rating = (await get(`/v1/appInfos/${info.id}/ageRatingDeclaration`)).data;
const unanswered = Object.entries(rating.attributes).filter(([, v]) => v === null).map(([k]) => k);
const required = unanswered.filter((k) => !OPTIONAL.includes(k) && !k.startsWith("ageRatingOverride"));
const unknown = required.filter((k) => !ENUM_NONE.includes(k) && !BOOL_FALSE.includes(k));
note(required.length === 0, `Age rating: ${required.length ? `${required.length} unanswered` : "answered"}`);
if (unknown.length) note(false, `  Questions this script does not know: ${unknown.join(", ")}`);
if (submitting) {
  const attributes = {};
  for (const k of Object.keys(rating.attributes)) {
    if (ENUM_NONE.includes(k)) attributes[k] = "NONE";
    if (BOOL_FALSE.includes(k)) attributes[k] = false;
  }
  await call("PATCH", `/v1/ageRatingDeclarations/${rating.id}`, { data: { type: "ageRatingDeclarations", id: rating.id, attributes } });
  note(true, "  → answered every question with none / no (4+)");
}

// --- content rights: every drawing and word in the app is our own
note(!!app.attributes.contentRightsDeclaration, `Content rights: ${app.attributes.contentRightsDeclaration ?? "not answered"}`);
if (submitting && !app.attributes.contentRightsDeclaration) {
  await call("PATCH", `/v1/apps/${app.id}`, {
    data: { type: "apps", id: app.id, attributes: { contentRightsDeclaration: "DOES_NOT_USE_THIRD_PARTY_CONTENT" } },
  });
  note(true, "  → does not use third-party content");
}

// --- App Review contact and notes (the notes live in fastlane/app-review-notes.txt)
const NOTES = readFileSync(new URL("../fastlane/app-review-notes.txt", import.meta.url), "utf8").trim().slice(0, 4000);
const detail = (await get(`/v1/appStoreVersions/${version.id}/appStoreReviewDetail`, { allow404: true }))?.data;
note(!!detail?.attributes?.contactPhone, `Review contact: ${detail?.attributes?.contactPhone ? "set" : "not set"}`);
if (submitting || MODE === "notes") {
  const attributes = {
    contactFirstName: env("REVIEW_FIRST_NAME"),
    contactLastName: env("REVIEW_LAST_NAME"),
    contactPhone: env("REVIEW_PHONE"),
    contactEmail: env("REVIEW_EMAIL"),
    demoAccountRequired: false,
    notes: NOTES,
  };
  if (detail) {
    await call("PATCH", `/v1/appStoreReviewDetails/${detail.id}`, { data: { type: "appStoreReviewDetails", id: detail.id, attributes } });
  } else {
    await call("POST", "/v1/appStoreReviewDetails", {
      data: { type: "appStoreReviewDetails", attributes, relationships: { appStoreVersion: { data: { type: "appStoreVersions", id: version.id } } } },
    });
  }
  note(true, "  → review contact and notes saved");
}

note(true, "App Privacy: no API; must be published on the website (Data Not Collected)");

// --- submit
if (submitting) {
  const open = (await get(`/v1/reviewSubmissions?filter[app]=${app.id}&filter[state]=READY_FOR_REVIEW&limit=1`)).data[0];
  const submission =
    open ??
    (
      await call("POST", "/v1/reviewSubmissions", {
        data: { type: "reviewSubmissions", attributes: { platform: "IOS" }, relationships: { app: { data: { type: "apps", id: app.id } } } },
      })
    ).data;
  const items = (await get(`/v1/reviewSubmissions/${submission.id}/items`)).data;
  if (!items.length) {
    await call("POST", "/v1/reviewSubmissionItems", {
      data: {
        type: "reviewSubmissionItems",
        relationships: {
          reviewSubmission: { data: { type: "reviewSubmissions", id: submission.id } },
          appStoreVersion: { data: { type: "appStoreVersions", id: version.id } },
        },
      },
    });
  }
  await call("PATCH", `/v1/reviewSubmissions/${submission.id}`, {
    data: { type: "reviewSubmissions", id: submission.id, attributes: { submitted: true } },
  });
  note(true, `Submitted version ${APP_VERSION} (build ${BUILD_NUMBER}) for App Review`);
}

if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFileSync } = await import("node:fs");
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## App Review (${MODE})\n\n${report.map((l) => `- ${l}`).join("\n")}\n`);
}
