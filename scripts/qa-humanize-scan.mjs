#!/usr/bin/env node
/**
 * qa-humanize-scan.mjs
 * Phase 1: Content QA Scan for AI-like patterns, word repetition, FAQ uniformity.
 * Scans ALL built HTML pages in dist/.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');

function getAllHtml(dir) {
  const r = [];
  for (const e of readdirSync(dir)) {
    const f = join(dir, e);
    if (statSync(f).isDirectory()) r.push(...getAllHtml(f));
    else if (e.endsWith('.html')) r.push(f);
  }
  return r;
}

// Korean particles to exclude from word counting
const PARTICLES = new Set(['이','가','은','는','을','를','에','에서','의','와','과','도','로','으로','며','고','면','나','지','만','서','라','요','다','니','까','든','야']);

function extractText(html) {
  // Remove script/style
  let t = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  t = t.replace(/<style[\s\S]*?<\/style>/gi, '');
  t = t.replace(/<[^>]+>/g, ' ');
  t = t.replace(/&[a-z]+;/gi, ' ');
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

function getKoreanWords(text) {
  // Extract Korean word tokens (2+ chars)
  const matches = text.match(/[가-힣]{2,}/g) || [];
  return matches.filter(w => !PARTICLES.has(w));
}

function getWordFreq(words) {
  const freq = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }
  return freq;
}

// Banned overuse words
const WATCH_WORDS = ['이곳', '매장', '공간', '분위기', '추천', '최고', '완벽', '특별', '다양한', '즐기', '경험'];

const files = getAllHtml(DIST);
const issues = [];
const pageStats = [];
const teaserTexts = []; // for cross-page duplication check

for (const file of files) {
  const rel = file.replace(DIST, '');
  const html = readFileSync(file, 'utf-8');
  const text = extractText(html);
  const words = getKoreanWords(text);
  const freq = getWordFreq(words);
  const pageIssues = [];

  // 1. Word repetition check (>3 times for watch words)
  for (const w of WATCH_WORDS) {
    if (freq[w] && freq[w] > 3) {
      pageIssues.push(`반복 초과: "${w}" ${freq[w]}회`);
    }
  }

  // 2. High frequency words (any word >15 times)
  // Exclude: store names, type labels, region names (intentionally dense for SEO)
  // Exempt store names (auto-detected from page path), type labels, regions, and common structural words
  const SEO_EXEMPT = new Set(['클럽','나이트','라운지','강남','이태원','홍대','부산','대구','대전','인천','수원','광주','해운대','서면','광안리','청담','성남','동성로','일산','천안','부평','강릉','전주','목포','포항','경주','충남','춘천','청주','의정부','부천','독산','길동','신림','강서','확인','방문','입장','안내','음악','공연','시간','매장','정보','사전','이용','추천','가이드','페이지','나이트라이프','코리아','드레스코드','체크리스트','타임라인',
    '부산해운대','부산서면','부산광안리','인천부평','인천송도','압구정','제주','자세히','보기','포함','씬에서','플러스',
    '잠실','창원','노원','평택','강북','고양','김해','독산동','상봉동','순천','수유','성북','영등포','관악','구로','마포','서대문','중구','종로','동작','양천','은평','도봉','성동','광진','송파','용산','서초',
    '울산','라이브','수록','댄스','나이트의','음악과','공간']);
  // Also exempt the venue name itself (extracted from path)
  const pathParts = rel.split('/').filter(Boolean);
  const venueName = decodeURIComponent(pathParts[pathParts.length - 1] || '').replace('index.html', '');
  if (venueName) SEO_EXEMPT.add(venueName);
  // Exempt compound region names from path
  if (pathParts.length >= 2) {
    const regionFromPath = decodeURIComponent(pathParts[pathParts.length - 2] || '');
    if (regionFromPath) SEO_EXEMPT.add(regionFromPath);
  }
  const highFreq = Object.entries(freq)
    .filter(([w, c]) => c > 15 && w.length >= 2 && !SEO_EXEMPT.has(w))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  if (highFreq.length > 0) {
    pageIssues.push(`고빈도 단어: ${highFreq.map(([w,c]) => `${w}(${c})`).join(', ')}`);
  }

  // 3. FAQ pattern check - look for FAQ questions starting the same way
  const faqQs = [...html.matchAll(/class="faq-q"[^>]*>([^<]+)</g)].map(m => m[1].trim());
  if (faqQs.length > 2) {
    const starts = faqQs.map(q => q.slice(0, 3));
    const startFreq = {};
    for (const s of starts) startFreq[s] = (startFreq[s] || 0) + 1;
    const repeatedStarts = Object.entries(startFreq).filter(([,c]) => c > 2);
    if (repeatedStarts.length > 0) {
      pageIssues.push(`FAQ 시작 반복: ${repeatedStarts.map(([s,c]) => `"${s}~" ${c}회`).join(', ')}`);
    }
  }

  // 4. Teaser text for cross-page dup check (venue cards on list/home pages)
  const teasers = [...html.matchAll(/class="venue-card-teaser"[^>]*>([^<]+)</g)].map(m => m[1].trim());
  for (const t of teasers) {
    teaserTexts.push({ text: t, page: rel });
  }

  // 5. Sentence uniformity check - extract sentences and check length variance
  const sentences = text.match(/[가-힣][^.!?]*[.!?]/g) || [];
  if (sentences.length > 5) {
    const lengths = sentences.map(s => s.length);
    const avg = lengths.reduce((a,b) => a+b, 0) / lengths.length;
    const variance = lengths.reduce((a,b) => a + (b - avg) ** 2, 0) / lengths.length;
    const stddev = Math.sqrt(variance);
    if (stddev < 5 && avg > 20) {
      pageIssues.push(`문장 길이 단조: avg=${avg.toFixed(0)} stddev=${stddev.toFixed(1)} — 리듬 변화 부족`);
    }
  }

  // 6. Check for common AI patterns
  const aiPatterns = [
    /다양한\s+[가-힣]+을?\s+즐기/g,
    /특별한\s+경험/g,
    /완벽한\s+[가-힣]+/g,
    /잊지\s+못할\s+[가-힣]+/g,
  ];
  for (const pat of aiPatterns) {
    const matches = text.match(pat);
    if (matches && matches.length > 1) {
      pageIssues.push(`AI 패턴: "${matches[0]}" ${matches.length}회`);
    }
  }

  if (pageIssues.length > 0) {
    issues.push({ path: rel, issues: pageIssues });
  }

  pageStats.push({
    path: rel,
    wordCount: words.length,
    issueCount: pageIssues.length,
    type: rel.includes('/club/') ? 'club-detail' :
          rel.includes('/night/') ? 'night-detail' :
          rel.includes('/lounge/') ? 'lounge-detail' :
          rel.includes('/clubs/') ? 'club-list' :
          rel.includes('/nights/') ? 'night-list' :
          rel.includes('/lounges/') ? 'lounge-list' :
          rel.includes('/region/') ? 'region' :
          rel.includes('/guides/') ? 'guide' :
          rel === '/index.html' ? 'home' : 'other',
  });
}

// 7. Cross-page teaser duplication check
const teaserDups = new Map();
for (const t of teaserTexts) {
  const key = t.text.slice(0, 30);
  if (!teaserDups.has(key)) teaserDups.set(key, []);
  teaserDups.get(key).push(t.page);
}
const dupTeasers = [...teaserDups.entries()].filter(([,pages]) => pages.length > 3);

// Report
console.log('═══ PHASE 0+1: Content QA Scan Report ═══\n');

// Page type summary
const typeCounts = {};
for (const s of pageStats) {
  typeCounts[s.type] = (typeCounts[s.type] || 0) + 1;
}
console.log('── Page Inventory ──');
for (const [type, count] of Object.entries(typeCounts).sort((a,b) => b[1] - a[1])) {
  console.log(`  ${type}: ${count}개`);
}
console.log(`  총: ${pageStats.length}개\n`);

// Issues summary
const issuePages = issues.length;
console.log(`── Content Issues ──`);
console.log(`  문제 페이지: ${issuePages}개 / ${pageStats.length}개`);
console.log(`  정상 페이지: ${pageStats.length - issuePages}개\n`);

// Issue breakdown by type
if (issues.length > 0) {
  console.log('── 문제 상세 (상위 30개) ──');
  for (const issue of issues.slice(0, 30)) {
    console.log(`  ${issue.path}`);
    for (const i of issue.issues) {
      console.log(`    - ${i}`);
    }
  }
  if (issues.length > 30) console.log(`  ... 외 ${issues.length - 30}개`);
}

// Teaser dups
if (dupTeasers.length > 0) {
  console.log(`\n── 카드 티저 중복 (3회 이상 동일 텍스트) ──`);
  for (const [text, pages] of dupTeasers.slice(0, 10)) {
    console.log(`  "${text}..." → ${pages.length}개 페이지`);
  }
}

// Summary of watch word violations
const watchViolations = {};
for (const issue of issues) {
  for (const i of issue.issues) {
    if (i.startsWith('반복 초과')) {
      const word = i.match(/"([^"]+)"/)?.[1];
      if (word) watchViolations[word] = (watchViolations[word] || 0) + 1;
    }
  }
}
if (Object.keys(watchViolations).length > 0) {
  console.log(`\n── Watch Word 위반 요약 ──`);
  for (const [w, c] of Object.entries(watchViolations).sort((a,b) => b[1] - a[1])) {
    console.log(`  "${w}": ${c}개 페이지에서 3회 초과`);
  }
}

console.log('\n═══ Scan Complete ═══');
