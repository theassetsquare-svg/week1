#!/usr/bin/env node
/**
 * generate-search-index.mjs
 * 빌드 시 search_index.json 생성
 * VENUE_LIST 기반: name, normalized_name, region, category, url, thumb, map
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { buildVenueUrl } from './lib/url.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const VENUES_PATH = join(ROOT, 'data', 'venues.json');
const DIST = join(ROOT, 'dist');

function normalize(s) {
  return s
    .replace(/\s+/g, '')
    .replace(/[^가-힣a-zA-Z0-9]/g, '')
    .toLowerCase();
}

function main() {
  const venues = JSON.parse(readFileSync(VENUES_PATH, 'utf8'));

  const index = venues.map(v => {
    const slug = v.urlSlug || v.venueSlug;
    const url = `/${v.typePath}/${v.regionSlug}/${slug}/`;
    return {
      name: v.name_display,
      normalized_name: normalize(v.name_display),
      region: v.region,
      normalized_region: normalize(v.region),
      category: v.type,
      categoryLabel: v.typeLabel,
      url,
      thumb: v.images[0]?.src || '',
      map: v.geo.precision !== 'none',
      // extra tokens for search
      tokens: normalize(v.name_display + v.region + v.typeLabel + (v.keywords || []).join('')),
    };
  });

  // Write to dist/ if it exists
  if (existsSync(DIST)) {
    writeFileSync(join(DIST, 'search_index.json'), JSON.stringify(index), 'utf8');
  }

  // Write to public/ so Astro copies it on build
  writeFileSync(join(ROOT, 'public', 'search_index.json'), JSON.stringify(index), 'utf8');

  console.log(`search_index.json generated: ${index.length} entries`);
}

main();
