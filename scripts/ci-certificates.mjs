// Run by .github/workflows/certificates.yml.
import { createSign } from "node:crypto";

const env = (k, fallback) => {
  const v = process.env[k] ?? fallback;
  if (v === undefined || v === "") throw new Error(`Missing ${k}`);
  return v;
};

const MODE = env("MODE", "list");
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

// Lists the team's signing certificates. With MODE=clean, revokes the development certificates
// Xcode creates on each CI run ("Created via API"); App Store and TestFlight builds are unaffected,
// and Xcode makes a fresh one on the next run. Distribution certificates are never touched.
const certs = (await get("/v1/certificates?limit=200&fields[certificates]=name,displayName,certificateType,expirationDate,platform")).data;
const throwaway = (c) => /DEVELOPMENT/.test(c.attributes.certificateType) && /Created via API/i.test(`${c.attributes.name} ${c.attributes.displayName}`);
for (const c of certs) {
  const a = c.attributes;
  console.log(`${throwaway(c) ? "ci " : "   "} ${a.certificateType.padEnd(22)} ${a.displayName ?? a.name}  expires ${a.expirationDate?.slice(0, 10)}`);
}
const stale = certs.filter(throwaway);
console.log(`${certs.length} certificates, ${stale.length} created by CI runs`);
if (MODE === "clean") {
  for (const c of stale) {
    await call("DELETE", `/v1/certificates/${c.id}`);
    console.log(`revoked ${c.attributes.displayName ?? c.attributes.name}`);
  }
}

// With MODE=create and CSR (a certificate signing request, base64 without PEM headers),
// creates the one Apple Distribution certificate CI signs with, and an App Store
// provisioning profile for it. Prints both; neither is secret (the private key never leaves
// the machine that made the CSR).
if (MODE === "create") {
  const cert = (
    await call("POST", "/v1/certificates", {
      data: { type: "certificates", attributes: { certificateType: "DISTRIBUTION", csrContent: env("CSR") } },
    })
  ).data;
  console.log(`created certificate ${cert.attributes.displayName ?? cert.attributes.name} (${cert.id}), expires ${cert.attributes.expirationDate}`);
  const bundle = (await get(`/v1/bundleIds?filter[identifier]=${env("BUNDLE_ID", "com.gitgudak.mebuki")}`)).data[0];
  const NAME = "Mebuki App Store";
  for (const p of (await get(`/v1/profiles?filter[name]=${encodeURIComponent(NAME)}`)).data) {
    await call("DELETE", `/v1/profiles/${p.id}`);
  }
  const profile = (
    await call("POST", "/v1/profiles", {
      data: {
        type: "profiles",
        attributes: { name: NAME, profileType: "IOS_APP_STORE" },
        relationships: {
          bundleId: { data: { type: "bundleIds", id: bundle.id } },
          certificates: { data: [{ type: "certificates", id: cert.id }] },
        },
      },
    })
  ).data;
  console.log(`created profile ${NAME} (${profile.attributes.uuid})`);
  console.log(`CERTIFICATE_DER_BASE64=${cert.attributes.certificateContent}`);
  console.log(`PROFILE_BASE64=${profile.attributes.profileContent}`);
}
