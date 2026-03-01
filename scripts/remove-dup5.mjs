#!/usr/bin/env node
/**
 * remove-dup5.mjs  (PHASE 8)
 * 업소별 — 가게이름 제외, 한 업소 내 5회 이상 반복 단어의 초과분 삭제
 * 4회까지 유지, 5회째부터 제거
 * 우선순위 낮은 필드부터 제거, 모든 필드 처리 (무조건삭제)
 */
import { readFileSync, writeFileSync } from 'fs';

const VENUES_PATH = 'data/venues.json';
const venues = JSON.parse(readFileSync(VENUES_PATH, 'utf8'));
const MAX_REPEAT = 4;

/* ── 보호 토큰 (업소별 가게이름+지역) ── */
function getProtected(v) {
  const s = new Set();
  [v.name_display, v.name_input, v.name_seo].filter(Boolean).forEach(n => {
    (n.match(/[\uAC00-\uD7AF]{2,}/g) || []).forEach(p => s.add(p));
    (n.match(/[a-zA-Z]{2,}/g) || []).forEach(p => s.add(p.toLowerCase()));
  });
  if (v.region) (v.region.match(/[\uAC00-\uD7AF]{2,}/g) || []).forEach(p => s.add(p));
  return s;
}

/* ── 필드 수집 (ref 기반) ── */
function collectFields(v) {
  const fields = []; // { obj, key, label, priority }

  function add(obj, key, label, pri) {
    if (obj && obj[key] !== undefined && typeof obj[key] === 'string' && obj[key].length > 0) {
      fields.push({ obj, key, label, priority: pri });
    }
  }

  function walkObj(obj, prefix, pri) {
    if (!obj || typeof obj !== 'object') return;
    for (const k of Object.keys(obj)) {
      if (typeof obj[k] === 'string' && obj[k].length > 0) {
        fields.push({ obj, key: k, label: `${prefix}.${k}`, priority: pri });
      } else if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
        walkObj(obj[k], `${prefix}.${k}`, pri);
      }
    }
  }

  // P1: story, bodySections
  if (v.story) walkObj(v.story, 'story', 1);
  if (v.bodySections) walkObj(v.bodySections, 'body', 1);

  // P2: faq.a, timeline.desc, timeline.label, checklist
  if (v.faq) v.faq.forEach((f, i) => add(f, 'a', `faq[${i}].a`, 2));
  if (v.timeline) v.timeline.forEach((t, i) => { add(t, 'desc', `tl[${i}]`, 2); add(t, 'label', `tl[${i}].label`, 2); });
  if (v.checklist) v.checklist.forEach((_, i) => add(v.checklist, String(i), `ck[${i}]`, 2));

  // P3: plannerRules, quickPlan, intro
  if (v.plannerRules) walkObj(v.plannerRules, 'planner', 3);
  if (v.quickPlan) {
    add(v.quickPlan, 'costNote', 'qp.cost', 3);
    if (v.quickPlan.table) v.quickPlan.table.forEach((r, i) => add(r, 'tip', `qp.t[${i}]`, 3));
    if (v.quickPlan.scenarios) v.quickPlan.scenarios.forEach((s, i) => add(s, 'desc', `qp.s[${i}]`, 3));
  }
  if (v.intro) {
    add(v.intro, 'hook', 'intro.hook', 3);
    add(v.intro, 'valuePromise', 'intro.vp', 3);
    if (v.intro.teasers) v.intro.teasers.forEach((_, i) => add(v.intro.teasers, String(i), `intro.t[${i}]`, 3));
    if (v.intro.riskItems) v.intro.riskItems.forEach((r, i) => { add(r, 'doInstead', `intro.r[${i}]`, 3); add(r, 'risk', `intro.rk[${i}]`, 3); });
    if (v.intro.checklist) v.intro.checklist.forEach((_, i) => add(v.intro.checklist, String(i), `intro.ck[${i}]`, 3));
  }

  // P4: editorial text, image_alt
  ['teaser', 'description_short', 'conclusionText', 'hookIntro', 'card_hook', 'card_value', 'image_alt'].forEach(f => add(v, f, f, 4));

  // P4: keywords (배열 → join 후 처리)
  if (v.keywords && v.keywords.length > 0) {
    // keywords는 배열이므로 각 항목을 개별 필드로 처리
    v.keywords.forEach((_, i) => add(v.keywords, String(i), `kw[${i}]`, 4));
  }

  // P5: SEO, sectionIntros
  ['seoDescription', 'metaDescription'].forEach(f => add(v, f, f, 5));
  if (v.sectionIntros) walkObj(v.sectionIntros, 'secI', 5);

  // P6: 이전 readonly — pageTitle, h1Title, seoTitle, faq.q (마지막에 제거)
  ['pageTitle', 'h1Title', 'seoTitle'].forEach(f => add(v, f, f, 6));
  if (v.faq) v.faq.forEach((f, i) => add(f, 'q', `faq[${i}].q`, 6));

  // Sort: low priority first (remove from these first)
  fields.sort((a, b) => a.priority - b.priority);
  return fields;
}

/* ── 한글 2+ 토큰 추출 ── */
function krTokens(text) {
  return text.match(/[\uAC00-\uD7AF]{2,}/g) || [];
}

/* ── 필드 내에서 word의 n번째 이후 출현 제거 ── */
function removeFromField(text, word, keepCount) {
  // 토큰 경계: 앞뒤가 한글이 아닌 위치에서만 매칭
  let hitIdx = 0;
  let result = '';
  let i = 0;

  while (i < text.length) {
    const remaining = text.substring(i);
    const pos = remaining.indexOf(word);

    if (pos === -1) {
      result += remaining;
      break;
    }

    const absPos = i + pos;
    const beforeChar = absPos > 0 ? text.charCodeAt(absPos - 1) : 0;
    const afterChar = absPos + word.length < text.length ? text.charCodeAt(absPos + word.length) : 0;

    const beforeIsKR = beforeChar >= 0xAC00 && beforeChar <= 0xD7AF;
    const afterIsKR = afterChar >= 0xAC00 && afterChar <= 0xD7AF;

    if (beforeIsKR || afterIsKR) {
      // word가 더 큰 한글 단어 안에 있음 → 건너뜀
      result += remaining.substring(0, pos + word.length);
      i = absPos + word.length;
      continue;
    }

    // 독립 단어 발견
    hitIdx++;
    if (hitIdx <= keepCount) {
      // 유지
      result += remaining.substring(0, pos + word.length);
    } else {
      // 제거
      result += remaining.substring(0, pos);
      // 뒤쪽 공백 하나 제거 (자연스러운 정리)
    }
    i = absPos + word.length;
  }

  // 정리
  return result.replace(/\s{2,}/g, ' ').replace(/\s+([,.·!?])/g, '$1').trim();
}

/* ── MAIN ── */
let totalRemoved = 0;
let totalFieldsFixed = 0;
let venuesProcessed = 0;

const LOG = process.argv.includes('--verbose');

venues.forEach((v, vi) => {
  const prot = getProtected(v);
  const fields = collectFields(v);

  // 모든 필드에서 단어 빈도
  const totalFreq = {};
  fields.forEach(f => {
    krTokens(f.obj[f.key]).forEach(w => { if (!prot.has(w)) totalFreq[w] = (totalFreq[w] || 0) + 1; });
  });

  // 초과 단어
  const overWords = Object.entries(totalFreq).filter(([, c]) => c > MAX_REPEAT);
  if (overWords.length === 0) return;

  venuesProcessed++;
  let venueRemoved = 0;

  // 각 초과 단어 처리
  for (const [word, totalCount] of overWords) {
    const keepInEdit = MAX_REPEAT;

    // 필드별 출현 수 계산
    const fieldHits = [];
    fields.forEach((f, fi) => {
      const text = f.obj[f.key];
      // 간단한 출현 카운트 (독립 단어만)
      let count = 0;
      let pos = 0;
      while (pos < text.length) {
        const idx = text.indexOf(word, pos);
        if (idx === -1) break;
        const bc = idx > 0 ? text.charCodeAt(idx - 1) : 0;
        const ac = idx + word.length < text.length ? text.charCodeAt(idx + word.length) : 0;
        const bKR = bc >= 0xAC00 && bc <= 0xD7AF;
        const aKR = ac >= 0xAC00 && ac <= 0xD7AF;
        if (!bKR && !aKR) count++;
        pos = idx + word.length;
      }
      if (count > 0) fieldHits.push({ fi, count });
    });

    const editTotal = fieldHits.reduce((s, h) => s + h.count, 0);
    if (editTotal <= keepInEdit) continue;

    // 필드 순서대로 유지/제거 결정
    let remaining = keepInEdit;
    for (const hit of fieldHits) {
      const f = fields[hit.fi];
      if (remaining >= hit.count) {
        remaining -= hit.count;
      } else {
        // 이 필드에서 일부/전부 제거
        const keepHere = remaining;
        remaining = 0;
        const toRemove = hit.count - keepHere;

        const oldText = f.obj[f.key];
        const newText = removeFromField(oldText, word, keepHere);

        if (newText !== oldText) {
          f.obj[f.key] = newText;
          venueRemoved += toRemove;
          totalFieldsFixed++;

          if (LOG) {
            console.log(`  [${v.name_display}] "${word}" x${toRemove} removed from ${f.label}`);
          }
        }
      }
    }
  }

  totalRemoved += venueRemoved;
  if (LOG && venueRemoved > 0) {
    console.log(`  → ${v.name_display}: ${venueRemoved}개 제거`);
  }
});

console.log(`\n=== remove-dup5 결과 ===`);
console.log(`처리 업소: ${venuesProcessed}/${venues.length}`);
console.log(`제거된 단어 인스턴스: ${totalRemoved}`);
console.log(`수정된 필드 수: ${totalFieldsFixed}`);

writeFileSync(VENUES_PATH, JSON.stringify(venues, null, 2), 'utf8');
console.log('venues.json 저장 완료\n');
