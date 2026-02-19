const fs = require('fs');
const path = require('path');
const venues = JSON.parse(fs.readFileSync('/home/user/week1/data/venues.json', 'utf8'));

// Find the venue
const v = venues.find(v => v.urlSlug === '플러스82');
if (!v) { console.log('Venue not found!'); process.exit(1); }

console.log('=== 수정 전 ===');
const fields = ['hookIntro', 'teaser'];
const bodyFields = ['atmosphere', 'music', 'safety'];
const storyFields = ['scene1','scene2','scene3','scene4','scene5','scene6','scene7','scene8'];
const faqField = 'faq';

function countWord(text, word) {
  const re = new RegExp(word, 'g');
  return (text.match(re) || []).length;
}

function countAll(v, word) {
  let total = 0;
  fields.forEach(f => { if (v[f]) total += countWord(v[f], word); });
  bodyFields.forEach(f => { if (v.bodySections && v.bodySections[f]) total += countWord(v.bodySections[f], word); });
  storyFields.forEach(f => { if (v.story && v.story[f]) total += countWord(v.story[f], word); });
  if (v.faq) v.faq.forEach(f => { total += countWord(f.q, word) + countWord(f.a, word); });
  if (v.timeline) v.timeline.forEach(t => { total += countWord(t.label, word) + countWord(t.desc, word); });
  if (v.checklist) v.checklist.forEach(c => { total += countWord(c, word); });
  if (v.plannerRules) {
    Object.values(v.plannerRules).forEach(group => {
      Object.entries(group).forEach(([k, val]) => {
        total += countWord(k, word) + countWord(val, word);
      });
    });
  }
  if (v.pageTitle) total += countWord(v.pageTitle, word);
  return total;
}

const word = '플러스';
console.log(`"${word}" in data fields: ${countAll(v, word)}`);

// Strategy: Replace excess occurrences of 플러스 with synonyms/alternatives
// Keep it in name_display, pageTitle, and first mention in hookIntro
// Remove from other places by replacing with contextual alternatives

function replaceNth(text, word, replacements) {
  let count = 0;
  return text.replace(new RegExp(word, 'g'), (match) => {
    count++;
    if (count <= 1) return match; // keep first occurrence
    const rep = replacements[(count - 2) % replacements.length];
    return rep;
  });
}

// For 플러스82 - the venue name contains 플러스
// We need to keep it in name references but remove standalone 플러스 mentions
// Replace "플러스" with contextual alternatives where it's not part of the venue name "플러스82"

function smartReplace(text, keepFirst) {
  // First, protect "플러스82" by replacing with placeholder
  let protected_text = text.replace(/플러스82/g, '___PLUS82___');

  // Now count remaining standalone 플러스
  const standalone = (protected_text.match(/플러스/g) || []).length;

  if (standalone > 0) {
    // Replace standalone 플러스 (not part of 플러스82)
    let count = 0;
    protected_text = protected_text.replace(/플러스/g, (match) => {
      count++;
      if (keepFirst && count <= 1) return match;
      // Replace with contextual words
      const alts = ['특별한', '프리미엄', '새로운', '독특한', '차별화된'];
      return alts[(count - 1) % alts.length];
    });
  }

  // Restore 플러스82
  protected_text = protected_text.replace(/___PLUS82___/g, '플러스82');

  // Now check how many 플러스 remain (from 플러스82 references)
  return protected_text;
}

// Apply to all text fields
fields.forEach(f => {
  if (v[f]) v[f] = smartReplace(v[f], f === 'hookIntro');
});

bodyFields.forEach(f => {
  if (v.bodySections && v.bodySections[f]) {
    v.bodySections[f] = smartReplace(v.bodySections[f], false);
  }
});

storyFields.forEach(f => {
  if (v.story && v.story[f]) {
    v.story[f] = smartReplace(v.story[f], false);
  }
});

if (v.faq) {
  v.faq.forEach(f => {
    f.q = smartReplace(f.q, false);
    f.a = smartReplace(f.a, false);
  });
}

if (v.timeline) {
  v.timeline.forEach(t => {
    t.label = smartReplace(t.label, false);
    t.desc = smartReplace(t.desc, false);
  });
}

if (v.checklist) {
  v.checklist = v.checklist.map(c => smartReplace(c, false));
}

if (v.plannerRules) {
  const newRules = {};
  Object.entries(v.plannerRules).forEach(([groupKey, group]) => {
    newRules[groupKey] = {};
    Object.entries(group).forEach(([k, val]) => {
      newRules[groupKey][smartReplace(k, false)] = smartReplace(val, false);
    });
  });
  v.plannerRules = newRules;
}

console.log('\n=== 수정 후 ===');
console.log(`"${word}" in data fields: ${countAll(v, word)}`);

fs.writeFileSync('/home/user/week1/data/venues.json', JSON.stringify(venues, null, 2));
console.log('\nvenues.json 저장 완료');
