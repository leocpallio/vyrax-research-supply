#!/usr/bin/env node
// Scans src/ for forbidden customer-copy patterns. Prints file:line for every hit. Exit 0 always (report tool).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
const P = {
  "human-use":
    /\b(human (use|consumption|trials?)|for (human|personal) (use|consumption)|safe for (human|people)|inject(ing|ion)? (into|yourself)|take (daily|once|twice)|per day|mcg\/kg)\b/i,
  dosing: /\b(dos(e|es|ing|age)|\d+\s?(mcg|µg)\s?(daily|per|\/)|loading phase|protocol cycle)\b/i,
  "pharma-grade": /pharmaceutical[\s-]grade|pharma[\s-]grade/i,
  gmp: /\bGMP\b|cGMP/,
  iso: /\bISO[\s-]?\d{3,}|ISO[\s-]certified/i,
  "fake-reviews":
    /\b\d[\d,]*\+?\s+(verified\s+)?(reviews|customers|happy|orders shipped)\b|\b4\.\d\s?(\/5|stars?)/i,
  guaranteed: /guarantee[ds]?\b/i,
  "next-day": /next[\s-]day|same[\s-]day/i,
  countdown: /countdown|order (within|in the next)|\bhrs?\b.*\bmins?\b|minsLeft/i,
  "em-dash": /—/,
};
const walk = (d) =>
  readdirSync(d).flatMap((e) => {
    const f = join(d, e);
    return statSync(f).isDirectory()
      ? walk(f)
      : /\.(tsx?|md)$/.test(e) && !e.endsWith(".gen.ts")
        ? [f]
        : [];
  });
let n = 0;
for (const f of walk("src"))
  readFileSync(f, "utf8")
    .split("\n")
    .forEach((l, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(l)) return;
      for (const [k, re] of Object.entries(P))
        if (re.test(l)) {
          n++;
          console.log(`${f}:${i + 1} [${k}] ${l.trim().slice(0, 140)}`);
        }
    });
console.log(`TOTAL ${n}`);
