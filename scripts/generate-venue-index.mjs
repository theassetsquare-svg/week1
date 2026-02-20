#!/usr/bin/env node
/**
 * generate-venue-index.mjs
 *
 * Reads data/venues.json and produces VENUE_INDEX.json in the project root
 * with per-venue SEO metadata and issue diagnostics.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const VENUES_PATH = join(ROOT, 'data', 'venues.json');
const OUTPUT_PATH = join(ROOT, 'VENUE_INDEX.json');

const catKr = { club: '클럽', night: '나이트', lounge: '라운지' };

function cleanSlug(slug, typePath, regionSlug) {
  let s = slug;
  const cat = catKr[typePath];
  if (cat) {
    const cleaned = s.split('-').filter(p => p !== cat).join('-');
    if (cleaned.length > 0) s = cleaned;
  }
  if (regionSlug) {
    const cleaned = s.split('-').filter(p => p !== regionSlug).join('-');
    if (cleaned.length > 0) s = cleaned;
  }
  return s;
}

const REQUIRED_INTRO_FIELDS = ['hook', 'valuePromise', 'scanBox', 'checklist', 'riskItems', 'teasers'];

function detectIssues(venue) {
  const issues = [];
  const name = venue.name_display || '';
  const title = venue.pageTitle || venue.seoTitle || '';
  const h1 = venue.h1Title || '';
  const desc = venue.metaDescription || venue.seoDescription || '';
  const images = Array.isArray(venue.images) ? venue.images : [];
  const keywords = venue.keywords;
  const intro = venue.intro;
  const conclusionText = venue.conclusionText;

  if (!title || !title.startsWith(name)) {
    issues.push('title_no_store_name');
  }
  if (!h1 || !h1.startsWith(name)) {
    issues.push('h1_no_store_name');
  }
  if (desc.length < 80) {
    issues.push('description_short');
  }
  if (desc.length > 160) {
    issues.push('description_long');
  }
  if (images.length === 0) {
    issues.push('no_thumbnail');
  }
  if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
    issues.push('no_keywords');
  }
  if (!intro || typeof intro !== 'object') {
    issues.push('no_intro');
  } else {
    const missing = REQUIRED_INTRO_FIELDS.some(f => !intro[f]);
    if (missing) {
      issues.push('no_intro');
    }
  }
  if (!conclusionText) {
    issues.push('no_conclusion');
  }

  return issues;
}

function main() {
  const venues = JSON.parse(readFileSync(VENUES_PATH, 'utf-8'));
  console.log(`Read ${venues.length} venues from ${VENUES_PATH}`);

  const index = venues.map(v => {
    const slug = v.urlSlug || v.venueSlug || '';
    const typePath = v.typePath || v.type || 'club';
    const regionSlug = v.regionSlug || '';
    const cSlug = cleanSlug(slug, typePath, regionSlug);
    const url = `/${typePath}/${regionSlug}/${cSlug}/`;

    const title = v.pageTitle || v.seoTitle || `${v.name_display || 'Unknown'} \u2013 \uc815\ubcf4\xb7\ud6c4\uae30`;
    const h1 = v.h1Title || `${v.name_display || 'Unknown'} \uc644\ubcbd \uac00\uc774\ub4dc`;
    const desc = v.metaDescription || v.seoDescription || `${v.name_display || ''} \uad00\ub828 \uc815\ubcf4\ub97c \ud655\uc778\ud558\uc138\uc694.`;

    const images = Array.isArray(v.images) ? v.images : [];

    return {
      id: v.id,
      name: v.name_display,
      category: v.type,
      region: v.region,
      regionSlug: v.regionSlug,
      url,
      slug: v.urlSlug || v.venueSlug,
      has_thumbnail: images.length > 0,
      current_title: title,
      current_h1: h1,
      current_description: desc,
      issues: detectIssues(v),
    };
  });

  writeFileSync(OUTPUT_PATH, JSON.stringify(index, null, 2), 'utf-8');
  console.log(`Wrote ${index.length} entries to ${OUTPUT_PATH}`);

  const issueCounts = {};
  let venuesWithIssues = 0;
  for (const entry of index) {
    if (entry.issues.length > 0) venuesWithIssues++;
    for (const issue of entry.issues) {
      issueCounts[issue] = (issueCounts[issue] || 0) + 1;
    }
  }

  console.log('\n-- Issue Summary --');
  console.log(`Total venues: ${index.length}`);
  console.log(`Venues with issues: ${venuesWithIssues}`);
  console.log(`Venues clean: ${index.length - venuesWithIssues}`);
  console.log('');
  const sorted = Object.entries(issueCounts).sort((a, b) => b[1] - a[1]);
  for (const [issue, count] of sorted) {
    console.log(`  ${issue}: ${count}`);
  }
  console.log(`\nTotal issue instances: ${sorted.reduce((s, [, c]) => s + c, 0)}`);
}

main();
