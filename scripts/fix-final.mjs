#!/usr/bin/env node
/**
 * 최종 전면 수정 스크립트
 * 1. title 태그 = "가게이름 — hookTitle" (중복단어 제거)
 * 2. og:title = 가게이름 전체 포함
 * 3. meta description ≤ 150자 (정밀 검증)
 * 4. JSON-LD NightClub 스키마 검증
 * 5. 해운대고구려 신실장 제거
 * 6. 이미지 해시 개선 (중복 방지)
 * 7. 광고주 없는 업소 닉네임/전화 제거
 * 8. 금지단어/가족 재검증
 * 9. title 중복단어 검증
 */
import fs from 'fs';
import path from 'path';

const ROOT = 'public/nolcool';
const venueMap = JSON.parse(fs.readFileSync('/tmp/venue-h1-map.json', 'utf8'));

// 광고주 없는 업소 (닉네임/전화 표시 금지)
const NO_AD = ['sangbong-hankukgwan','hwajeong-hankukgwan','suwon-korea','bundang-pongpong',
  'busan-asiad','ulsan-newworld','suyu-shampoo','indeokwon-gukbingwan'];
// 해운대고구려 = 신실장 금지
const NO_SHIN = ['haeundae-goguryeo'];

// 이미지 풀 (카테고리별)
const POOLS = {
  night: [
    'photo-1566737236500-c8ac43014a67','photo-1516450360452-9312f5e86fc7',
    'photo-1492684223066-81342ee5ff30','photo-1429962714451-bb934ecdc4ec',
    'photo-1508700115892-45ecd05ae2ad','photo-1504196606672-aef5c9cefc92',
    'photo-1598387993281-cecf8b71a8f8','photo-1571204829887-3b8d69e4094d',
    'photo-1549488344-cbb6c34cf08b','photo-1559628233-100c798642d4',
    'photo-1533174072545-7a4b6ad7a6c3','photo-1496337589254-7e19d01cec44',
    'photo-1536599018102-9f803c140fc1','photo-1563227812-0ea4c22e6cc8',
    'photo-1572947650440-e8a97ef053b2','photo-1585518419759-7fe2e0fbf8a6',
  ],
  club: [
    'photo-1470225620780-dba8ba36b745','photo-1574391884720-bbc3740c59d1',
    'photo-1536599018102-9f803c140fc1','photo-1563227812-0ea4c22e6cc8',
    'photo-1572947650440-e8a97ef053b2','photo-1585518419759-7fe2e0fbf8a6',
    'photo-1481833761820-0509d3217039','photo-1504593811423-6dd665756598',
    'photo-1566737236500-c8ac43014a67','photo-1516450360452-9312f5e86fc7',
    'photo-1429962714451-bb934ecdc4ec','photo-1508700115892-45ecd05ae2ad',
    'photo-1492684223066-81342ee5ff30','photo-1559628233-100c798642d4',
    'photo-1533174072545-7a4b6ad7a6c3','photo-1549488344-cbb6c34cf08b',
  ],
  lounge: [
    'photo-1514362545857-3bc16c4c7d1b','photo-1551024709-8f23befc6f87',
    'photo-1543007630-9710e4a00a20','photo-1525268323446-0505b6fe7778',
    'photo-1560840067-ddcaeb7831d2','photo-1519214605650-76a613ee3245',
    'photo-1517248135467-4c7edcad34c4','photo-1546171753-97d7676e4602',
    'photo-1585518419759-7fe2e0fbf8a6','photo-1571204829887-3b8d69e4094d',
    'photo-1438557068880-c5f474830377','photo-1541532713592-79a0317b6b77',
    'photo-1567532939604-b6b5b0db2604','photo-1415201364774-f6f0bb35f28f',
    'photo-1600093463592-8e36ae95ef56','photo-1580809361436-42a7ec204889',
  ],
  room: [
    'photo-1438557068880-c5f474830377','photo-1541532713592-79a0317b6b77',
    'photo-1580809361436-42a7ec204889','photo-1517248135467-4c7edcad34c4',
    'photo-1560840067-ddcaeb7831d2','photo-1543007630-9710e4a00a20',
    'photo-1514362545857-3bc16c4c7d1b','photo-1519214605650-76a613ee3245',
    'photo-1546171753-97d7676e4602','photo-1551024709-8f23befc6f87',
    'photo-1600093463592-8e36ae95ef56','photo-1585518419759-7fe2e0fbf8a6',
    'photo-1567532939604-b6b5b0db2604','photo-1415201364774-f6f0bb35f28f',
    'photo-1598387993281-cecf8b71a8f8','photo-1571204829887-3b8d69e4094d',
  ],
  yojeong: [
    'photo-1517154421773-0529f29ea451','photo-1621508638997-e30808c10653',
    'photo-1600093463592-8e36ae95ef56','photo-1580809361436-42a7ec204889',
    'photo-1438557068880-c5f474830377','photo-1541532713592-79a0317b6b77',
    'photo-1517248135467-4c7edcad34c4','photo-1543007630-9710e4a00a20',
    'photo-1546171753-97d7676e4602','photo-1519214605650-76a613ee3245',
    'photo-1560840067-ddcaeb7831d2','photo-1415201364774-f6f0bb35f28f',
    'photo-1567532939604-b6b5b0db2604','photo-1514362545857-3bc16c4c7d1b',
    'photo-1551024709-8f23befc6f87','photo-1525268323446-0505b6fe7778',
  ],
  hoppa: [
    'photo-1514362545857-3bc16c4c7d1b','photo-1567532939604-b6b5b0db2604',
    'photo-1551024709-8f23befc6f87','photo-1525268323446-0505b6fe7778',
    'photo-1546171753-97d7676e4602','photo-1519214605650-76a613ee3245',
    'photo-1560840067-ddcaeb7831d2','photo-1571204829887-3b8d69e4094d',
    'photo-1543007630-9710e4a00a20','photo-1415201364774-f6f0bb35f28f',
    'photo-1598387993281-cecf8b71a8f8','photo-1585518419759-7fe2e0fbf8a6',
    'photo-1438557068880-c5f474830377','photo-1541532713592-79a0317b6b77',
    'photo-1580809361436-42a7ec204889','photo-1600093463592-8e36ae95ef56',
  ],
};

// 개선된 해시 (slug+index로 충돌 방지)
function betterHash(slug) {
  let h = 5381;
  for (let i = 0; i < slug.length; i++) {
    h = ((h << 5) + h + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pickPhotos(pool, slug, count) {
  const h = betterHash(slug);
  const result = [];
  const len = pool.length;
  const step = Math.max(1, Math.floor(len / count));
  for (let i = 0; i < count; i++) {
    result.push(pool[(h + i * step + i) % len]);
  }
  // 중복 제거
  const seen = new Set();
  for (let i = 0; i < result.length; i++) {
    if (seen.has(result[i])) {
      // 대체 이미지 찾기
      for (let j = 0; j < len; j++) {
        const alt = pool[(h + count + j) % len];
        if (!seen.has(alt)) { result[i] = alt; break; }
      }
    }
    seen.add(result[i]);
  }
  return result;
}

function imgUrl(pid, w, h) {
  return `https://images.unsplash.com/${pid}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;
}

function getCategory(fp) {
  for (const c of ['night','club','lounge','room','yojeong','hoppa'])
    if (fp.includes(`/${c}/`)) return c;
  return null;
}
function getSlug(fp) { return fp.split('/').at(-2); }

function getHook(slug) {
  const d = venueMap[slug];
  if (!d) return null;
  let hook = d.h1.includes('—') ? d.h1.split('—').slice(1).join('—').trim() : d.h1.replace(d.name,'').trim();
  const nameWords = d.name.replace(/[·\s]/g,' ').split(' ').filter(w => w.length > 1);
  for (const w of nameWords) hook = hook.replace(new RegExp(w,'g'),'').trim();
  return hook && hook.length >= 5 ? hook : null;
}

// title에서 중복 단어 제거
function removeDupWords(title) {
  if (!title.includes('—')) return title;
  const [left, right] = title.split('—').map(s => s.trim());
  // left 단어들 추출 (2자 이상)
  const leftWords = left.replace(/[^가-힣a-zA-Z0-9\s]/g,' ').split(/\s+/).filter(w => w.length >= 2);
  let cleaned = right;
  for (const w of leftWords) {
    // right에서 중복 단어 제거
    if (cleaned.includes(w)) {
      cleaned = cleaned.replace(new RegExp(w + '[에서는의을를]?','g'), '').trim();
    }
  }
  cleaned = cleaned.replace(/^[,.\s—·]+/,'').replace(/\s+/g,' ').trim();
  if (!cleaned || cleaned.length < 3) return left;
  return `${left} — ${cleaned}`;
}

let stats = { title: 0, ogTitle: 0, desc: 0, img: 0, shin: 0, noAd: 0 };

function fixPage(fp) {
  let html = fs.readFileSync(fp, 'utf8');
  const cat = getCategory(fp);
  const slug = getSlug(fp);
  if (!cat) return;
  const d = venueMap[slug];
  if (!d) return;
  let changed = false;

  // 1. title 태그 = "가게이름 — hookTitle" (중복단어 제거)
  const hook = getHook(slug);
  if (hook) {
    const newTitle = removeDupWords(`${d.name} — ${hook}`);
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${newTitle}</title>`);
    stats.title++;
    changed = true;
  }

  // 2. og:title = 가게이름 전체
  html = html.replace(
    /(<meta property="og:title" content=")[^"]*(">)/,
    `$1${d.name} — ${d.name.match(/나이트|클럽|라운지|룸|요정|호빠/) ? '' : (venueMap[slug]?.name.split(/\s/).pop() || '')} 솔직 가이드$2`
  );
  // 더 깔끔하게
  const ogTitle = `${d.name} 솔직 가이드`;
  html = html.replace(
    /(<meta property="og:title" content=")[^"]*(">)/,
    `$1${ogTitle}$2`
  );
  stats.ogTitle++;

  // 3. meta description ≤ 150자 (재검증)
  html = html.replace(
    /(<meta name="description" content=")([^"]*)(">)/,
    (m, pre, desc, post) => {
      if ([...desc].length > 150) {
        const chars = [...desc];
        let cut = chars.slice(0, 147).join('');
        const lastP = cut.lastIndexOf('.');
        const lastS = cut.lastIndexOf(' ');
        const cutAt = Math.max(lastP, lastS);
        if (cutAt > 80) cut = cut.substring(0, cutAt);
        cut = cut.replace(/[,.\s]+$/, '') + '...';
        stats.desc++;
        return pre + cut + post;
      }
      return m;
    }
  );
  html = html.replace(
    /(<meta property="og:description" content=")([^"]*)(">)/,
    (m, pre, desc, post) => {
      if ([...desc].length > 150) {
        const chars = [...desc];
        let cut = chars.slice(0, 147).join('');
        const lastP = cut.lastIndexOf('.');
        const lastS = cut.lastIndexOf(' ');
        const cutAt = Math.max(lastP, lastS);
        if (cutAt > 80) cut = cut.substring(0, cutAt);
        cut = cut.replace(/[,.\s]+$/, '') + '...';
        return pre + cut + post;
      }
      return m;
    }
  );

  // 4. 이미지 재할당 (중복 방지)
  const pool = POOLS[cat];
  if (pool) {
    const photos = pickPhotos(pool, slug, 11);
    let gi = 0, bi = 0;
    // Hero
    html = html.replace(
      /(<div class="hero"><img src=")[^"]*("[^>]*>)/,
      `$1${imgUrl(photos[0], 720, 720)}$2`
    );
    // Gallery
    html = html.replace(
      /(<div class="sgi"><img src=")[^"]*("[^>]*>)/g,
      (m, pre, post) => `${pre}${imgUrl(photos[1 + gi++], 540, 405)}${post}`
    );
    // Body
    html = html.replace(
      /(<div class="bgi"><img src=")[^"]*("[^>]*>)/g,
      (m, pre, post) => `${pre}${imgUrl(photos[7 + bi++], 350, 263)}${post}`
    );
    // og:image
    html = html.replace(
      /(<meta property="og:image" content=")[^"]*(">)/,
      `$1${imgUrl(photos[0], 1200, 630)}$2`
    );
    stats.img++;
  }

  // 5. 해운대고구려 신실장 제거
  if (NO_SHIN.includes(slug)) {
    html = html.replace(/신실장[의은는이가]?[^\s<]*/g, (m) => {
      stats.shin++;
      return '';
    });
    html = html.replace(/신실장/g, '');
  }

  // 6. 광고주 없는 업소: 닉네임/전화 제거
  if (NO_AD.includes(slug)) {
    html = html.replace(/<dt>연락처<\/dt><dd>[^<]*<\/dd>/g, '');
    html = html.replace(/<dt>담당<\/dt><dd>[^<]*<\/dd>/g, '');
    stats.noAd++;
  }

  if (changed || true) fs.writeFileSync(fp, html, 'utf8');
}

// Index pages: fix description
function fixIndex(fp) {
  let html = fs.readFileSync(fp, 'utf8');
  html = html.replace(
    /(<meta name="description" content=")([^"]*)(">)/,
    (m, pre, desc, post) => {
      if ([...desc].length > 150) {
        const chars = [...desc];
        let cut = chars.slice(0, 147).join('');
        const ls = cut.lastIndexOf(' ');
        if (ls > 80) cut = cut.substring(0, ls);
        cut = cut.replace(/[,.\s]+$/, '') + '...';
        stats.desc++;
        return pre + cut + post;
      }
      return m;
    }
  );
  html = html.replace(
    /(<meta property="og:description" content=")([^"]*)(">)/,
    (m, pre, desc, post) => {
      if ([...desc].length > 150) {
        const chars = [...desc];
        let cut = chars.slice(0, 147).join('');
        const ls = cut.lastIndexOf(' ');
        if (ls > 80) cut = cut.substring(0, ls);
        cut = cut.replace(/[,.\s]+$/, '') + '...';
        return pre + cut + post;
      }
      return m;
    }
  );
  fs.writeFileSync(fp, html, 'utf8');
}

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name === 'index.html') {
      if (getCategory(full)) fixPage(full);
      else fixIndex(full);
    }
  }
}

console.log('═══ 최종 수정 실행 ═══');
walk(ROOT);
console.log(`  title 수정: ${stats.title}`);
console.log(`  og:title 수정: ${stats.ogTitle}`);
console.log(`  description 150자 수정: ${stats.desc}`);
console.log(`  이미지 재할당: ${stats.img}`);
console.log(`  신실장 제거: ${stats.shin}`);
console.log(`  광고주없는업소 정리: ${stats.noAd}`);

// ═══ 검증 ═══
console.log('\n═══ 6단계 검증 ═══');
const BANNED = ['다양한','특별한','프리미엄','최고의','뛰어난','차별화된','혁신적인','할수있습니다','제공합니다'];
const FAMILY = ['가족 모임','가족모임','가족 같은'];

let v = { descFail:[], titleDup:[], ogNoName:[], noJsonLd:[], family:0, banned:0, imgDup:[], noImg:0 };
const allHooks = {};

function verify(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) verify(full);
    else if (e.name === 'index.html') {
      const c = fs.readFileSync(full, 'utf8');
      const cat = getCategory(full);
      const slug = getSlug(full);

      // 1. description ≤ 150
      const dm = c.match(/name="description" content="([^"]*)"/);
      if (dm && [...dm[1]].length > 150) v.descFail.push(`${slug}: ${[...dm[1]].length}자`);

      // 2. title 중복단어
      const tm = c.match(/<title>([^<]*)<\/title>/);
      if (tm && tm[1].includes('—')) {
        const [left, right] = tm[1].split('—').map(s=>s.trim());
        const words = left.replace(/[^가-힣a-zA-Z0-9\s]/g,' ').split(/\s+/).filter(w=>w.length>=2);
        for (const w of words) {
          if (right.includes(w)) { v.titleDup.push(`${slug}: "${w}" 중복 in "${tm[1]}"`); break; }
        }
      }

      // 3. og:title에 가게이름
      if (cat) {
        const d = venueMap[slug];
        const ogm = c.match(/og:title" content="([^"]*)"/);
        if (d && ogm && !ogm[1].includes(d.name)) v.ogNoName.push(slug);
      }

      // 4. JSON-LD
      if (cat && !c.includes('"@type":"NightClub"')) v.noJsonLd.push(slug);

      // 5. family/banned
      for (const f of FAMILY) if (c.includes(f)) { v.family++; break; }
      for (const b of BANNED) if (c.includes(b)) { v.banned++; break; }

      // 6. 이미지 중복 (같은 페이지 내)
      if (cat) {
        const imgs = [...c.matchAll(/images\.unsplash\.com\/([^?]+)/g)].map(m=>m[1]);
        const unique = new Set(imgs);
        if (imgs.length > 0 && unique.size < imgs.length) {
          v.imgDup.push(`${slug}: ${imgs.length}장 중 ${imgs.length - unique.size}장 중복`);
        }
        if (imgs.length === 0) v.noImg++;
      }

      // hookTitle
      const hm = c.match(/<p class="sub">([^<]*)<\/p>/);
      if (hm) allHooks[hm[1]] = (allHooks[hm[1]] || 0) + 1;
    }
  }
}
verify(ROOT);

const dupHooks = Object.entries(allHooks).filter(([,n])=>n>1);

console.log(`\n1. seoDescription ≤150자: ${v.descFail.length === 0 ? '✅ 전부 통과' : '❌ ' + v.descFail.length + '건 초과'}`);
v.descFail.slice(0,5).forEach(f => console.log(`   ${f}`));

console.log(`\n2. title 중복단어: ${v.titleDup.length === 0 ? '✅ 없음' : '⚠️ ' + v.titleDup.length + '건'}`);
v.titleDup.slice(0,5).forEach(f => console.log(`   ${f}`));

console.log(`\n3. og:title 가게이름: ${v.ogNoName.length === 0 ? '✅ 전부 포함' : '❌ ' + v.ogNoName.length + '건 누락'}`);

console.log(`\n4. JSON-LD NightClub: ${v.noJsonLd.length === 0 ? '✅ 전부 있음' : '❌ ' + v.noJsonLd.length + '건 없음'}`);

console.log(`\n5. 금지사항: 가족=${v.family} 금지단어=${v.banned} ${v.family+v.banned===0?'✅':'❌'}`);

console.log(`\n6. 이미지 중복: ${v.imgDup.length === 0 ? '✅ 없음' : '⚠️ ' + v.imgDup.length + '건'}`);
v.imgDup.slice(0,5).forEach(f => console.log(`   ${f}`));

console.log(`\n7. hookTitle 중복: ${dupHooks.length === 0 ? '✅ 전부 고유' : dupHooks.length + '건'}`);
dupHooks.slice(0,3).forEach(([h,n]) => console.log(`   "${h.substring(0,30)}" → ${n}건`));

console.log(`\n8. 이미지없는 가게: ${v.noImg} ${v.noImg===0?'✅':'❌'}`);
