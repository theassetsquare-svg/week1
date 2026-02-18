#!/usr/bin/env node
/**
 * generate-redirects.mjs
 * 구 URL(venueSlug 기반) → 신 URL(urlSlug 기반, dedup 적용) 리다이렉트 생성
 *
 * 출력:
 *   1. redirect_map.json — [{old, new}] JSON 배열
 *   2. _redirects — Cloudflare Pages 301 리다이렉트 규칙
 *   3. dist/_redirects — 배포용 복사본
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { buildVenueUrl, buildOldVenueUrl } from './lib/url.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const venues = JSON.parse(readFileSync(join(ROOT, 'data', 'venues.json'), 'utf8'));

const redirects = [];

for (const v of venues) {
  const newUrl = buildVenueUrl(v);
  const oldUrl = buildOldVenueUrl(v);

  // Only add redirect if old and new URLs differ
  if (oldUrl !== newUrl) {
    redirects.push({ old: oldUrl, new: newUrl });
  }
}

// Write redirect_map.json
writeFileSync(join(ROOT, 'redirect_map.json'), JSON.stringify(redirects, null, 2), 'utf8');

// Write _redirects for Cloudflare Pages (percent-encoded)
const lines = redirects.map(r =>
  `${encodeURI(r.old)} ${encodeURI(r.new)} 301`
);
const redirectsContent = lines.join('\n') + '\n';
writeFileSync(join(ROOT, '_redirects'), redirectsContent, 'utf8');

// Copy to dist/ if it exists
if (existsSync(DIST)) {
  writeFileSync(join(DIST, '_redirects'), redirectsContent, 'utf8');
}

console.log(`redirect_map.json: ${redirects.length} entries`);
console.log(`_redirects: ${lines.length} rules written`);
