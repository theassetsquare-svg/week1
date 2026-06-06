#!/usr/bin/env node
// Stage2 GATE (pre-build, on SOURCE). Blocks: risk words / one-blob description / unrealistic read-time.
// Existing checks (canonical, fake ratings) remain in their own qa_* scripts.
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const fails = [];

// ── 1) RISK WORDS (NOLCOOL rule) — 0 across src/ + public/. "2차 위반/경고/정지" (penalty tiers) preserved. ──
const RISK = /밤문화|유흥|룸살롱|룸싸롱|노래방|초이스|2차(?!\s*(위반|경고|정지))/g;
const ROOTS = ['src', 'public'];
const EXT = new Set(['.ts', '.astro', '.html', '.txt', '.json', '.js', '.mjs']);
const SKIP = new Set(['node_modules', 'dist']);
function walk(d, out = []) {
  let entries; try { entries = readdirSync(d); } catch { return out; }
  for (const e of entries) {
    if (SKIP.has(e)) continue;
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (EXT.has(extname(e))) out.push(p);
  }
  return out;
}
let riskHits = 0;
for (const root of ROOTS) for (const f of walk(root)) {
  const m = readFileSync(f, 'utf8').match(RISK);
  if (m) { riskHits += m.length; fails.push(`RISK WORD x${m.length} in ${f}: ${[...new Set(m)].join(', ')}`); }
}

// ── 2) VENUE READABILITY + READ-TIME (template-level) ──
const VT = 'src/pages/venue/[slug].astro';
try {
  const t = readFileSync(VT, 'utf8');
  // one-blob: description must NOT be dumped into a single raw <p>; must use paragraph splitter
  if (/<p class="tp-desc">\{venue\.description/.test(t)) fails.push('ONE-BLOB: description rendered as single <p> (use toParagraphs)');
  if (!/toParagraphs\(/.test(t)) fails.push('ONE-BLOB: toParagraphs() splitter missing');
  // read-time must be capped & prose-based, not raw main length / 600
  if (/textContent\.length[\s\S]{0,40}\/\s*600/.test(t)) fails.push('READ-TIME: counts entire main / 600 (inflates) — use capped prose calc');
  if (!/Math\.min\(\s*\d+/.test(t)) fails.push('READ-TIME: missing realistic cap (Math.min)');
} catch (e) { fails.push('cannot read ' + VT); }

// ── 3) ANTI-FABRICATION: NightClub telephone must stay conditional on real venue.phone (no hardcoded fake NAP) ──
try {
  const t = readFileSync(VT, 'utf8');
  if (/"telephone"\s*:\s*"0/.test(t)) fails.push('FAKE-NAP: hardcoded telephone literal in venue schema (must be venue.phone-gated)');
  if (!/venue\.phone\s*\?/.test(t)) fails.push('NAP: telephone must be conditional on venue.phone');
  if (/"streetAddress"/.test(t)) fails.push('FAKE-NAP: streetAddress present but no real street data in schema source');
} catch {}

if (fails.length) {
  console.error('❌ lint-copy GATE FAILED:\n  ' + fails.join('\n  '));
  process.exit(1);
}
console.log('✅ lint-copy GATE PASS — risk words 0, no one-blob, read-time capped');
