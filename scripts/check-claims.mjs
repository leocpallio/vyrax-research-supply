#!/usr/bin/env node
/**
 * Vyrax Labs claim gate.
 *
 * Fails (exit 1) if any customer-facing claim could render without the evidence that backs it.
 * It runs five rules over the working tree:
 *
 *   1. registry-integrity   claim ids are unique, every `requires.key` exists in the evidence
 *                           manifest, every claim names at least one surface.
 *   2. forbidden-assertion  an assertion phrase ("HPLC tested", "lab tested", "third party tested",
 *                           "batch by batch", "independently verified", "clinically proven", ...)
 *                           appears in a source file other than src/lib/claims.ts. Prose that
 *                           asserts testing, verification or clinical proof must come from the
 *                           registry, never from a component, or it will keep rendering when the
 *                           gated component is hidden.
 *   3. unbound-assertion    a registered claim asserts something but is bound to no evidence, or it
 *                           resolves to "allowed" while its evidence is missing.
 *   4. hardcoded-claim      the literal text of an assertion claim appears in a source file other
 *                           than src/lib/claims.ts, i.e. a component copied the claim instead of
 *                           calling claimGate()/claimText().
 *   5. asserting-fallback   a claim's *honest-empty* fallback itself matches a forbidden assertion
 *                           phrase, so the fallback would assert exactly what the gate withheld.
 *
 * Comment-only lines are skipped so documentation may discuss the rules; JSX comments are not
 * special-cased. Literal matching is whitespace-normalised and case-insensitive, so a claim split
 * across several JSX expressions can still slip past rule 4: rules 2 and 3 are the backstop.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const SRC = join(ROOT, "src");
const CLAIMS_FILE = "src/lib/claims.ts";

const { claimRegistry, resolveClaim } = await import(
  new URL("../src/lib/claims.ts", import.meta.url).href
);
const { evidence, evidenceSummary, describeRequirement } = await import(
  new URL("../src/lib/evidence.ts", import.meta.url).href
);

/** Assertion phrases that may only ever render through the registry. */
const FORBIDDEN = [
  {
    id: "hplc-tested",
    re: /\bHPLC\s+(?:and\s+(?:MS|mass\s+spectrometry)\s+)?tested\b/i,
    why: "HPLC testing is asserted",
  },
  { id: "lab-tested", re: /\blab(?:oratory)?[\s-]+tested\b/i, why: "lab-tested is asserted" },
  {
    id: "third-party-tested",
    re: /\bthird[\s-]party\s+(?:lab(?:oratory|s)?\s+)?test(?:ed|ing)\b/i,
    why: "third-party testing is asserted",
  },
  {
    id: "third-party-lab",
    re: /\bthird[\s-]party\s+laborator(?:y|ies)\b|\bthird[\s-]party\s+labs?\b/i,
    why: "a third-party laboratory is asserted",
  },
  {
    id: "independent-lab",
    re: /\bindependent\s+(?:lab(?:oratory)?|testing|analysis|purity|verification)\b/i,
    why: "independent testing is asserted",
  },
  {
    id: "independently-verified",
    re: /\bindependently\s+(?:tested|verified|confirmed|validated|analysed|analyzed)\b/i,
    why: "independent verification is asserted",
  },
  {
    id: "tested-by-independent",
    re: /\btested\s+by\s+(?:an?\s+)?(?:independent|third[\s-]party)\b/i,
    why: "testing by an independent body is asserted",
  },
  {
    id: "batch-by-batch",
    re: /\bbatch[\s-]+by[\s-]+batch\b/i,
    why: "batch-by-batch testing is asserted",
  },
  {
    id: "clinically-proven",
    re: /\bclinic(?:al|ally)[\s-]+proven\b/i,
    why: "clinical proof is asserted",
  },
  {
    id: "every-batch-tested",
    re: /\bevery\s+batch\s+(?:is\s+|was\s+)?(?:tested|sent|submitted|analysed|analyzed)\b/i,
    why: "batch testing is asserted",
  },
  {
    id: "each-batch-tested",
    re: /\beach\s+batch\s+(?:is\s+|was\s+)?(?:tested|sent|submitted|analysed|analyzed)\b/i,
    why: "batch testing is asserted",
  },
  {
    id: "verified-by-independent",
    re: /\bverified\s+by\s+(?:an?\s+)?(?:independent|third[\s-]party)\b/i,
    why: "independent verification is asserted",
  },
];

const normalise = (s) => s.replace(/\s+/g, " ").trim().toLowerCase();

const isCommentLine = (line) => {
  const t = line.trim();
  return t.startsWith("//") || t.startsWith("*") || t.startsWith("/*");
};

function sourceFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.tsx?$/.test(entry) && !entry.endsWith(".gen.ts")) out.push(full);
  }
  return out;
}

const violations = [];
const add = (rule, where, message) => violations.push({ rule, where, message });

// ---------------------------------------------------------------------------------------------
// Rule 1: registry integrity
// ---------------------------------------------------------------------------------------------
const seen = new Set();
for (const claim of claimRegistry) {
  if (seen.has(claim.id))
    add("registry-integrity", CLAIMS_FILE, `duplicate claim id "${claim.id}"`);
  seen.add(claim.id);
  if (claim.surfaces.length === 0) add("registry-integrity", claim.id, "no surface declared");
  for (const requirement of claim.requires) {
    if (!Object.prototype.hasOwnProperty.call(evidence, requirement.key)) {
      add("registry-integrity", claim.id, `requires unknown evidence key "${requirement.key}"`);
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Rules 2 and 4: scan the tree
// ---------------------------------------------------------------------------------------------
const files = sourceFiles(SRC).map((full) => ({ full, rel: relative(ROOT, full) }));
const longClaimTexts = claimRegistry
  .filter((c) => c.assertion && !c.text.includes("{{"))
  .map((c) => ({ id: c.id, needle: normalise(c.text) }))
  .filter((c) => c.needle.length >= 6);

for (const file of files) {
  const lines = readFileSync(file.full, "utf8").split("\n");
  const codeLines = lines.filter((line) => !isCommentLine(line));
  const code = normalise(codeLines.join("\n"));

  if (file.rel !== CLAIMS_FILE) {
    lines.forEach((line, index) => {
      if (isCommentLine(line)) return;
      for (const pattern of FORBIDDEN) {
        const match = pattern.re.exec(line);
        if (match) {
          add(
            "forbidden-assertion",
            `${file.rel}:${index + 1}`,
            `"${match[0]}" (${pattern.why}) is rendered in prose, not through the registry`,
          );
        }
      }
    });

    for (const claim of longClaimTexts) {
      if (code.includes(claim.needle)) {
        add(
          "hardcoded-claim",
          file.rel,
          `assertion text of claim "${claim.id}" is hard-coded here; call claimGate("${claim.id}") instead`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Rules 3 and 5: per-claim resolution
// ---------------------------------------------------------------------------------------------
const tally = { allowed: 0, "honest-empty": 0, hidden: 0 };
const coverage = new Map();

for (const claim of claimRegistry) {
  const resolved = resolveClaim(claim.id);
  tally[resolved.state] += 1;
  for (const surface of claim.surfaces) coverage.set(surface, (coverage.get(surface) ?? 0) + 1);

  const assertsForbidden = FORBIDDEN.filter((p) => p.re.test(claim.text)).map((p) => p.id);
  if (assertsForbidden.length > 0 && claim.requires.length === 0) {
    add(
      "unbound-assertion",
      claim.id,
      `asserts ${assertsForbidden.join(", ")} but is bound to no evidence`,
    );
  }
  if (claim.assertion && resolved.state === "allowed" && resolved.missing.length > 0) {
    add("unbound-assertion", claim.id, "resolves to allowed while evidence is missing");
  }
  if (typeof claim.honestEmpty === "string") {
    for (const pattern of FORBIDDEN) {
      const match = pattern.re.exec(claim.honestEmpty);
      if (match) {
        add(
          "asserting-fallback",
          claim.id,
          `honest-empty copy asserts "${match[0]}" (${pattern.why}); a fallback must not assert`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------------------------
const line = (s = "") => process.stdout.write(`${s}\n`);

line(`claim gate: ${claimRegistry.length} registered claims, ${files.length} source files scanned`);
line();
line("evidence manifest");
for (const row of evidenceSummary()) {
  const detail = row.detail.length > 78 ? `${row.detail.slice(0, 75)}...` : row.detail;
  line(`  ${row.state === "known" ? "known  " : "unknown"} ${row.key.padEnd(24)} ${detail}`);
}
line();
line("claim resolution");
line(`  allowed       ${tally.allowed}`);
line(`  honest-empty  ${tally["honest-empty"]}`);
line(`  hidden        ${tally.hidden}`);
line(
  `  bound to      ${[...new Set(claimRegistry.flatMap((c) => c.requires.map((r) => r.key)))].length} evidence keys`,
);
line(
  `  detail        ${claimRegistry.flatMap((c) => c.requires.map(describeRequirement)).length} requirement bindings`,
);
line();

if (violations.length === 0) {
  line("PASS no unbacked claims");
  process.exitCode = 0;
} else {
  line(`FAIL ${violations.length} violation${violations.length === 1 ? "" : "s"}`);
  const byRule = new Map();
  for (const v of violations) {
    if (!byRule.has(v.rule)) byRule.set(v.rule, []);
    byRule.get(v.rule).push(v);
  }
  for (const [rule, list] of byRule) {
    line();
    line(`  ${rule} (${list.length})`);
    for (const v of list) line(`    ${v.where}  ${v.message}`);
  }
  process.exitCode = 1;
}
