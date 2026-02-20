#!/usr/bin/env node
/**
 * lint-copy.mjs
 * Validates card_hook + card_value for all venues.
 * Fails (exit 1) on any rule violation.
 *
 * Rules:
 *  A) Banned words (해당/이곳/공간/매장/감도/기준) = 0 per card
 *  B) Same word ≤ 3 times within one card (hook + value)
 *  C) Cross-venue Jaccard similarity ≤ 0.50 (WARN at 0.35)
 *  D) card_hook and card_value must both exist and be non-empty
 */

import { readFileSync } from 'fs';

const VENUES_PATH = 'data/venues.json';
const venues = JSON.parse(readFileSync(VENUES_PATH, 'utf8'));

const BANNED = ['해당', '이곳', '공간', '매장', '감도', '기준'];
let errors = 0;
let warnings = 0;

console.log(`\n🔍 Lint card copy: ${venues.length} venues\n`);

// ─── Rule D: existence check ───
venues.forEach(v => {
  if (!v.card_hook || v.card_hook.trim().length === 0) {
    console.error(`  FAIL [D] Missing card_hook: ${v.name_display}`);
    errors++;
  }
  if (!v.card_value || v.card_value.trim().length === 0) {
    console.error(`  FAIL [D] Missing card_value: ${v.name_display}`);
    errors++;
  }
});

// ─── Rule A: banned words ───
venues.forEach(v => {
  const text = (v.card_hook || '') + ' ' + (v.card_value || '');
  BANNED.forEach(w => {
    if (text.includes(w)) {
      console.error(`  FAIL [A] Banned word "${w}" in: ${v.name_display}`);
      errors++;
    }
  });
});

// ─── Rule B: word repetition ───
venues.forEach(v => {
  const text = (v.card_hook || '') + ' ' + (v.card_value || '');
  const words = text.split(/[\s,./·:;!?→]+/).filter(w => w.length > 1);
  const freq = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  Object.entries(freq).forEach(([word, count]) => {
    if (count > 3) {
      console.error(`  FAIL [B] Word "${word}" repeated ${count}x in: ${v.name_display}`);
      errors++;
    }
  });
});

// ─── Rule C: cross-venue similarity ───
function tokenize(text) {
  return new Set(text.split(/[\s,./·:;!?→]+/).filter(w => w.length > 1));
}

function jaccard(a, b) {
  const intersection = [...a].filter(x => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

const allCards = venues.map(v => ({
  name: v.name_display,
  tokens: tokenize((v.card_hook || '') + ' ' + (v.card_value || '')),
}));

let highSimPairs = 0;
let midSimPairs = 0;

for (let i = 0; i < allCards.length; i++) {
  for (let j = i + 1; j < allCards.length; j++) {
    const sim = jaccard(allCards[i].tokens, allCards[j].tokens);
    if (sim > 0.50) {
      console.error(`  FAIL [C] Jaccard ${sim.toFixed(2)}: ${allCards[i].name} <-> ${allCards[j].name}`);
      highSimPairs++;
      errors++;
    } else if (sim > 0.35) {
      midSimPairs++;
    }
  }
}

// ─── Summary ───
console.log(`\n━━━ Results ━━━`);
console.log(`  Errors: ${errors}`);
console.log(`  Warnings: ${warnings}`);
console.log(`  High similarity (>0.50): ${highSimPairs}`);
console.log(`  Mid similarity (>0.35): ${midSimPairs} (info only)`);
console.log('');

if (errors > 0) {
  console.error(`FAILED: ${errors} violation(s) found.`);
  process.exit(1);
} else {
  console.log('PASS: all card copy rules satisfied.');
}
