#!/usr/bin/env node
/**
 * Regenerate src/data/sitemap-lastmod.json from git history.
 *
 * Why: sitemap lastmod was a single hand-bumped constant (CONTENT_UPDATED), so it was wrong for
 * every page except the one that was last edited, and it went stale without anyone noticing. The
 * first fix dated each page group from the newest commit touching the whole source file, which
 * meant editing one compound's copy moved the lastmod of every other product page. Google only
 * treats lastmod as a signal while it is trustworthy, so both a wrong date and a needlessly wide
 * one cost credibility.
 *
 * What it does now: two levels of date.
 *   files   - shared source files (route templates, catalog helpers). A commit here really does
 *             change every page in that group, so its date legitimately applies to all of them.
 *   records - one date per catalogue record, taken from git blame over that record's own line
 *             range, so editing Retatrutide moves only the Retatrutide URLs.
 *
 * Anything with no date (untracked file, shallow clone, no git) is left out of the map and the
 * sitemap omits <lastmod> for that URL rather than claiming a date it cannot support.
 *
 * Run by `prebuild`. The output is deterministic for a given git history (no build timestamp), so
 * the tracked JSON reproduces byte for byte; `--check` exits 1 if the file on disk is stale.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(root, "src/data/sitemap-lastmod.json");
const check = process.argv.includes("--check");

/** Shared source files whose commit date drives a page group's lastmod. Keep in sync with the
 *  FILES constants in src/lib/sitemap-entries.ts. */
const SHARED_FILES = [
  "src/routes/index.tsx",
  "src/routes/shop.tsx",
  "src/routes/about.tsx",
  "src/routes/calculator.tsx",
  "src/routes/contact.tsx",
  "src/routes/cookies.tsx",
  "src/routes/faq.tsx",
  "src/routes/lab-reports.tsx",
  "src/routes/privacy.tsx",
  "src/routes/research-use-policy.tsx",
  "src/routes/reconstitution.tsx",
  "src/routes/returns.tsx",
  "src/routes/shipping.tsx",
  "src/routes/terms.tsx",
  "src/routes/guides.index.tsx",
  "src/routes/guides.$slug.tsx",
  "src/routes/category.$slug.tsx",
  "src/routes/collections.$slug.tsx",
  "src/routes/product.$slug.tsx",
  "src/data/categories.ts",
  "src/data/category-content.ts",
  "src/data/shop-sections.ts",
  "src/data/compounds-a.ts",
  "src/data/compounds-b.ts",
  "src/data/ukpl-additions.ts",
  "src/data/coa.ts",
  "src/lib/catalog.ts",
  "src/lib/pdp-schema.ts",
];

/** Catalogue records, keyed by the sitemap key prefix they feed. Each entry is a data file whose
 *  records carry a `slug` field (or, for category-content.ts, are keyed by slug). */
const RECORD_SOURCES = [
  { prefix: "product", files: ["src/data/compounds-a.ts", "src/data/compounds-b.ts", "src/data/ukpl-additions.ts"] },
  { prefix: "category", files: ["src/data/categories.ts", "src/data/category-content.ts"] },
  { prefix: "collection", files: ["src/data/shop-sections.ts"] },
];

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const git = (args) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });

/** Every commit in history: full sha -> committer date (YYYY-MM-DD, the committer's own zone). */
const commitDates = () => {
  const map = new Map();
  try {
    for (const line of git(["log", "--format=%H %cs"]).split("\n")) {
      const [sha, date] = line.trim().split(" ");
      if (sha && DATE.test(date ?? "")) map.set(sha, date);
    }
  } catch {
    return map;
  }
  return map;
};

/** sha of the commit that last touched each line of a file (1-indexed line -> sha). */
const lineCommits = (file) => {
  const byLine = new Map();
  let out;
  try {
    out = git(["blame", "--line-porcelain", "--", file]);
  } catch {
    return byLine;
  }
  let sha = null;
  let line = 0;
  for (const raw of out.split("\n")) {
    const head = /^([0-9a-f]{40}) \d+ (\d+)/.exec(raw);
    if (head) {
      sha = head[1];
      line = Number(head[2]);
      continue;
    }
    if (raw.startsWith("\t")) {
      if (sha) byLine.set(line, sha);
      continue;
    }
  }
  return byLine;
};

/**
 * Line ranges of each record in a data file.
 * Object records look like `  {` / `    slug: "x",` ... `  },`; keyed maps look like
 * `  "x": {` ... `  },`.
 */
const recordRanges = (text, keyed) => {
  const lines = text.split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    let slug = null;
    if (keyed) {
      const m = /^ {2}"([a-z0-9][a-z0-9-]*)": \{$/.exec(lines[i]);
      if (m) slug = m[1];
    } else if (/^ {2}\{$/.test(lines[i])) {
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        const m = /^ {4}slug: "([^"]+)",$/.exec(lines[j]);
        if (m) {
          slug = m[1];
          break;
        }
      }
    }
    if (!slug) continue;
    for (let j = i + 1; j < lines.length; j++) {
      if (/^ {2}\},?$/.test(lines[j])) {
        out.push({ slug, start: i + 1, end: j + 1 });
        i = j;
        break;
      }
    }
  }
  return out;
};

const dates = commitDates();
const files = {};
for (const f of SHARED_FILES) {
  try {
    const d = git(["log", "-1", "--format=%cs", "--", f]).trim();
    if (DATE.test(d)) files[f] = d;
  } catch {
    /* no git: the sitemap omits lastmod for pages that depend on this file */
  }
}

const records = {};
for (const { prefix, files: sources } of RECORD_SOURCES) {
  for (const file of sources) {
    if (!files[file]) continue;
    let text;
    try {
      text = readFileSync(resolve(root, file), "utf8");
    } catch {
      continue;
    }
    const commits = lineCommits(file);
    for (const { slug, start, end } of recordRanges(text, file.endsWith("category-content.ts"))) {
      let newest = null;
      for (let line = start; line <= end; line++) {
        const d = dates.get(commits.get(line)) ?? null;
        if (d && (!newest || d > newest)) newest = d;
      }
      const key = `${prefix}:${slug}`;
      if (!newest) continue;
      // A record can be listed in two sources (e.g. a category in categories.ts and again in
      // category-content.ts): keep the newer of the two.
      if (!records[key] || newest > records[key]) records[key] = newest;
    }
  }
}

const sorted = (obj) => Object.fromEntries(Object.keys(obj).sort().map((k) => [k, obj[k]]));
const payload = { files: sorted(files), records: sorted(records) };
const json = `${JSON.stringify(payload, null, 2)}\n`;

if (check) {
  const current = (() => {
    try {
      return readFileSync(OUT, "utf8");
    } catch {
      return null;
    }
  })();
  if (current !== json) {
    console.error(`sitemap-lastmod: ${OUT} is stale, run npm run prebuild`);
    process.exit(1);
  }
  console.log(
    `sitemap-lastmod: up to date (${Object.keys(files).length} files, ${Object.keys(records).length} records)`,
  );
} else {
  writeFileSync(OUT, json);
  console.log(
    `sitemap-lastmod: ${Object.keys(files).length} files, ${Object.keys(records).length} records -> ${OUT}`,
  );
}
