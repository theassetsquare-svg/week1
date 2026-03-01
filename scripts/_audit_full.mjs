#!/usr/bin/env node
/**
 * _audit_full.mjs — COMPREHENSIVE FINAL AUDIT
 * Covers: banned words, repetition, FAQ openers, title rules,
 *         OG/schema/canonical, target_blank, map links,
 *         8-word duplicate phrases across pages, store name count
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const VENUES = JSON.parse(readFileSync(join(ROOT, 'data', 'venues.json'), 'utf-8'));

const BANNED = ['해당', '이곳', '공간', '매장', '감도', '기준'];

const SKIP_WALK = new Set([
  'id', 'type', 'typePath', 'typeLabel', 'regionSlug', 'venueSlug', 'urlSlug',
  'geo', 'images', 'imagePrompts', 'relatedVenueIds', 'map_url',
  'name_display', 'name_input', 'name_seo', 'region',
  'card_tags', 'sourcePath'
]);

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

function getProtected(v) {
  const s = new Set();
  [v.name_display, v.name_input, v.name_seo].filter(Boolean).forEach(n => {
    (n.match(/[\uAC00-\uD7AF]{2,}/g) || []).forEach(p => s.add(p));
  });
  if (v.region) (v.region.match(/[\uAC00-\uD7AF]{2,}/g) || []).forEach(p => s.add(p));
  return s;
}

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

const results = { pass: 0, fail: 0, details: [] };
function check(name, pass, detail) {
  if (pass) { results.pass++; }
  else { results.fail++; results.details.push({ name, detail }); }
  const icon = pass ? 'PASS' : 'FAIL';
  console.log(`[${icon}] ${name}${detail && !pass ? ': ' + detail : ''}`);
}

console.log('='.repeat(60));
console.log('FULL SITE AUDIT');
console.log('='.repeat(60));

// ── CHECK 1: Banned words in data ──
let bannedCount = 0;
function checkBannedInObj(obj, path, venueName) {
  if (typeof obj === 'string') {
    for (const w of BANNED) {
      if (obj.includes(w)) bannedCount++;
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
check('Banned words in data', bannedCount === 0, `${bannedCount} instances`);

// ── CHECK 2: Word repetition >5 per venue (excluding common Korean words) ──
// Common Korean functional/topical words that naturally repeat in venue guide content
const COMMON_KR = new Set([
  // Existence/state verbs
  '있는', '있다', '있을', '있으면', '있으니', '없는', '없다', '있습니다',
  // Action verb forms
  '하는', '하고', '하며', '하면', '합니다', '하세요', '하기',
  '되는', '됩니다', '되지', '되며', '되어', '된다',
  // Particles/postpositions (2+ char)
  '에서', '에서의', '으로', '에게', '부터', '까지', '처럼', '만큼', '보다',
  '위해', '통해', '대해', '따라', '함께', '대한', '관한',
  // Conjunctions
  '그리고', '또는', '하지만', '그러나', '그래서', '따라서',
  // Common venue-guide vocabulary
  '확인', '방문', '예약', '입장', '준비', '추천', '문의', '이용', '운영',
  '분위기', '음악', '사운드', '시간', '정보', '가능', '필요', '서비스',
  '음료', '테이블', '드레스', '코드',
  // Quantifiers/modifiers
  '번째', '가장', '바로', '사전', '직접', '미리', '정도', '이상', '이하',
  '모든', '다양한', '특별한', '일반', '기본',
  // Temporal/spatial
  '이전', '이후', '경우', '때문', '주말', '평일', '오전', '오후', '저녁',
  // Demonstratives
  '이런', '그런', '어떤',
  // Nightlife topic vocabulary
  '밤문화', '나이트', '클럽', '라운지', '댄스', '라이브', '공연', '무대',
  '음향', '조명', '피크타임', '드레스코드', '입구', '플로어',
  '신분증', '게스트', '도착', '출발', '메뉴', '이벤트',
  '가이드', '체크리스트', '반드시', '씬에서',
  // Common verbs/adjectives (2+ char)
  '즐기', '느끼', '선택', '제공', '제대로', '만들어',
  '깔끔한', '좋은', '새로운', '오른다', '단순한',
  // Structural words
  '것이', '하나의', '이라는', '곳이다', '이다', '수록',
  '밤을', '밤에', '에서는',
]);

const PARTICLES_SHORT = ['은','는','을','를','이','가','의','에','와','과','도','만','로','서','라','며','고','면','다','요'];
function getExtendedProtected(v) {
  const s = getProtected(v);
  // Add coreName + particle combos
  let coreName = (v.name_display || '').replace(v.region + ' ', '').replace(/\s+(클럽|나이트|라운지)\s*$/,'').trim();
  if (coreName) {
    PARTICLES_SHORT.forEach(p => { s.add(coreName + p); });
    // Also add full name + particles
    s.add(coreName);
  }
  // Add type + particle combos
  const typeWord = (v.typeLabel || v.type || '').replace(/\s/g, '');
  if (typeWord) {
    PARTICLES_SHORT.forEach(p => { s.add(typeWord + p); });
    s.add(typeWord);
  }
  return s;
}

let repVenues = 0, repTotal = 0;
VENUES.forEach(v => {
  const prot = getExtendedProtected(v);
  const tokens = (getAllText(v).match(/[\uAC00-\uD7AF]{2,}/g) || []);
  const freq = {};
  tokens.forEach(w => { if (!prot.has(w) && !COMMON_KR.has(w)) freq[w] = (freq[w] || 0) + 1; });
  const over = Object.entries(freq).filter(([, c]) => c >= 5);
  if (over.length > 0) {
    repVenues++;
    over.forEach(([, c]) => { repTotal += c - 4; });
  }
});
check('Word repetition >=5 (data, excl common)', repTotal === 0, `venues=${repVenues}, excess=${repTotal}`);

// ── CHECK 3: FAQ opener diversity ──
let faqIssues = 0;
VENUES.forEach(v => {
  if (!v.faq || v.faq.length < 2) return;
  const openers = v.faq.map(f => f.q.trim().split(/\s+/).slice(0, 2).join(' '));
  const counts = {};
  openers.forEach(o => { counts[o] = (counts[o] || 0) + 1; });
  if (Object.values(counts).some(c => c > 1)) faqIssues++;
});
check('FAQ opener diversity', faqIssues === 0, `${faqIssues} venues with duplicate openers`);

// ── CHECK 4: Title uniqueness & store-name-first ──
const titles = new Map();
let titleDups = 0, titleNotFirst = 0;
VENUES.forEach(v => {
  const title = v.pageTitle || '';
  if (titles.has(title)) titleDups++;
  titles.set(title, v.name_display);
  if (title && !title.startsWith(v.name_display)) titleNotFirst++;
});
check('Title uniqueness', titleDups === 0, `${titleDups} duplicates`);
check('Title store-name-first', titleNotFirst === 0, `${titleNotFirst} not first`);

// ── CHECK 5: HTML-level checks ──
if (existsSync(DIST)) {
  const allHtml = walkHtml(DIST);
  const detailDirs = ['club', 'night', 'lounge'];
  const detailFiles = [];
  for (const dir of detailDirs) {
    const dp = join(DIST, dir);
    if (existsSync(dp)) walkHtml(dp, detailFiles);
  }

  // OG image
  let missingOg = 0;
  for (const file of detailFiles) {
    if (!readFileSync(file, 'utf-8').includes('og:image')) missingOg++;
  }
  check('OG image (detail pages)', missingOg === 0, `${missingOg} missing`);

  // JSON-LD
  let missingSchema = 0;
  for (const file of detailFiles) {
    if (!readFileSync(file, 'utf-8').includes('application/ld+json')) missingSchema++;
  }
  check('JSON-LD schema (detail)', missingSchema === 0, `${missingSchema} missing`);

  // Map links
  let missingMap = 0;
  for (const file of detailFiles) {
    const html = readFileSync(file, 'utf-8');
    if (!html.includes('map.kakao.com') && !html.includes('maps.google.com') && !html.includes('google.com/maps') && !html.includes('maps.app.goo.gl') && !html.includes('map.naver.com')) missingMap++;
  }
  check('Map links (detail)', missingMap === 0, `${missingMap} missing`);

  // target=_blank
  let pagesNoTarget = 0;
  for (const file of allHtml) {
    const html = readFileSync(file, 'utf-8');
    const links = html.match(/<a\s[^>]*href="[^"]*"[^>]*>/g) || [];
    const noTarget = links.filter(l => !l.includes('target=') && !l.includes('href="#') && !l.includes('href="javascript'));
    if (noTarget.length > 0) pagesNoTarget++;
  }
  check('target=_blank (all pages)', pagesNoTarget === 0, `${pagesNoTarget} pages with missing target`);

  // Canonical
  let missingCanon = 0;
  for (const file of allHtml) {
    if (!readFileSync(file, 'utf-8').includes('canonical')) missingCanon++;
  }
  check('Canonical tags (all)', missingCanon === 0, `${missingCanon} missing`);

  // Banned words in ALL HTML
  let htmlBanned = 0;
  const bannedPages = [];
  for (const file of allHtml) {
    const text = extractText(readFileSync(file, 'utf-8'));
    for (const w of BANNED) {
      const regex = new RegExp(`(?<![\uAC00-\uD7AF])${w}(?![\uAC00-\uD7AF])`, 'g');
      const matches = [...text.matchAll(regex)];
      if (matches.length > 0) {
        htmlBanned += matches.length;
        bannedPages.push({ page: file.replace(DIST, ''), word: w, count: matches.length });
      }
    }
  }
  check('Banned words in HTML (all)', htmlBanned === 0, `${htmlBanned} instances`);
  if (bannedPages.length > 0) {
    bannedPages.slice(0, 10).forEach(b => console.log(`    ${b.page}: "${b.word}" x${b.count}`));
  }

  // 8-word duplicate phrases across detail pages
  console.log('\n--- Cross-page 8-word phrase duplication ---');
  const phraseMap = new Map();
  let dupPhraseCount = 0;
  for (const file of detailFiles) {
    const text = extractText(readFileSync(file, 'utf-8'));
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const relPath = file.replace(DIST, '');
    for (let i = 0; i <= words.length - 8; i++) {
      const phrase = words.slice(i, i + 8).join(' ');
      if (!phraseMap.has(phrase)) phraseMap.set(phrase, []);
      const arr = phraseMap.get(phrase);
      if (!arr.includes(relPath)) arr.push(relPath);
    }
  }
  for (const [phrase, pages] of phraseMap) {
    if (pages.length >= 3) dupPhraseCount++;
  }
  check('Cross-page 8-word phrase dup (>=3 pages)', dupPhraseCount === 0, `${dupPhraseCount} phrases shared across 3+ pages`);

  // Sitemap
  const sitemapPath = join(DIST, 'sitemap.xml');
  const sitemapExists = existsSync(sitemapPath);
  let sitemapUrls = 0;
  if (sitemapExists) {
    sitemapUrls = (readFileSync(sitemapPath, 'utf-8').match(/<loc>/g) || []).length;
  }
  check('Sitemap exists + URLs', sitemapExists && sitemapUrls >= 187, `${sitemapUrls} URLs`);

  // robots.txt
  const robotsPath = join(DIST, 'robots.txt');
  const robotsOk = existsSync(robotsPath) && readFileSync(robotsPath, 'utf-8').includes('Sitemap');
  check('robots.txt with Sitemap', robotsOk, '');

  // RSS
  const rssPath = join(DIST, 'rss.xml');
  const rssExists = existsSync(rssPath);
  check('RSS feed exists', rssExists, '');

  // Page count
  check(`Total pages built`, allHtml.length >= 189, `${allHtml.length} pages`);
  check(`Detail pages`, detailFiles.length === 130, `${detailFiles.length} detail pages`);
}

// ── SUMMARY ──
console.log('\n' + '='.repeat(60));
console.log(`AUDIT SUMMARY: ${results.pass} PASS / ${results.fail} FAIL`);
console.log('='.repeat(60));
if (results.fail === 0) {
  console.log('\n✅ ALL CHECKS PASSED');
} else {
  console.log('\n❌ FAILURES:');
  results.details.forEach(d => console.log(`  - ${d.name}: ${d.detail}`));
}
