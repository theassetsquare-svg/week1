#!/usr/bin/env node
/**
 * qa_schema_consistency.mjs
 * JSON-LD structured data validation for all HTML files in dist/
 *
 * Checks:
 *   - Venue detail pages: must have WebPage + BreadcrumbList + FAQPage schemas
 *   - List pages (clubs/, nights/, lounges/): must have CollectionPage
 *   - Home page: must have WebSite with SearchAction
 *   - All @type values are valid
 *   - All urls use https://night-4qy.pages.dev domain
 *   - BreadcrumbList has at least 3 items
 *
 * Exit 0 = PASS, Exit 1 = FAIL
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const DOMAIN = 'https://night-4qy.pages.dev';

const VALID_TYPES = new Set([
  'WebPage', 'WebSite', 'BreadcrumbList', 'FAQPage', 'CollectionPage',
  'ListItem', 'Question', 'Answer', 'SearchAction', 'Organization',
  'LocalBusiness', 'NightClub', 'BarOrPub', 'EntertainmentBusiness',
  'Place', 'PostalAddress', 'GeoCoordinates', 'AggregateRating',
  'ItemList', 'Article', 'BlogPosting', 'HowTo', 'HowToStep',
  'ImageObject', 'VideoObject', 'Event', 'Offer', 'AboutPage',
]);

// ── helpers ──────────────────────────────────────────────

function walkHtml(dir, list = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walkHtml(full, list);
    } else if (entry.endsWith('.html')) {
      list.push(full);
    }
  }
  return list;
}

function extractJsonLdBlocks(html) {
  const blocks = [];
  const regex = /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    try {
      blocks.push(JSON.parse(m[1]));
    } catch {
      blocks.push(null); // parse error
    }
  }
  return blocks;
}

function getTypes(obj) {
  const types = new Set();
  if (!obj || typeof obj !== 'object') return types;
  if (obj['@type']) {
    if (Array.isArray(obj['@type'])) {
      obj['@type'].forEach(t => types.add(t));
    } else {
      types.add(obj['@type']);
    }
  }
  // recurse into nested objects/arrays
  for (const val of Object.values(obj)) {
    if (Array.isArray(val)) {
      for (const item of val) {
        for (const t of getTypes(item)) types.add(t);
      }
    } else if (val && typeof val === 'object') {
      for (const t of getTypes(val)) types.add(t);
    }
  }
  return types;
}

function collectUrls(obj, urls = []) {
  if (!obj || typeof obj !== 'object') return urls;
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string' && (key === 'url' || key === 'item' || key === '@id')) {
      if (val.startsWith('http')) {
        urls.push(val);
      }
    } else if (Array.isArray(val)) {
      for (const item of val) collectUrls(item, urls);
    } else if (val && typeof val === 'object') {
      collectUrls(val, urls);
    }
  }
  return urls;
}

function getBreadcrumbItemCount(blocks) {
  for (const block of blocks) {
    if (!block) continue;
    if (block['@type'] === 'BreadcrumbList' && Array.isArray(block.itemListElement)) {
      return block.itemListElement.length;
    }
  }
  return 0;
}

function isVenuePage(relPath) {
  return /^(club|night|lounge)\/[^/]+\/[^/]+/.test(relPath);
}

function isListPage(relPath) {
  return /^(clubs|nights|lounges)\/index\.html$/.test(relPath);
}

function isHomePage(relPath) {
  return relPath === 'index.html';
}

// ── main ─────────────────────────────────────────────────

function main() {
  console.log('=== qa_schema_consistency — JSON-LD Validation ===\n');

  const htmlFiles = walkHtml(DIST);
  let totalChecked = 0;
  let failCount = 0;
  const failures = [];
  const schemaTypeCounts = {};

  for (const filePath of htmlFiles) {
    totalChecked++;
    const relPath = relative(DIST, filePath);
    const html = readFileSync(filePath, 'utf-8');
    const blocks = extractJsonLdBlocks(html);
    const pageFailures = [];

    // Collect all types found in this page
    const allTypes = new Set();
    for (const block of blocks) {
      if (block === null) {
        pageFailures.push('invalid JSON in ld+json block');
        continue;
      }
      for (const t of getTypes(block)) {
        allTypes.add(t);
        schemaTypeCounts[t] = (schemaTypeCounts[t] || 0) + 1;
      }
    }

    // Check all @type values are in the valid set
    for (const t of allTypes) {
      if (!VALID_TYPES.has(t)) {
        pageFailures.push(`unknown @type "${t}"`);
      }
    }

    // Check all urls use the correct domain
    for (const block of blocks) {
      if (!block) continue;
      const urls = collectUrls(block);
      for (const url of urls) {
        if (url.startsWith('http') && !url.startsWith(DOMAIN)) {
          pageFailures.push(`URL not using ${DOMAIN}: "${url.slice(0, 80)}"`);
          break; // one per page is enough
        }
      }
    }

    // Venue detail pages: must have WebPage + BreadcrumbList + FAQPage
    if (isVenuePage(relPath)) {
      if (!allTypes.has('WebPage')) {
        pageFailures.push('venue page missing WebPage schema');
      }
      if (!allTypes.has('BreadcrumbList')) {
        pageFailures.push('venue page missing BreadcrumbList schema');
      }
      if (!allTypes.has('FAQPage')) {
        pageFailures.push('venue page missing FAQPage schema');
      }
      // BreadcrumbList must have at least 3 items
      const bcCount = getBreadcrumbItemCount(blocks);
      if (bcCount > 0 && bcCount < 3) {
        pageFailures.push(`BreadcrumbList has only ${bcCount} items (need at least 3)`);
      }
    }

    // List pages: must have CollectionPage
    if (isListPage(relPath)) {
      if (!allTypes.has('CollectionPage')) {
        pageFailures.push('list page missing CollectionPage schema');
      }
    }

    // Home page: must have WebSite with SearchAction
    if (isHomePage(relPath)) {
      if (!allTypes.has('WebSite')) {
        pageFailures.push('home page missing WebSite schema');
      }
      if (!allTypes.has('SearchAction')) {
        pageFailures.push('home page missing SearchAction in WebSite');
      }
    }

    if (pageFailures.length > 0) {
      failCount++;
      for (const msg of pageFailures) {
        failures.push(`${relPath}: ${msg}`);
      }
    }
  }

  // ── report ───────────────────────────────────────────
  console.log(`Pages checked: ${totalChecked}`);
  console.log(`Pages with failures: ${failCount}`);
  console.log('');

  console.log('Schemas found per type:');
  const sortedTypes = Object.entries(schemaTypeCounts).sort((a, b) => b[1] - a[1]);
  for (const [type, count] of sortedTypes) {
    console.log(`  ${type}: ${count}`);
  }

  if (failures.length > 0) {
    console.log(`\nFailures (${failures.length} total, showing up to 15):`);
    for (const f of failures.slice(0, 15)) {
      console.log(`  - ${f}`);
    }
    if (failures.length > 15) {
      console.log(`  ... and ${failures.length - 15} more`);
    }
  }

  console.log('');
  if (failCount > 0) {
    console.error(`FAIL: qa_schema_consistency — ${failCount} page(s) with issues`);
    process.exit(1);
  } else {
    console.log('PASS: qa_schema_consistency — all pages OK');
    process.exit(0);
  }
}

main();
