#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');

function walkHtml(dir, list = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walkHtml(p, list);
    else if (f.endsWith('.html')) list.push(p);
  }
  return list;
}

function extractBodyContent(html) {
  // Extract only main content - skip nav, header, footer, scripts, styles
  let text = html;
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
  // Extract only content inside main or article or venue-section classes
  const mainMatch = text.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) text = mainMatch[1];
  text = text.replace(/<[^>]+>/g, ' ').replace(/&[a-zA-Z]+;/g, ' ').replace(/&#\d+;/g, ' ').replace(/\s+/g, ' ').trim();
  return text;
}

const detailDirs = ['club', 'night', 'lounge'];
const detailFiles = [];
for (const dir of detailDirs) {
  const dp = join(DIST, dir);
  if (existsSync(dp)) walkHtml(dp, detailFiles);
}

console.log(`Checking ${detailFiles.length} detail pages for 8-word content phrase duplication...\n`);

const phraseMap = new Map();
for (const file of detailFiles) {
  const text = extractBodyContent(readFileSync(file, 'utf-8'));
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const relPath = file.replace(DIST, '');
  const seen = new Set();
  for (let i = 0; i <= words.length - 8; i++) {
    const phrase = words.slice(i, i + 8).join(' ');
    if (seen.has(phrase)) continue; // only count once per page
    seen.add(phrase);
    if (!phraseMap.has(phrase)) phraseMap.set(phrase, []);
    phraseMap.get(phrase).push(relPath);
  }
}

// Find phrases in 3+ pages
const dupsOver3 = [];
for (const [phrase, pages] of phraseMap) {
  if (pages.length >= 3) dupsOver3.push({ phrase, count: pages.length });
}
dupsOver3.sort((a, b) => b.count - a.count);

console.log(`Total 8-word phrases in 3+ pages: ${dupsOver3.length}`);
console.log(`\nTop 20 most common phrases:`);
dupsOver3.slice(0, 20).forEach((d, i) => {
  console.log(`  ${i+1}. (${d.count} pages) "${d.phrase}"`);
});

// Filter: only Korean content phrases (not template/nav/footer text)
const koreanDups = dupsOver3.filter(d => {
  const krChars = (d.phrase.match(/[\uAC00-\uD7AF]/g) || []).length;
  return krChars >= 8; // at least 8 Korean chars = meaningful Korean content
});

console.log(`\nKorean content phrases in 3+ pages: ${koreanDups.length}`);
koreanDups.slice(0, 20).forEach((d, i) => {
  console.log(`  ${i+1}. (${d.count} pages) "${d.phrase}"`);
});
