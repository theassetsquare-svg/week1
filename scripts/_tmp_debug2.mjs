#!/usr/bin/env node
import { readFileSync } from 'fs';

const venues = JSON.parse(readFileSync('data/venues.json', 'utf8'));
const v = venues[0]; // 강남 레이스 클럽

// Protected tokens
const protectedTokens = new Set();
[v.name_display, v.name_input, v.name_seo].filter(Boolean).forEach(n => {
  const kr = n.match(/[\uAC00-\uD7AF]{2,}/g) || [];
  kr.forEach(p => protectedTokens.add(p));
});
if (v.region) {
  const rk = v.region.match(/[\uAC00-\uD7AF]{2,}/g) || [];
  rk.forEach(p => protectedTokens.add(p));
}
console.log('Protected tokens:', [...protectedTokens]);

// Count "입장" in various field groups
const word = '입장';

// Check each text field
const allFields = [];

// story
if (v.story) {
  for (const [k, val] of Object.entries(v.story)) {
    if (typeof val === 'string') {
      const tokens = val.match(/[\uAC00-\uD7AF]{2,}/g) || [];
      const count = tokens.filter(t => t === word).length;
      if (count > 0) allFields.push({ field: `story.${k}`, count });
    }
  }
}

// bodySections
if (v.bodySections) {
  function walk(obj, prefix) {
    for (const [k, val] of Object.entries(obj)) {
      if (typeof val === 'string') {
        const tokens = val.match(/[\uAC00-\uD7AF]{2,}/g) || [];
        const count = tokens.filter(t => t === word).length;
        if (count > 0) allFields.push({ field: `${prefix}.${k}`, count });
      } else if (typeof val === 'object' && val) walk(val, `${prefix}.${k}`);
    }
  }
  walk(v.bodySections, 'bodySections');
}

// faq
if (v.faq) {
  v.faq.forEach((f, i) => {
    const tq = (f.q.match(/[\uAC00-\uD7AF]{2,}/g) || []).filter(t => t === word).length;
    const ta = (f.a.match(/[\uAC00-\uD7AF]{2,}/g) || []).filter(t => t === word).length;
    if (tq > 0) allFields.push({ field: `faq[${i}].q (readonly)`, count: tq });
    if (ta > 0) allFields.push({ field: `faq[${i}].a`, count: ta });
  });
}

// other fields
const sf = ['pageTitle','metaDescription','teaser','description_short','hookIntro','conclusionText',
  'card_hook','card_value','seoTitle','seoDescription','h1Title'];
sf.forEach(f => {
  if (v[f]) {
    const tokens = v[f].match(/[\uAC00-\uD7AF]{2,}/g) || [];
    const count = tokens.filter(t => t === word).length;
    if (count > 0) allFields.push({ field: f, count });
  }
});

// timeline, checklist
if (v.timeline) {
  v.timeline.forEach((t, i) => {
    if (t.desc) {
      const tokens = t.desc.match(/[\uAC00-\uD7AF]{2,}/g) || [];
      const count = tokens.filter(t2 => t2 === word).length;
      if (count > 0) allFields.push({ field: `timeline[${i}].desc`, count });
    }
  });
}

// sectionIntros
if (v.sectionIntros) {
  for (const [k, val] of Object.entries(v.sectionIntros)) {
    if (typeof val === 'string') {
      const tokens = val.match(/[\uAC00-\uD7AF]{2,}/g) || [];
      const count = tokens.filter(t => t === word).length;
      if (count > 0) allFields.push({ field: `sectionIntros.${k}`, count });
    }
  }
}

// intro
if (v.intro) {
  if (v.intro.hook) {
    const c = (v.intro.hook.match(/[\uAC00-\uD7AF]{2,}/g) || []).filter(t => t === word).length;
    if (c > 0) allFields.push({ field: 'intro.hook', count: c });
  }
  if (v.intro.valuePromise) {
    const c = (v.intro.valuePromise.match(/[\uAC00-\uD7AF]{2,}/g) || []).filter(t => t === word).length;
    if (c > 0) allFields.push({ field: 'intro.valuePromise', count: c });
  }
  if (v.intro.teasers) {
    v.intro.teasers.forEach((t, i) => {
      const c = (t.match(/[\uAC00-\uD7AF]{2,}/g) || []).filter(t2 => t2 === word).length;
      if (c > 0) allFields.push({ field: `intro.teasers[${i}]`, count: c });
    });
  }
}

// plannerRules
if (v.plannerRules) {
  function walkP(obj, prefix) {
    for (const [k, val] of Object.entries(obj)) {
      if (typeof val === 'string') {
        const tokens = val.match(/[\uAC00-\uD7AF]{2,}/g) || [];
        const count = tokens.filter(t => t === word).length;
        if (count > 0) allFields.push({ field: `${prefix}.${k}`, count });
      } else if (typeof val === 'object' && val) walkP(val, `${prefix}.${k}`);
    }
  }
  walkP(v.plannerRules, 'plannerRules');
}

// quickPlan
if (v.quickPlan) {
  if (v.quickPlan.costNote) {
    const c = (v.quickPlan.costNote.match(/[\uAC00-\uD7AF]{2,}/g) || []).filter(t => t === word).length;
    if (c > 0) allFields.push({ field: 'quickPlan.costNote', count: c });
  }
  if (v.quickPlan.scenarios) {
    v.quickPlan.scenarios.forEach((s, i) => {
      if (s.desc) {
        const c = (s.desc.match(/[\uAC00-\uD7AF]{2,}/g) || []).filter(t => t === word).length;
        if (c > 0) allFields.push({ field: `quickPlan.scenarios[${i}].desc`, count: c });
      }
    });
  }
}

console.log(`\n"${word}" 분포:`);
let total = 0;
allFields.forEach(f => { console.log(`  ${f.field}: ${f.count}`); total += f.count; });
console.log(`  총합: ${total}`);

// Now check: does the regex boundary match work?
console.log(`\n=== regex 테스트 ===`);
const testTexts = ['사전 입장 확인', '입장료는 무료', '입장합니다', '조기 입장이 가능합니다'];
testTexts.forEach(t => {
  const regex = new RegExp(`(?<![\\uAC00-\\uD7AF])${word}(?![\\uAC00-\\uD7AF])`, 'g');
  const matches = [...t.matchAll(regex)];
  console.log(`  "${t}" → matches: ${matches.length} [${matches.map(m=>m.index).join(',')}]`);
});
