#!/usr/bin/env node
/**
 * 전체 130개 페이지 상세 리포트
 * - 가게이름 출현 횟수 (full name_display)
 * - 코어이름 출현 횟수
 * - 지역명 출현 횟수
 * - 카테고리 출현 횟수
 * - 3회 초과 단어 목록
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');
const venuesData = JSON.parse(readFileSync(join(__dirname, '..', 'data', 'venues.json'), 'utf-8'));

function extractVisibleText(html) {
  // Remove head, scripts, style, JSON-LD
  let text = html
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ');
  return text;
}

function countWord(text, word) {
  if (!word || word.length < 2) return 0;
  let count = 0, pos = 0;
  while ((pos = text.indexOf(word, pos)) !== -1) { count++; pos += word.length; }
  return count;
}

function getKoreanTokenCounts(text) {
  const tokens = text.match(/[\uAC00-\uD7AF]{2,}/g) || [];
  const counts = {};
  for (const t of tokens) counts[t] = (counts[t] || 0) + 1;
  return counts;
}

console.log('================================================================');
console.log('  전체 130개 매장 페이지 상세 리포트');
console.log('================================================================\n');

// Summary tables
const allResults = [];

for (const v of venuesData) {
  const typePath = v.typePath;
  const slug = v.urlSlug || v.venueSlug;
  const htmlPath = join(distDir, typePath, v.regionSlug, slug, 'index.html');

  if (!existsSync(htmlPath)) {
    console.log(`  [SKIP] ${v.name_display} — HTML not found`);
    continue;
  }

  const html = readFileSync(htmlPath, 'utf-8');
  const visibleText = extractVisibleText(html);

  // Get core name (without region and type)
  let coreName = v.name_display;
  if (v.region) coreName = coreName.replace(v.region + ' ', '').replace(v.region, '');
  for (const t of ['클럽', '나이트', '라운지']) {
    coreName = coreName.replace(' ' + t, '').replace(t, '');
  }
  coreName = coreName.trim();

  const typeLabel = v.typeLabel || '';

  const fullNameCount = countWord(visibleText, v.name_display);
  const coreNameCount = countWord(visibleText, coreName);
  const regionCount = countWord(visibleText, v.region);
  const typeCount = countWord(visibleText, typeLabel);

  // Get words exceeding 3 occurrences
  const tokenCounts = getKoreanTokenCounts(visibleText);
  const FUNC_WORDS = new Set([
    '그리고', '그러나', '하지만', '그래서', '또한', '그런데', '그래도', '따라서',
    '그러므로', '만약', '때문', '위해', '대한', '통해', '따른', '같은',
    '위한', '대해', '관한', '있는', '없는', '하는', '되는', '있을', '없을',
    '합니다', '입니다', '됩니다', '있습니다', '없습니다', '것입니다',
    '에서', '으로', '부터', '까지', '에게', '보다', '처럼', '같이',
    '대로', '밖에', '이며', '이고', '이나', '지만', '면서',
    '우리', '저희', '자신', '모든', '어떤', '이런', '그런',
    '가장', '매우', '정말', '너무', '아주', '상당히',
    '하지', '않는', '못하', '않은',
    '것이', '것을', '것은', '것도', '것으로', '수도', '있어', '보는', '주는', '라는',
    '이다', '된다', '한다', '온다', '간다', '해서', '에는',
  ]);

  const overLimit = Object.entries(tokenCounts)
    .filter(([t, c]) => c > 3 && !FUNC_WORDS.has(t))
    .sort((a, b) => b[1] - a[1]);

  allResults.push({
    name: v.name_display,
    path: `/${typePath}/${v.regionSlug}/${slug}/`,
    fullNameCount,
    coreNameCount,
    regionCount,
    typeCount,
    overLimit,
    coreName,
    region: v.region,
    typeLabel,
  });
}

// === TABLE 1: 가게이름 출현 횟수 ===
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  [표1] 가게이름 출현 횟수 (보이는 텍스트 기준)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('매장명'.padEnd(28) + '풀네임  코어명  지역명  타입');
console.log('─'.repeat(65));

for (const r of allResults) {
  const line = r.name.padEnd(28) +
    String(r.fullNameCount).padStart(4) + '회  ' +
    String(r.coreNameCount).padStart(4) + '회  ' +
    String(r.regionCount).padStart(4) + '회  ' +
    String(r.typeCount).padStart(4) + '회';
  console.log(line);
}

// Summary stats
const avgFull = (allResults.reduce((s, r) => s + r.fullNameCount, 0) / allResults.length).toFixed(1);
const avgCore = (allResults.reduce((s, r) => s + r.coreNameCount, 0) / allResults.length).toFixed(1);
const avgRegion = (allResults.reduce((s, r) => s + r.regionCount, 0) / allResults.length).toFixed(1);
const avgType = (allResults.reduce((s, r) => s + r.typeCount, 0) / allResults.length).toFixed(1);

console.log('─'.repeat(65));
console.log('평균'.padEnd(28) +
  avgFull.padStart(4) + '회  ' +
  avgCore.padStart(4) + '회  ' +
  avgRegion.padStart(4) + '회  ' +
  avgType.padStart(4) + '회');

// === TABLE 2: 3회 초과 반복 단어 ===
console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  [표2] 3회 초과 반복 단어 (기능어 제외)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

let totalOverLimit = 0;
for (const r of allResults) {
  if (r.overLimit.length === 0) {
    console.log(`✅ ${r.name}: 없음`);
  } else {
    const words = r.overLimit.map(([w, c]) => `${w}(${c})`).join(', ');
    console.log(`❌ ${r.name}: ${r.overLimit.length}개 — ${words}`);
    totalOverLimit += r.overLimit.length;
  }
}

console.log('\n─'.repeat(65));
console.log(`총 3회 초과 단어 건수: ${totalOverLimit}건 (${allResults.length}개 페이지)`);
console.log(`3회 이하 통과 페이지: ${allResults.filter(r => r.overLimit.length === 0).length}/${allResults.length}`);
