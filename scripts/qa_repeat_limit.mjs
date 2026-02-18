#!/usr/bin/env node
/**
 * qa_repeat_limit.mjs
 * 반복 단어 제한 검사 (의미 토큰 기준)
 *
 * 규칙:
 * - 의미 단어(핵심 토큰): 어떤 단어도 3회 초과 시 FAIL
 * - 브랜드명 토큰: 8회 상한
 * - 지역/카테고리 토큰: 각 6회
 * - UI 구조 토큰(FAQ/목차/지도/위치/주차/체크리스트): 각 6회
 * - 상투어(이곳/매장/공간/여기/해당/장소): 각 3회 이하
 * - 기능어(조사/어미/접속사) 제외
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

// 상투어 목록 (예외 없이 페이지당 각 3회 이하)
const CLICHE_WORDS = ['이곳', '매장', '공간', '여기', '해당', '장소'];

// UI 구조 토큰 (6회 상한)
const UI_TOKENS = ['FAQ', '목차', '지도', '위치', '주차', '체크리스트', '갤러리', '타임라인'];

// 카테고리 토큰 (6회 상한)
const CATEGORY_TOKENS = ['나이트', '클럽', '라운지', '나이트라이프', '밤문화'];

// 한국어 기능어 (제외 대상)
const FUNC_WORDS = new Set([
  '그리고', '그러나', '하지만', '그래서', '또한', '그런데', '그래도', '따라서',
  '그러므로', '그러면', '만약', '때문', '위해', '대한', '통해', '따른', '같은',
  '위한', '대해', '관한', '있는', '없는', '하는', '되는', '있을', '없을',
  '합니다', '입니다', '됩니다', '있습니다', '없습니다', '것입니다',
  '에서', '으로', '부터', '까지', '에게', '보다', '처럼', '같이',
  '대로', '밖에', '이며', '이고', '이나', '지만', '면서',
  '우리', '저희', '자신', '모든', '어떤', '이런', '그런',
  '가장', '매우', '정말', '너무', '아주', '상당히',
  '하지', '않는', '못하', '않은',
]);

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

// 한국어 토큰 추출 (2글자 이상 한글 시퀀스)
function extractKoreanTokens(text) {
  const matches = text.match(/[\uAC00-\uD7AF]{2,}/g) || [];
  return matches;
}

function countSubstring(text, sub) {
  let count = 0;
  let pos = 0;
  while ((pos = text.indexOf(sub, pos)) !== -1) {
    count++;
    pos += sub.length;
  }
  return count;
}

function main() {
  console.log('=== qa_repeat_limit ===\n');

  if (!existsSync(DIST)) {
    fail('dist/ not found');
    process.exit(1);
  }

  // 업소명 → 지역 매핑
  const venueNameSet = new Set(VENUES.map(v => v.name_display));
  const regionSet = new Set(VENUES.map(v => v.region));

  // 업소 상세 페이지만 검사
  const detailDirs = ['club', 'night', 'lounge'];
  const htmlFiles = [];
  for (const dir of detailDirs) {
    const dirPath = join(DIST, dir);
    if (existsSync(dirPath)) walkHtml(dirPath, htmlFiles);
  }

  console.log(`  Detail pages to check: ${htmlFiles.length}`);

  let pagesFailed = 0;

  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf-8');
    const relPath = file.replace(DIST, '');
    const text = extractVisibleText(html);
    const pageIssues = [];

    // 해당 페이지의 브랜드명 추출 (title에서)
    const titleMatch = html.match(/<title>(.*?)<\/title>/s);
    const title = titleMatch ? titleMatch[1] : '';
    let brandName = '';
    for (const v of VENUES) {
      if (title.includes(v.name_display)) {
        brandName = v.name_display;
        break;
      }
    }

    // 해당 페이지의 지역명
    let regionName = '';
    for (const v of VENUES) {
      if (title.includes(v.region) && title.includes(v.name_display)) {
        regionName = v.region;
        break;
      }
    }

    // 1) 상투어 검사 (각 3회 이하)
    for (const word of CLICHE_WORDS) {
      const count = countSubstring(text, word);
      if (count > 3) {
        pageIssues.push(`cliche "${word}" x${count} (max 3)`);
      }
    }

    // 2) 한국어 토큰 추출 및 카운팅
    const tokens = extractKoreanTokens(text);
    const tokenCounts = {};
    for (const t of tokens) {
      tokenCounts[t] = (tokenCounts[t] || 0) + 1;
    }

    // 3) 각 토큰별 제한 적용
    for (const [token, count] of Object.entries(tokenCounts)) {
      // 기능어 제외
      if (FUNC_WORDS.has(token)) continue;
      if (token.length < 2) continue;

      // 브랜드명 토큰: 8회 상한
      if (brandName && token === brandName) continue; // brand_count에서 별도 검사

      // 브랜드명의 일부인 경우 스킵
      if (brandName && brandName.includes(token)) continue;

      // 지역명: 6회 상한
      if (regionSet.has(token) || (regionName && token === regionName)) {
        if (count > 6) {
          pageIssues.push(`region "${token}" x${count} (max 6)`);
        }
        continue;
      }

      // 카테고리 토큰: 6회 상한
      if (CATEGORY_TOKENS.includes(token)) {
        if (count > 6) {
          pageIssues.push(`category "${token}" x${count} (max 6)`);
        }
        continue;
      }

      // UI 구조 토큰: 6회 상한
      if (UI_TOKENS.includes(token)) {
        if (count > 6) {
          pageIssues.push(`ui-token "${token}" x${count} (max 6)`);
        }
        continue;
      }

      // 일반 의미 토큰: 3회 상한
      if (count > 3) {
        pageIssues.push(`token "${token}" x${count} (max 3)`);
      }
    }

    if (pageIssues.length > 0) {
      fail(`${relPath}: ${pageIssues.length} issue(s)`);
      for (const issue of pageIssues.slice(0, 10)) {
        console.error(`    - ${issue}`);
      }
      if (pageIssues.length > 10) {
        console.error(`    ... and ${pageIssues.length - 10} more`);
      }
      pagesFailed++;
    }
  }

  console.log(`\n  Pages failed: ${pagesFailed}/${htmlFiles.length}`);
  console.log('');

  if (fails > 0) {
    console.error(`FAIL: qa_repeat_limit — ${fails} error(s)`);
    process.exit(1);
  } else {
    console.log('PASS: qa_repeat_limit');
    process.exit(0);
  }
}

main();
