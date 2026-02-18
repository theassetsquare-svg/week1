#!/usr/bin/env node
/**
 * qa_repeat_limit.mjs
 * 반복 단어 제한 검사 (의미 토큰 기준)
 *
 * 규칙:
 * - 의미 단어(핵심 토큰): 어떤 단어도 3회 초과 시 FAIL
 * - 브랜드명 토큰: skip (brand_count에서 별도 관리, 전체 4~8 우선)
 * - 지역/카테고리: 각 6회
 * - UI 구조 토큰(FAQ/목차/지도/위치/주차/체크리스트 등): 각 6회
 * - 상투어(이곳/매장/공간/여기/해당/장소): 예외 없이 3회 이하
 * - 기능어(stopwords_ko.json) 제외
 * - 초과 토큰 TOP10 + 위치(섹션) 출력
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const VENUES = JSON.parse(readFileSync(join(ROOT, 'data', 'venues.json'), 'utf-8'));
const STOPWORDS = new Set(JSON.parse(readFileSync(join(ROOT, 'data', 'stopwords_ko.json'), 'utf-8')));

let fails = 0;

function fail(msg) { console.error(`  FAIL: ${msg}`); fails++; }

// 상투어 목록 (예외 없이 페이지당 각 3회 이하)
const CLICHE_WORDS = ['이곳', '매장', '공간', '여기', '해당', '장소'];

// UI 구조 토큰 (6회 상한)
const UI_TOKENS = new Set(['목차', '지도', '위치', '주차', '체크리스트', '갤러리', '타임라인',
  '스토리텔링', '커스텀', '첫방문', '뮤직', '자주', '묻는', '질문', '관련',
  '심층', '분석', '성향', '테스트', '후기', '비교', '검색어']);

// 카테고리 토큰 (6회 상한)
const CATEGORY_TOKENS = new Set(['나이트', '클럽', '라운지', '나이트라이프', '밤문화']);

function walkHtml(dir, list = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walkHtml(p, list);
    else if (f.endsWith('.html')) list.push(p);
  }
  return list;
}

/**
 * HTML에서 섹션별 텍스트 추출 (섹션 ID 기준)
 */
function extractSections(html) {
  // script/style 제거
  const cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  const sections = [];
  // section id별로 분할
  const sectionRegex = /<section[^>]*id=["']([^"']+)["'][^>]*>([\s\S]*?)(?=<section|<\/div>\s*<script|$)/gi;
  let match;
  while ((match = sectionRegex.exec(cleaned)) !== null) {
    const id = match[1];
    const text = match[2].replace(/<[^>]+>/g, ' ').replace(/&[a-zA-Z]+;/g, ' ').replace(/&#\d+;/g, ' ').replace(/\s+/g, ' ').trim();
    sections.push({ id, text });
  }

  // 전체 텍스트도 추출 (fallback)
  const fullText = cleaned
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-zA-Z]+;/g, ' ')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return { sections, fullText };
}

/**
 * 한국어 의미 토큰 추출 (2글자 이상 한글, URL/숫자 제외)
 */
function extractKoreanTokens(text) {
  // URL 제거
  const noUrls = text.replace(/https?:\/\/[^\s]+/g, '');
  // 숫자/영문 제거
  const noNums = noUrls.replace(/[0-9a-zA-Z]+/g, ' ');
  const matches = noNums.match(/[\uAC00-\uD7AF]{2,}/g) || [];
  return matches;
}

function main() {
  console.log('=== qa_repeat_limit ===\n');

  if (!existsSync(DIST)) {
    fail('dist/ not found');
    process.exit(1);
  }

  // 업소명/지역 매핑
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
    const { sections, fullText } = extractSections(html);
    const pageIssues = [];

    // 해당 페이지의 브랜드명 추출 (title에서)
    const titleMatch = html.match(/<title>(.*?)<\/title>/s);
    const title = titleMatch ? titleMatch[1] : '';
    let brandName = '';
    let coreName = '';
    let regionName = '';
    for (const v of VENUES) {
      if (title.includes(v.name_display)) {
        brandName = v.name_display;
        regionName = v.region;
        // coreName: name_display에서 region과 type 제거
        let cn = v.name_display;
        if (v.region) cn = cn.replace(v.region + ' ', '').replace(v.region, '');
        let cnNoType = cn;
        for (const t of ['클럽', '나이트', '라운지']) {
          cnNoType = cnNoType.replace(' ' + t, '').replace(t, '');
        }
        cnNoType = cnNoType.trim();
        coreName = cnNoType.length < 2 ? cn.trim().replace(/\s+/g, '') : cnNoType;
        break;
      }
    }

    // 브랜드명 구성 토큰 세트 (2글자 이상 한글 부분)
    const brandTokens = new Set();
    if (brandName) {
      const parts = brandName.match(/[\uAC00-\uD7AF]{2,}/g) || [];
      for (const p of parts) brandTokens.add(p);
    }

    // 1) 상투어 검사 (각 3회 이하) — 전체 텍스트에서 substring 카운트
    for (const word of CLICHE_WORDS) {
      let count = 0;
      let pos = 0;
      while ((pos = fullText.indexOf(word, pos)) !== -1) { count++; pos += word.length; }
      if (count > 3) {
        // 어느 섹션에서 나왔는지
        const locs = [];
        for (const sec of sections) {
          let sc = 0; let sp = 0;
          while ((sp = sec.text.indexOf(word, sp)) !== -1) { sc++; sp += word.length; }
          if (sc > 0) locs.push(`${sec.id}:${sc}`);
        }
        pageIssues.push({ token: word, count, max: 3, type: 'cliche', locations: locs.join(', ') });
      }
    }

    // 2) 한국어 토큰 추출 및 카운팅
    const tokens = extractKoreanTokens(fullText);
    const tokenCounts = {};
    for (const t of tokens) {
      tokenCounts[t] = (tokenCounts[t] || 0) + 1;
    }

    // 섹션별 토큰 위치 매핑 (초과 토큰 위치 보고용)
    const sectionTokenCounts = {};
    for (const sec of sections) {
      const secTokens = extractKoreanTokens(sec.text);
      const counts = {};
      for (const t of secTokens) counts[t] = (counts[t] || 0) + 1;
      sectionTokenCounts[sec.id] = counts;
    }

    // 3) 각 토큰별 제한 적용
    for (const [token, count] of Object.entries(tokenCounts)) {
      // stopwords 제외
      if (STOPWORDS.has(token)) continue;
      if (token.length < 2) continue;

      // 브랜드명 토큰: skip (brand_count에서 별도 관리)
      if (brandName && brandName.includes(token)) continue;
      // coreName + 조사 결합형 스킵
      if (coreName && coreName.length >= 2 && token.startsWith(coreName)) continue;
      // brandTokens에 속하는 경우
      if (brandTokens.has(token)) continue;

      // 지역명: 6회 상한
      if (regionSet.has(token) || (regionName && token === regionName)) {
        if (count > 6) {
          const locs = findTokenLocations(token, sectionTokenCounts);
          pageIssues.push({ token, count, max: 6, type: 'region', locations: locs });
        }
        continue;
      }

      // 카테고리 토큰: 6회 상한
      if (CATEGORY_TOKENS.has(token)) {
        if (count > 6) {
          const locs = findTokenLocations(token, sectionTokenCounts);
          pageIssues.push({ token, count, max: 6, type: 'category', locations: locs });
        }
        continue;
      }

      // UI 구조 토큰: 6회 상한
      if (UI_TOKENS.has(token)) {
        if (count > 6) {
          const locs = findTokenLocations(token, sectionTokenCounts);
          pageIssues.push({ token, count, max: 6, type: 'ui-token', locations: locs });
        }
        continue;
      }

      // 상투어는 이미 위에서 검사 (substring 방식)
      if (CLICHE_WORDS.includes(token)) continue;

      // 일반 의미 토큰: 3회 상한
      if (count > 3) {
        const locs = findTokenLocations(token, sectionTokenCounts);
        pageIssues.push({ token, count, max: 3, type: 'token', locations: locs });
      }
    }

    if (pageIssues.length > 0) {
      // 초과량 기준 정렬 (가장 심한 것부터)
      pageIssues.sort((a, b) => (b.count - b.max) - (a.count - a.max));
      fail(`${relPath}: ${pageIssues.length} issue(s)`);
      for (const issue of pageIssues.slice(0, 10)) {
        const locStr = issue.locations ? ` [${issue.locations}]` : '';
        console.error(`    - ${issue.type} "${issue.token}" x${issue.count} (max ${issue.max})${locStr}`);
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

function findTokenLocations(token, sectionTokenCounts) {
  const locs = [];
  for (const [secId, counts] of Object.entries(sectionTokenCounts)) {
    if (counts[token]) locs.push(`${secId}:${counts[token]}`);
  }
  return locs.join(', ');
}

main();
