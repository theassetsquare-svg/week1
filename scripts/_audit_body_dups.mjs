#!/usr/bin/env node
/**
 * Check cross-venue body content duplication in venues.json
 * Focus on actual editorial content (story, bodySections, faq answers, etc.)
 */
import { readFileSync } from 'fs';

const venues = JSON.parse(readFileSync('data/venues.json', 'utf8'));

// Collect body text per venue (excluding structural metadata)
const BODY_FIELDS = ['hookIntro', 'conclusionText', 'teaser', 'description_short'];
const SKIP = new Set(['id','type','typePath','typeLabel','regionSlug','venueSlug','urlSlug','geo','images','imagePrompts','relatedVenueIds','map_url','name_display','name_input','name_seo','region','card_tags','sourcePath','pageTitle','h1Title','seoTitle','seoDescription','metaDescription','keywords']);

function getBodyText(v) {
  const texts = [];
  function walk(obj, path) {
    if (typeof obj === 'string' && obj.length > 20) texts.push(obj);
    else if (Array.isArray(obj)) obj.forEach((item, i) => walk(item, `${path}[${i}]`));
    else if (typeof obj === 'object' && obj !== null) {
      for (const [k, val] of Object.entries(obj)) {
        if (SKIP.has(k)) continue;
        walk(val, `${path}.${k}`);
      }
    }
  }
  walk(v, 'v');
  return texts;
}

// Find 8-word phrases shared across 3+ venues
const phraseMap = new Map();
venues.forEach(v => {
  const texts = getBodyText(v);
  const allText = texts.join(' ');
  const words = allText.split(/\s+/).filter(w => w.length > 0);
  const seen = new Set();
  for (let i = 0; i <= words.length - 8; i++) {
    const phrase = words.slice(i, i + 8).join(' ');
    if (seen.has(phrase)) continue;
    seen.add(phrase);
    if (!phraseMap.has(phrase)) phraseMap.set(phrase, []);
    phraseMap.get(phrase).push(v.name_display);
  }
});

const dups = [];
for (const [phrase, vnames] of phraseMap) {
  if (vnames.length >= 3) dups.push({ phrase, count: vnames.length, venues: vnames.slice(0, 3) });
}
dups.sort((a, b) => b.count - a.count);

console.log(`\n=== BODY CONTENT 8-word phrase duplication ===`);
console.log(`Total phrases appearing in 3+ venues: ${dups.length}`);
console.log(`\nTop 30:`);
dups.slice(0, 30).forEach((d, i) => {
  console.log(`  ${i+1}. (${d.count} venues) "${d.phrase}" [${d.venues.join(', ')}...]`);
});

// Also check for common 10-word phrases
const longDups = [];
for (const [phrase, vnames] of phraseMap) {
  // Only count longer phrases (more words)
  if (vnames.length >= 5 && phrase.split(/\s+/).length >= 8) {
    const krCount = (phrase.match(/[\uAC00-\uD7AF]/g) || []).length;
    if (krCount >= 10) longDups.push({ phrase, count: vnames.length });
  }
}
longDups.sort((a, b) => b.count - a.count);

console.log(`\n=== Korean content phrases in 5+ venues ===`);
console.log(`Count: ${longDups.length}`);
longDups.slice(0, 20).forEach((d, i) => {
  console.log(`  ${i+1}. (${d.count} venues) "${d.phrase}"`);
});
