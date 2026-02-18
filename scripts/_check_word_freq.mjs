#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const STOPWORDS = new Set(JSON.parse(readFileSync(join(ROOT, 'data', 'stopwords_ko.json'), 'utf-8')));

const file = join(DIST, 'night', 'sangbong', '한국관', 'index.html');
const html = readFileSync(file, 'utf-8');

// Extract visible text (no script/style/tags)
const text = html
  .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-zA-Z]+;/g, ' ')
  .replace(/&#\d+;/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

// Extract Korean tokens (2+ chars)
const tokens = text.match(/[\uAC00-\uD7AF]{2,}/g) || [];

// Count frequencies
const freq = {};
for (const t of tokens) {
  if (STOPWORDS.has(t)) continue;
  freq[t] = (freq[t] || 0) + 1;
}

// Sort by frequency desc
const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);

console.log('=== 상봉동 한국관 나이트 — 의미 단어 빈도 ===\n');

// Show words with 3+ occurrences
const over3 = sorted.filter(([, c]) => c >= 3);
console.log(`3회 이상 반복 단어: ${over3.length}개\n`);

console.log('--- 3회 이상 ---');
for (const [word, count] of over3) {
  console.log(`  ${word}: ${count}회`);
}

console.log('\n--- 2회 반복 ---');
const exact2 = sorted.filter(([, c]) => c === 2);
console.log(`2회 반복 단어: ${exact2.length}개`);
for (const [word, count] of exact2) {
  console.log(`  ${word}: ${count}회`);
}

console.log(`\n--- 전체 고유 의미 단어 수: ${sorted.length}개 ---`);
