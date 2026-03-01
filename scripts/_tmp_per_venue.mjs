#!/usr/bin/env node
import { readFileSync } from 'fs';

const venues = JSON.parse(readFileSync('data/venues.json', 'utf8'));

// 가게이름 토큰 보호 (업소별로)
function getVenueNameTokens(v) {
  const tokens = new Set();
  [v.name_display, v.name_input, v.name_seo].filter(Boolean).forEach(n => {
    const parts = n.match(/[\uAC00-\uD7AF]{2,}/g) || [];
    parts.forEach(p => tokens.add(p));
    const eng = n.match(/[a-zA-Z]{2,}/g) || [];
    eng.forEach(p => tokens.add(p.toLowerCase()));
  });
  // 지역명도 보호
  if (v.region) {
    const regionParts = v.region.match(/[\uAC00-\uD7AF]{2,}/g) || [];
    regionParts.forEach(p => tokens.add(p));
  }
  return tokens;
}

// 모든 텍스트 추출
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
        else if (typeof val === 'object' && val !== null && !Array.isArray(val)) walkObj(val);
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
        else if (typeof val === 'object' && val !== null && !Array.isArray(val)) walkPlanner(val);
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

// 업소별 분석
let totalVenuesWithIssues = 0;
let totalExcessWords = 0;

venues.forEach(v => {
  const nameTokens = getVenueNameTokens(v);
  const allText = extractAllTexts(v).join(' ');
  const words = allText.match(/[\uAC00-\uD7AF]{2,}/g) || [];

  const freq = {};
  words.forEach(w => {
    if (nameTokens.has(w)) return;
    freq[w] = (freq[w] || 0) + 1;
  });

  const over5 = Object.entries(freq).filter(([w, c]) => c >= 5).sort((a, b) => b[1] - a[1]);
  if (over5.length > 0) {
    totalVenuesWithIssues++;
    const excess = over5.reduce((sum, [, c]) => sum + (c - 4), 0);
    totalExcessWords += excess;
    console.log(`\n[${v.name_display}] ${over5.length}개 단어 5회+ (초과 ${excess}개)`);
    over5.slice(0, 15).forEach(([w, c]) => console.log(`  "${w}": ${c}회 (초과 ${c - 4})`));
    if (over5.length > 15) console.log(`  ... +${over5.length - 15}개 더`);
  }
});

console.log(`\n=== 요약 ===`);
console.log(`문제 있는 업소: ${totalVenuesWithIssues}/${venues.length}`);
console.log(`총 초과 단어 수: ${totalExcessWords}`);
