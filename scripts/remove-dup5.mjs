#!/usr/bin/env node
/**
 * remove-dup5.mjs  (PHASE 8)
 * 업소별 — 가게이름 제외하고 중복단어 5개 이상이면 초과분 삭제
 * 4회까지 유지, 5회째부터 제거
 *
 * 처리 순서: 중요도 낮은 필드부터 제거 (pageTitle/h1 등은 마지막)
 */
import { readFileSync, writeFileSync } from 'fs';

const VENUES_PATH = 'data/venues.json';
const venues = JSON.parse(readFileSync(VENUES_PATH, 'utf8'));

const MAX_REPEAT = 4; // 최대 허용 횟수

/* ── 가게이름 보호 토큰 (업소별) ── */
function getProtectedTokens(v) {
  const tokens = new Set();
  [v.name_display, v.name_input, v.name_seo].filter(Boolean).forEach(n => {
    const kr = n.match(/[\uAC00-\uD7AF]{2,}/g) || [];
    kr.forEach(p => tokens.add(p));
    const en = n.match(/[a-zA-Z]{2,}/g) || [];
    en.forEach(p => tokens.add(p.toLowerCase()));
  });
  // 지역명도 보호
  if (v.region) {
    const rk = v.region.match(/[\uAC00-\uD7AF]{2,}/g) || [];
    rk.forEach(p => tokens.add(p));
  }
  return tokens;
}

/* ── 텍스트 필드 접근자 (우선순위: 낮은 → 높은, 낮은 것부터 제거) ── */
function getFieldAccessors(v) {
  const accessors = [];

  // 우선순위 1 (가장 먼저 제거) — 내부 콘텐츠
  if (v.story) {
    for (const key of Object.keys(v.story)) {
      if (typeof v.story[key] === 'string') {
        accessors.push({
          get: () => v.story[key],
          set: (val) => { v.story[key] = val; },
          label: `story.${key}`,
          priority: 1
        });
      }
    }
  }

  if (v.bodySections) {
    function walkBody(obj, prefix) {
      for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'string') {
          accessors.push({
            get: () => obj[key],
            set: (val) => { obj[key] = val; },
            label: `${prefix}.${key}`,
            priority: 1
          });
        } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          walkBody(obj[key], `${prefix}.${key}`);
        }
      }
    }
    walkBody(v.bodySections, 'bodySections');
  }

  // 우선순위 2 — FAQ, timeline, checklist
  if (v.faq) {
    v.faq.forEach((f, i) => {
      accessors.push({
        get: () => f.a,
        set: (val) => { f.a = val; },
        label: `faq[${i}].a`,
        priority: 2
      });
    });
  }

  if (v.timeline) {
    v.timeline.forEach((t, i) => {
      if (t.desc) {
        accessors.push({
          get: () => t.desc,
          set: (val) => { t.desc = val; },
          label: `timeline[${i}].desc`,
          priority: 2
        });
      }
    });
  }

  if (v.checklist) {
    v.checklist.forEach((c, i) => {
      accessors.push({
        get: () => v.checklist[i],
        set: (val) => { v.checklist[i] = val; },
        label: `checklist[${i}]`,
        priority: 2
      });
    });
  }

  // 우선순위 3 — planner, quickPlan, intro
  if (v.plannerRules) {
    function walkPlanner(obj, prefix) {
      for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'string') {
          accessors.push({
            get: () => obj[key],
            set: (val) => { obj[key] = val; },
            label: `${prefix}.${key}`,
            priority: 3
          });
        } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          walkPlanner(obj[key], `${prefix}.${key}`);
        }
      }
    }
    walkPlanner(v.plannerRules, 'plannerRules');
  }

  if (v.quickPlan) {
    if (v.quickPlan.costNote) {
      accessors.push({
        get: () => v.quickPlan.costNote,
        set: (val) => { v.quickPlan.costNote = val; },
        label: 'quickPlan.costNote',
        priority: 3
      });
    }
    if (v.quickPlan.table) {
      v.quickPlan.table.forEach((r, i) => {
        if (r.tip) {
          accessors.push({
            get: () => r.tip,
            set: (val) => { r.tip = val; },
            label: `quickPlan.table[${i}].tip`,
            priority: 3
          });
        }
      });
    }
    if (v.quickPlan.scenarios) {
      v.quickPlan.scenarios.forEach((s, i) => {
        if (s.desc) {
          accessors.push({
            get: () => s.desc,
            set: (val) => { s.desc = val; },
            label: `quickPlan.scenarios[${i}].desc`,
            priority: 3
          });
        }
      });
    }
  }

  if (v.intro) {
    if (v.intro.hook) {
      accessors.push({
        get: () => v.intro.hook,
        set: (val) => { v.intro.hook = val; },
        label: 'intro.hook',
        priority: 3
      });
    }
    if (v.intro.valuePromise) {
      accessors.push({
        get: () => v.intro.valuePromise,
        set: (val) => { v.intro.valuePromise = val; },
        label: 'intro.valuePromise',
        priority: 3
      });
    }
    if (v.intro.teasers) {
      v.intro.teasers.forEach((t, i) => {
        accessors.push({
          get: () => v.intro.teasers[i],
          set: (val) => { v.intro.teasers[i] = val; },
          label: `intro.teasers[${i}]`,
          priority: 3
        });
      });
    }
    if (v.intro.riskItems) {
      v.intro.riskItems.forEach((r, i) => {
        if (r.doInstead) {
          accessors.push({
            get: () => r.doInstead,
            set: (val) => { r.doInstead = val; },
            label: `intro.riskItems[${i}].doInstead`,
            priority: 3
          });
        }
      });
    }
  }

  // 우선순위 4 — teaser, description_short, conclusionText, hookIntro
  for (const f of ['teaser', 'description_short', 'conclusionText', 'hookIntro', 'card_hook', 'card_value']) {
    if (v[f] && typeof v[f] === 'string') {
      accessors.push({
        get: () => v[f],
        set: (val) => { v[f] = val; },
        label: f,
        priority: 4
      });
    }
  }

  // 우선순위 5 — seo fields (제거 최소화)
  for (const f of ['seoDescription', 'metaDescription']) {
    if (v[f] && typeof v[f] === 'string') {
      accessors.push({
        get: () => v[f],
        set: (val) => { v[f] = val; },
        label: f,
        priority: 5
      });
    }
  }

  // sectionIntros
  if (v.sectionIntros) {
    for (const key of Object.keys(v.sectionIntros)) {
      if (typeof v.sectionIntros[key] === 'string') {
        accessors.push({
          get: () => v.sectionIntros[key],
          set: (val) => { v.sectionIntros[key] = val; },
          label: `sectionIntros.${key}`,
          priority: 5
        });
      }
    }
  }

  // 우선순위 6 (보존 최대) — pageTitle, h1Title, seoTitle, faq.q는 건드리지 않음

  // 정렬: priority 낮은 것부터 (먼저 제거)
  accessors.sort((a, b) => a.priority - b.priority);
  return accessors;
}

/* ── 한국어 토큰 추출 ── */
function extractKoreanTokens(text) {
  return text.match(/[\uAC00-\uD7AF]{2,}/g) || [];
}

/* ── 단어의 N번째 이후 출현을 제거 ── */
function removeNthOccurrence(text, word, startFrom) {
  // word가 독립적으로 나타나는 경우만 제거 (앞뒤에 한글이 아닌 경우)
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // 앞뒤가 한글이 아닌 경계에서만 매칭
  const regex = new RegExp(`(?<![\\uAC00-\\uD7AF])${escaped}(?![\\uAC00-\\uD7AF])`, 'g');

  let count = 0;
  const result = text.replace(regex, (match) => {
    count++;
    if (count >= startFrom) {
      return ''; // 제거
    }
    return match; // 유지
  });

  // 정리: 연속 공백, 공백+구두점
  return result
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.·!?])/g, '$1')
    .replace(/([,.·!?])\s*([,.·!?])/g, '$1')
    .trim();
}

/* ── 메인 처리 ── */
let totalVenues = 0;
let totalWordsRemoved = 0;
let totalFieldsFixed = 0;

venues.forEach(v => {
  const protectedTokens = getProtectedTokens(v);
  const accessors = getFieldAccessors(v);

  // Step 1: 전체 단어 빈도 계산
  const freq = {};
  accessors.forEach(acc => {
    const text = acc.get();
    if (!text) return;
    const tokens = extractKoreanTokens(text);
    tokens.forEach(w => {
      if (protectedTokens.has(w)) return;
      freq[w] = (freq[w] || 0) + 1;
    });
  });

  // pageTitle, h1Title, seoTitle, faq.q도 카운트에 포함 (제거 대상은 아님)
  const readOnlyFields = ['pageTitle', 'h1Title', 'seoTitle'];
  readOnlyFields.forEach(f => {
    if (v[f] && typeof v[f] === 'string') {
      const tokens = extractKoreanTokens(v[f]);
      tokens.forEach(w => {
        if (protectedTokens.has(w)) return;
        freq[w] = (freq[w] || 0) + 1;
      });
    }
  });
  // faq questions
  if (v.faq) {
    v.faq.forEach(f => {
      const tokens = extractKoreanTokens(f.q);
      tokens.forEach(w => {
        if (protectedTokens.has(w)) return;
        freq[w] = (freq[w] || 0) + 1;
      });
    });
  }

  // Step 2: 5회+ 단어 식별
  const overWords = Object.entries(freq).filter(([, c]) => c > MAX_REPEAT);
  if (overWords.length === 0) return;

  totalVenues++;
  let venueRemoved = 0;

  // Step 3: 각 초과 단어에 대해, 필드 순서대로 순회하며 초과분 제거
  overWords.forEach(([word, totalCount]) => {
    const excess = totalCount - MAX_REPEAT;
    let remainToRemove = excess;

    // 읽기전용 필드에서의 카운트를 먼저 세어 반영
    let readOnlyCount = 0;
    readOnlyFields.forEach(f => {
      if (v[f] && typeof v[f] === 'string') {
        const tokens = extractKoreanTokens(v[f]);
        tokens.forEach(w => { if (w === word) readOnlyCount++; });
      }
    });
    if (v.faq) {
      v.faq.forEach(f => {
        const tokens = extractKoreanTokens(f.q);
        tokens.forEach(w => { if (w === word) readOnlyCount++; });
      });
    }

    // 편집 가능 필드에서의 카운트
    let editableCount = totalCount - readOnlyCount;
    // 편집 가능 필드에서 유지할 수 = MAX_REPEAT - readOnlyCount (최소 0)
    let keepInEditable = Math.max(0, MAX_REPEAT - readOnlyCount);

    if (editableCount <= keepInEditable) return; // 이미 OK

    let editableRemaining = keepInEditable;

    // 우선순위 낮은(priority 숫자 작은) 필드부터 순회
    for (const acc of accessors) {
      const text = acc.get();
      if (!text) continue;

      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?<![\\uAC00-\\uD7AF])${escaped}(?![\\uAC00-\\uD7AF])`, 'g');
      const matches = [...text.matchAll(regex)];
      if (matches.length === 0) continue;

      if (editableRemaining >= matches.length) {
        // 이 필드의 모든 출현을 유지
        editableRemaining -= matches.length;
      } else {
        // 일부만 유지, 나머지 제거
        const keepHere = editableRemaining;
        editableRemaining = 0;

        let hitCount = 0;
        const newText = text.replace(regex, (match) => {
          hitCount++;
          if (hitCount <= keepHere) return match;
          venueRemoved++;
          return '';
        });

        // 정리
        const cleaned = newText
          .replace(/\s{2,}/g, ' ')
          .replace(/\s+([,.·!?])/g, '$1')
          .replace(/([,.·!?])\s*([,.·!?])/g, '$1')
          .trim();

        if (cleaned !== text) {
          acc.set(cleaned);
          totalFieldsFixed++;
        }
      }

      if (editableRemaining <= 0) break;
    }
  });

  totalWordsRemoved += venueRemoved;
});

console.log(`\n=== remove-dup5 결과 ===`);
console.log(`처리 업소: ${totalVenues}/${venues.length}`);
console.log(`제거된 단어 수: ${totalWordsRemoved}`);
console.log(`수정된 필드 수: ${totalFieldsFixed}`);

writeFileSync(VENUES_PATH, JSON.stringify(venues, null, 2), 'utf8');
console.log('venues.json 저장 완료\n');
