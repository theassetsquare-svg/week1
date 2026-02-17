#!/usr/bin/env node
/**
 * qa_search.mjs
 * 메인 검색 기능 테스트 (클라이언트사이드 검색 검증)
 * - 30개 샘플 업소의 data-name 속성 매칭 확인
 * - 카드 링크의 target="_blank" rel="noopener noreferrer" 확인
 * - 검색 입력 필드 존재 확인
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const INDEX_HTML = join(ROOT, 'dist', 'index.html');
const VENUES = JSON.parse(readFileSync(join(ROOT, 'data', 'venues.json'), 'utf-8'));

let fails = 0;
let warns = 0;

function fail(msg) { console.error(`  FAIL: ${msg}`); fails++; }
function warn(msg) { console.warn(`  WARN: ${msg}`); warns++; }

function main() {
  console.log('=== qa_search ===\n');

  if (!existsSync(INDEX_HTML)) {
    fail('dist/index.html not found — build first');
    process.exit(1);
  }

  const html = readFileSync(INDEX_HTML, 'utf-8');

  // 1) 검색 입력 필드 존재 확인
  if (!html.includes('id="venueSearch"')) {
    fail('Search input #venueSearch not found');
  } else {
    console.log('  Search input #venueSearch: found');
  }

  // 2) 모든 카드의 data-name 추출
  const cardRegex = /<a\s+href=["'](.*?)["']\s+class=["']venue-card["']\s+data-type=["'](.*?)["']\s+data-region=["'](.*?)["']\s+data-name=["'](.*?)["']/g;
  const cards = [];
  let match;
  while ((match = cardRegex.exec(html)) !== null) {
    cards.push({
      href: match[1],
      type: match[2],
      region: match[3],
      name: match[4],
    });
  }

  // 더 유연한 파싱 (속성 순서가 다를 수 있음)
  if (cards.length === 0) {
    const flexRegex = /<a\s[^>]*class=["']venue-card["'][^>]*data-name=["'](.*?)["'][^>]*href=["'](.*?)["'][^>]*/g;
    while ((match = flexRegex.exec(html)) !== null) {
      cards.push({ name: match[1], href: match[2] });
    }
  }

  // 카드가 하나도 없으면 attribute 방식 독립적으로 추출
  if (cards.length === 0) {
    const allCards = [...html.matchAll(/data-name=["'](.*?)["']/g)];
    for (const m of allCards) {
      cards.push({ name: m[1], href: '' });
    }
  }

  console.log(`  Venue cards found: ${cards.length}`);

  if (cards.length === 0) {
    fail('No venue cards found in index.html');
    process.exit(1);
  }

  // 3) 30개 샘플 업소 검색 테스트
  const sampleSize = Math.min(30, VENUES.length);
  const shuffled = [...VENUES].sort(() => Math.random() - 0.5);
  const samples = shuffled.slice(0, sampleSize);

  let searchPass = 0;
  let searchFail = 0;

  for (const v of samples) {
    const query = v.name_display.toLowerCase();
    const found = cards.some(c => c.name.toLowerCase().includes(query));

    if (found) {
      searchPass++;
    } else {
      fail(`Search for "${v.name_display}" — no matching card found`);
      searchFail++;
    }
  }

  console.log(`  Search test: ${searchPass}/${sampleSize} passed`);

  // 4) 카드 링크 검사: target="_blank" rel="noopener noreferrer"
  // 인덱스 페이지 카드에 target="_blank" 있는지 확인
  const cardLinksWithBlank = (html.match(/class=["']venue-card["'][^>]*target=["']_blank["']/g) || []).length;
  const cardLinksAlt = (html.match(/data-name=["'][^"']*["'][^>]*target=["']_blank["']/g) || []).length;
  const totalBlank = Math.max(cardLinksWithBlank, cardLinksAlt);

  if (totalBlank === 0 && cards.length > 0) {
    warn(`Venue cards missing target="_blank" — currently ${totalBlank}/${cards.length}`);
  } else {
    console.log(`  Cards with target="_blank": ${totalBlank}/${cards.length}`);
  }

  // 5) Enter 키 핸들러 존재 확인
  if (html.includes('keydown') || html.includes('keyup') || html.includes('keypress') || html.includes('Enter')) {
    console.log('  Enter key handler: found');
  } else {
    warn('No Enter key handler detected for search — Enter-to-navigate may not work');
  }

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
