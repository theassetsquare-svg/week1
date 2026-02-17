#!/usr/bin/env node
/**
 * qa_url_duplicates.mjs
 * URL 중복 토큰 검사 + canonical 정합성 검증
 * FAIL 조건: 경로 세그먼트에 동일 단어 반복, canonical 불일치
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const SITEMAP = join(ROOT, 'sitemap.xml');
const SITE = 'https://week1-6m5.pages.dev';

let fails = 0;
let warns = 0;

function fail(msg) { console.error(`  FAIL: ${msg}`); fails++; }
function warn(msg) { console.warn(`  WARN: ${msg}`); warns++; }

// HTML 파일 재귀 탐색
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

  // 1) sitemap URL 중복 토큰 검사
  if (!existsSync(SITEMAP)) {
    fail('sitemap.xml not found');
  } else {
    const sitemap = readFileSync(SITEMAP, 'utf-8');
    const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
    const seenUrls = new Set();

    for (const url of urls) {
      // 중복 URL 검사
      if (seenUrls.has(url)) {
        fail(`Duplicate URL in sitemap: ${url}`);
      }
      seenUrls.add(url);

      // 경로 세그먼트 중복 토큰 검사
      const path = decodeURIComponent(new URL(url).pathname);
      const segments = path.split('/').filter(Boolean);

      // 연속 동일 세그먼트 검사 (예: /부산/부산/)
      for (let i = 1; i < segments.length; i++) {
        if (segments[i] === segments[i - 1]) {
          fail(`Consecutive duplicate segment "${segments[i]}" in: ${path}`);
        }
      }

      // 세그먼트 내 단어 분할 후 경로 전체에서 동일 단어 반복 검사
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

  // 2) dist/ HTML canonical 검증
  if (!existsSync(DIST)) {
    warn('dist/ not found — skipping canonical check');
  } else {
    const htmlFiles = walkHtml(DIST);
    let canonicalChecked = 0;

    for (const file of htmlFiles) {
      const html = readFileSync(file, 'utf-8');
      const canonMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["'](.*?)["']/i);

      if (!canonMatch) {
        const relPath = file.replace(DIST, '');
        warn(`No canonical tag in: ${relPath}`);
        continue;
      }

      const canonical = canonMatch[1];

      // canonical이 정규 URL인지 확인
      if (!canonical.startsWith('http')) {
        fail(`Non-absolute canonical "${canonical}" in: ${file.replace(DIST, '')}`);
      }

      // canonical에 중복 토큰이 없는지 확인
      try {
        const cPath = decodeURIComponent(new URL(canonical).pathname);
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
    console.log(`  Canonical tags checked: ${canonicalChecked}`);
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
