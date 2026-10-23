// Run by .github/workflows/testflight-tester.yml.
import { createSign } from "node:crypto";
import { appendFileSync } from "node:fs";

const env = (k, fallback) => {
  const v = process.env[k] ?? fallback;
  if (v === undefined || v === "") throw new Error(`Missing ${k}`);
  return v;
};

const BUNDLE_ID = env("BUNDLE_ID", "com.gitgudak.mebuki");
const BUILD_NUMBER = env("BUILD_NUMBER");
const GROUP = env("GROUP", "Friends");
const EMAIL = env("TESTER_EMAIL");
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

// Adds an external TestFlight tester to a beta group and gives that group a build. Apple emails the
// invite once the build has passed Beta App Review; this submits the build for that review when
// the Test Information (beta contact, feedback email, description) is complete, and otherwise
// reports what is missing.
const say = (line) => {
  console.log(line);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `- ${line}\n`);
};

const app = (await get(`/v1/apps?filter[bundleId]=${BUNDLE_ID}`)).data[0];
const groups = (await get(`/v1/betaGroups?filter[app]=${app.id}&limit=50`)).data;
let group = groups.find((g) => g.attributes.name === GROUP);
if (!group) {
  group = (
    await call("POST", "/v1/betaGroups", {
      data: { type: "betaGroups", attributes: { name: GROUP }, relationships: { app: { data: { type: "apps", id: app.id } } } },
    })
  ).data;
  say(`Created external group ${GROUP}`);
}
say(`Group: ${GROUP} (${group.attributes.isInternalGroup ? "internal" : "external"})`);

const build = (await get(`/v1/builds?filter[app]=${app.id}&filter[version]=${BUILD_NUMBER}&limit=1`)).data[0];
if (!build) throw new Error(`Build ${BUILD_NUMBER} not found`);
say(`Build ${BUILD_NUMBER}: ${build.attributes.processingState}`);
const inGroup = (await get(`/v1/betaGroups/${group.id}/builds?limit=200`)).data.some((b) => b.id === build.id);
if (!inGroup) {
  await call("POST", `/v1/betaGroups/${group.id}/relationships/builds`, { data: [{ type: "builds", id: build.id }] });
  say(`Added build ${BUILD_NUMBER} to ${GROUP}`);
} else say(`Build ${BUILD_NUMBER} already in ${GROUP}`);

const existing = (await get(`/v1/betaTesters?filter[email]=${encodeURIComponent(EMAIL)}&filter[apps]=${app.id}&limit=1`)).data[0];
if (existing) {
  await call("POST", `/v1/betaGroups/${group.id}/relationships/betaTesters`, { data: [{ type: "betaTesters", id: existing.id }] });
  say(`Tester ${EMAIL} already known; added to ${GROUP}`);
} else {
  await call("POST", "/v1/betaTesters", {
    data: {
      type: "betaTesters",
      attributes: { email: EMAIL },
      relationships: { betaGroups: { data: [{ type: "betaGroups", id: group.id }] } },
    },
  });
  say(`Added tester ${EMAIL} to ${GROUP}`);
}

// Test Information: the beta contact comes from the same secrets as the App Review contact.
let detail = (await get(`/v1/apps/${app.id}/betaAppReviewDetail`)).data;
const contact = {
  contactFirstName: process.env.REVIEW_FIRST_NAME,
  contactLastName: process.env.REVIEW_LAST_NAME,
  contactPhone: process.env.REVIEW_PHONE,
  contactEmail: process.env.REVIEW_EMAIL,
};
if (Object.values(contact).every(Boolean)) {
  detail = (
    await call("PATCH", `/v1/betaAppReviewDetails/${detail.id}`, {
      data: {
        type: "betaAppReviewDetails",
        id: detail.id,
        attributes: {
          ...contact,
          demoAccountRequired: false,
          notes: "No account or sign-in. Browse the plant guides, play a guide, save a plant with the heart, and share it.",
        },
      },
    })
  ).data;
  say("Saved the beta contact");
}
const DESCRIPTION =
  "Mebuki is a free, open-source plant care guide. Each of its 42 plants has a short animated guide " +
  "with chapters for light, water, soil and more, and every tip cites its source.";
let locs = (await get(`/v1/apps/${app.id}/betaAppLocalizations`)).data;
let loc = locs.find((l) => l.attributes.locale?.startsWith("en")) ?? locs[0];
if (contact.contactEmail) {
  const attributes = { feedbackEmail: contact.contactEmail, description: DESCRIPTION };
  if (loc) {
    loc = (await call("PATCH", `/v1/betaAppLocalizations/${loc.id}`, { data: { type: "betaAppLocalizations", id: loc.id, attributes } })).data;
  } else {
    loc = (
      await call("POST", "/v1/betaAppLocalizations", {
        data: { type: "betaAppLocalizations", attributes: { ...attributes, locale: "en-US" }, relationships: { app: { data: { type: "apps", id: app.id } } } },
      })
    ).data;
  }
  say("Saved the feedback email and beta description");
}
const d = detail.attributes;
const missing = ["contactFirstName", "contactLastName", "contactPhone", "contactEmail"].filter((k) => !d[k]);
if (!loc?.attributes.feedbackEmail) missing.push("feedbackEmail");
if (!loc?.attributes.description) missing.push("beta description");
const review = (await get(`/v1/builds/${build.id}/betaAppReviewSubmission`, { allow404: true }))?.data;
if (review) {
  say(`Beta App Review for build ${BUILD_NUMBER}: ${review.attributes.betaReviewState}`);
} else if (missing.length) {
  say(`Not submitted for Beta App Review yet. Test Information is missing: ${missing.join(", ")}`);
} else {
  await call("POST", "/v1/betaAppReviewSubmissions", {
    data: { type: "betaAppReviewSubmissions", relationships: { build: { data: { type: "builds", id: build.id } } } },
  });
  say(`Submitted build ${BUILD_NUMBER} for Beta App Review; the invite goes out once Apple approves it`);
}
