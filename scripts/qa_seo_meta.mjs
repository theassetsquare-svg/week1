#!/usr/bin/env node
/**
 * qa_seo_meta.mjs
 * SEO meta tag validation for all HTML files in dist/
 *
 * Checks:
 *   a. <title> exists and is 30-70 chars
 *   b. <meta name="description"> exists and is 80-160 chars
 *   c. <link rel="canonical"> exists and is absolute URL starting with https://night-4qy.pages.dev
 *   d. <meta property="og:title"> exists
 *   e. <meta property="og:description"> exists
 *   f. For venue pages (path matches /{club|night|lounge}/): title starts with Korean word (store name)
 *
 * Exit 0 = PASS, Exit 1 = FAIL
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const DOMAIN = 'https://week1-6m5.pages.dev';

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

function extractAttr(html, regex) {
  const m = html.match(regex);
  return m ? m[1] : null;
}

function isKoreanStart(str) {
  if (!str) return false;
  // Match if the string starts with a Korean character (Hangul syllable or Jamo)
  return /^[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(str.trim());
}

function isVenuePage(relPath) {
  // Venue detail pages live under club/, night/, or lounge/ (but NOT clubs/, nights/, lounges/)
  return /^(club|night|lounge)\/[^/]+\/[^/]+/.test(relPath);
}

// ── main ─────────────────────────────────────────────────

function main() {
  console.log('=== qa_seo_meta — SEO Meta Tag Validation ===\n');

  const htmlFiles = walkHtml(DIST);
  let totalPages = 0;
  let passCount = 0;
  let failCount = 0;
  const failures = []; // collect failure messages

  for (const filePath of htmlFiles) {
    totalPages++;
    const relPath = relative(DIST, filePath);
    const html = readFileSync(filePath, 'utf-8');
    const pageFailures = [];

    // a. <title> exists and is 30-70 chars
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const titleText = titleMatch ? titleMatch[1].trim() : null;
    if (!titleText) {
      pageFailures.push('missing <title>');
    } else if (titleText.length < 30 || titleText.length > 70) {
      pageFailures.push(`<title> length ${titleText.length} (expected 30-70): "${titleText.slice(0, 50)}..."`);
    }

    // b. <meta name="description"> exists and is 80-160 chars
    const descContent = extractAttr(html, /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
    if (!descContent) {
      pageFailures.push('missing <meta name="description">');
    } else if (descContent.length < 80 || descContent.length > 160) {
      pageFailures.push(`description length ${descContent.length} (expected 80-160): "${descContent.slice(0, 60)}..."`);
    }

    // c. <link rel="canonical"> exists and is absolute URL starting with DOMAIN
    const canonicalHref = extractAttr(html, /<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i);
    if (!canonicalHref) {
      pageFailures.push('missing <link rel="canonical">');
    } else if (!canonicalHref.startsWith(DOMAIN)) {
      pageFailures.push(`canonical not starting with ${DOMAIN}: "${canonicalHref.slice(0, 80)}"`);
    }

    // d. <meta property="og:title"> exists
    const ogTitle = extractAttr(html, /<meta\s+property=["']og:title["']\s+content=["']([^"']*)["']/i);
    if (!ogTitle) {
      pageFailures.push('missing <meta property="og:title">');
    }

    // e. <meta property="og:description"> exists
    const ogDesc = extractAttr(html, /<meta\s+property=["']og:description["']\s+content=["']([^"']*)["']/i);
    if (!ogDesc) {
      pageFailures.push('missing <meta property="og:description">');
    }

    // f. For venue pages: title starts with a Korean word (store name)
    if (isVenuePage(relPath)) {
      if (titleText && !isKoreanStart(titleText)) {
        pageFailures.push(`venue title does not start with Korean store name: "${titleText.slice(0, 40)}"`);
      }
    }

    // tally
    if (pageFailures.length === 0) {
      passCount++;
    } else {
      failCount++;
      for (const msg of pageFailures) {
        failures.push(`${relPath}: ${msg}`);
      }
    }
  }

  // ── report ───────────────────────────────────────────
  console.log(`Total pages scanned: ${totalPages}`);
  console.log(`  PASS: ${passCount}`);
  console.log(`  FAIL: ${failCount}`);

  if (failures.length > 0) {
    console.log(`\nTop failures (showing up to 10):`);
    for (const f of failures.slice(0, 10)) {
      console.log(`  - ${f}`);
    }
    if (failures.length > 10) {
      console.log(`  ... and ${failures.length - 10} more`);
    }
  }

  console.log('');
  if (failCount > 0) {
    console.error(`FAIL: qa_seo_meta — ${failCount} page(s) with issues, ${failures.length} total issue(s)`);
    process.exit(1);
  } else {
    console.log('PASS: qa_seo_meta — all pages OK');
    process.exit(0);
  }
}

main();
