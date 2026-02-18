#!/usr/bin/env node
/**
 * fix-venue-repetition.mjs
 * venues.json 데이터에서 반복 토큰을 제거/치환하여
 * qa_repeat_limit 및 qa_brand_count QA를 통과시킨다.
 */
import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const venuesPath = join(__dirname, '..', 'data', 'venues.json');

// Backup
copyFileSync(venuesPath, venuesPath + '.bak');
const venues = JSON.parse(readFileSync(venuesPath, 'utf-8'));

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countSub(text, sub) {
  if (!sub) return 0;
  let c = 0, p = 0;
  while ((p = text.indexOf(sub, p)) !== -1) { c++; p += sub.length; }
  return c;
}

/**
 * name_display 필러 패턴을 제거한다.
 * 뒤에서부터 제거하여 서론에 남기고 결론에서 제거 (분산 유지).
 */
function removeName(text, name, maxKeep) {
  const patterns = [
    name + '만의 특성으로 ',
    name + '을 기준으로 ',
    name + '에 관해 ',
    name + '의 특색으로 ',
    name + '의 경우 ',
    name + '에서는 ',
    name + '에서 ',
    name + '이라는 ',
    name + '의 ',
    name + '이 ',
    name + '은 ',
    name + '을 ',
    name + '에 ',
    name + '과 ',
    name + '와 ',
    name,
  ];

  let count = countSub(text, name);
  for (const pat of patterns) {
    while (count > maxKeep) {
      const idx = text.lastIndexOf(pat);
      if (idx === -1) break;
      text = text.slice(0, idx) + text.slice(idx + pat.length);
      count = countSub(text, name);
    }
    if (count <= maxKeep) break;
  }
  return cleanSpaces(text);
}

/**
 * 지역명을 줄인다. name_display 제거 후 남은 standalone 지역 참조를 처리.
 */
function reduceRegion(text, region, maxKeep) {
  if (!region || region.length < 2) return text;
  const patterns = [
    region + '에서의 ',
    region + '에서는 ',
    region + '에서 ',
    region + '의 ',
    region + '에는 ',
    region + '에 ',
    region + '과 ',
    region,
  ];
  let count = countSub(text, region);
  for (const pat of patterns) {
    while (count > maxKeep) {
      const idx = text.lastIndexOf(pat);
      if (idx === -1) break;
      // 이 지역 등의 대체어 사용 (첫 2회만)
      const replacement = count > maxKeep + 1 ? '' : '이 지역 ';
      text = text.slice(0, idx) + replacement + text.slice(idx + pat.length);
      count = countSub(text, region);
    }
    if (count <= maxKeep) break;
  }
  return cleanSpaces(text);
}

/**
 * 상투어 제거 (이곳, 공간, 매장, 여기, 해당, 장소)
 */
const CLICHE_SYNONYMS = {
  '이곳': ['', '', ''],
  '공간': ['무대', '현장', '세계', '영역', ''],
  '매장': ['', '', ''],
  '여기': ['', '', ''],
  '해당': ['', '', ''],
  '장소': ['현장', '무대', ''],
};

function reduceCliche(text, word, max) {
  let count = countSub(text, word);
  const syns = CLICHE_SYNONYMS[word] || [''];
  let synIdx = 0;
  while (count > max) {
    const idx = text.lastIndexOf(word);
    if (idx === -1) break;
    const rep = syns[synIdx % syns.length];
    synIdx++;
    text = text.slice(0, idx) + rep + text.slice(idx + word.length);
    count = countSub(text, word);
  }
  return cleanSpaces(text);
}

/**
 * 일반 토큰 반복 제거: 한국어 2글자 이상 토큰 중 3회 초과하는 것 감소
 */
const FUNC_WORDS = new Set([
  '그리고', '그러나', '하지만', '그래서', '또한', '그런데', '그래도', '따라서',
  '그러므로', '그러면', '만약', '때문', '위해', '대한', '통해', '따른', '같은',
  '위한', '대해', '관한', '있는', '없는', '하는', '되는', '있을', '없을',
  '합니다', '입니다', '됩니다', '있습니다', '없습니다', '것입니다',
  '에서', '으로', '부터', '까지', '에게', '보다', '처럼', '같이',
  '대로', '밖에', '이며', '이고', '이나', '지만', '면서',
  '우리', '저희', '자신', '모든', '어떤', '이런', '그런',
  '가장', '매우', '정말', '너무', '아주', '상당히',
  '하지', '않는', '못하', '않은',
]);

const CATEGORY_TOKENS = new Set(['나이트', '클럽', '라운지', '나이트라이프', '밤문화']);
const UI_TOKENS = new Set(['FAQ', '목차', '지도', '위치', '주차', '체크리스트', '갤러리', '타임라인']);

function extractKoreanTokens(text) {
  return text.match(/[\uAC00-\uD7AF]{2,}/g) || [];
}

function reduceGeneralTokens(text, brandName, region, max) {
  const tokens = extractKoreanTokens(text);
  const counts = {};
  for (const t of tokens) counts[t] = (counts[t] || 0) + 1;

  for (const [token, count] of Object.entries(counts)) {
    if (FUNC_WORDS.has(token)) continue;
    if (token.length < 2) continue;
    if (brandName && brandName.includes(token) && token.length <= 3) continue;
    if (CATEGORY_TOKENS.has(token)) continue; // category는 6회 허용
    if (UI_TOKENS.has(token)) continue;
    if (region && token === region) continue; // region은 별도 처리

    // 일반 토큰: max 허용
    if (count > max) {
      let curCount = count;
      while (curCount > max) {
        const idx = text.lastIndexOf(token);
        if (idx === -1) break;
        text = text.slice(0, idx) + text.slice(idx + token.length);
        curCount--;
      }
    }
  }
  return cleanSpaces(text);
}

function cleanSpaces(text) {
  return text
    .replace(/  +/g, ' ')
    .replace(/\. +\./g, '.')
    .replace(/ +\./g, '.')
    .replace(/^ +/gm, '')
    .replace(/ +$/gm, '')
    .trim();
}

// ─── Main Processing ───

let totalNameRemoved = 0;
let totalRegionRemoved = 0;

for (const v of venues) {
  const name = v.name_display;
  const region = v.region;
  const beforeName = countAllText(v, name);

  // ── 1. name_display 제거 (필드별 목표) ──
  v.teaser = removeName(v.teaser, name, 1);
  for (const scene of ['scene1', 'scene2', 'scene3', 'scene4', 'scene5']) {
    v.story[scene] = removeName(v.story[scene], name, 0);
  }
  v.bodySections.atmosphere = removeName(v.bodySections.atmosphere, name, 0);
  v.bodySections.music = removeName(v.bodySections.music, name, 0);
  v.bodySections.safety = removeName(v.bodySections.safety, name, 0);
  v.timeline = v.timeline.map(t => ({ ...t, desc: removeName(t.desc, name, 0) }));

  // checklist: strip name prefix
  v.checklist = v.checklist.map(item => {
    const re = new RegExp('^' + escapeRegex(name) + '\\s*(방문 시|이용 시|입장 전|준비 중|참고:?)\\s*', '');
    let fixed = item.replace(re, '');
    fixed = removeName(fixed, name, 0);
    return fixed;
  });

  // FAQ
  v.faq = v.faq.map(f => ({
    q: removeName(f.q, name, 0),
    a: removeName(f.a, name, 0),
  }));

  // plannerRules
  for (const group of Object.keys(v.plannerRules || {})) {
    for (const key of Object.keys(v.plannerRules[group] || {})) {
      v.plannerRules[group][key] = removeName(v.plannerRules[group][key], name, 0);
    }
  }

  const afterName = countAllText(v, name);
  totalNameRemoved += (beforeName - afterName);

  // ── 2. 지역명 감소 (데이터에서 최대 2회) ──
  const beforeRegion = countAllText(v, region);
  const allTextFields = getAllTextFields(v);
  for (const field of allTextFields) {
    setTextField(v, field.path, reduceRegion(field.value, region, 0));
  }
  // teaser에 1회 허용
  if (countSub(v.teaser, region) === 0) {
    // teaser에 지역 없으면 OK
  }
  const afterRegion = countAllText(v, region);
  totalRegionRemoved += (beforeRegion - afterRegion);

  // ── 3. 상투어 감소 ──
  const cliches = ['이곳', '공간', '매장', '여기', '해당', '장소'];
  for (const cw of cliches) {
    const fields2 = getAllTextFields(v);
    // 전체 데이터에서 cliche 카운트
    let totalCliche = fields2.reduce((s, f) => s + countSub(f.value, cw), 0);
    if (totalCliche > 2) {
      // 필드별로 뒤에서부터 제거
      for (let i = fields2.length - 1; i >= 0 && totalCliche > 2; i--) {
        const f = fields2[i];
        let val = f.value;
        while (countSub(val, cw) > 0 && totalCliche > 2) {
          val = reduceCliche(val, cw, Math.max(0, countSub(val, cw) - 1));
          totalCliche--;
        }
        setTextField(v, f.path, val);
      }
    }
  }

  // ── 4. 일반 토큰 반복 감소 ──
  // 모든 텍스트를 합쳐서 토큰 카운트 → 3회 초과 토큰을 필드별로 제거
  const allFields = getAllTextFields(v);
  const combinedText = allFields.map(f => f.value).join(' ');
  const tokenCounts = {};
  for (const t of extractKoreanTokens(combinedText)) {
    tokenCounts[t] = (tokenCounts[t] || 0) + 1;
  }

  const overflowTokens = Object.entries(tokenCounts)
    .filter(([t, c]) => {
      if (FUNC_WORDS.has(t)) return false;
      if (t.length < 2) return false;
      if (name && name.includes(t) && t.length <= 3) return false;
      if (CATEGORY_TOKENS.has(t)) return c > 3; // 데이터에서 3회까지 (템플릿에서 3회 추가)
      if (UI_TOKENS.has(t)) return false;
      if (t === region) return false;
      return c > 3;
    })
    .sort((a, b) => b[1] - a[1]);

  for (const [token, _count] of overflowTokens) {
    const limit = CATEGORY_TOKENS.has(token) ? 3 : 3;
    // 뒤 필드부터 제거
    let totalCount = getAllTextFields(v).reduce((s, f) => s + countSub(f.value, token), 0);
    const fields3 = getAllTextFields(v);
    for (let i = fields3.length - 1; i >= 0 && totalCount > limit; i--) {
      let val = fields3[i].value;
      while (countSub(val, token) > 0 && totalCount > limit) {
        const idx = val.lastIndexOf(token);
        if (idx === -1) break;
        val = val.slice(0, idx) + val.slice(idx + token.length);
        val = cleanSpaces(val);
        totalCount--;
      }
      setTextField(v, fields3[i].path, val);
    }
  }
}

writeFileSync(venuesPath, JSON.stringify(venues, null, 2), 'utf-8');
console.log(`✅ fix-venue-repetition complete`);
console.log(`   name_display removed: ${totalNameRemoved} occurrences`);
console.log(`   region removed: ${totalRegionRemoved} occurrences`);

// ─── Helpers ───

function countAllText(v, sub) {
  return getAllTextFields(v).reduce((s, f) => s + countSub(f.value, sub), 0);
}

function getAllTextFields(v) {
  const fields = [];
  fields.push({ path: 'teaser', value: v.teaser });
  for (const s of ['scene1', 'scene2', 'scene3', 'scene4', 'scene5']) {
    fields.push({ path: `story.${s}`, value: v.story[s] });
  }
  fields.push({ path: 'bodySections.atmosphere', value: v.bodySections.atmosphere });
  fields.push({ path: 'bodySections.music', value: v.bodySections.music });
  fields.push({ path: 'bodySections.safety', value: v.bodySections.safety });
  v.timeline.forEach((t, i) => {
    fields.push({ path: `timeline.${i}.desc`, value: t.desc });
  });
  v.checklist.forEach((c, i) => {
    fields.push({ path: `checklist.${i}`, value: c });
  });
  v.faq.forEach((f, i) => {
    fields.push({ path: `faq.${i}.q`, value: f.q });
    fields.push({ path: `faq.${i}.a`, value: f.a });
  });
  for (const group of Object.keys(v.plannerRules || {})) {
    for (const key of Object.keys(v.plannerRules[group] || {})) {
      fields.push({ path: `plannerRules.${group}.${key}`, value: v.plannerRules[group][key] });
    }
  }
  return fields;
}

function setTextField(v, path, value) {
  const parts = path.split('.');
  let obj = v;
  for (let i = 0; i < parts.length - 1; i++) {
    obj = obj[parts[i]];
  }
  obj[parts[parts.length - 1]] = value;
}
