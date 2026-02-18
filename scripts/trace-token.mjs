#!/usr/bin/env node
import { readFileSync } from 'fs';

const file = process.argv[2];
const token = process.argv[3];

const html = readFileSync(file, 'utf-8');
const text = html
  .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-zA-Z]+;/g, ' ')
  .replace(/&#\d+;/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

// Count as token extraction
const tokens = text.match(/[\uAC00-\uD7AF]{2,}/g) || [];
const counts = {};
tokens.forEach(t => counts[t] = (counts[t] || 0) + 1);

console.log(`Token "${token}" extracted count:`, counts[token] || 0);

// Find occurrences with context
let pos = 0;
let idx = 0;
while ((pos = text.indexOf(token, pos)) !== -1) {
  const before = text[pos - 1] || '';
  const after = text[pos + token.length] || '';
  const isKorBefore = /[\uAC00-\uD7AF]/.test(before);
  const isKorAfter = /[\uAC00-\uD7AF]/.test(after);
  const standalone = !isKorBefore && !isKorAfter;
  if (standalone) {
    idx++;
    console.log(`  ${idx}: ...${text.substring(Math.max(0, pos - 20), pos + token.length + 20)}...`);
  }
  pos += 1;
}
