#!/usr/bin/env node
/**
 * 간단한 접근: 업소별로 전체 텍스트에서 단어 빈도를 세고,
 * 5회 이상인 단어를 필드별로 제거 (후순위 필드부터)
 */
import { readFileSync } from 'fs';

const venues = JSON.parse(readFileSync('data/venues.json', 'utf8'));
const v = venues[0]; // 테스트: 강남 레이스 클럽

const protectedTokens = new Set();
[v.name_display, v.name_input, v.name_seo].filter(Boolean).forEach(n => {
  (n.match(/[\uAC00-\uD7AF]{2,}/g) || []).forEach(p => protectedTokens.add(p));
});
if (v.region) (v.region.match(/[\uAC00-\uD7AF]{2,}/g) || []).forEach(p => protectedTokens.add(p));

console.log('Protected:', [...protectedTokens]);

// 모든 editable 필드의 텍스트 수집 (priority 순서)
const fields = [];
function addField(obj, key, label, priority) {
  if (obj && typeof obj[key] === 'string' && obj[key].length > 0) {
    fields.push({ obj, key, label, priority });
  }
}

// Priority 1: story
if (v.story) for (const k of Object.keys(v.story)) addField(v.story, k, `story.${k}`, 1);

// Priority 1: bodySections (flat walk)
if (v.bodySections) {
  function walkBS(o, prefix) {
    for (const k of Object.keys(o)) {
      if (typeof o[k] === 'string') addField(o, k, `${prefix}.${k}`, 1);
      else if (typeof o[k] === 'object' && o[k] !== null && !Array.isArray(o[k])) walkBS(o[k], `${prefix}.${k}`);
    }
  }
  walkBS(v.bodySections, 'body');
}

// Priority 2: faq answers, timeline, checklist
if (v.faq) v.faq.forEach((f, i) => addField(f, 'a', `faq[${i}].a`, 2));
if (v.timeline) v.timeline.forEach((t, i) => { if (t.desc) addField(t, 'desc', `timeline[${i}].desc`, 2); });
if (v.checklist) v.checklist.forEach((c, i) => addField(v.checklist, i, `checklist[${i}]`, 2));

// Priority 3: plannerRules, quickPlan, intro
if (v.plannerRules) {
  function walkPR(o, prefix) {
    for (const k of Object.keys(o)) {
      if (typeof o[k] === 'string') addField(o, k, `${prefix}.${k}`, 3);
      else if (typeof o[k] === 'object' && o[k] !== null && !Array.isArray(o[k])) walkPR(o[k], `${prefix}.${k}`);
    }
  }
  walkPR(v.plannerRules, 'planner');
}
if (v.quickPlan) {
  if (v.quickPlan.costNote) addField(v.quickPlan, 'costNote', 'qp.costNote', 3);
  if (v.quickPlan.table) v.quickPlan.table.forEach((r, i) => { if (r.tip) addField(r, 'tip', `qp.table[${i}].tip`, 3); });
  if (v.quickPlan.scenarios) v.quickPlan.scenarios.forEach((s, i) => { if (s.desc) addField(s, 'desc', `qp.scenarios[${i}].desc`, 3); });
}
if (v.intro) {
  if (v.intro.hook) addField(v.intro, 'hook', 'intro.hook', 3);
  if (v.intro.valuePromise) addField(v.intro, 'valuePromise', 'intro.valuePromise', 3);
  if (v.intro.teasers) v.intro.teasers.forEach((t, i) => addField(v.intro.teasers, i, `intro.teasers[${i}]`, 3));
  if (v.intro.riskItems) v.intro.riskItems.forEach((r, i) => { if (r.doInstead) addField(r, 'doInstead', `intro.risk[${i}]`, 3); });
}

// Priority 4: teaser, desc_short, conclusionText, hookIntro
['teaser','description_short','conclusionText','hookIntro','card_hook','card_value'].forEach(f => addField(v, f, f, 4));

// Priority 5: seo fields, sectionIntros
['seoDescription','metaDescription'].forEach(f => addField(v, f, f, 5));
if (v.sectionIntros) for (const k of Object.keys(v.sectionIntros)) addField(v.sectionIntros, k, `secIntro.${k}`, 5);

// Sort by priority (low first = remove first)
fields.sort((a, b) => a.priority - b.priority);

console.log(`\n총 editable 필드: ${fields.length}개`);

// Count word frequency across ALL fields (editable + readonly)
const allFreq = {};
function countTokens(text) {
  const tokens = text.match(/[\uAC00-\uD7AF]{2,}/g) || [];
  tokens.forEach(w => {
    if (protectedTokens.has(w)) return;
    allFreq[w] = (allFreq[w] || 0) + 1;
  });
}

// Editable fields
fields.forEach(f => countTokens(f.obj[f.key]));
// Readonly fields
['pageTitle', 'h1Title', 'seoTitle'].forEach(f => { if (v[f]) countTokens(v[f]); });
if (v.faq) v.faq.forEach(f => countTokens(f.q));

const overWords = Object.entries(allFreq).filter(([, c]) => c > 4).sort((a, b) => b[1] - a[1]);
console.log(`\n5회+ 단어 (${overWords.length}개):`);
overWords.forEach(([w, c]) => console.log(`  "${w}": ${c}회`));

// Now simulate removal for "입장"
const testWord = '입장';
console.log(`\n=== "${testWord}" 제거 시뮬레이션 ===`);

// Count in readonly
let roCount = 0;
['pageTitle', 'h1Title', 'seoTitle'].forEach(f => {
  if (v[f]) {
    const c = (v[f].match(/[\uAC00-\uD7AF]{2,}/g) || []).filter(t => t === testWord).length;
    if (c > 0) { console.log(`  RO: ${f} → ${c}`); roCount += c; }
  }
});
if (v.faq) v.faq.forEach((f, i) => {
  const c = (f.q.match(/[\uAC00-\uD7AF]{2,}/g) || []).filter(t => t === testWord).length;
  if (c > 0) { console.log(`  RO: faq[${i}].q → ${c}`); roCount += c; }
});

console.log(`  RO total: ${roCount}`);
const keepInEditable = Math.max(0, 4 - roCount);
console.log(`  Keep in editable: ${keepInEditable}`);

// Count in each editable field
let editCount = 0;
fields.forEach(f => {
  const text = f.obj[f.key];
  const c = (text.match(/[\uAC00-\uD7AF]{2,}/g) || []).filter(t => t === testWord).length;
  if (c > 0) {
    console.log(`  EDIT: ${f.label} (p${f.priority}) → ${c}`);
    editCount += c;
  }
});
console.log(`  Edit total: ${editCount}`);
console.log(`  To remove: ${Math.max(0, editCount - keepInEditable)}`);
