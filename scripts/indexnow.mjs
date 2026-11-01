#!/usr/bin/env node
/**
 * IndexNow submission for the published storefront.
 *
 * Why: Google discovers changes through the sitemap on its own schedule; IndexNow pushes the same
 * URL list to Bing (and the endpoints that share its feed) the moment a deploy lands. Vyrax has 117
 * indexable URLs and almost no click history, so hours of crawl lag on a fresh sitemap lastmod is
 * the difference between a page being eligible and being invisible.
 *
 * What it does:
 *   1. proves the host owns the key: GET <site>/<key>.txt and require it to contain the key. Without
 *      that check the submission is accepted and then silently discarded on key validation, which
 *      looks like success in the logs and teaches nobody anything.
 *   2. takes the URL list from the live sitemap by default, so what is submitted is exactly what is
 *      published, not what a local build happened to contain.
 *   3. POSTs { host, key, keyLocation, urlList } to https://api.indexnow.org/indexnow.
 *
 * Response codes worth knowing (protocol, not Bing-specific):
 *   200 accepted, 202 accepted but key not yet validated, 400 bad request, 403 key not valid,
 *   422 URLs do not belong to the host or the key does not match, 429 too many requests.
 *
 * Usage:
 *   node scripts/indexnow.mjs                 # submit the live sitemap
 *   node scripts/indexnow.mjs --dry-run       # print what would be sent, send nothing
 *   node scripts/indexnow.mjs --url /shop --url /product/bpc-157
 *   node scripts/indexnow.mjs --site https://staging.example.com
 *
 * Exit codes: 0 submitted (or dry-run), 1 anything that means the submission did not land.
 * scripts/deploy.sh calls this after a successful deploy and does not fail the deploy on it.
 */
import { readdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_SITE = "https://vyraxlabs.co.uk";
const ENDPOINT = "https://api.indexnow.org/indexnow";
const KEY_NAME = /^[0-9a-f]{8,128}$/i;

/** The key is a public file in public/, not a secret: the protocol requires it to be fetchable. */
export function findKey(pubDir = resolve(ROOT, "public")) {
  const hits = readdirSync(pubDir).filter((f) => f.endsWith(".txt") && KEY_NAME.test(f.slice(0, -4)));
  const files = hits.filter((f) => {
    const key = f.slice(0, -4);
    return readFileSync(resolve(pubDir, f), "utf8").trim() === key;
  });
  if (files.length !== 1) {
    throw new Error(
      `expected exactly one <key>.txt containing its own name in ${pubDir}, found ${files.length}` +
        (files.length ? `: ${files.join(", ")}` : " (add public/<key>.txt with the key inside)")
    );
  }
  return files[0].slice(0, -4);
}

export function sitemapUrls(xml) {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
}

/** Absolute URLs only, same host as the site, deduplicated, order preserved. */
export function normalise(site, paths) {
  const origin = new URL(site).origin;
  const seen = new Set();
  const out = [];
  for (const raw of paths) {
    const url = new URL(raw, origin);
    if (url.origin !== origin) continue;
    url.hash = "";
    const href = url.toString();
    if (seen.has(href)) continue;
    seen.add(href);
    out.push(href);
  }
  return out;
}

export function interpret(status) {
  if (status === 200) return { ok: true, note: "accepted" };
  if (status === 202) return { ok: true, note: "accepted, key pending validation" };
  if (status === 400) return { ok: false, note: "bad request (malformed payload)" };
  if (status === 403) return { ok: false, note: "key not valid" };
  if (status === 422) return { ok: false, note: "URLs do not belong to the host, or key mismatch" };
  if (status === 429) return { ok: false, note: "too many requests, retry later" };
  return { ok: false, note: `unexpected status ${status}` };
}

export function parseArgs(argv) {
  const opts = { site: DEFAULT_SITE, urls: [], dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--site") opts.site = argv[++i];
    else if (a === "--url") opts.urls.push(argv[++i]);
    else throw new Error(`unknown argument ${a}`);
  }
  return opts;
}

async function main(argv) {
  const opts = parseArgs(argv);
  const site = opts.site.replace(/\/$/, "");
  const key = process.env.INDEXNOW_KEY || findKey();
  const keyLocation = `${site}/${key}.txt`;

  // 1. Prove the key is published before claiming a submission.
  const keyRes = await fetch(keyLocation, { headers: { "user-agent": "VyraxLabs-IndexNow/1.0" } });
  const served = (await keyRes.text()).trim();
  if (keyRes.status !== 200 || served !== key) {
    console.error(`key check failed: ${keyLocation} -> ${keyRes.status} "${served.slice(0, 60)}"`);
    return 1;
  }

  // 2. The URL list is the live sitemap unless explicit URLs were given.
  let paths = opts.urls;
  if (paths.length === 0) {
    const smRes = await fetch(`${site}/sitemap.xml`, { headers: { "user-agent": "VyraxLabs-IndexNow/1.0" } });
    if (smRes.status !== 200) {
      console.error(`sitemap fetch failed: ${site}/sitemap.xml -> ${smRes.status}`);
      return 1;
    }
    paths = sitemapUrls(await smRes.text());
  }
  const urlList = normalise(site, paths);
  if (urlList.length === 0) {
    console.error("nothing to submit: no URLs from sitemap and none passed with --url");
    return 1;
  }

  const payload = { host: new URL(site).host, key, keyLocation, urlList };
  if (opts.dryRun) {
    console.log(`dry run: would submit ${urlList.length} URLs to ${ENDPOINT}`);
    for (const u of urlList) console.log(`  ${u}`);
    return 0;
  }

  // 3. Submit.
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });
  const { ok, note } = interpret(res.status);
  console.log(`IndexNow ${res.status} ${note}: ${urlList.length} URLs for ${payload.host}`);
  if (!ok) console.error(await res.text().catch(() => ""));
  return ok ? 0 : 1;
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => {
      console.error(`indexnow failed: ${err.message}`);
      process.exit(1);
    }
  );
}
