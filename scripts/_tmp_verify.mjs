#!/usr/bin/env node
import { readFileSync } from 'fs';

const venues = JSON.parse(readFileSync('data/venues.json', 'utf8'));

function getProtected(v) {
  const s = new Set();
  [v.name_display, v.name_input, v.name_seo].filter(Boolean).forEach(n => {
    (n.match(/[\uAC00-\uD7AF]{2,}/g) || []).forEach(p => s.add(p));
  });
  if (v.region) (v.region.match(/[\uAC00-\uD7AF]{2,}/g) || []).forEach(p => s.add(p));
  return s;
}

// Same field extraction as _tmp_per_venue but track which field each token comes from
function analyzeVenue(v) {
  const prot = getProtected(v);
  const freq = {};
  const fieldSources = {}; // word -> [{field, count}]

  function countField(text, fieldName) {
    const tokens = text.match(/[\uAC00-\uD7AF]{2,}/g) || [];
    tokens.forEach(w => {
      if (prot.has(w)) return;
      freq[w] = (freq[w] || 0) + 1;
      if (!fieldSources[w]) fieldSources[w] = {};
      fieldSources[w][fieldName] = (fieldSources[w][fieldName] || 0) + 1;
    });
  }

  // String fields
  ['pageTitle', 'metaDescription', 'teaser', 'description_short',
   'hookIntro', 'conclusionText', 'card_hook', 'card_value',
   'seoTitle', 'seoDescription', 'h1Title', 'image_alt'].forEach(f => {
    if (v[f] && typeof v[f] === 'string') countField(v[f], f);
  });

  if (v.story) Object.entries(v.story).forEach(([k,val]) => { if (typeof val === 'string') countField(val, `story.${k}`); });
  if (v.bodySections) {
    function walkObj(obj, prefix) {
      for (const [k, val] of Object.entries(obj)) {
        if (typeof val === 'string') countField(val, `${prefix}.${k}`);
        else if (typeof val === 'object' && val && !Array.isArray(val)) walkObj(val, `${prefix}.${k}`);
      }
    }
    walkObj(v.bodySections, 'body');
  }
  if (v.faq) v.faq.forEach((f,i) => { countField(f.q, `faq[${i}].q`); countField(f.a, `faq[${i}].a`); });
  if (v.timeline) v.timeline.forEach((t,i) => { if(t.desc) countField(t.desc, `tl[${i}]`); if(t.label) countField(t.label, `tl[${i}].label`); });
  if (v.checklist) v.checklist.forEach((c,i) => countField(c, `ck[${i}]`));
  if (v.sectionIntros) Object.entries(v.sectionIntros).forEach(([k,val]) => { if (typeof val === 'string') countField(val, `secI.${k}`); });
  if (v.intro) {
    if (v.intro.hook) countField(v.intro.hook, 'intro.hook');
    if (v.intro.valuePromise) countField(v.intro.valuePromise, 'intro.vp');
    if (v.intro.checklist) v.intro.checklist.forEach((c,i) => countField(c, `intro.ck[${i}]`));
    if (v.intro.teasers) v.intro.teasers.forEach((t,i) => countField(t, `intro.t[${i}]`));
    if (v.intro.riskItems) v.intro.riskItems.forEach((r,i) => { if(r.doInstead) countField(r.doInstead, `intro.r[${i}]`); if(r.risk) countField(r.risk, `intro.rk[${i}]`); });
  }
  if (v.plannerRules) {
    function walkP(obj, prefix) {
      for (const [k, val] of Object.entries(obj)) {
        if (typeof val === 'string') countField(val, `${prefix}.${k}`);
        else if (typeof val === 'object' && val && !Array.isArray(val)) walkP(val, `${prefix}.${k}`);
      }
    }
    walkP(v.plannerRules, 'planner');
  }
  if (v.quickPlan) {
    if (v.quickPlan.costNote) countField(v.quickPlan.costNote, 'qp.cost');
    if (v.quickPlan.table) v.quickPlan.table.forEach((r,i) => { if(r.tip) countField(r.tip, `qp.t[${i}]`); });
    if (v.quickPlan.scenarios) v.quickPlan.scenarios.forEach((s,i) => { if(s.desc) countField(s.desc, `qp.s[${i}]`); });
  }
  if (v.keywords) countField(v.keywords.join(' '), 'keywords');

  return { freq, fieldSources };
}

let totalExcess = 0;
let shown = 0;
venues.forEach(v => {
  const { freq, fieldSources } = analyzeVenue(v);
  const over = Object.entries(freq).filter(([,c]) => c >= 5).sort((a,b) => b[1]-a[1]);
  if (over.length > 0 && shown < 5) {
    shown++;
    console.log(`\n[${v.name_display}] ${over.length}개 단어 5회+:`);
    over.forEach(([w,c]) => {
      const excess = c - 4;
      totalExcess += excess;
      const sources = Object.entries(fieldSources[w]).map(([f,n]) => `${f}:${n}`).join(', ');
      console.log(`  "${w}" x${c} → ${sources}`);
    });
  } else {
    over.forEach(([,c]) => { totalExcess += c - 4; });
  }
});

console.log(`\n총 초과: ${totalExcess}`);
