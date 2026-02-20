import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const v = JSON.parse(readFileSync(join(ROOT, 'data', 'venues.json'), 'utf8'));

console.log('=== FINAL VERIFICATION ===');
console.log('Total venues:', v.length);
console.log('Venues with pageTitle:', v.filter(x => x.pageTitle).length);
console.log('Venues with metaDescription:', v.filter(x => x.metaDescription).length);
console.log('Venues with h1Title:', v.filter(x => x.h1Title).length);
console.log('Venues with sectionIntros:', v.filter(x => x.sectionIntros).length);
console.log('Venues with conclusionText:', v.filter(x => x.conclusionText).length);
console.log();
console.log('Unique pageTitles:', new Set(v.map(x => x.pageTitle)).size, '/', v.length);
console.log('Unique metaDescriptions:', new Set(v.map(x => x.metaDescription)).size, '/', v.length);
console.log('Unique h1Titles:', new Set(v.map(x => x.h1Title)).size, '/', v.length);
console.log();

// Verify all titles start with store name
const badTitles = v.filter(x => !(x.pageTitle || '').startsWith(x.name_display));
console.log('Titles NOT starting with store name:', badTitles.length);
const badH1 = v.filter(x => !(x.h1Title || '').startsWith(x.name_display));
console.log('H1s NOT starting with store name:', badH1.length);
console.log();

// Headline packs count
const headlinesDir = join(ROOT, 'src', 'data', 'headlines');
const packs = readdirSync(headlinesDir).filter(f => f.endsWith('.json'));
console.log('Headline pack files:', packs.length);
console.log();

// Show sample pages
console.log('=== SAMPLE CHOSEN TITLES ===');
for (const type of ['club', 'night', 'lounge']) {
  console.log(`\n--- ${type.toUpperCase()} ---`);
  v.filter(x => x.type === type).slice(0, 2).forEach(s => {
    console.log(`${s.name_display}:`);
    console.log(`  Title: ${s.pageTitle}`);
    console.log(`  H1:    ${s.h1Title}`);
    console.log(`  Desc:  ${(s.metaDescription || '').slice(0, 80)}...`);
    const ct = s.conclusionText || '';
    const re = new RegExp(s.name_display.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const nameCount = (ct.match(re) || []).length;
    console.log(`  Conclusion store name count: ${nameCount}`);
  });
}

// Store name density in built pages
console.log('\n=== STORE NAME DENSITY IN BUILT PAGES ===');
const sampleIds = [v[0], v[49], v[110]]; // club, night, lounge
for (const s of sampleIds) {
  const slug = s.urlSlug || s.venueSlug;
  const htmlPath = join(ROOT, 'dist', s.typePath, s.regionSlug, slug, 'index.html');
  try {
    const html = readFileSync(htmlPath, 'utf8');
    const re = new RegExp(s.name_display.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const total = (html.match(re) || []).length;
    // Count in visible text only (exclude tags)
    const textOnly = html.replace(/<[^>]+>/g, ' ');
    const visibleCount = (textOnly.match(re) || []).length;
    console.log(`  ${s.name_display}: total=${total}, visible_text=${visibleCount}`);
  } catch (e) {
    console.log(`  ${s.name_display}: HTML not found`);
  }
}

console.log('\n✅ Verification complete');
