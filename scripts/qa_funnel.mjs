#!/usr/bin/env node
// Stage4 GATE: dead internal links, orphans, dead-ends, dark patterns. Runs on dist/ post-build.
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';

const DIST = 'dist';
const MAIN = 'https://nolcool.com';
const fails = [];
const warns = [];

function walk(d, out = []) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e === 'index.html') out.push(p);
  }
  return out;
}
const files = walk(DIST);
const pageOf = f => (f.replace(DIST, '').replace(/index\.html$/, '').replace(/\\/g, '/')) || '/';
const pages = new Set(files.map(pageOf));

// load _redirects (source -> applies). Build set of redirect SOURCES (exact) + wildcard prefixes.
const redExact = new Set(), redWild = [];
try {
  for (const line of readFileSync(join(DIST, '_redirects'), 'utf8').split('\n')) {
    const m = line.trim().match(/^(\S+)\s+(\S+)\s+30\d/);
    if (!m) continue;
    const src = m[1];
    if (src.endsWith('*')) redWild.push(src.slice(0, -1));
    else redExact.add(src.replace(/\/$/, ''));
  }
} catch {}
const isRedirected = u => redExact.has(u.replace(/\/$/, '')) || redWild.some(p => u.startsWith(p));

// build link graph
const outbound = {}, inbound = {};
const NEXT_RE = /href="(\/[^"#?]*)"/g; // internal links only
const deadLinks = [];
for (const f of files) {
  const html = readFileSync(f, 'utf8');
  const from = pageOf(f);
  outbound[from] = outbound[from] || new Set();
  let m;
  while ((m = NEXT_RE.exec(html))) {
    let href = m[1].split('#')[0].split('?')[0];
    if (!href.startsWith('/')) continue;
    if (/['"+${}`\s]/.test(href)) continue; // JS-concatenated/dynamic href, not a static link
    if (/\.(css|js|svg|png|jpg|jpeg|webp|ico|xml|txt|json|woff2?|mjs)$/i.test(href)) continue; // assets
    const norm = href.endsWith('/') || href === '/' ? href : href + '/';
    outbound[from].add(norm);
    // resolve: page exists OR redirect OR asset path
    const exists = pages.has(norm) || existsSync(join(DIST, href)) || existsSync(join(DIST, norm, 'index.html'));
    if (!exists && !isRedirected(href) && !isRedirected(norm)) {
      deadLinks.push(`${from} -> ${href} (404, no redirect)`);
    } else if (pages.has(norm)) {
      (inbound[norm] = inbound[norm] || new Set()).add(from);
    }
  }
}

// dead links
if (deadLinks.length) [...new Set(deadLinks)].slice(0, 30).forEach(d => fails.push('DEAD-LINK: ' + d));

// orphans (no inbound, excluding home)
const orphans = [...pages].filter(p => p !== '/' && (!inbound[p] || inbound[p].size === 0));
orphans.forEach(o => warns.push('ORPHAN: ' + o));

// dead-ends: indexable content pages with < 3 outbound internal next-steps
const dead = [...pages].filter(p => (outbound[p]?.size || 0) < 3);
dead.forEach(d => warns.push(`DEAD-END(${outbound[d]?.size||0} links): ` + d));

// nolcool main link must be DIRECT to nolcool.com (no ilsanroom hop) — checked per page
let ilsanHop = 0, mainLinked = 0;
for (const f of files) {
  const html = readFileSync(f, 'utf8');
  if (html.includes('ilsanroom.pages.dev')) { ilsanHop++; fails.push('ILSANROOM-HOP: ' + pageOf(f)); }
  if (html.includes(MAIN)) mainLinked++;
}

// dark patterns: blocked back, forced auto-redirect (meta refresh / location.replace timers), fake countdown
let dark = 0;
for (const f of files) {
  const html = readFileSync(f, 'utf8');
  if (/http-equiv=["']refresh["']/i.test(html)) { dark++; fails.push('DARK-PATTERN meta-refresh: ' + pageOf(f)); }
  if (/history\.pushState\([^)]*\);\s*window\.onpopstate/i.test(html) || /onpopstate\s*=\s*function[^}]*history\.go/i.test(html)) { dark++; fails.push('DARK-PATTERN back-block: ' + pageOf(f)); }
  if (/setTimeout\([^,]*location\.(replace|href)/i.test(html)) { dark++; fails.push('DARK-PATTERN auto-redirect timer: ' + pageOf(f)); }
}

console.log(`funnel: ${files.length} pages | dead-links ${[...new Set(deadLinks)].length} | orphans ${orphans.length} | dead-ends ${dead.length} | ilsanroom-hops ${ilsanHop} | nolcool.com-linked ${mainLinked} | dark ${dark}`);
if (warns.length && process.env.FUNNEL_WARN) console.log('  ' + warns.slice(0, 40).join('\n  '));

// HARD fails: dead links, ilsanroom hops, dark patterns. Orphans/dead-ends are reported (warn) unless STRICT.
const hard = [...new Set(fails)];
if (process.env.FUNNEL_STRICT) hard.push(...warns);
if (hard.length) {
  console.error(`❌ qa_funnel FAILED:\n  ` + hard.slice(0, 40).join('\n  '));
  process.exit(1);
}
console.log('✅ qa_funnel PASS — 0 dead-links, 0 ilsanroom-hops, 0 dark-patterns');
