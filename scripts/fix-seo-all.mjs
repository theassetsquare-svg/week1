#!/usr/bin/env node
/**
 * 놀쿨 서브사이트 SEO 전면 수정
 * Step 1: meta description → 150자 제한
 * Step 2: hookTitle → 고유 훅 (가게명 단어 불포함)
 * Step 3: og:image → 실제 Unsplash 이미지 URL
 * Step 4: 가족/금지단어 제거
 * Step 5: robots.txt + sitemap.xml + llms.txt 생성
 * Step 6: 전체 검증
 */
import fs from 'fs';
import path from 'path';

const ROOT = 'public/nolcool';
const SITE_URL = 'https://week1-6m5.pages.dev';

// ── 금지단어 목록 ──
const BANNED = ['다양한','특별한','프리미엄','최고의','뛰어난','차별화된','혁신적인','할수있습니다','제공합니다'];
const FAMILY = ['가족 모임','가족모임','가족 같은','가족이'];

// ── 벤유 데이터 로드 ──
const venueMap = JSON.parse(fs.readFileSync('/tmp/venue-h1-map.json', 'utf8'));

function getHook(slug) {
  const d = venueMap[slug];
  if (!d) return null;
  let hook;
  if (d.h1.includes('—')) {
    hook = d.h1.split('—').slice(1).join('—').trim();
  } else {
    hook = d.h1.replace(d.name, '').trim();
  }
  const nameWords = d.name.replace(/[·\s]/g, ' ').split(' ').filter(w => w.length > 1);
  for (const w of nameWords) {
    if (hook.includes(w)) {
      hook = hook.replace(new RegExp(w, 'g'), '').trim();
    }
  }
  if (!hook || hook.length < 5) return null;
  return hook;
}

function getCategory(fp) {
  const cats = ['night','club','lounge','room','yojeong','hoppa'];
  for (const c of cats) if (fp.includes(`/${c}/`)) return c;
  return null;
}
function getSlug(fp) {
  return fp.split('/').at(-2);
}

let stats = { descFixed: 0, hookFixed: 0, ogFixed: 0, familyFixed: 0, bannedFixed: 0 };

function fixHtml(fp) {
  let html = fs.readFileSync(fp, 'utf8');
  const cat = getCategory(fp);
  const slug = getSlug(fp);
  if (!cat) return;
  let changed = false;

  // STEP 1: meta description → 150자
  html = html.replace(
    /(<meta name="description" content=")([^"]*)(">)/,
    (m, pre, desc, post) => {
      if (desc.length > 150) {
        let cut = desc.substring(0, 147);
        const lastSpace = cut.lastIndexOf(' ');
        const lastPeriod = cut.lastIndexOf('.');
        const cutAt = Math.max(lastSpace, lastPeriod);
        if (cutAt > 100) cut = cut.substring(0, cutAt);
        cut = cut.replace(/[,.\s]+$/, '') + '...';
        stats.descFixed++;
        changed = true;
        return pre + cut + post;
      }
      return m;
    }
  );
  html = html.replace(
    /(<meta property="og:description" content=")([^"]*)(">)/,
    (m, pre, desc, post) => {
      if (desc.length > 150) {
        let cut = desc.substring(0, 147);
        const lastSpace = cut.lastIndexOf(' ');
        const lastPeriod = cut.lastIndexOf('.');
        const cutAt = Math.max(lastSpace, lastPeriod);
        if (cutAt > 100) cut = cut.substring(0, cutAt);
        cut = cut.replace(/[,.\s]+$/, '') + '...';
        return pre + cut + post;
      }
      return m;
    }
  );

  // STEP 2: hookTitle → 고유 훅
  const hook = getHook(slug);
  if (hook) {
    html = html.replace(
      /(<p class="sub">)[^<]*(<\/p>)/,
      (m, pre, post) => {
        stats.hookFixed++;
        changed = true;
        return pre + hook + post;
      }
    );
  }

  // STEP 3: og:image → 실제 Unsplash URL
  const heroMatch = html.match(/<div class="hero"><img src="([^"]+)"/);
  if (heroMatch) {
    const heroUrl = heroMatch[1].replace(/w=\d+&h=\d+/, 'w=1200&h=630');
    html = html.replace(
      /(<meta property="og:image" content=")[^"]*(">)/,
      `$1${heroUrl}$2`
    );
    stats.ogFixed++;
    changed = true;
  }

  // STEP 4: 가족/금지단어
  for (const f of FAMILY) {
    if (html.includes(f)) {
      html = html.replace(/가족 모임/g, '단체 모임');
      html = html.replace(/가족모임/g, '단체모임');
      html = html.replace(/가족 같은/g, '단골 같은');
      html = html.replace(/가족이/g, '단골이');
      stats.familyFixed++;
      changed = true;
      break;
    }
  }
  for (const b of BANNED) {
    if (html.includes(b)) {
      html = html.replace(new RegExp(b, 'g'), '');
      stats.bannedFixed++;
      changed = true;
    }
  }

  if (changed) fs.writeFileSync(fp, html, 'utf8');
}

function fixIndex(fp) {
  let html = fs.readFileSync(fp, 'utf8');
  let changed = false;
  html = html.replace(
    /(<meta name="description" content=")([^"]*)(">)/,
    (m, pre, desc, post) => {
      if (desc.length > 150) {
        let cut = desc.substring(0, 147);
        const ls = cut.lastIndexOf(' ');
        if (ls > 100) cut = cut.substring(0, ls);
        cut = cut.replace(/[,.\s]+$/, '') + '...';
        stats.descFixed++;
        changed = true;
        return pre + cut + post;
      }
      return m;
    }
  );
  html = html.replace(
    /(<meta property="og:description" content=")([^"]*)(">)/,
    (m, pre, desc, post) => {
      if (desc.length > 150) {
        let cut = desc.substring(0, 147);
        const ls = cut.lastIndexOf(' ');
        if (ls > 100) cut = cut.substring(0, ls);
        cut = cut.replace(/[,.\s]+$/, '') + '...';
        return pre + cut + post;
      }
      return m;
    }
  );
  for (const f of FAMILY) {
    if (html.includes(f)) {
      html = html.replace(/가족 모임/g, '단체 모임').replace(/가족모임/g, '단체모임').replace(/가족 같은/g, '단골 같은').replace(/가족이/g, '단골이');
      stats.familyFixed++;
      changed = true;
      break;
    }
  }
  if (changed) fs.writeFileSync(fp, html, 'utf8');
}

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name === 'index.html') {
      const cat = getCategory(full);
      if (cat) fixHtml(full);
      else fixIndex(full);
    }
  }
}

console.log('── STEP 1~4: HTML 수정 ──');
walk(ROOT);
console.log('  meta description 수정:', stats.descFixed);
console.log('  hookTitle 수정:', stats.hookFixed);
console.log('  og:image 실제사진:', stats.ogFixed);
console.log('  가족 참조 수정:', stats.familyFixed);
console.log('  금지단어 수정:', stats.bannedFixed);

// ── STEP 5: robots.txt + sitemap.xml + llms.txt ──
console.log('\n── STEP 5: robots.txt + sitemap.xml + llms.txt ──');

const pages = [];
function collectPages(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) collectPages(full);
    else if (e.name === 'index.html') {
      const rel = full.replace(ROOT, '/nolcool').replace('/index.html', '/');
      pages.push(rel);
    }
  }
}
collectPages(ROOT);

const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/nolcool/sitemap.xml

User-agent: GPTBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: ClaudeBot
Allow: /
`;
fs.writeFileSync(path.join(ROOT, 'robots.txt'), robotsTxt);
console.log('  robots.txt 생성 ✅');

const today = new Date().toISOString().split('T')[0];
const sitemapEntries = pages.map(p =>
  `  <url><loc>${SITE_URL}${p}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${p === '/nolcool/' ? '1.0' : p.split('/').filter(Boolean).length <= 2 ? '0.8' : '0.6'}</priority></url>`
).join('\n');
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</urlset>`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemapXml);
console.log(`  sitemap.xml 생성 (${pages.length}개 URL) ✅`);

const categories = ['night','club','lounge','hoppa','room','yojeong'];
const catNames = { night:'나이트', club:'클럽', lounge:'라운지', hoppa:'호빠', room:'룸', yojeong:'요정' };
const catCounts = {};
for (const p of pages) {
  for (const c of categories) {
    if (p.includes(`/${c}/`) && p !== `/nolcool/${c}/`) {
      catCounts[c] = (catCounts[c] || 0) + 1;
    }
  }
}
const llmsTxt = `# 놀쿨 NOLCOOL
> 전국 나이트·클럽·라운지·룸·요정·호빠 가이드

## 사이트 정보
- 이름: 놀쿨 (NOLCOOL)
- URL: ${SITE_URL}/nolcool/
- 유형: 나이트라이프 정보 가이드 (정적 사이트)
- 언어: 한국어

## 카테고리 (${Object.values(catCounts).reduce((a,b)=>a+b,0)}곳)
${categories.map(c => `- ${catNames[c]}: ${catCounts[c] || 0}곳 → ${SITE_URL}/nolcool/${c}/`).join('\n')}

## 콘텐츠 특징
- 각 가게별 1,000자 이상 상세 설명
- 분위기, 음악, 타임라인, FAQ 정보
- 가격 정보 없음
- 예약/결제 기능 없음
- 실제 이미지 11장 (히어로 1:1 + 갤러리 6장 + 본문 4장)

## 연락처
- 카카오톡: besta12
`;
fs.writeFileSync(path.join(ROOT, 'llms.txt'), llmsTxt);
console.log('  llms.txt 생성 ✅');

// ── STEP 6: 전체 검증 ──
console.log('\n── STEP 6: 전체 검증 ──');
let v = { descOver150: 0, ogSvg: 0, familyLeft: 0, bannedLeft: 0, noImg: 0 };
const hooks = {};

function verify(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) verify(full);
    else if (e.name === 'index.html') {
      const c = fs.readFileSync(full, 'utf8');
      const descM = c.match(/name="description" content="([^"]*)"/);
      if (descM && descM[1].length > 150) v.descOver150++;

      const hookM = c.match(/<p class="sub">([^<]*)<\/p>/);
      if (hookM) hooks[hookM[1]] = (hooks[hookM[1]] || 0) + 1;

      const ogM = c.match(/og:image" content="([^"]*)"/);
      if (ogM && ogM[1].endsWith('.svg')) v.ogSvg++;

      for (const f of FAMILY) if (c.includes(f)) { v.familyLeft++; break; }
      for (const b of BANNED) if (c.includes(b)) { v.bannedLeft++; break; }

      const cat = getCategory(full);
      if (cat && !c.includes('<img ')) v.noImg++;
    }
  }
}
verify(ROOT);

const dupHooks = Object.entries(hooks).filter(([,cnt]) => cnt > 1);
const uniqueHooks = Object.keys(hooks).length;

console.log(`  meta description >150자: ${v.descOver150}개 ${v.descOver150 === 0 ? '✅' : '❌'}`);
console.log(`  고유 hookTitle: ${uniqueHooks}개 / 중복: ${dupHooks.length}개 ${dupHooks.length <= 3 ? '✅' : '⚠️'}`);
if (dupHooks.length > 0) {
  for (const [h, cnt] of dupHooks.sort((a,b) => b[1]-a[1]).slice(0, 5)) {
    console.log(`    "${h.substring(0,30)}..." → ${cnt}건`);
  }
}
console.log(`  og:image SVG 잔존: ${v.ogSvg}개 ${v.ogSvg === 0 ? '✅' : '⚠️'}`);
console.log(`  가족 참조 잔존: ${v.familyLeft}개 ${v.familyLeft === 0 ? '✅' : '❌'}`);
console.log(`  금지단어 잔존: ${v.bannedLeft}개 ${v.bannedLeft === 0 ? '✅' : '❌'}`);
console.log(`  이미지 없는 가게: ${v.noImg}개 ${v.noImg === 0 ? '✅' : '❌'}`);
console.log(`  robots.txt: ${fs.existsSync(path.join(ROOT, 'robots.txt')) ? '✅' : '❌'}`);
console.log(`  sitemap.xml: ${fs.existsSync(path.join(ROOT, 'sitemap.xml')) ? '✅' : '❌'}`);
console.log(`  llms.txt: ${fs.existsSync(path.join(ROOT, 'llms.txt')) ? '✅' : '❌'}`);
