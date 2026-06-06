#!/usr/bin/env node
// Stage2 GATE (post-build, on dist/). Blocks: missing CSS assets (unstyled pages) / rendered one-blob paragraphs.
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';

const DIST = 'dist';
const fails = [];

function walkHtml(d, out = []) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walkHtml(p, out);
    else if (e.endsWith('.html')) out.push(p);
  }
  return out;
}
const htmls = walkHtml(DIST);

// ── 1) Every referenced local stylesheet must exist in dist (no MIME/404 unstyled page) ──
let cssChecked = 0, cssMissing = 0;
for (const f of htmls) {
  const html = readFileSync(f, 'utf8');
  const links = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*href="(\/[^"]+)"/g)].map(m => m[1]);
  for (const href of links) {
    cssChecked++;
    const asset = join(DIST, href.split('?')[0]);
    if (!existsSync(asset)) { cssMissing++; fails.push(`MISSING CSS: ${href} referenced by ${f.replace(DIST, '')}`); }
  }
}

// ── 2) No venue page may render a one-blob paragraph (.tp-desc > 600 chars = un-split) ──
let blobs = 0;
for (const f of htmls.filter(h => h.includes('/venue/'))) {
  const html = readFileSync(f, 'utf8');
  for (const m of html.matchAll(/<p [^>]*class="tp-desc"[^>]*>([\s\S]*?)<\/p>/g)) {
    const text = m[1].replace(/<[^>]+>/g, '');
    if (text.length > 600) { blobs++; fails.push(`ONE-BLOB: ${text.length}-char <p class="tp-desc"> in ${f.replace(DIST, '')}`); }
  }
}

// ── 3) DUAL-URL DEDUP: no /nolcool/ duplicate pages may exist in dist ──
const nolcoolPages = htmls.filter(h => h.replace(/\\/g, '/').includes('/nolcool/'));
if (nolcoolPages.length) fails.push(`DUAL-URL: ${nolcoolPages.length} /nolcool/ duplicate page(s) still in dist (must be removed + 301'd)`);

// ── 4) TITLE/META across all pages: no detail-title "놀쿨", no dup title/meta, /venue/ meta 120-160 ──
const byTitle = {}, byMeta = {};
for (const f of htmls) {
  const html = readFileSync(f, 'utf8');
  const url = f.replace(DIST, '').replace(/index\.html$/, '').replace(/\\/g, '/');
  const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1] || '';
  const meta = (html.match(/<meta name="description" content="([^"]*)"/i) || [])[1] || '';
  (byTitle[title] = byTitle[title] || []).push(url);
  if (meta) (byMeta[meta] = byMeta[meta] || []).push(url);
  // venue (detail) pages: no 놀쿨 in title, meta 120-160
  if (url.startsWith('/venue/')) {
    if (title.includes('놀쿨')) fails.push(`DETAIL-TITLE 놀쿨: ${url} "${title}"`);
    const ml = meta.length;
    if (ml < 120 || ml > 160) fails.push(`META-LEN ${ml} (need 120-160): ${url}`);
  }
}
for (const [t, urls] of Object.entries(byTitle)) if (urls.length > 1) fails.push(`DUP TITLE x${urls.length}: "${t}" (${urls.slice(0,2).join(', ')})`);
for (const [m, urls] of Object.entries(byMeta)) if (urls.length > 1) fails.push(`DUP META x${urls.length}: ${urls.slice(0,2).join(', ')}`);

const uniqFails = [...new Set(fails)];
if (uniqFails.length) {
  console.error(`❌ qa_gate_stage2 FAILED (${htmls.length} pages, ${cssChecked} css refs, ${cssMissing} missing, ${blobs} blobs):`);
  console.error('  ' + uniqFails.slice(0, 20).join('\n  '));
  process.exit(1);
}
console.log(`✅ qa_gate_stage2 PASS — ${htmls.length} pages, ${cssChecked} CSS refs OK, 0 one-blob, 0 /nolcool dups, 0 dup title/meta, /venue meta 120-160`);
