#!/usr/bin/env node
/**
 * qa_links_html.mjs
 * Internal links and navigation check for all HTML files in dist/
 *
 * Checks:
 *   a. All internal links (href starting with /) use standard <a> tags (not JS-only)
 *   b. Breadcrumb nav exists on venue detail pages
 *   c. No broken internal links (href path should have corresponding dist/ file)
 *   d. Footer navigation links work
 *   e. At least 3 internal links per page
 *
 * Report: total pages, internal links found, broken links, pages without breadcrumbs
 *
 * Exit 0 = PASS, Exit 1 = FAIL
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');

const MIN_INTERNAL_LINKS = 3;

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

function isVenuePage(relPath) {
  return /^(club|night|lounge)\/[^/]+\/[^/]+/.test(relPath);
}

/**
 * Extract all <a href="..."> where href starts with /
 * Returns array of { href, inFooter }
 */
function extractInternalLinks(html) {
  const links = [];
  // Find all <a> tags with href starting with /
  const regex = /<a\s[^>]*href=["'](\/[^"'#]*)["'][^>]*>/gi;
  let m;

  // Check if we're inside a footer context
  const footerStart = html.indexOf('<footer');
  const footerEnd = html.indexOf('</footer>');

  while ((m = regex.exec(html)) !== null) {
    const href = m[1];
    const pos = m.index;
    const inFooter = footerStart >= 0 && footerEnd >= 0 && pos > footerStart && pos < footerEnd;
    links.push({ href, inFooter, pos });
  }

  return links;
}

/**
 * Check if an internal href resolves to a file in dist/
 * Handles trailing slashes: /clubs/ -> dist/clubs/index.html
 */
function resolveInternalLink(href) {
  // Decode percent-encoded characters
  let decoded;
  try {
    decoded = decodeURIComponent(href);
  } catch {
    decoded = href;
  }

  // Remove query string if any
  decoded = decoded.split('?')[0];

  // If path ends with /, look for index.html
  if (decoded.endsWith('/')) {
    const filePath = join(DIST, decoded, 'index.html');
    if (existsSync(filePath)) return true;
  }

  // Try as-is (e.g. /favicon.svg)
  const directPath = join(DIST, decoded);
  if (existsSync(directPath) && statSync(directPath).isFile()) return true;

  // Try adding /index.html
  const withIndex = join(DIST, decoded, 'index.html');
  if (existsSync(withIndex)) return true;

  // Try adding .html
  const withHtml = join(DIST, decoded + '.html');
  if (existsSync(withHtml)) return true;

  return false;
}

/**
 * Check if breadcrumb navigation exists in the HTML.
 * Looks for common breadcrumb patterns: class="breadcrumb", aria-label containing breadcrumb,
 * or BreadcrumbList schema, or nav element with breadcrumb.
 */
function hasBreadcrumb(html) {
  return /class=["'][^"']*breadcrumb[^"']*["']/i.test(html)
    || /aria-label=["'][^"']*breadcrumb[^"']*["']/i.test(html)
    || /BreadcrumbList/i.test(html);
}

// ── main ─────────────────────────────────────────────────

function main() {
  console.log('=== qa_links_html — Internal Links & Navigation Check ===\n');

  const htmlFiles = walkHtml(DIST);
  let totalPages = 0;
  let totalInternalLinks = 0;
  let brokenLinkCount = 0;
  let pagesWithoutBreadcrumbs = 0;
  let failCount = 0;
  const failures = [];
  const brokenLinks = [];

  for (const filePath of htmlFiles) {
    totalPages++;
    const relPath = relative(DIST, filePath);
    const html = readFileSync(filePath, 'utf-8');
    const pageFailures = [];

    // Extract internal links
    const internalLinks = extractInternalLinks(html);
    totalInternalLinks += internalLinks.length;

    // a. All internal links use standard <a> tags — we extracted from <a> tags,
    //    so this is inherently satisfied. We additionally check there are no
    //    onclick-only navigations (href="#" with onclick containing location)
    const jsOnlyNav = html.match(/onclick=["'][^"']*(?:location|window\.location|navigate)[^"']*["']/gi);
    if (jsOnlyNav && jsOnlyNav.length > 0) {
      pageFailures.push(`found ${jsOnlyNav.length} JS-only navigation(s) (onclick with location)`);
    }

    // b. Breadcrumb nav on venue detail pages
    if (isVenuePage(relPath)) {
      if (!hasBreadcrumb(html)) {
        pagesWithoutBreadcrumbs++;
        pageFailures.push('venue page missing breadcrumb navigation');
      }
    }

    // c. No broken internal links
    for (const link of internalLinks) {
      if (!resolveInternalLink(link.href)) {
        brokenLinkCount++;
        const msg = `broken link "${link.href}"`;
        pageFailures.push(msg);
        brokenLinks.push(`${relPath}: ${link.href}`);
      }
    }

    // d. Footer navigation links — check footer links are not broken
    const footerLinks = internalLinks.filter(l => l.inFooter);
    for (const link of footerLinks) {
      if (!resolveInternalLink(link.href)) {
        // Already counted in broken links above, just noting for completeness
      }
    }

    // e. At least 3 internal links per page
    if (internalLinks.length < MIN_INTERNAL_LINKS) {
      pageFailures.push(`only ${internalLinks.length} internal link(s) (need >= ${MIN_INTERNAL_LINKS})`);
    }

    if (pageFailures.length > 0) {
      failCount++;
      for (const msg of pageFailures) {
        failures.push(`${relPath}: ${msg}`);
      }
    }
  }

  // ── report ───────────────────────────────────────────
  console.log(`Total pages scanned: ${totalPages}`);
  console.log(`Total internal links found: ${totalInternalLinks}`);
  console.log(`Broken internal links: ${brokenLinkCount}`);
  console.log(`Venue pages without breadcrumbs: ${pagesWithoutBreadcrumbs}`);
  console.log(`Pages with failures: ${failCount}`);

  if (brokenLinks.length > 0) {
    console.log(`\nBroken links (showing up to 15):`);
    for (const bl of brokenLinks.slice(0, 15)) {
      console.log(`  - ${bl}`);
    }
    if (brokenLinks.length > 15) {
      console.log(`  ... and ${brokenLinks.length - 15} more`);
    }
  }

  if (failures.length > 0) {
    console.log(`\nAll failures (${failures.length} total, showing up to 15):`);
    for (const f of failures.slice(0, 15)) {
      console.log(`  - ${f}`);
    }
    if (failures.length > 15) {
      console.log(`  ... and ${failures.length - 15} more`);
    }
  }

  console.log('');
  if (failCount > 0) {
    console.error(`FAIL: qa_links_html — ${failCount} page(s) with issues`);
    process.exit(1);
  } else {
    console.log('PASS: qa_links_html — all pages OK');
    process.exit(0);
  }
}

main();
