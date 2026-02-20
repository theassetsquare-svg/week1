#!/usr/bin/env node
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const dir = join(ROOT, 'src', 'data', 'headlines');
const PARTICLES = new Set(['은','는','이','가','을','를','에','의','와','과','도','vs','로','으로','에서','까지','부터','만','처럼','보다','나','며','고','면','때','것','수','더','안','못','다','한','할','된','인','적','중','별','용','해','및','등','그','저','또','각','1','2','3','4','5','6','7','8','9','0','+','·','FAQ','개','명','곳','때문','위한','위해','보는','하는','되는']);

let wfFails = 0;
const files = readdirSync(dir);
for (const f of files) {
  const pack = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  const wc = {};
  for (const v of pack.variants) {
    const hook = v.title.replace(pack.store, '').trim();
    const tokens = hook.split(/[\s·+]+/).filter(w => w.length >= 2 && !PARTICLES.has(w) && !/^\d+$/.test(w));
    for (const w of tokens) {
      wc[w] = (wc[w] || 0) + 1;
    }
  }
  const bad = Object.entries(wc).filter(([w, c]) => c > 3);
  if (bad.length) {
    wfFails++;
    console.log(pack.store, bad.map(([w, c]) => `${w}=${c}`).join(', '));
  }
}
console.log('\nWord freq max 3 check:', wfFails === 0 ? 'PASS' : `FAIL (${wfFails} venues)`);

// Also check title uniqueness, length, store-first, banned words
const venues = JSON.parse(readFileSync(join(ROOT, 'data', 'venues.json'), 'utf8'));
const BANNED = ['최고','완벽','대박','1위','공식','단독','예약','문의','전화번호','카톡'];
const allTitles = new Set();
let lenFails = 0, storeFails = 0, bannedFails = 0;

for (const v of venues) {
  const n = v.name_display.replace(/\s+/g, '');
  if (!v.pageTitle.startsWith(n)) storeFails++;
  if (v.pageTitle.length < 28 || v.pageTitle.length > 55) lenFails++;
  const tokens = v.pageTitle.split(/\s+/);
  if (BANNED.some(b => tokens.some(t => t.startsWith(b)))) bannedFails++;
  allTitles.add(v.pageTitle);
}
const dupes = venues.length - allTitles.size;

console.log('\n=== HEADLINE QA SUMMARY ===');
console.log('Store name first:', storeFails === 0 ? 'PASS' : `FAIL (${storeFails})`);
console.log('No banned claims:', bannedFails === 0 ? 'PASS' : `FAIL (${bannedFails})`);
console.log('Title length 28-55:', lenFails === 0 ? 'PASS' : `FAIL (${lenFails})`);
console.log('No duplicate titles:', dupes === 0 ? 'PASS' : `FAIL (${dupes})`);
console.log('Word freq max 3:', wfFails === 0 ? 'PASS' : `FAIL (${wfFails})`);
console.log('Headline packs:', files.length, '/', venues.length);
const allPass = storeFails === 0 && bannedFails === 0 && lenFails === 0 && dupes === 0 && wfFails === 0;
console.log('\nOVERALL:', allPass ? 'ALL QA PASSED' : 'NEEDS FIXES');
process.exit(allPass ? 0 : 1);
