import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, '../data/venues.json');

// --- Normalization and search (mirrors page implementation) ---

function norm(s) {
  return s.replace(/\s+/g, '').replace(/[^가-힣a-zA-Z0-9]/g, '').toLowerCase();
}

function buildIndex(venues) {
  return venues.map(venue => {
    const name = venue.name_display;
    const region = venue.region ?? '';
    const tokens = norm(name).split('').reduce((acc, _, i, arr) => {
      for (let len = 2; len <= arr.length - i; len++) {
        acc.push(arr.slice(i, i + len).join(''));
      }
      return acc;
    }, []);
    return { id: venue.id, name, region, tokens };
  });
}

function search(q, index) {
  const nq = norm(q);
  const lq = q.toLowerCase().trim();
  return index.filter(item => {
    const nName = norm(item.name);
    if (nName === nq) return true;
    if (nName.includes(nq) || item.tokens.includes(nq)) return true;
    if (lq.split(/\s+/).every(t => item.name.toLowerCase().includes(t) || item.region.toLowerCase().includes(t))) return true;
    return lq.split(/\s+/).some(t => t.length >= 2 && (item.name.toLowerCase().includes(t) || item.region.toLowerCase().includes(t)));
  });
}

// --- Load data ---

const venues = JSON.parse(readFileSync(DATA_PATH, 'utf8'));
const index = buildIndex(venues);

// --- Test runner ---

let passed = 0;
let failed = 0;

function assert(description, condition, detail = '') {
  if (condition) {
    console.log(`  PASS  ${description}`);
    passed++;
  } else {
    console.log(`  FAIL  ${description}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

// --- Test suite 1: every venue's name_display returns at least 1 result ---

console.log('\n[Suite 1] Each venue name_display returns at least 1 result');

for (const venue of venues) {
  const query = venue.name_display;
  const results = search(query, index);
  assert(
    `search("${query}") score > 0`,
    results.length >= 1,
    `got ${results.length} results`
  );
}

// --- Test suite 2: specific cases ---

console.log('\n[Suite 2] Specific query cases');

// "레이스" should match "강남 레이스 클럽"
{
  const results = search('레이스', index);
  const match = results.some(r => r.name === '강남 레이스 클럽');
  assert(
    'search("레이스") matches "강남 레이스 클럽"',
    match,
    `results: [${results.map(r => r.name).join(', ')}]`
  );
  assert(
    'search("레이스") returns at least 1 result',
    results.length >= 1,
    `got ${results.length} results`
  );
}

// "강남" should return multiple results
{
  const results = search('강남', index);
  assert(
    'search("강남") returns multiple results (>= 2)',
    results.length >= 2,
    `got ${results.length} results: [${results.slice(0, 5).map(r => r.name).join(', ')}${results.length > 5 ? ', ...' : ''}]`
  );
}

// --- Summary ---

const total = passed + failed;
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed}/${total} passed, ${failed} failed`);
if (failed === 0) {
  console.log('PASS — all tests passed');
  process.exit(0);
} else {
  console.log('FAIL — some tests failed');
  process.exit(1);
}
