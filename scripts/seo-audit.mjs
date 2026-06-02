#!/usr/bin/env node
// Full-site SEO audit over built HTML in dist/. No deps — regex extraction.
// Scores the site /100 and reports every offending page: duplicate titles
// (cannibalization), duplicate meta/H1, length violations, the CLAUDE.md
// "same word twice in title" rule, and missing canonical/JSON-LD/OG/H1.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '..', 'dist');

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

const pick = (re, html) => { const m = html.match(re); return m ? m[1].trim() : ''; };
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&mdash;/g, '—');

// CLAUDE.md rule: no word may appear twice in a title (after splitting on space / —).
function dupWordInTitle(title) {
  const core = title.split('—')[0];
  const words = core.split(/\s+/).map((w) => w.replace(/[^가-힣a-zA-Z0-9]/g, '')).filter((w) => w.length >= 2);
  const seen = new Set();
  for (const w of words) { if (seen.has(w)) return w; seen.add(w); }
  return null;
}

function audit() {
  const files = walk(DIST);
  const pages = [];
  for (const f of files) {
    const html = fs.readFileSync(f, 'utf8');
    const url = '/' + path.relative(DIST, f).replace(/index\.html$/, '').replace(/\\/g, '/');
    pages.push({
      file: path.relative(DIST, f), url,
      title: decode(pick(/<title>([^<]*)<\/title>/i, html)),
      desc: decode(pick(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i, html)),
      canonical: pick(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i, html),
      h1: decode(pick(/<h1[^>]*>([\s\S]*?)<\/h1>/i, html).replace(/<[^>]+>/g, '')),
      robots: pick(/<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i, html),
      ogImage: pick(/<meta\s+property=["']og:image["']\s+content=["']([^"']*)["']/i, html),
      hasJsonLd: /application\/ld\+json/i.test(html),
      hasViewport: /name=["']viewport["']/i.test(html),
    });
  }

  // Build duplicate maps for cannibalization detection.
  const titleMap = {}, descMap = {}, h1Map = {};
  for (const p of pages) {
    if (p.title) (titleMap[p.title] ||= []).push(p.url);
    if (p.desc) (descMap[p.desc] ||= []).push(p.url);
    if (p.h1) (h1Map[p.h1] ||= []).push(p.url);
  }
  const dupTitles = Object.entries(titleMap).filter(([, u]) => u.length > 1);
  const dupDescs = Object.entries(descMap).filter(([, u]) => u.length > 1);
  const dupH1s = Object.entries(h1Map).filter(([, u]) => u.length > 1);

  const issues = { errors: [], warnings: [] };
  const E = (url, msg) => issues.errors.push({ url, msg });
  const W = (url, msg) => issues.warnings.push({ url, msg });

  for (const p of pages) {
    if (!p.title) E(p.url, 'missing <title>');
    else {
      if (p.title.length > 60) W(p.url, `title ${p.title.length}c > 60: "${p.title}"`);
      if (p.title.length < 10) W(p.url, `title too short: "${p.title}"`);
      const dw = dupWordInTitle(p.title);
      if (dw) E(p.url, `title repeats word "${dw}": "${p.title}"`);
    }
    if (!p.desc) E(p.url, 'missing meta description');
    else {
      if (p.desc.length > 160) W(p.url, `desc ${p.desc.length}c > 160`);
      if (p.desc.length < 70) W(p.url, `desc ${p.desc.length}c < 70`);
    }
    if (!p.canonical) E(p.url, 'missing canonical');
    if (!p.h1) W(p.url, 'missing <h1>');
    if (!p.hasJsonLd) W(p.url, 'no JSON-LD');
    if (!p.ogImage) W(p.url, 'no og:image');
    if (!p.hasViewport) E(p.url, 'no viewport meta');
    if (/noindex/i.test(p.robots)) W(p.url, 'robots noindex');
  }
  for (const [t, u] of dupTitles) u.forEach((url) => E(url, `DUPLICATE title (${u.length}×): "${t}"`));
  for (const [, u] of dupDescs) u.forEach((url) => E(url, `DUPLICATE meta description (${u.length}×)`));
  for (const [, u] of dupH1s) if (u.length > 2) u.forEach((url) => W(url, `duplicate H1 (${u.length}×)`));

  // Score: start 100, errors cost more than warnings, capped at 0.
  const errPages = new Set(issues.errors.map((i) => i.url)).size;
  const warnPages = new Set(issues.warnings.map((i) => i.url)).size;
  const score = Math.max(0, Math.round(100 - (errPages / pages.length) * 70 - (warnPages / pages.length) * 30));

  const report = {
    generatedAt: new Date().toISOString(),
    totalPages: pages.length,
    score,
    duplicateTitles: dupTitles.length,
    duplicateDescriptions: dupDescs.length,
    errorCount: issues.errors.length,
    warningCount: issues.warnings.length,
    errors: issues.errors,
    warnings: issues.warnings,
  };
  fs.writeFileSync(path.join(__dirname, '..', 'seo-audit-report.json'), JSON.stringify(report, null, 2));

  console.log(`SEO AUDIT — ${pages.length} pages`);
  console.log(`SCORE: ${score}/100  (errors on ${errPages} pages, warnings on ${warnPages})`);
  console.log(`Duplicate titles: ${dupTitles.length} | duplicate descriptions: ${dupDescs.length} | duplicate H1: ${dupH1s.length}`);
  console.log(`Errors: ${issues.errors.length} | Warnings: ${issues.warnings.length}\n`);
  if (dupTitles.length) {
    console.log('## DUPLICATE TITLES (cannibalization):');
    dupTitles.slice(0, 25).forEach(([t, u]) => console.log(`  (${u.length}×) "${t}"\n      ${u.slice(0, 4).join('\n      ')}`));
  }
  console.log('\n## First 30 errors:');
  issues.errors.slice(0, 30).forEach((i) => console.log(`  [${i.url}] ${i.msg}`));
  console.log(`\nFull report: seo-audit-report.json`);
  return report;
}
audit();
