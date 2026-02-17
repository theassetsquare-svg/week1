#!/usr/bin/env node
/**
 * qa_seo_meta.mjs
 * SEO 메타 검사: title/H1/description/OG/canonical/JSON-LD
 * - title/H1은 "{가게이름}..."으로 시작해야 함 (업소 상세페이지)
 * - meta description은 페이지마다 고유
 * - og:image / twitter:image 존재
 * - canonical 존재
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
function warn(msg) { console.warn(`  WARN: ${msg}`); warns++; }

function walkHtml(dir, list = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walkHtml(p, list);
    else if (f.endsWith('.html')) list.push(p);
  }
  return list;
}

function extractTag(html, regex) {
  const m = html.match(regex);
  return m ? m[1].trim() : null;
}

// 업소명 → regionSlug/venueSlug 매핑
const venueByPath = {};
for (const v of VENUES) {
  const key = `/${v.typePath}/${v.regionSlug}/${v.venueSlug}/`;
  venueByPath[key] = v;
}

function main() {
  console.log('=== qa_seo_meta ===\n');

  if (!existsSync(DIST)) {
    fail('dist/ not found');
    process.exit(1);
  }

  const htmlFiles = walkHtml(DIST);
  const descriptions = new Map(); // description → file path (중복 검사)

  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf-8');
    const relPath = file.replace(DIST, '') || '/';
    const pagePath = relPath.replace(/index\.html$/, '').replace(/\.html$/, '/');

    // title 검사
    const title = extractTag(html, /<title>(.*?)<\/title>/s);
    if (!title) {
      fail(`No <title> in: ${relPath}`);
    }

    // H1 검사
    const h1 = extractTag(html, /<h1[^>]*>(.*?)<\/h1>/s);
    if (!h1) {
      fail(`No <h1> in: ${relPath}`);
    }

    // meta description 검사
    const desc = extractTag(html, /<meta\s+name=["']description["']\s+content=["'](.*?)["']/i)
              || extractTag(html, /<meta\s+content=["'](.*?)["']\s+name=["']description["']/i);
    if (!desc) {
      fail(`No meta description in: ${relPath}`);
    } else {
      if (descriptions.has(desc)) {
        fail(`Duplicate description: "${desc.slice(0, 50)}..." — ${relPath} = ${descriptions.get(desc)}`);
      }
      descriptions.set(desc, relPath);
    }

    // canonical 검사
    const canonical = extractTag(html, /<link\s+rel=["']canonical["']\s+href=["'](.*?)["']/i);
    if (!canonical) {
      fail(`No canonical in: ${relPath}`);
    }

    // OG/Twitter 이미지 검사
    const ogImage = extractTag(html, /<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i);
    const twImage = extractTag(html, /<meta\s+name=["']twitter:image["']\s+content=["'](.*?)["']/i)
                 || extractTag(html, /<meta\s+property=["']twitter:image["']\s+content=["'](.*?)["']/i);

    if (!ogImage) warn(`No og:image in: ${relPath}`);
    if (!twImage) warn(`No twitter:image in: ${relPath}`);

    // 업소 상세페이지 추가 검사: title/H1이 가게이름으로 시작
    const decodedPath = decodeURIComponent(pagePath);
    const venue = venueByPath[decodedPath];
    if (venue) {
      const name = venue.name_display;

      if (title && !title.startsWith(name)) {
        fail(`Title does not start with venue name "${name}": "${title.slice(0, 60)}..." in ${relPath}`);
      }

      // H1에서 HTML 태그 제거 후 검사
      const h1Clean = h1 ? h1.replace(/<[^>]+>/g, '').trim() : '';
      if (h1Clean && !h1Clean.startsWith(name)) {
        fail(`H1 does not start with venue name "${name}": "${h1Clean.slice(0, 60)}..." in ${relPath}`);
      }
    }
  }

  console.log(`  Pages checked: ${htmlFiles.length}`);
  console.log(`  Unique descriptions: ${descriptions.size}`);
  console.log('');

  if (fails > 0) {
    console.error(`FAIL: qa_seo_meta — ${fails} error(s), ${warns} warning(s)`);
    process.exit(1);
  } else {
    console.log(`PASS: qa_seo_meta — ${warns} warning(s)`);
    process.exit(0);
  }
}

main();
