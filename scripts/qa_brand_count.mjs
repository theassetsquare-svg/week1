#!/usr/bin/env node
/**
 * qa_brand_count.mjs
 * 브랜드명(가게이름) 등장 횟수 4~8회 검사 + 분산 검사
 * - 상세페이지에서 가게이름 등장: 4~8회
 * - 서론/본론/결론에 분산 (한 곳에 몰아넣기 금지)
 * - 다른 가게이름 언급: 8개 이하
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const VENUES = JSON.parse(readFileSync(join(ROOT, 'data', 'venues.json'), 'utf-8'));

let fails = 0;
let warns = 0;

function fail(msg) { console.error(`  FAIL: ${msg}`); fails++; }
function warn(msg) { console.warn(`  WARN: ${msg}`); warns++; }

function walkHtml(dir, list = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walkHtml(p, list);
    else if (f.endsWith('.html')) list.push(p);
  }
  return list;
}

function extractVisibleText(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-zA-Z]+;/g, ' ')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countSubstring(text, sub) {
  if (!sub || sub.length === 0) return 0;
  let count = 0;
  let pos = 0;
  while ((pos = text.indexOf(sub, pos)) !== -1) {
    count++;
    pos += sub.length;
  }
  return count;
}

// 업소명 → 경로 매핑
const venueByPath = {};
for (const v of VENUES) {
  const key = `/${v.typePath}/${v.regionSlug}/${v.venueSlug}/index.html`;
  venueByPath[key] = v;
}

function main() {
  console.log('=== qa_brand_count ===\n');

  if (!existsSync(DIST)) {
    fail('dist/ not found');
    process.exit(1);
  }

  const detailDirs = ['club', 'night', 'lounge'];
  const htmlFiles = [];
  for (const dir of detailDirs) {
    const dirPath = join(DIST, dir);
    if (existsSync(dirPath)) walkHtml(dirPath, htmlFiles);
  }

  console.log(`  Detail pages to check: ${htmlFiles.length}`);

  let brandCountFails = 0;
  let distributionFails = 0;
  let otherBrandFails = 0;
  const allVenueNames = VENUES.map(v => v.name_display);

  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf-8');
    const relPath = file.replace(DIST, '');
    const text = extractVisibleText(html);

    // 해당 페이지의 업소 찾기
    let venue = venueByPath[relPath];
    if (!venue) {
      // 경로 디코딩으로 재시도
      const decodedPath = decodeURIComponent(relPath);
      venue = venueByPath[decodedPath];
    }
    if (!venue) {
      // title에서 업소명 추출
      for (const v of VENUES) {
        if (text.includes(v.name_display) && relPath.includes(v.typePath)) {
          venue = v;
          break;
        }
      }
    }

    if (!venue) {
      warn(`Cannot identify venue for: ${relPath}`);
      continue;
    }

    const brandName = venue.name_display;

    // 1) 브랜드명 등장 횟수 검사 (4~8)
    const brandCount = countSubstring(text, brandName);
    if (brandCount < 4) {
      fail(`${relPath}: "${brandName}" appears ${brandCount} times (min 4)`);
      brandCountFails++;
    } else if (brandCount > 8) {
      fail(`${relPath}: "${brandName}" appears ${brandCount} times (max 8)`);
      brandCountFails++;
    }

    // 2) 분산 검사: 텍스트를 3등분하여 최소 1회씩 분포
    if (brandCount >= 4) {
      const textLen = text.length;
      const third = Math.floor(textLen / 3);
      const part1 = text.slice(0, third);
      const part2 = text.slice(third, third * 2);
      const part3 = text.slice(third * 2);

      const c1 = countSubstring(part1, brandName);
      const c2 = countSubstring(part2, brandName);
      const c3 = countSubstring(part3, brandName);

      if (c1 === 0 || c2 === 0 || c3 === 0) {
        warn(`${relPath}: "${brandName}" distribution [${c1},${c2},${c3}] — missing from a section`);
        distributionFails++;
      }
    }

    // 3) 다른 가게이름 언급 검사 (8개 이하)
    let otherBrands = 0;
    for (const name of allVenueNames) {
      if (name === brandName) continue;
      if (text.includes(name)) {
        otherBrands++;
      }
    }

    if (otherBrands > 8) {
      fail(`${relPath}: ${otherBrands} other brand names mentioned (max 8)`);
      otherBrandFails++;
    }
  }

  console.log(`\n  Brand count fails: ${brandCountFails}`);
  console.log(`  Distribution warns: ${distributionFails}`);
  console.log(`  Other-brand fails: ${otherBrandFails}`);
  console.log('');

  if (fails > 0) {
    console.error(`FAIL: qa_brand_count — ${fails} error(s), ${warns} warning(s)`);
    process.exit(1);
  } else {
    console.log(`PASS: qa_brand_count — ${warns} warning(s)`);
    process.exit(0);
  }
}

main();
