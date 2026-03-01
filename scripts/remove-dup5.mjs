#!/usr/bin/env node
/**
 * remove-dup5.mjs — FINAL RELEASE
 * 업소별: 가게이름 제외, 3회 이상 반복 단어의 초과분 삭제 (2회까지 유지)
 * 모든 텍스트 필드를 재귀적으로 순회 (감사 스크립트와 동일 범위)
 */
import { readFileSync, writeFileSync } from 'fs';

const VENUES_PATH = 'data/venues.json';
const venues = JSON.parse(readFileSync(VENUES_PATH, 'utf8'));
const MAX_REPEAT = 2;

// 스킵 필드 (비-텍스트)
const SKIP_KEYS = new Set([
  'id', 'type', 'typePath', 'typeLabel', 'regionSlug', 'venueSlug', 'urlSlug',
  'geo', 'images', 'imagePrompts', 'relatedVenueIds', 'map_url',
  'name_display', 'name_input', 'name_seo', 'region',
  'card_tags', 'sourcePath'
]);

// 보호 토큰 (업소별)
function getProtected(v) {
  const s = new Set();
  [v.name_display, v.name_input, v.name_seo].filter(Boolean).forEach(n => {
    (n.match(/[\uAC00-\uD7AF]{2,}/g) || []).forEach(p => s.add(p));
    (n.match(/[a-zA-Z]{2,}/g) || []).forEach(p => s.add(p.toLowerCase()));
  });
  if (v.region) (v.region.match(/[\uAC00-\uD7AF]{2,}/g) || []).forEach(p => s.add(p));
  return s;
}

// 재귀적으로 모든 string 필드 수집 (ref 기반)
function collectAllStringRefs(obj, path, priority, refs) {
  if (typeof obj === 'string' && obj.length > 0) {
    // obj는 parent[key] 형태로 접근해야 하므로 여기서는 처리 불가
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      if (typeof item === 'string' && item.length > 0) {
        refs.push({ parent: obj, key: String(i), label: `${path}[${i}]`, priority });
      } else if (typeof item === 'object' && item !== null) {
        collectAllStringRefs(item, `${path}[${i}]`, priority, refs);
      }
    });
  } else if (typeof obj === 'object' && obj !== null) {
    for (const k of Object.keys(obj)) {
      if (SKIP_KEYS.has(k)) continue;
      const val = obj[k];
      if (typeof val === 'string' && val.length > 0) {
        // Assign priority based on field name
        let p = priority;
        if (['pageTitle', 'h1Title', 'seoTitle'].includes(k)) p = 10;
        else if (['seoDescription', 'metaDescription'].includes(k)) p = 8;
        else if (k === 'q' && path.includes('faq')) p = 9; // FAQ questions
        else if (['hookIntro', 'conclusionText', 'card_hook', 'card_value'].includes(k)) p = 6;
        else if (['teaser', 'description_short'].includes(k)) p = 6;
        refs.push({ parent: obj, key: k, label: `${path}.${k}`, priority: p });
      } else if (Array.isArray(val)) {
        collectAllStringRefs(val, `${path}.${k}`, priority, refs);
      } else if (typeof val === 'object' && val !== null) {
        collectAllStringRefs(val, `${path}.${k}`, priority, refs);
      }
    }
  }
}

function krTokens(text) {
  return text.match(/[\uAC00-\uD7AF]{2,}/g) || [];
}

// 필드에서 word를 경계 검사 후 제거 (keepCount개만 유지)
function removeExcess(text, word, keepCount) {
  let hitIdx = 0;
  let result = '';
  let i = 0;

  while (i < text.length) {
    const pos = text.indexOf(word, i);
    if (pos === -1) {
      result += text.substring(i);
      break;
    }
    const bc = pos > 0 ? text.charCodeAt(pos - 1) : 0;
    const ac = pos + word.length < text.length ? text.charCodeAt(pos + word.length) : 0;
    const bKR = bc >= 0xAC00 && bc <= 0xD7AF;
    const aKR = ac >= 0xAC00 && ac <= 0xD7AF;

    if (bKR || aKR) {
      result += text.substring(i, pos + word.length);
      i = pos + word.length;
      continue;
    }

    hitIdx++;
    if (hitIdx <= keepCount) {
      result += text.substring(i, pos + word.length);
    } else {
      result += text.substring(i, pos);
    }
    i = pos + word.length;
  }

  return result.replace(/\s{2,}/g, ' ').replace(/\s+([,.·!?])/g, '$1').trim();
}

// ── MAIN ──
let totalRemoved = 0;
let totalFieldsFixed = 0;
let venuesProcessed = 0;

venues.forEach(v => {
  const prot = getProtected(v);

  // Collect ALL string refs
  const refs = [];
  collectAllStringRefs(v, 'v', 1, refs);

  // Sort: low priority first (remove from less important first)
  refs.sort((a, b) => a.priority - b.priority);

  // Count word frequency across ALL fields
  const freq = {};
  refs.forEach(r => {
    krTokens(r.parent[r.key]).forEach(w => {
      if (!prot.has(w)) freq[w] = (freq[w] || 0) + 1;
    });
  });

  const overWords = Object.entries(freq).filter(([, c]) => c > MAX_REPEAT);
  if (overWords.length === 0) return;

  venuesProcessed++;
  let venueRemoved = 0;

  for (const [word] of overWords) {
    // Count per field (boundary-aware)
    const fieldHits = [];
    refs.forEach((r, ri) => {
      const text = r.parent[r.key];
      let count = 0;
      let pos = 0;
      while (pos < text.length) {
        const idx = text.indexOf(word, pos);
        if (idx === -1) break;
        const bc = idx > 0 ? text.charCodeAt(idx - 1) : 0;
        const ac = idx + word.length < text.length ? text.charCodeAt(idx + word.length) : 0;
        if (!(bc >= 0xAC00 && bc <= 0xD7AF) && !(ac >= 0xAC00 && ac <= 0xD7AF)) count++;
        pos = idx + word.length;
      }
      if (count > 0) fieldHits.push({ ri, count });
    });

    const editTotal = fieldHits.reduce((s, h) => s + h.count, 0);
    if (editTotal <= MAX_REPEAT) continue;

    let remaining = MAX_REPEAT;
    for (const hit of fieldHits) {
      const r = refs[hit.ri];
      if (remaining >= hit.count) {
        remaining -= hit.count;
      } else {
        const keepHere = remaining;
        remaining = 0;
        const toRemove = hit.count - keepHere;
        const oldText = r.parent[r.key];
        const newText = removeExcess(oldText, word, keepHere);
        if (newText !== oldText) {
          r.parent[r.key] = newText;
          venueRemoved += toRemove;
          totalFieldsFixed++;
        }
      }
    }
  }
  totalRemoved += venueRemoved;
});

console.log(`\n=== remove-dup 결과 ===`);
console.log(`처리 업소: ${venuesProcessed}/${venues.length}`);
console.log(`제거된 단어: ${totalRemoved}`);
console.log(`수정된 필드: ${totalFieldsFixed}`);

writeFileSync(VENUES_PATH, JSON.stringify(venues, null, 2), 'utf8');
console.log('venues.json 저장 완료\n');
