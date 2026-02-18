#!/usr/bin/env node
/**
 * qa_url_duplicates.mjs
 * URL 중복 토큰 검사 + canonical 정합성 + sitemap 중복 검사
 *
 * FAIL 조건:
 * - 경로 세그먼트에 동일 단어가 2회 이상 등장
 * - slug에 category 토큰(클럽/나이트/라운지) 잔존 (typePath와 중복)
 * - canonical이 정규 URL과 불일치
 * - sitemap에 리다이렉트 URL 또는 중복 URL 존재
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { buildVenueUrl, buildOldVenueUrl } from './lib/url.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const SITEMAP = join(ROOT, 'sitemap.xml');
const REDIRECT_MAP = join(ROOT, 'redirect_map.json');
const SITE = 'https://week1-6m5.pages.dev';

// Category token mapping: English path segment → Korean token
const CAT_MAP = { club: '클럽', night: '나이트', lounge: '라운지' };

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

function main() {
  console.log('=== qa_url_duplicates ===\n');

  // Load redirect old URLs for cross-check
  const redirectOldUrls = new Set();
  if (existsSync(REDIRECT_MAP)) {
    const redirects = JSON.parse(readFileSync(REDIRECT_MAP, 'utf-8'));
    redirects.forEach(r => redirectOldUrls.add(r.old));
  }

  // 1) Sitemap 검사
  if (!existsSync(SITEMAP)) {
    fail('sitemap.xml not found');
  } else {
    const sitemap = readFileSync(SITEMAP, 'utf-8');
    const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
    const seenUrls = new Set();

    for (const url of urls) {
      const path = decodeURIComponent(new URL(url).pathname);

      // a) 중복 URL 검사
      if (seenUrls.has(path)) {
        fail(`Duplicate URL in sitemap: ${path}`);
      }
      seenUrls.add(path);

      // b) 리다이렉트 구 URL이 sitemap에 포함되면 FAIL
      if (redirectOldUrls.has(path)) {
        fail(`Redirect (old) URL in sitemap: ${path}`);
      }

      // c) 경로 세그먼트 중복 토큰 검사
      const segments = path.split('/').filter(Boolean);

      // 연속 동일 세그먼트 검사 (예: /부산/부산/)
      for (let i = 1; i < segments.length; i++) {
        if (segments[i] === segments[i - 1]) {
          fail(`Consecutive duplicate segment "${segments[i]}" in: ${path}`);
        }
      }

      // d) slug에 category 토큰 잔존 검사
      if (segments.length >= 3) {
        const typeSeg = segments[0]; // club, night, lounge
        const slug = segments[segments.length - 1];
        const koreanCat = CAT_MAP[typeSeg];
        if (koreanCat) {
          const slugParts = slug.split('-');
          if (slugParts.includes(koreanCat)) {
            fail(`Slug contains category token "${koreanCat}" (redundant with /${typeSeg}/): ${path}`);
          }
        }
      }

      // e) 세그먼트 간 동일 단어 반복 검사
      const allWords = [];
      for (const seg of segments) {
        const words = seg.split(/[-_]/).filter(w => w.length > 0);
        allWords.push(...words);
      }
      const wordCount = {};
      for (const w of allWords) {
        wordCount[w] = (wordCount[w] || 0) + 1;
        if (wordCount[w] > 1) {
          fail(`Token "${w}" appears ${wordCount[w]} times in path: ${path}`);
        }
      }
    }
    console.log(`  Sitemap URLs checked: ${urls.length}`);
  }

  // 2) venues.json ↔ buildVenueUrl 크로스 검증
  const VENUES_PATH = join(ROOT, 'data', 'venues.json');
  if (existsSync(VENUES_PATH)) {
    const venues = JSON.parse(readFileSync(VENUES_PATH, 'utf-8'));
    const venueUrls = new Set();
    for (const v of venues) {
      const url = buildVenueUrl(v);

      // a) buildVenueUrl 결과에 중복 토큰 검사
      const segs = url.split('/').filter(Boolean);
      const words = [];
      for (const seg of segs) {
        words.push(...seg.split(/[-_]/).filter(w => w.length > 0));
      }
      const wc = {};
      for (const w of words) {
        wc[w] = (wc[w] || 0) + 1;
        if (wc[w] > 1) {
          fail(`buildVenueUrl token "${w}" ×${wc[w]} in: ${url} (venue ${v.id})`);
        }
      }

      // b) URL 중복 (다른 venue가 같은 URL)
      if (venueUrls.has(url)) {
        fail(`buildVenueUrl collision: ${url} (venue ${v.id})`);
      }
      venueUrls.add(url);

      // c) old URL = new URL이면 redirect 불필요 확인
      const oldUrl = buildOldVenueUrl(v);
      if (oldUrl !== url && !redirectOldUrls.has(oldUrl)) {
        warn(`Old URL ${oldUrl} differs from new ${url} but missing from redirect_map.json (venue ${v.id})`);
      }
    }
    console.log(`  Venues cross-validated: ${venues.length}`);
  }

  // 3) dist/ HTML canonical 검증
  if (!existsSync(DIST)) {
    warn('dist/ not found — skipping canonical check');
  } else {
    const htmlFiles = walkHtml(DIST);
    let canonicalChecked = 0;
    let canonicalMissing = 0;

    for (const file of htmlFiles) {
      const html = readFileSync(file, 'utf-8');
      const relPath = file.replace(DIST, '');

      const canonMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["'](.*?)["']/i);
      if (!canonMatch) {
        fail(`No canonical tag in: ${relPath}`);
        canonicalMissing++;
        continue;
      }

      const canonical = canonMatch[1];

      // canonical은 절대 URL이어야 함
      if (!canonical.startsWith('http')) {
        fail(`Non-absolute canonical "${canonical}" in: ${relPath}`);
      }

      // canonical에 리다이렉트 구 URL 포함 검사
      try {
        const cPath = decodeURIComponent(new URL(canonical).pathname);
        if (redirectOldUrls.has(cPath)) {
          fail(`Canonical points to redirect (old) URL: ${canonical}`);
        }

        // canonical에 중복 토큰 검사
        const cSegs = cPath.split('/').filter(Boolean);
        for (let i = 1; i < cSegs.length; i++) {
          if (cSegs[i] === cSegs[i - 1]) {
            fail(`Canonical has consecutive duplicate: ${canonical}`);
          }
        }
      } catch (e) {
        fail(`Invalid canonical URL: ${canonical}`);
      }

      canonicalChecked++;
    }
    console.log(`  Canonical tags checked: ${canonicalChecked} (missing: ${canonicalMissing})`);
  }

  // 결과
  console.log('');
  if (fails > 0) {
    console.error(`FAIL: qa_url_duplicates — ${fails} error(s), ${warns} warning(s)`);
    process.exit(1);
  } else {
    console.log(`PASS: qa_url_duplicates — ${warns} warning(s)`);
    process.exit(0);
  }
}

main();
