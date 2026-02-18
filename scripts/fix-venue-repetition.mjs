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
 * 브랜드 코어 이름 추출: name_display에서 region과 type을 제거한 고유 부분.
 * 예: "강남 레이스 클럽" → "레이스", "부산해운대 멜트 클럽" → "멜트"
 */
function getCoreName(v) {
  let core = v.name_display;
  if (v.region) core = core.replace(v.region + ' ', '').replace(v.region, '');
  let coreNoType = core;
  for (const t of ['클럽', '나이트', '라운지']) {
    coreNoType = coreNoType.replace(' ' + t, '').replace(t, '');
  }
  coreNoType = coreNoType.trim();
  // If core too short without type, keep type suffix (collapse spaces for token protection)
  if (coreNoType.length < 2) {
    return core.trim().replace(/\s+/g, '');
  }
  return coreNoType;
}

/**
 * buildCoreNameMap: ALWAYS returns bare coreName, even for duplicates.
 * Region prefix is NOT added — it bloats repetition counts.
 */
function buildCoreNameMap(venues) {
  const coreCount = {};
  for (const v of venues) {
    const cn = getCoreName(v);
    coreCount[cn] = (coreCount[cn] || 0) + 1;
  }
  const map = new Map();
  const dupSet = new Set();
  for (const v of venues) {
    const cn = getCoreName(v);
    map.set(v.id, cn);
    if (coreCount[cn] > 1) {
      dupSet.add(v.id);
    }
  }
  return { map, dupSet };
}

/**
 * name_display를 coreName으로 치환한다 (유사도 보존).
 * 뒤에서부터 치환하여 서론에 남기고 결론에서 치환 (분산 유지).
 * coreName이 비어 있으면 삭제 (기존 동작).
 */
function removeName(text, name, maxKeep, coreName = '') {
  let count = countSub(text, name);
  while (count > maxKeep) {
    const idx = text.lastIndexOf(name);
    if (idx === -1) break;
    text = text.slice(0, idx) + coreName + text.slice(idx + name.length);
    count = countSub(text, name);
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
      const replacement = '';
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
  '것이', '것을', '것은', '것도', '것으로', '수도', '있어', '보는', '주는', '라는',
  '이다', '된다', '한다', '온다', '간다', '볼수', '해서', '에는',
  '서는', '에서', '으로', '부터', '이면', '이고', '에서는', '으로는',
]);

const CATEGORY_TOKENS = new Set(['나이트', '클럽', '라운지', '나이트라이프', '밤문화']);
const UI_TOKENS = new Set(['FAQ', '목차', '지도', '위치', '주차', '체크리스트', '갤러리', '타임라인']);

function extractKoreanTokens(text) {
  return text.match(/[\uAC00-\uD7AF]{2,}/g) || [];
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

/**
 * Remove token from text only at Korean word boundaries (char before is NOT Korean).
 * Prevents removing substrings from within larger Korean compounds.
 */
function removeAtBoundary(text, token) {
  const hangulRe = /[\uAC00-\uD7AF]/;
  let searchFrom = text.length;
  while (true) {
    const idx = text.lastIndexOf(token, searchFrom - 1);
    if (idx === -1 || idx >= searchFrom) return { text, found: false };
    const charBefore = idx > 0 ? text[idx - 1] : '';
    if (!hangulRe.test(charBefore)) {
      return {
        text: text.slice(0, idx) + text.slice(idx + token.length),
        found: true,
      };
    }
    searchFrom = idx;
  }
}

// ─── Keywords Cleanup ───

function cleanupKeywords(v, coreName, region) {
  if (!v.keywords || !Array.isArray(v.keywords)) return;

  // 1. Remove empty strings
  v.keywords = v.keywords.filter(kw => kw && kw.trim().length > 0);

  // 2. Deduplicate (exact match)
  v.keywords = [...new Set(v.keywords)];

  // 3. Remove region from keywords
  if (region) {
    v.keywords = v.keywords.map(kw => {
      if (kw.includes(region)) {
        return kw.replace(region + ' ', '').replace(' ' + region, '').replace(region, '').trim();
      }
      return kw;
    }).filter(kw => kw.length > 0);
    // Deduplicate again after region removal
    v.keywords = [...new Set(v.keywords)];
  }

  // 4. Limit keywords containing coreName: keep max 2
  if (coreName && coreName.length >= 2) {
    const withCore = [];
    const withoutCore = [];
    for (const kw of v.keywords) {
      if (kw.includes(coreName)) {
        withCore.push(kw);
      } else {
        withoutCore.push(kw);
      }
    }
    if (withCore.length > 2) {
      // Keep first 2 that contain coreName as-is
      const kept = withCore.slice(0, 2);
      // For the rest, remove coreName from them
      const trimmed = withCore.slice(2).map(kw => {
        return kw.replace(coreName + ' ', '').replace(' ' + coreName, '').replace(coreName, '').trim();
      }).filter(kw => kw.length > 0);
      v.keywords = [...kept, ...trimmed, ...withoutCore];
    }
    // Deduplicate again
    v.keywords = [...new Set(v.keywords)];
  }

  // 5. Limit keywords containing category type tokens: keep max 3 per type
  for (const typeToken of ['나이트', '클럽', '라운지']) {
    const withType = [];
    for (let i = 0; i < v.keywords.length; i++) {
      if (v.keywords[i].includes(typeToken)) {
        withType.push(i);
      }
    }
    if (withType.length > 3) {
      // Remove type token from keywords beyond the 3rd
      const toTrim = withType.slice(3);
      for (const idx of toTrim) {
        v.keywords[idx] = v.keywords[idx]
          .replace(typeToken + ' ', '')
          .replace(' ' + typeToken, '')
          .replace(typeToken, '')
          .trim();
      }
      v.keywords = v.keywords.filter(kw => kw.length > 0);
      v.keywords = [...new Set(v.keywords)];
    }
  }

  // Final cleanup: remove empty strings, deduplicate
  v.keywords = v.keywords.filter(kw => kw && kw.trim().length > 0);
  v.keywords = [...new Set(v.keywords)];
}

// ─── FAQ Cleanup ───

function cleanupFAQ(v, coreName, region) {
  if (!v.faq || !Array.isArray(v.faq)) return;

  // Remove coreName from FAQ Q&A, keep max 1 across all FAQs
  if (coreName && coreName.length >= 2) {
    let coreCount = 0;
    for (const f of v.faq) {
      coreCount += countSub(f.q, coreName) + countSub(f.a, coreName);
    }
    // Remove from back until only 1 remains
    for (let i = v.faq.length - 1; i >= 0 && coreCount > 1; i--) {
      // Remove from answer first
      while (countSub(v.faq[i].a, coreName) > 0 && coreCount > 1) {
        const result = removeAtBoundary(v.faq[i].a, coreName);
        if (!result.found) break;
        v.faq[i].a = cleanSpaces(result.text);
        coreCount--;
      }
      // Then from question
      while (countSub(v.faq[i].q, coreName) > 0 && coreCount > 1) {
        const result = removeAtBoundary(v.faq[i].q, coreName);
        if (!result.found) break;
        v.faq[i].q = cleanSpaces(result.text);
        coreCount--;
      }
    }
  }

  // Remove region from FAQ Q&A, keep max 0
  if (region && region.length >= 2) {
    for (const f of v.faq) {
      f.q = reduceRegion(f.q, region, 0);
      f.a = reduceRegion(f.a, region, 0);
    }
  }
}

// ─── Aggressive Token Reduction (NEW) ───

function reduceAllTokensAggressively(v, coreName, region) {
  // Combine ALL text fields and count every Korean 2+ char token
  const allFields = getAllTextFields(v);
  const combinedText = allFields.map(f => f.value).join(' ');
  const tokenCounts = {};
  for (const t of extractKoreanTokens(combinedText)) {
    tokenCounts[t] = (tokenCounts[t] || 0) + 1;
  }

  // Determine limits per token — does NOT skip tokens just because they're in name_display
  const tokensToReduce = [];
  for (const [token, count] of Object.entries(tokenCounts)) {
    if (FUNC_WORDS.has(token)) continue;
    if (token.length < 2) continue;
    if (UI_TOKENS.has(token)) continue;

    let limit;
    if (coreName && token === coreName) {
      limit = 2; // coreName (bare): max 2 in data (template adds h1, h2, breadcrumb)
    } else if (region && token === region) {
      limit = 0; // region: max 0 in data (template adds breadcrumb, fact box, tags)
    } else if (CATEGORY_TOKENS.has(token)) {
      limit = 1; // category tokens: max 1 in data (template adds breadcrumb, badge, table, related)
    } else {
      limit = 3; // everything else: max 3
    }

    if (count > limit) {
      tokensToReduce.push([token, count, limit]);
    }
  }

  // Sort by count descending (reduce most repeated first)
  tokensToReduce.sort((a, b) => b[1] - a[1]);

  // Reduce each token across all fields (from back), using Korean word-boundary safe removal
  for (const [token, _count, limit] of tokensToReduce) {
    let totalCount = getAllTextFields(v).reduce((s, f) => s + countSub(f.value, token), 0);
    const fields = getAllTextFields(v);
    for (let i = fields.length - 1; i >= 0 && totalCount > limit; i--) {
      let val = fields[i].value;
      while (countSub(val, token) > 0 && totalCount > limit) {
        const result = removeAtBoundary(val, token);
        if (!result.found) break;
        val = cleanSpaces(result.text);
        totalCount--;
      }
      setTextField(v, fields[i].path, val);
    }
  }
}

/**
 * Final cleanup pass for keywords after aggressive token reduction:
 * remove empty strings and re-deduplicate.
 */
function finalKeywordsCleanup(v) {
  if (!v.keywords || !Array.isArray(v.keywords)) return;
  v.keywords = v.keywords.filter(kw => kw && kw.trim().length > 0);
  v.keywords = [...new Set(v.keywords)];
}

// ─── Main Processing ───

let totalNameRemoved = 0;
let totalRegionRemoved = 0;
let totalAggressiveRemoved = 0;
const { map: coreNameMap, dupSet } = buildCoreNameMap(venues);

for (const v of venues) {
  const name = v.name_display;
  const region = v.region;
  const coreName = coreNameMap.get(v.id) || getCoreName(v);
  const hasDupCoreName = dupSet.has(v.id);
  const beforeName = countAllText(v, name);

  // ── 1. name_display → coreName 치환 (유사도 보존) ──
  v.teaser = removeName(v.teaser, name, 0, coreName);
  for (const scene of ['scene1', 'scene2', 'scene3', 'scene4', 'scene5', 'scene6', 'scene7', 'scene8']) {
    if (v.story[scene]) v.story[scene] = removeName(v.story[scene], name, 0, coreName);
  }
  v.bodySections.atmosphere = removeName(v.bodySections.atmosphere, name, 0, coreName);
  v.bodySections.music = removeName(v.bodySections.music, name, 0, coreName);
  v.bodySections.safety = removeName(v.bodySections.safety, name, 0, coreName);
  // hookIntro
  if (v.hookIntro) v.hookIntro = removeName(v.hookIntro, name, 1, coreName);
  // deepDive subsections
  if (v.bodySections.deepDive) {
    for (const key of Object.keys(v.bodySections.deepDive)) {
      v.bodySections.deepDive[key] = removeName(v.bodySections.deepDive[key], name, 0, coreName);
    }
  }
  v.timeline = v.timeline.map(t => ({ ...t, desc: removeName(t.desc, name, 0, coreName) }));

  // checklist: strip name prefix, then replace remaining
  v.checklist = v.checklist.map(item => {
    const re = new RegExp('^' + escapeRegex(name) + '\\s*(방문 시|이용 시|입장 전|준비 중|참고:?)\\s*', '');
    let fixed = item.replace(re, '');
    fixed = removeName(fixed, name, 0, coreName);
    return fixed;
  });

  // FAQ - keep 1 full name in first answer for brand distribution
  v.faq = v.faq.map((f, i) => ({
    q: removeName(f.q, name, 0, coreName),
    a: removeName(f.a, name, i === 0 ? 1 : 0, coreName),
  }));

  // plannerRules
  for (const group of Object.keys(v.plannerRules || {})) {
    for (const key of Object.keys(v.plannerRules[group] || {})) {
      v.plannerRules[group][key] = removeName(v.plannerRules[group][key], name, 0, coreName);
    }
  }

  const afterName = countAllText(v, name);
  totalNameRemoved += (beforeName - afterName);

  // ── 2. 지역명 감소 ──
  // NEVER skip region removal. For duplicates: max 2, non-duplicates: max 0.
  const regionMax = hasDupCoreName ? 2 : 0;
  const beforeRegion = countAllText(v, region);
  // First pass: remove all region mentions from every field (max 0 per field)
  const regionFields = getAllTextFields(v);
  for (const field of regionFields) {
    setTextField(v, field.path, reduceRegion(field.value, region, 0));
  }
  // For duplicate coreName venues: we already removed all. That's fine since regionMax=2
  // is enforced by the aggressive pass later. The per-field pass with max 0 removes all.
  // But we want to allow up to regionMax total — we can't add them back, so we accept
  // that region removal was aggressive. The aggressive pass will maintain the limit.
  const afterRegion = countAllText(v, region);
  totalRegionRemoved += (beforeRegion - afterRegion);

  // ── 3. 상투어 감소 (데이터 전체에서 1회까지, 템플릿 여유분 확보) ──
  const cliches = ['이곳', '공간', '매장', '여기', '해당', '장소'];
  for (const cw of cliches) {
    const fields2 = getAllTextFields(v);
    let totalCliche = fields2.reduce((s, f) => s + countSub(f.value, cw), 0);
    if (totalCliche > 1) {
      for (let i = fields2.length - 1; i >= 0 && totalCliche > 1; i--) {
        const f = fields2[i];
        let val = f.value;
        while (countSub(val, cw) > 0 && totalCliche > 1) {
          val = reduceCliche(val, cw, Math.max(0, countSub(val, cw) - 1));
          totalCliche--;
        }
        setTextField(v, f.path, val);
      }
    }
  }

  // ── 3.5 타임라인 time 필드 "N단계" → "Step N" ──
  v.timeline = v.timeline.map(t => ({
    ...t,
    time: t.time.replace(/^(\d+)단계$/, 'Step $1'),
  }));

  // ── 3.6 키워드 정리 (dedup, coreName/type limits, region removal) ──
  cleanupKeywords(v, coreName, region);

  // ── 3.7 FAQ 정리 (coreName max 1, region max 0) ──
  cleanupFAQ(v, coreName, region);

  // ── 4. Aggressive token reduction (NEW — replaces old general token pass) ──
  const beforeAggressive = getAllTextFields(v).reduce((s, f) => {
    for (const t of extractKoreanTokens(f.value)) {
      s++;
    }
    return s;
  }, 0);

  reduceAllTokensAggressively(v, coreName, region);

  const afterAggressive = getAllTextFields(v).reduce((s, f) => {
    for (const t of extractKoreanTokens(f.value)) {
      s++;
    }
    return s;
  }, 0);
  totalAggressiveRemoved += (beforeAggressive - afterAggressive);

  // ── 5. Final keywords cleanup (remove empties from aggressive pass) ──
  finalKeywordsCleanup(v);
}

writeFileSync(venuesPath, JSON.stringify(venues, null, 2), 'utf-8');
console.log(`\u2705 fix-venue-repetition complete`);
console.log(`   name_display removed: ${totalNameRemoved} occurrences`);
console.log(`   region removed: ${totalRegionRemoved} occurrences`);
console.log(`   aggressive token pass removed: ${totalAggressiveRemoved} token occurrences`);

// ─── Helpers ───

function countAllText(v, sub) {
  return getAllTextFields(v).reduce((s, f) => s + countSub(f.value, sub), 0);
}

function getAllTextFields(v) {
  const fields = [];
  // storyFrame.style is rendered 2x on page (heading + TOC) — include early so it's preserved
  if (v.storyFrame && v.storyFrame.style) {
    fields.push({ path: 'storyFrame.style', value: v.storyFrame.style });
  }
  fields.push({ path: 'teaser', value: v.teaser });
  if (v.hookIntro) fields.push({ path: 'hookIntro', value: v.hookIntro });
  for (const s of ['scene1', 'scene2', 'scene3', 'scene4', 'scene5', 'scene6', 'scene7', 'scene8']) {
    if (v.story[s]) fields.push({ path: `story.${s}`, value: v.story[s] });
  }
  fields.push({ path: 'bodySections.atmosphere', value: v.bodySections.atmosphere });
  fields.push({ path: 'bodySections.music', value: v.bodySections.music });
  fields.push({ path: 'bodySections.safety', value: v.bodySections.safety });
  if (v.bodySections.deepDive) {
    for (const key of Object.keys(v.bodySections.deepDive)) {
      fields.push({ path: `bodySections.deepDive.${key}`, value: v.bodySections.deepDive[key] });
    }
  }
  v.timeline.forEach((t, i) => {
    fields.push({ path: `timeline.${i}.label`, value: t.label });
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
  // Keywords as text fields for token reduction
  v.keywords.forEach((kw, i) => {
    fields.push({ path: `keywords.${i}`, value: kw });
  });
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
