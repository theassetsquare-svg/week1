#!/usr/bin/env node
/**
 * qa_search.mjs
 * 메인 검색 기능 100% 자동 검증
 *
 * 1) search_index.json 존재 + 전체 업소 포함 확인
 * 2) 랜덤 30개 샘플 → 검색 시뮬레이션 (정규화 매칭)
 * 3) HTML 구조 검증: target="_blank", Enter 핸들러, 자동완성 DOM
 * 4) 100% 아니면 FAIL
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { buildVenueUrl } from './lib/url.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const INDEX_HTML = join(ROOT, 'dist', 'index.html');
const SEARCH_INDEX = join(ROOT, 'public', 'search_index.json');
const VENUES_PATH = join(ROOT, 'data', 'venues.json');

let fails = 0;
let warns = 0;

function fail(msg) { console.error(`  FAIL: ${msg}`); fails++; }
function warn(msg) { console.warn(`  WARN: ${msg}`); warns++; }

function norm(s) {
  return s.replace(/\s+/g, '').replace(/[^가-힣a-zA-Z0-9]/g, '').toLowerCase();
}

// Simulate the 4-tier search logic from index.astro
function simulateSearch(query, index) {
  const q = norm(query);
  const ql = query.toLowerCase().trim();
  const qTokens = ql.split(/\s+/).filter(t => t.length > 0);

  return index.filter(item => {
    const nName = norm(item.name);
    const lName = item.name.toLowerCase();
    const lRegion = (item.region || '').toLowerCase();
    const lCat = (item.categoryLabel || item.catLabel || '').toLowerCase();

    // Tier 1: exact
    if (nName === q) return true;
    // Tier 2: partial
    if (nName.includes(q)) return true;
    const itemNorm = item.normalized_name || item.norm || norm(item.name + (item.region || '') + (item.categoryLabel || item.catLabel || ''));
    if (itemNorm.includes(q)) return true;
    // Tier 3: all tokens
    if (qTokens.length > 0 && qTokens.every(t => lName.includes(t) || lRegion.includes(t) || lCat.includes(t))) return true;
    // Tier 4: any token
    if (qTokens.some(t => lName.includes(t) || lRegion.includes(t))) return true;
    return false;
  });
}

function main() {
  console.log('=== qa_search ===\n');

  // 1) Check files exist
  if (!existsSync(INDEX_HTML)) {
    fail('dist/index.html not found — build first');
    process.exit(1);
  }

  const venues = JSON.parse(readFileSync(VENUES_PATH, 'utf-8'));

  // 2) Check search_index.json
  if (!existsSync(SEARCH_INDEX)) {
    fail('search_index.json not found — run generate-search-index.mjs');
  } else {
    const si = JSON.parse(readFileSync(SEARCH_INDEX, 'utf-8'));
    console.log(`  search_index.json: ${si.length} entries`);
    if (si.length !== venues.length) {
      fail(`search_index.json has ${si.length} entries, expected ${venues.length}`);
    }

    // Verify all venues in index
    const indexNames = new Set(si.map(e => norm(e.name)));
    let missing = 0;
    for (const v of venues) {
      if (!indexNames.has(norm(v.name_display))) {
        fail(`Venue "${v.name_display}" not in search_index.json`);
        missing++;
      }
    }
    if (missing === 0) console.log('  All venues present in search_index.json');
  }

  // 3) HTML structure checks
  const html = readFileSync(INDEX_HTML, 'utf-8');

  // Search input
  if (!html.includes('id="venueSearch"')) {
    fail('Search input #venueSearch not found');
  } else {
    console.log('  Search input #venueSearch: found');
  }

  // Autocomplete dropdown
  if (html.includes('searchDropdown') || html.includes('search-dropdown')) {
    console.log('  Autocomplete dropdown: found');
  } else {
    fail('Autocomplete dropdown element not found');
  }

  // Enter key handler
  if (html.includes('Enter') && html.includes('keydown')) {
    console.log('  Enter key handler: found');
  } else {
    fail('No Enter key handler detected');
  }

  // target="_blank" on venue cards
  const cardLinks = [...html.matchAll(/class="venue-card"[^>]*/g)];
  const cardsWithBlank = cardLinks.filter(m => m[0].includes('target="_blank"'));
  if (cardLinks.length === 0) {
    fail('No venue cards found');
  } else if (cardsWithBlank.length < cardLinks.length) {
    fail(`Only ${cardsWithBlank.length}/${cardLinks.length} cards have target="_blank"`);
  } else {
    console.log(`  Cards with target="_blank": ${cardsWithBlank.length}/${cardLinks.length}`);
  }

  // rel="noopener noreferrer"
  const cardsWithRel = cardLinks.filter(m => m[0].includes('noopener') && m[0].includes('noreferrer'));
  if (cardsWithRel.length < cardLinks.length) {
    fail(`Only ${cardsWithRel.length}/${cardLinks.length} cards have rel="noopener noreferrer"`);
  } else {
    console.log(`  Cards with rel="noopener noreferrer": ${cardsWithRel.length}/${cardLinks.length}`);
  }

  // 4) Search simulation — 30 random samples
  // Extract embedded search index from HTML
  const siMatch = html.match(/const\s+SI\s*=\s*(\[[\s\S]*?\]);\s*\n/);
  let embeddedIndex = [];
  if (siMatch) {
    try {
      embeddedIndex = JSON.parse(siMatch[1]);
    } catch (e) {
      // Try search_index.json as fallback
    }
  }

  // Fallback to file
  if (embeddedIndex.length === 0 && existsSync(SEARCH_INDEX)) {
    embeddedIndex = JSON.parse(readFileSync(SEARCH_INDEX, 'utf-8'));
  }

  // Also check data-name attributes as additional verification
  const dataNames = [...html.matchAll(/data-name="([^"]*)"/g)].map(m => m[1]);

  const sampleSize = Math.min(30, venues.length);
  const shuffled = [...venues].sort(() => Math.random() - 0.5);
  const samples = shuffled.slice(0, sampleSize);

  let searchPass = 0;
  let searchFail = 0;

  for (const v of samples) {
    const query = v.name_display;
    const expectedUrl = `/${v.typePath}/${v.regionSlug}/${v.urlSlug || v.venueSlug}/`;

    // Test 1: data-name attribute contains the name
    const nameInData = dataNames.some(d => d.toLowerCase().includes(query.toLowerCase()));

    // Test 2: search index simulation
    let foundInIndex = false;
    if (embeddedIndex.length > 0) {
      const results = simulateSearch(query, embeddedIndex);
      foundInIndex = results.some(r => r.url === expectedUrl);
    }

    // Test 3: search by partial name (first word)
    const firstWord = query.split(' ').filter(w => w.length >= 2)[0] || query;
    let foundByPartial = false;
    if (embeddedIndex.length > 0) {
      const results2 = simulateSearch(firstWord, embeddedIndex);
      foundByPartial = results2.some(r => r.url === expectedUrl);
    }

    const passed = nameInData && (foundInIndex || foundByPartial);
    if (passed) {
      searchPass++;
    } else {
      fail(`Search "${query}" → data-name:${nameInData}, index:${foundInIndex}, partial:${foundByPartial} — expected ${expectedUrl}`);
      searchFail++;
    }
  }

  console.log(`\n  Search simulation: ${searchPass}/${sampleSize} passed`);

  console.log('');
  if (fails > 0) {
    console.error(`FAIL: qa_search — ${fails} error(s), ${warns} warning(s)`);
    process.exit(1);
  } else {
    console.log(`PASS: qa_search — ${warns} warning(s)`);
    process.exit(0);
  }
}

main();
