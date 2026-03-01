#!/usr/bin/env node
import { readFileSync } from 'fs';

const venues = JSON.parse(readFileSync('data/venues.json', 'utf8'));

// 모든 업소명 수집
const venueNameTokens = new Set();
venues.forEach(v => {
  [v.name_display, v.name_input, v.name_seo].filter(Boolean).forEach(n => {
    const parts = n.match(/[\uAC00-\uD7AF]{2,}/g) || [];
    parts.forEach(p => venueNameTokens.add(p));
    const eng = n.match(/[a-zA-Z]{2,}/g) || [];
    eng.forEach(p => venueNameTokens.add(p.toLowerCase()));
  });
});

console.log('보호할 가게이름 토큰:', venueNameTokens.size, '개');

// 모든 텍스트 필드에서 토큰 추출
function extractAllTexts(v) {
  const texts = [];
  const stringFields = [
    'pageTitle', 'metaDescription', 'teaser', 'description_short',
    'hookIntro', 'conclusionText', 'card_hook', 'card_value',
    'seoTitle', 'seoDescription', 'h1Title', 'image_alt'
  ];
  stringFields.forEach(f => { if (v[f] && typeof v[f] === 'string') texts.push(v[f]); });

  if (v.story) Object.values(v.story).forEach(val => { if (typeof val === 'string') texts.push(val); });
  if (v.bodySections) {
    function walkObj(obj) {
      for (const val of Object.values(obj)) {
        if (typeof val === 'string') texts.push(val);
        else if (typeof val === 'object' && val) walkObj(val);
      }
    }
    walkObj(v.bodySections);
  }
  if (v.faq) v.faq.forEach(f => { texts.push(f.q); texts.push(f.a); });
  if (v.timeline) v.timeline.forEach(t => { if (t.desc) texts.push(t.desc); if (t.label) texts.push(t.label); });
  if (v.checklist) v.checklist.forEach(c => texts.push(c));
  if (v.sectionIntros) Object.values(v.sectionIntros).forEach(val => { if (typeof val === 'string') texts.push(val); });
  if (v.intro) {
    if (v.intro.hook) texts.push(v.intro.hook);
    if (v.intro.valuePromise) texts.push(v.intro.valuePromise);
    if (v.intro.checklist) v.intro.checklist.forEach(c => texts.push(c));
    if (v.intro.teasers) v.intro.teasers.forEach(t => texts.push(t));
    if (v.intro.riskItems) v.intro.riskItems.forEach(r => { if (r.doInstead) texts.push(r.doInstead); if (r.risk) texts.push(r.risk); });
  }
  if (v.plannerRules) {
    function walkPlanner(obj) {
      for (const val of Object.values(obj)) {
        if (typeof val === 'string') texts.push(val);
        else if (typeof val === 'object' && val) walkPlanner(val);
      }
    }
    walkPlanner(v.plannerRules);
  }
  if (v.quickPlan) {
    if (v.quickPlan.costNote) texts.push(v.quickPlan.costNote);
    if (v.quickPlan.table) v.quickPlan.table.forEach(r => { if (r.tip) texts.push(r.tip); });
    if (v.quickPlan.scenarios) v.quickPlan.scenarios.forEach(s => { if (s.desc) texts.push(s.desc); });
  }
  if (v.keywords) texts.push(v.keywords.join(' '));

  return texts;
}

// 글로벌 단어 빈도 계산
const wordCount = {};
venues.forEach(v => {
  const allText = extractAllTexts(v).join(' ');
  const words = allText.match(/[\uAC00-\uD7AF]{2,}/g) || [];
  words.forEach(w => {
    if (venueNameTokens.has(w)) return; // 가게이름 보호
    wordCount[w] = (wordCount[w] || 0) + 1;
  });
});

const over5 = Object.entries(wordCount).filter(([w, c]) => c >= 5).sort((a, b) => b[1] - a[1]);
console.log(`\n전체 텍스트 필드에서 5회이상 중복 (가게이름 제외): ${over5.length}개\n`);
over5.forEach(([w, c]) => console.log(`  "${w}": ${c}회`));

// 보호되는 가게이름 중 빈도 높은 것도 참고
console.log('\n--- 참고: 보호된 가게이름 토큰 일부 ---');
const protectedCount = {};
venues.forEach(v => {
  const allText = extractAllTexts(v).join(' ');
  const words = allText.match(/[\uAC00-\uD7AF]{2,}/g) || [];
  words.forEach(w => {
    if (venueNameTokens.has(w)) {
      protectedCount[w] = (protectedCount[w] || 0) + 1;
    }
  });
});
Object.entries(protectedCount).filter(([,c]) => c >= 20).sort((a,b) => b[1]-a[1]).forEach(([w,c]) => console.log(`  "${w}": ${c}회 (보호)`));
