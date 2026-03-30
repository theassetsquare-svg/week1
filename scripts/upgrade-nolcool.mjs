#!/usr/bin/env node
/**
 * 놀쿨 서브사이트 업그레이드 스크립트
 * - 이모지 플레이스홀더 → 실제 Unsplash 이미지 (무료, 상업적 이용 가능)
 * - 저작권 연도 2025 → 2026
 * - 각 가게별 카테고리에 맞는 이미지 할당
 */
import fs from 'fs';
import path from 'path';

// ── Unsplash 사진 풀 (카테고리별, 전부 200 OK 검증 완료) ──
const PHOTO_POOLS = {
  night: [
    'photo-1566737236500-c8ac43014a67',
    'photo-1516450360452-9312f5e86fc7',
    'photo-1492684223066-81342ee5ff30',
    'photo-1429962714451-bb934ecdc4ec',
    'photo-1508700115892-45ecd05ae2ad',
    'photo-1504196606672-aef5c9cefc92',
    'photo-1598387993281-cecf8b71a8f8',
    'photo-1571204829887-3b8d69e4094d',
    'photo-1549488344-cbb6c34cf08b',
    'photo-1559628233-100c798642d4',
    'photo-1533174072545-7a4b6ad7a6c3',
    'photo-1496337589254-7e19d01cec44',
  ],
  club: [
    'photo-1470225620780-dba8ba36b745',
    'photo-1574391884720-bbc3740c59d1',
    'photo-1536599018102-9f803c140fc1',
    'photo-1563227812-0ea4c22e6cc8',
    'photo-1572947650440-e8a97ef053b2',
    'photo-1585518419759-7fe2e0fbf8a6',
    'photo-1481833761820-0509d3217039',
    'photo-1504593811423-6dd665756598',
    'photo-1566737236500-c8ac43014a67',
    'photo-1516450360452-9312f5e86fc7',
    'photo-1429962714451-bb934ecdc4ec',
    'photo-1508700115892-45ecd05ae2ad',
  ],
  lounge: [
    'photo-1514362545857-3bc16c4c7d1b',
    'photo-1551024709-8f23befc6f87',
    'photo-1543007630-9710e4a00a20',
    'photo-1525268323446-0505b6fe7778',
    'photo-1560840067-ddcaeb7831d2',
    'photo-1519214605650-76a613ee3245',
    'photo-1517248135467-4c7edcad34c4',
    'photo-1546171753-97d7676e4602',
    'photo-1585518419759-7fe2e0fbf8a6',
    'photo-1571204829887-3b8d69e4094d',
    'photo-1438557068880-c5f474830377',
    'photo-1541532713592-79a0317b6b77',
  ],
  room: [
    'photo-1438557068880-c5f474830377',
    'photo-1541532713592-79a0317b6b77',
    'photo-1580809361436-42a7ec204889',
    'photo-1517248135467-4c7edcad34c4',
    'photo-1560840067-ddcaeb7831d2',
    'photo-1543007630-9710e4a00a20',
    'photo-1514362545857-3bc16c4c7d1b',
    'photo-1519214605650-76a613ee3245',
    'photo-1546171753-97d7676e4602',
    'photo-1551024709-8f23befc6f87',
    'photo-1600093463592-8e36ae95ef56',
    'photo-1585518419759-7fe2e0fbf8a6',
  ],
  yojeong: [
    'photo-1517154421773-0529f29ea451',
    'photo-1621508638997-e30808c10653',
    'photo-1600093463592-8e36ae95ef56',
    'photo-1580809361436-42a7ec204889',
    'photo-1438557068880-c5f474830377',
    'photo-1541532713592-79a0317b6b77',
    'photo-1517248135467-4c7edcad34c4',
    'photo-1543007630-9710e4a00a20',
    'photo-1546171753-97d7676e4602',
    'photo-1519214605650-76a613ee3245',
    'photo-1560840067-ddcaeb7831d2',
    'photo-1415201364774-f6f0bb35f28f',
  ],
  hoppa: [
    'photo-1514362545857-3bc16c4c7d1b',
    'photo-1567532939604-b6b5b0db2604',
    'photo-1551024709-8f23befc6f87',
    'photo-1525268323446-0505b6fe7778',
    'photo-1546171753-97d7676e4602',
    'photo-1519214605650-76a613ee3245',
    'photo-1560840067-ddcaeb7831d2',
    'photo-1571204829887-3b8d69e4094d',
    'photo-1543007630-9710e4a00a20',
    'photo-1415201364774-f6f0bb35f28f',
    'photo-1598387993281-cecf8b71a8f8',
    'photo-1585518419759-7fe2e0fbf8a6',
  ],
};

// slug → 숫자 해시 (같은 가게는 항상 같은 이미지)
function hashSlug(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = ((h << 5) - h + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// 카테고리에서 겹치지 않는 N개 이미지 선택
function pickPhotos(pool, slug, count) {
  const h = hashSlug(slug);
  const result = [];
  const len = pool.length;
  for (let i = 0; i < count; i++) {
    result.push(pool[(h + i) % len]);
  }
  return result;
}

function imgUrl(photoId, w, h) {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;
}

// ── 카테고리 판별 ──
function getCategory(filePath) {
  if (filePath.includes('/night/')) return 'night';
  if (filePath.includes('/club/')) return 'club';
  if (filePath.includes('/lounge/')) return 'lounge';
  if (filePath.includes('/room/')) return 'room';
  if (filePath.includes('/yojeong/')) return 'yojeong';
  if (filePath.includes('/hoppa/')) return 'hoppa';
  return null;
}

function getSlugFromPath(filePath) {
  const parts = filePath.split('/');
  // e.g., public/nolcool/night/cheongdam-h2o/index.html
  return parts[parts.length - 2];
}

// ── HTML 업그레이드 ──
function upgradeHtml(html, filePath) {
  const cat = getCategory(filePath);
  if (!cat) return html; // index page, skip image replacement

  const slug = getSlugFromPath(filePath);
  const pool = PHOTO_POOLS[cat];
  // 11장 필요: 1 hero + 6 gallery + 4 body
  const photos = pickPhotos(pool, slug, 11);

  let result = html;

  // 1. Hero 이미지 교체 (1:1)
  result = result.replace(
    /<div class="hero"><div class="ph"[^>]*>[^<]*<\/div><\/div>/,
    (match) => {
      const altMatch = match.match(/aria-label="([^"]*)"/);
      const alt = altMatch ? altMatch[1] : `${slug} 대표 이미지`;
      return `<div class="hero"><img src="${imgUrl(photos[0], 720, 720)}" alt="${alt}" loading="eager" style="width:100%;height:100%;object-fit:cover"></div>`;
    }
  );

  // 2. 스와이프 갤러리 6장 교체
  let galleryIdx = 0;
  result = result.replace(
    /<div class="sgi"[^>]*>[^<]*<\/div>/g,
    (match) => {
      const altMatch = match.match(/aria-label="([^"]*)"/);
      const alt = altMatch ? altMatch[1] : `사진 ${galleryIdx + 1}`;
      const photo = photos[1 + galleryIdx]; // photos[1] ~ photos[6]
      galleryIdx++;
      return `<div class="sgi"><img src="${imgUrl(photo, 540, 405)}" alt="${alt}" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:14px"></div>`;
    }
  );

  // 3. 본문 이미지 4장 교체
  let bodyIdx = 0;
  result = result.replace(
    /<div class="bgi"[^>]*>[^<]*<\/div>/g,
    (match) => {
      const altMatch = match.match(/aria-label="([^"]*)"/);
      const alt = altMatch ? altMatch[1] : `내부 ${bodyIdx + 1}`;
      const photo = photos[7 + bodyIdx]; // photos[7] ~ photos[10]
      bodyIdx++;
      return `<div class="bgi"><img src="${imgUrl(photo, 350, 263)}" alt="${alt}" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:12px"></div>`;
    }
  );

  // 4. 저작권 연도 2025 → 2026
  result = result.replace(/© 2025/g, '© 2026');

  return result;
}

// ── 실행 ──
const ROOT = 'public/nolcool';
let updated = 0;
let skipped = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.name === 'index.html') {
      const original = fs.readFileSync(full, 'utf8');
      const upgraded = upgradeHtml(original, full);
      if (upgraded !== original) {
        fs.writeFileSync(full, upgraded, 'utf8');
        updated++;
      } else {
        skipped++;
      }
    }
  }
}

walk(ROOT);
console.log(`✅ 업그레이드 완료: ${updated}개 수정, ${skipped}개 스킵`);

// 검증
let imgCount = 0;
let noImg = [];
function verify(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) verify(full);
    else if (entry.name === 'index.html') {
      const c = fs.readFileSync(full, 'utf8');
      const imgs = (c.match(/<img /g) || []).length;
      if (imgs > 0) imgCount += imgs;
      // venue pages should have images (skip index pages)
      const cat = getCategory(full);
      if (cat && imgs === 0) noImg.push(full);
    }
  }
}
verify(ROOT);
console.log(`📸 총 이미지 태그: ${imgCount}개`);
if (noImg.length > 0) {
  console.log(`⚠️ 이미지 없는 페이지: ${noImg.length}개`);
  noImg.forEach(f => console.log('  -', f));
} else {
  console.log('✅ 모든 가게 페이지에 이미지 삽입 완료');
}

// 2025 잔존 확인
let old2025 = 0;
function check2025(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) check2025(full);
    else if (entry.name === 'index.html') {
      const c = fs.readFileSync(full, 'utf8');
      if (c.includes('© 2025')) old2025++;
    }
  }
}
check2025(ROOT);
console.log(old2025 === 0 ? '✅ 저작권 연도 전부 2026으로 업데이트' : `⚠️ 2025 잔존: ${old2025}개`);
