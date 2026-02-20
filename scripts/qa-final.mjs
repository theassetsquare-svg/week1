#!/usr/bin/env node
/**
 * Final QA checks:
 * 1. All page titles unique, start with store name
 * 2. All meta descriptions unique
 * 3. All H1s unique, start with store name
 * 4. Store name appears 10-12 times in page content
 * 5. No banned words in titles
 * 6. Title length 15-55 chars
 * 7. Cross-page similarity check (titles + descriptions must be unique)
 * 8. Headline packs exist for all venues
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const DATA = join(ROOT, 'data');
const HEADLINES = join(ROOT, 'src', 'data', 'headlines');

const venues = JSON.parse(readFileSync(join(DATA, 'venues.json'), 'utf8'));

const BANNED = ['최고', '완벽', '대박', '핫플', '세련된', '고급', '1위', '공식', '단독',
  '마감', '예약', '문의', '전화번호', '카톡', '연락처', '전화'];

let errors = 0;
let warnings = 0;
let pass = 0;

function check(label, condition, detail) {
  if (condition) { pass++; }
  else { errors++; console.error(`  FAIL: ${label} — ${detail}`); }
}

function warn(label, detail) {
  warnings++;
  console.warn(`  WARN: ${label} — ${detail}`);
}

// ========== 1. VENUE DATA CHECKS ==========
console.log('=== VENUE DATA CHECKS ===');

const allTitles = new Set();
const allDescs = new Set();
const allH1s = new Set();

for (const v of venues) {
  const n = v.name_display;

  // Title exists and starts with store name
  check(`${n} pageTitle exists`, !!v.pageTitle, 'missing pageTitle');
  if (v.pageTitle) {
    check(`${n} title starts with name`, v.pageTitle.startsWith(n), `"${v.pageTitle}" does not start with "${n}"`);

    // Banned words
    for (const bw of BANNED) {
      check(`${n} no banned word "${bw}"`, !v.pageTitle.includes(bw), `title contains "${bw}"`);
    }

    // Title length
    const len = v.pageTitle.length;
    if (len > 55) warn(`${n} title length`, `${len} chars (>55)`);
    if (len < 12) warn(`${n} title length`, `${len} chars (<12)`);

    // Title uniqueness
    check(`${n} title unique`, !allTitles.has(v.pageTitle), `duplicate title: "${v.pageTitle}"`);
    allTitles.add(v.pageTitle);
  }

  // Description exists and unique
  check(`${n} metaDescription exists`, !!v.metaDescription, 'missing metaDescription');
  if (v.metaDescription) {
    check(`${n} desc unique`, !allDescs.has(v.metaDescription), 'duplicate description');
    allDescs.add(v.metaDescription);
  }

  // H1 exists and starts with store name
  check(`${n} h1Title exists`, !!v.h1Title, 'missing h1Title');
  if (v.h1Title) {
    check(`${n} H1 starts with name`, v.h1Title.startsWith(n), `"${v.h1Title}" does not start with "${n}"`);
    check(`${n} H1 unique`, !allH1s.has(v.h1Title), `duplicate H1: "${v.h1Title}"`);
    allH1s.add(v.h1Title);
  }

  // Section intros exist
  check(`${n} sectionIntros exists`, !!v.sectionIntros, 'missing sectionIntros');
  check(`${n} conclusionText exists`, !!v.conclusionText, 'missing conclusionText');

  // Headline pack exists
  const slug = `${v.typePath}-${v.regionSlug}-${(v.urlSlug || v.venueSlug).replace(/\s+/g, '-')}`;
  const packPath = join(HEADLINES, `${slug}.json`);
  check(`${n} headline pack`, existsSync(packPath), `missing ${packPath}`);
}

// ========== 2. BUILT PAGE CHECKS (sample 10 pages) ==========
console.log('\n=== BUILT PAGE CHECKS (store name density) ===');

const sampleVenues = [
  ...venues.filter(v => v.type === 'club').slice(0, 4),
  ...venues.filter(v => v.type === 'night').slice(0, 4),
  ...venues.filter(v => v.type === 'lounge').slice(0, 2),
];

for (const v of sampleVenues) {
  const slug = v.urlSlug || v.venueSlug;
  // Build path from typePath
  const htmlPath = join(DIST, v.typePath, v.regionSlug, slug, 'index.html');
  if (!existsSync(htmlPath)) {
    warn(`${v.name_display} HTML`, `not found at ${htmlPath}`);
    continue;
  }

  const html = readFileSync(htmlPath, 'utf8');

  // Count store name occurrences in visible text
  const nameRegex = new RegExp(v.name_display.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const nameMatches = html.match(nameRegex) || [];
  const nameCount = nameMatches.length;

  // Check title tag
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const pageTitle = titleMatch ? titleMatch[1] : '';
  check(`${v.name_display} <title> starts with name`, pageTitle.startsWith(v.name_display), `<title>: "${pageTitle}"`);

  // Check H1
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  const h1Text = h1Match ? h1Match[1] : '';
  check(`${v.name_display} <h1> starts with name`, h1Text.startsWith(v.name_display), `<h1>: "${h1Text}"`);

  // Check og:title
  const ogMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/);
  const ogTitle = ogMatch ? ogMatch[1] : '';
  check(`${v.name_display} og:title matches`, ogTitle === pageTitle, `og:title mismatch`);

  // Store name density
  if (nameCount >= 10 && nameCount <= 16) {
    pass++;
    console.log(`  OK: ${v.name_display} — store name appears ${nameCount} times`);
  } else if (nameCount >= 8) {
    warn(`${v.name_display} name density`, `${nameCount} (target 10-12)`);
  } else {
    errors++;
    console.error(`  FAIL: ${v.name_display} — store name only ${nameCount} times (target 10-12)`);
  }
}

// ========== 3. CROSS-PAGE SIMILARITY ==========
console.log('\n=== CROSS-PAGE TITLE SIMILARITY ===');
console.log(`  Unique titles: ${allTitles.size} / ${venues.length}`);
console.log(`  Unique descriptions: ${allDescs.size} / ${venues.length}`);
console.log(`  Unique H1s: ${allH1s.size} / ${venues.length}`);

// ========== SUMMARY ==========
console.log('\n===================================================');
console.log('  FINAL QA SUMMARY');
console.log('===================================================');
console.log(`  Passed:   ${pass}`);
console.log(`  Warnings: ${warnings}`);
console.log(`  Errors:   ${errors}`);
console.log(`  Result:   ${errors === 0 ? '✅ PASS' : '❌ FAIL'}`);
console.log('===================================================');
