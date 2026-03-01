#!/usr/bin/env node
/**
 * final-audit.mjs — FINAL HUMAN-QUALITY AUDIT
 * Checks: banned words, repetition >3, duplicate phrases, FAQ openers,
 *         title uniqueness, store-name-first, OG image, schema, etc.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const VENUES = JSON.parse(readFileSync(join(ROOT, 'data', 'venues.json'), 'utf-8'));

// ── BANNED WORDS ──
const BANNED = ['해당', '이곳', '공간', '매장', '감도', '기준'];

// ── Walk HTML files ──
function walkHtml(dir, list = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walkHtml(p, list);
    else if (f.endsWith('.html')) list.push(p);
  }
  return list;
}

function extractText(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-zA-Z]+;/g, ' ')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const results = {
  bannedWords: [],
  repetition: [],
  faqOpeners: [],
  titleIssues: [],
  ogIssues: [],
  schemaIssues: [],
  targetBlank: [],
  mapLinks: [],
  duplicatePhrases: [],
};

// ══════════════════════════════════════
// CHECK 1: BANNED WORDS in venues.json
// ══════════════════════════════════════
console.log('=== CHECK 1: Banned words in data ===');
let bannedCount = 0;

function checkBannedInObj(obj, path, venueName) {
  if (typeof obj === 'string') {
    for (const w of BANNED) {
      if (obj.includes(w)) {
        results.bannedWords.push({ venue: venueName, path, word: w, snippet: obj.substring(0, 80) });
        bannedCount++;
      }
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, i) => checkBannedInObj(item, `${path}[${i}]`, venueName));
  } else if (typeof obj === 'object' && obj !== null) {
    for (const [k, v] of Object.entries(obj)) {
      if (SKIP_WALK.has(k)) continue;
      checkBannedInObj(v, `${path}.${k}`, venueName);
    }
  }
}

VENUES.forEach(v => checkBannedInObj(v, 'root', v.name_display));
console.log(`  Banned word instances: ${bannedCount}`);

// ══════════════════════════════════════
// CHECK 2: Per-venue word repetition >3
// ══════════════════════════════════════
console.log('\n=== CHECK 2: Word repetition >3 per venue (data) ===');

function getProtected(v) {
  const s = new Set();
  [v.name_display, v.name_input, v.name_seo].filter(Boolean).forEach(n => {
    (n.match(/[\uAC00-\uD7AF]{2,}/g) || []).forEach(p => s.add(p));
  });
  if (v.region) (v.region.match(/[\uAC00-\uD7AF]{2,}/g) || []).forEach(p => s.add(p));
  return s;
}

const SKIP_WALK = new Set([
  'id', 'type', 'typePath', 'typeLabel', 'regionSlug', 'venueSlug', 'urlSlug',
  'geo', 'images', 'imagePrompts', 'relatedVenueIds', 'map_url',
  'name_display', 'name_input', 'name_seo', 'region',
  'card_tags', 'sourcePath'
]);

function getAllText(v) {
  const t = [];
  function walk(obj) {
    if (typeof obj === 'string') t.push(obj);
    else if (Array.isArray(obj)) obj.forEach(walk);
    else if (typeof obj === 'object' && obj !== null) {
      for (const [k, val] of Object.entries(obj)) {
        if (SKIP_WALK.has(k)) continue;
        walk(val);
      }
    }
  }
  walk(v);
  return t.join(' ');
}

let repVenues = 0;
let repTotal = 0;
VENUES.forEach(v => {
  const prot = getProtected(v);
  const tokens = (getAllText(v).match(/[\uAC00-\uD7AF]{2,}/g) || []);
  const freq = {};
  tokens.forEach(w => { if (!prot.has(w)) freq[w] = (freq[w] || 0) + 1; });
  const over = Object.entries(freq).filter(([, c]) => c >= 3);
  if (over.length > 0) {
    repVenues++;
    over.forEach(([w, c]) => {
      repTotal += c - 2;
      results.repetition.push({ venue: v.name_display, word: w, count: c });
    });
  }
});
console.log(`  Venues with repetition: ${repVenues}/130`);
console.log(`  Total excess words: ${repTotal}`);

// ══════════════════════════════════════
// CHECK 3: FAQ opener diversity
// ══════════════════════════════════════
console.log('\n=== CHECK 3: FAQ opener diversity ===');
let faqIssues = 0;
VENUES.forEach(v => {
  if (!v.faq || v.faq.length < 2) return;
  const openers = v.faq.map(f => {
    const q = f.q.trim();
    // First 2 words as opener
    return q.split(/\s+/).slice(0, 2).join(' ');
  });
  const openerCounts = {};
  openers.forEach(o => { openerCounts[o] = (openerCounts[o] || 0) + 1; });
  const dups = Object.entries(openerCounts).filter(([, c]) => c > 1);
  if (dups.length > 0) {
    faqIssues++;
    results.faqOpeners.push({ venue: v.name_display, duplicates: dups.map(([o, c]) => `"${o}" x${c}`) });
  }
});
console.log(`  FAQ opener issues: ${faqIssues}`);

// ══════════════════════════════════════
// CHECK 4: Title uniqueness & store-name-first
// ══════════════════════════════════════
console.log('\n=== CHECK 4: Titles ===');
const titles = new Map();
let titleDups = 0;
let titleNotFirst = 0;

VENUES.forEach(v => {
  const title = v.pageTitle || '';
  if (titles.has(title)) {
    titleDups++;
    results.titleIssues.push({ venue: v.name_display, issue: 'duplicate title', title });
  }
  titles.set(title, v.name_display);

  // Store name first check
  const displayName = v.name_display;
  if (title && !title.startsWith(displayName)) {
    titleNotFirst++;
    results.titleIssues.push({ venue: v.name_display, issue: 'name not first', title: title.substring(0, 50) });
  }
});
console.log(`  Duplicate titles: ${titleDups}`);
console.log(`  Name not first in title: ${titleNotFirst}`);

// ══════════════════════════════════════
// CHECK 5: HTML-level checks (OG, schema, target=_blank)
// ══════════════════════════════════════
console.log('\n=== CHECK 5: HTML checks ===');

if (!existsSync(DIST)) {
  console.log('  SKIP: dist/ not found (run build first)');
} else {
  const htmlFiles = walkHtml(DIST);
  let missingOg = 0, missingSchema = 0, missingTarget = 0, missingMap = 0;

  // Detail pages
  const detailDirs = ['club', 'night', 'lounge'];
  const detailFiles = [];
  for (const dir of detailDirs) {
    const dp = join(DIST, dir);
    if (existsSync(dp)) walkHtml(dp, detailFiles);
  }

  for (const file of detailFiles) {
    const html = readFileSync(file, 'utf-8');
    const relPath = file.replace(DIST, '');

    // OG image
    if (!html.includes('og:image')) {
      missingOg++;
      results.ogIssues.push({ page: relPath, issue: 'missing og:image' });
    }

    // Schema
    if (!html.includes('application/ld+json')) {
      missingSchema++;
      results.schemaIssues.push({ page: relPath, issue: 'missing JSON-LD' });
    }

    // Map link
    if (!html.includes('map.kakao.com') && !html.includes('maps.google.com') && !html.includes('google.com/maps') && !html.includes('maps.app.goo.gl') && !html.includes('map.naver.com')) {
      missingMap++;
      results.mapLinks.push({ page: relPath });
    }
  }

  // Check internal links for target=_blank
  // (just count pages with any <a> missing target)
  let pagesNoTarget = 0;
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf-8');
    // Find <a href=...> without target="_blank"
    const links = html.match(/<a\s[^>]*href="[^"]*"[^>]*>/g) || [];
    const noTarget = links.filter(l => !l.includes('target=') && !l.includes('href="#') && !l.includes('href="javascript'));
    if (noTarget.length > 0) {
      pagesNoTarget++;
    }
  }

  console.log(`  Detail pages: ${detailFiles.length}`);
  console.log(`  Missing OG image: ${missingOg}`);
  console.log(`  Missing JSON-LD: ${missingSchema}`);
  console.log(`  Missing map link: ${missingMap}`);
  console.log(`  Pages with links missing target=_blank: ${pagesNoTarget}`);
}

// ══════════════════════════════════════
// CHECK 6: Banned words in built HTML
// ══════════════════════════════════════
console.log('\n=== CHECK 6: Banned words in HTML ===');
if (existsSync(DIST)) {
  const detailDirs = ['club', 'night', 'lounge'];
  let htmlBanned = 0;
  const bannedPages = [];

  for (const dir of detailDirs) {
    const dp = join(DIST, dir);
    if (!existsSync(dp)) continue;
    const files = walkHtml(dp);
    for (const file of files) {
      const text = extractText(readFileSync(file, 'utf-8'));
      for (const w of BANNED) {
        const regex = new RegExp(`(?<![\\uAC00-\\uD7AF])${w}(?![\\uAC00-\\uD7AF])`, 'g');
        const matches = [...text.matchAll(regex)];
        if (matches.length > 0) {
          htmlBanned += matches.length;
          bannedPages.push({ page: file.replace(DIST, ''), word: w, count: matches.length });
        }
      }
    }
  }
  console.log(`  Banned word instances in HTML: ${htmlBanned}`);
  if (bannedPages.length > 0) {
    bannedPages.slice(0, 10).forEach(b => console.log(`    ${b.page}: "${b.word}" x${b.count}`));
    if (bannedPages.length > 10) console.log(`    ... +${bannedPages.length - 10} more`);
  }
}

// ══════════════════════════════════════
// SUMMARY
// ══════════════════════════════════════
console.log('\n' + '='.repeat(50));
console.log('AUDIT SUMMARY');
console.log('='.repeat(50));
console.log(`Banned words (data):      ${bannedCount}`);
console.log(`Repetition >3 (data):     venues=${repVenues}, excess=${repTotal}`);
console.log(`FAQ opener issues:        ${faqIssues}`);
console.log(`Title duplicates:         ${titleDups}`);
console.log(`Title name-not-first:     ${titleNotFirst}`);

const totalIssues = bannedCount + repTotal + faqIssues + titleDups + titleNotFirst;
if (totalIssues === 0) {
  console.log('\n✅ ALL DATA CHECKS PASSED');
} else {
  console.log(`\n❌ TOTAL ISSUES: ${totalIssues} — NEEDS FIXING`);
}
