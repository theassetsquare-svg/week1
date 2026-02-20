#!/usr/bin/env node

/**
 * generate-venue-index.mjs
 *
 * Reads data/venues.json and produces docs/VENUE_INDEX.json
 * with per-venue SEO audit metadata and issue flags.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const INPUT = resolve(ROOT, 'data', 'venues.json');
const OUTPUT = resolve(ROOT, 'docs', 'VENUE_INDEX.json');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build the canonical URL path for a venue.
 * Pattern: /{typePath}/{regionSlug}/{urlSlug}/
 */
function buildUrl(venue) {
  return `/${venue.typePath}/${venue.regionSlug}/${venue.urlSlug}/`;
}

/**
 * Derive a "core name" from name_display by stripping the region prefix and
 * the type suffix (클럽 / 나이트 / 라운지).  For example:
 *   "강남 레이스 클럽"  -> "레이스"
 *   "이태원 볼노스트 클럽" -> "볼노스트"
 *   "강남 하입 라운지" -> "하입"
 *
 * Falls back to the full name_display if stripping leaves nothing.
 */
function coreName(venue) {
  const parts = venue.name_display.split(/\s+/);
  const region = venue.region;
  const typeSuffixes = ['클럽', '나이트', '라운지'];

  const filtered = parts.filter(
    (p) => p !== region && !typeSuffixes.includes(p)
  );
  return filtered.length > 0 ? filtered.join(' ') : venue.name_display;
}

/**
 * Detect issues for a single venue.
 */
function detectIssues(venue) {
  const issues = [];

  // 1. no_jsonld — always true (venue detail pages lack JSON-LD)
  issues.push('no_jsonld');

  // 2. title_not_name_first — pageTitle should start with the compact form
  //    of name_display (all spaces removed).
  const compactName = venue.name_display.replace(/\s+/g, '');
  if (!venue.pageTitle.startsWith(compactName)) {
    issues.push('title_not_name_first');
  }

  // 3. h1_too_generic — always true (H1 is just name_display, not SEO-optimised)
  issues.push('h1_too_generic');

  // 4. missing_breadcrumb_ld — always true
  issues.push('missing_breadcrumb_ld');

  // 5. missing_faq_ld — always true
  issues.push('missing_faq_ld');

  // 6. internal_links_new_tab — always true
  issues.push('internal_links_new_tab');

  // 7. faq_missing_venue_name — first FAQ question doesn't mention the venue
  //    We check for: full name_display, compact name, or core name.
  if (venue.faq && venue.faq.length > 0) {
    const q = venue.faq[0].q;
    const nameDisplay = venue.name_display;
    const core = coreName(venue);

    const containsName =
      q.includes(nameDisplay) ||
      q.includes(compactName) ||
      q.includes(core);

    if (!containsName) {
      issues.push('faq_missing_venue_name');
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const venues = JSON.parse(readFileSync(INPUT, 'utf8'));

const index = venues.map((v) => {
  const regionLevel3 =
    (v.geo && (v.geo.district || v.geo.neighborhood)) || null;

  return {
    id: v.id,
    name: v.name_display,
    category: v.typeLabel,
    region_level1: '대한민국',
    region_level2: v.region,
    region_level3: regionLevel3 || null,
    url: buildUrl(v),
    slug: v.urlSlug,
    has_thumbnail: Array.isArray(v.images) && v.images.length >= 1,
    has_gallery: Array.isArray(v.images) && v.images.length >= 3,
    map_query: v.name_display,
    current_title: v.pageTitle,
    current_h1: v.name_display,
    current_description: v.metaDescription,
    issues: detectIssues(v),
  };
});

writeFileSync(OUTPUT, JSON.stringify(index, null, 2), 'utf8');

console.log(`[generate-venue-index] Wrote ${index.length} venues to ${OUTPUT}`);

// Print a short summary of issue counts
const issueCounts = {};
index.forEach((entry) => {
  entry.issues.forEach((issue) => {
    issueCounts[issue] = (issueCounts[issue] || 0) + 1;
  });
});

console.log('\nIssue summary:');
for (const [issue, count] of Object.entries(issueCounts).sort(
  (a, b) => b[1] - a[1]
)) {
  console.log(`  ${issue}: ${count} / ${index.length}`);
}
