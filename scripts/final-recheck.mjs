#!/usr/bin/env node
/**
 * PHASE 4: Final recheck before deployment
 */
import { readFileSync } from 'fs';

const venues = JSON.parse(readFileSync('data/venues.json', 'utf8'));

console.log('=== PHASE 4: FINAL RECHECK ===\n');

// 1) Main page card samples
console.log('--- Main Page (엄선 12) hook/value quality ---');
const nightPick = venues.filter(v => v.type === 'night').slice(0, 4);
const clubPick = venues.filter(v => v.type === 'club').slice(0, 4);
const loungePick = venues.filter(v => v.type === 'lounge').slice(0, 4);
const recommended = [...nightPick, ...clubPick, ...loungePick];
recommended.forEach((v, i) => {
  console.log(`  [${i+1}] ${v.name_display}`);
  console.log(`    hook:  ${v.card_hook}`);
  console.log(`    value: ${v.card_value}`);
  console.log(`    tags:  ${(v.card_tags || []).join(', ')}`);
});
console.log('');

// 2) Category samples
console.log('--- Category Samples ---');
['night', 'club', 'lounge'].forEach(type => {
  const sample = venues.filter(v => v.type === type);
  const mid = sample[Math.floor(sample.length / 2)];
  if (mid) {
    console.log(`  [${mid.typeLabel}] ${mid.name_display}`);
    console.log(`    hook:  ${mid.card_hook}`);
    console.log(`    value: ${mid.card_value}`);
  }
});
console.log('');

// 3) Map URL samples
console.log('--- Map URL Samples ---');
[0, 50, 100].forEach(i => {
  const v = venues[i];
  if (v) console.log(`  ${v.name_display}: ${v.map_url}`);
});
console.log('');

// 4) Image alt samples
console.log('--- Image Alt Samples ---');
[0, 30, 65, 100, 129].forEach(i => {
  const v = venues[i];
  if (v) console.log(`  ${v.name_display}: ${v.images[0]?.alt}`);
});
console.log('');

// 5) Banned words check
const BANNED = ['해당', '이곳', '공간', '매장', '감도', '기준'];
let bannedTotal = 0;
venues.forEach(v => {
  const t = (v.card_hook || '') + ' ' + (v.card_value || '');
  BANNED.forEach(w => { if (t.includes(w)) bannedTotal++; });
});
console.log(`--- Banned Words: ${bannedTotal} violations ---`);

// 6) Existence check
const missing = venues.filter(v => !v.card_hook || !v.card_value);
console.log(`--- Missing card_hook/value: ${missing.length} venues ---`);

// 7) Length check
const hookLens = venues.map(v => (v.card_hook || '').length);
const valueLens = venues.map(v => (v.card_value || '').length);
console.log(`--- Lengths ---`);
console.log(`  hook:  min=${Math.min(...hookLens)}, max=${Math.max(...hookLens)}, avg=${(hookLens.reduce((a,b)=>a+b,0)/hookLens.length).toFixed(1)}`);
console.log(`  value: min=${Math.min(...valueLens)}, max=${Math.max(...valueLens)}, avg=${(valueLens.reduce((a,b)=>a+b,0)/valueLens.length).toFixed(1)}`);
console.log('');

// 8) New tab / rel attributes (check component file)
const cardComponent = readFileSync('src/components/VenueCard.astro', 'utf8');
const hasTargetBlank = cardComponent.includes('target="_blank"');
const hasNoopener = cardComponent.includes('rel="noopener noreferrer"');
console.log(`--- VenueCard.astro ---`);
console.log(`  target="_blank": ${hasTargetBlank ? 'OK' : 'MISSING'}`);
console.log(`  rel="noopener noreferrer": ${hasNoopener ? 'OK' : 'MISSING'}`);
console.log(`  "지도 보기" link: ${cardComponent.includes('venue-card-map') ? 'OK' : 'MISSING'}`);
console.log('');

// Summary
const allOk = bannedTotal === 0 && missing.length === 0 && hasTargetBlank && hasNoopener;
if (allOk) {
  console.log('=== ALL PHASE 4 CHECKS PASSED ===');
} else {
  console.error('=== PHASE 4 FAILED ===');
  process.exit(1);
}
