#!/usr/bin/env node
/**
 * seo-optimize-venues.mjs
 * 1. Ensures store name density 10-12 mentions per venue page text
 * 2. Fixes broken text references (empty store names, dangling particles)
 * 3. Ensures description_short is unique per venue
 * 4. Fixes plannerRules key mapping (목적→p, 시간대→t)
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const VENUES_PATH = join(ROOT, 'data', 'venues.json');

const venues = JSON.parse(readFileSync(VENUES_PATH, 'utf8'));

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h + str.charCodeAt(i)) | 0; }
  return Math.abs(h);
}

function typeKo(type) {
  return { club: '클럽', night: '나이트', lounge: '라운지' }[type] || type;
}

// ======================== TEXT HELPERS ========================
// Get all renderable text fields for a venue (what appears on the page)
function getAllText(v) {
  const parts = [];
  if (v.pageTitle) parts.push(v.pageTitle);
  if (v.h1Title) parts.push(v.h1Title);
  if (v.metaDescription) parts.push(v.metaDescription);
  if (v.hookIntro) parts.push(v.hookIntro);
  if (v.teaser) parts.push(v.teaser);
  if (v.bodySections) {
    if (v.bodySections.atmosphere) parts.push(v.bodySections.atmosphere);
    if (v.bodySections.music) parts.push(v.bodySections.music);
    if (v.bodySections.safety) parts.push(v.bodySections.safety);
    if (v.bodySections.deepDive) {
      for (const val of Object.values(v.bodySections.deepDive)) {
        if (val) parts.push(val);
      }
    }
  }
  if (v.story) {
    for (let i = 1; i <= 8; i++) {
      if (v.story[`scene${i}`]) parts.push(v.story[`scene${i}`]);
    }
  }
  if (v.sectionIntros) {
    for (const val of Object.values(v.sectionIntros)) {
      if (val) parts.push(val);
    }
  }
  if (v.conclusionText) parts.push(v.conclusionText);
  if (v.timeline) {
    for (const t of v.timeline) {
      if (t.desc) parts.push(t.desc);
    }
  }
  if (v.faq) {
    for (const f of v.faq) {
      if (f.q) parts.push(f.q);
      if (f.a) parts.push(f.a);
    }
  }
  if (v.intro) {
    if (v.intro.hook) parts.push(v.intro.hook);
    if (v.intro.valuePromise) parts.push(v.intro.valuePromise);
    if (v.intro.scanBox) parts.push(...v.intro.scanBox);
    if (v.intro.checklist) parts.push(...v.intro.checklist);
    if (v.intro.teasers) parts.push(...v.intro.teasers);
    if (v.intro.riskItems) {
      for (const r of v.intro.riskItems) {
        if (r.dont) parts.push(r.dont);
        if (r.doInstead) parts.push(r.doInstead);
      }
    }
  }
  return parts.join(' ');
}

function countStoreName(text, name) {
  if (!name || !text) return 0;
  let count = 0;
  let pos = 0;
  while ((pos = text.indexOf(name, pos)) !== -1) {
    count++;
    pos += name.length;
  }
  return count;
}

// ======================== FIX BROKEN TEXT ========================
// Fix common issues: "레이스 은", "레이스 의", empty store name refs
function fixBrokenText(text, storeName) {
  if (!text) return text;
  // Get the short name (without region and type suffix)
  const parts = storeName.split(' ');
  // For "강남 레이스 클럽", shortName candidates: "레이스 클럽", "레이스"
  const shortNames = [];
  if (parts.length >= 2) shortNames.push(parts.slice(1).join(' ')); // "레이스 클럽"
  if (parts.length >= 2) shortNames.push(parts[1]); // "레이스"
  if (parts.length >= 3) shortNames.push(parts.slice(1, -1).join(' ')); // "레이스" (without type)

  let fixed = text;

  // Fix dangling particles after short name: "레이스 은" → "레이스 클럽은"
  for (const sn of shortNames) {
    const danglingPattern = new RegExp(`${escapeRegex(sn)}\\s+(은|는|이|가|을|를|에|의|와|과|에서|으로|로|까지|도|만)\\b`, 'g');
    // Only fix if the short name is missing the type suffix
    if (sn === storeName || sn.endsWith('클럽') || sn.endsWith('나이트') || sn.endsWith('라운지')) continue;
    fixed = fixed.replace(danglingPattern, (match, particle) => {
      return `${storeName}${particle}`;
    });
  }

  // Fix empty store name references: " 은 ", " 의 ", " 에서 " etc.
  // These happen when store name was completely removed
  fixed = fixed.replace(/\s{2,}(은|는|이|가|을|를|에|의|와|과|에서|으로|로|까지)\s/g, ` ${storeName}$1 `);

  return fixed;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ======================== STORE NAME DENSITY ADJUSTMENT ========================
// Add store name mentions to sections that need them
function adjustDensity(v, currentCount, target) {
  const name = v.name_display;
  const diff = target - currentCount;

  if (diff <= 0) return; // Already at or above target

  // Priority order for adding mentions: bodySections, deepDive, story scenes
  const addTargets = [
    { path: 'bodySections.atmosphere', label: '분위기' },
    { path: 'bodySections.music', label: '사운드' },
    { path: 'bodySections.safety', label: '안전' },
    { path: 'bodySections.deepDive.checkpoint', label: '체크포인트' },
    { path: 'bodySections.deepDive.history', label: '역사' },
    { path: 'bodySections.deepDive.season', label: '시즌' },
    { path: 'bodySections.deepDive.course', label: '코스' },
  ];

  let added = 0;
  const idx = hash(v.id);

  const insertTemplates = [
    (n) => `${n}에서는`,
    (n) => `${n}의`,
    (n) => `${n}을 찾는 방문자는`,
    (n) => `${n}이 제공하는`,
    (n) => `${n}에서의 경험은`,
    (n) => `${n}만의`,
  ];

  for (let i = 0; i < addTargets.length && added < diff; i++) {
    const { path } = addTargets[(idx + i) % addTargets.length];
    const keys = path.split('.');
    let obj = v;
    for (let k = 0; k < keys.length - 1; k++) {
      obj = obj?.[keys[k]];
    }
    const lastKey = keys[keys.length - 1];
    if (!obj || !obj[lastKey]) continue;

    const text = obj[lastKey];
    const nameCount = countStoreName(text, name);

    // Only add if this section has 0-1 mentions
    if (nameCount < 2) {
      const sentences = text.split('. ');
      if (sentences.length >= 2) {
        const templateFn = insertTemplates[(idx + i + added) % insertTemplates.length];
        const prefix = templateFn(name);
        // Insert store name reference at start of 2nd sentence
        sentences[1] = prefix + ' ' + sentences[1].charAt(0).toLowerCase() + sentences[1].slice(1);
        obj[lastKey] = sentences.join('. ');
        added++;
      }
    }
  }
}

// ======================== REMOVE EXCESS DENSITY ========================
function reduceExcessDensity(v, currentCount, maxTarget) {
  if (currentCount <= maxTarget) return;

  const name = v.name_display;
  const excess = currentCount - maxTarget;

  // Remove from story scenes (least impactful for SEO)
  let removed = 0;
  for (let i = 8; i >= 4 && removed < excess; i--) {
    const key = `scene${i}`;
    if (!v.story?.[key]) continue;
    const text = v.story[key];
    const count = countStoreName(text, name);
    if (count > 2) {
      // Remove one mention by replacing "STORE_NAME " with empty in the middle of text
      const firstIdx = text.indexOf(name);
      const secondIdx = text.indexOf(name, firstIdx + name.length);
      if (secondIdx > 0) {
        v.story[key] = text.substring(0, secondIdx) + text.substring(secondIdx + name.length).replace(/^\s*(은|는|이|가|을|를)\s*/, ' ');
        removed++;
      }
    }
  }
}

// ======================== FIX PLANNER RULES KEYS ========================
function fixPlannerKeys(v) {
  if (!v.plannerRules) return;

  // Map Korean keys to short keys expected by template
  const rules = v.plannerRules;
  if (rules['목적'] && !rules['p']) {
    rules['p'] = rules['목적'];
  }
  if (rules['시간대'] && !rules['t']) {
    rules['t'] = rules['시간대'];
  }
}

// ======================== FIX DESCRIPTION_SHORT ========================
function fixDescriptionShort(v) {
  const name = v.name_display;
  const t = typeKo(v.type);
  const r = v.region;

  if (!v.description_short || v.description_short.length < 40 || !v.description_short.includes(name)) {
    const idx = hash(v.id);
    const templates = [
      `${name}은 ${r}에 위치한 ${t}입니다. 체크리스트 ${v.checklist?.length || 7}개, FAQ ${v.faq?.length || 8}개, 타임라인 ${v.timeline?.length || 5}단계를 확인하세요.`,
      `${r} ${t} ${name} — 입장 정보, 피크타임 가이드, 체크리스트를 한 페이지에 정리했습니다.`,
      `${name} 방문 전 확인할 체크리스트 ${v.checklist?.length || 7}개와 FAQ ${v.faq?.length || 8}개를 담은 가이드입니다.`,
      `${name}은 ${r}의 밤문화를 대표하는 ${t}입니다. 분위기·사운드·준비물을 확인하세요.`,
    ];
    v.description_short = templates[idx % templates.length];
  }
}

// ======================== MAIN ========================
console.log(`Processing ${venues.length} venues for SEO optimization...\n`);

const stats = {
  totalVenues: venues.length,
  textFixed: 0,
  densityAdjusted: 0,
  plannerFixed: 0,
  descShortFixed: 0,
  densityBefore: { min: Infinity, max: 0, sum: 0 },
  densityAfter: { min: Infinity, max: 0, sum: 0 },
};

for (let i = 0; i < venues.length; i++) {
  const v = venues[i];
  const name = v.name_display;

  // 1. Fix broken text in all text fields
  const textFields = [
    ['hookIntro'],
    ['teaser'],
    ['bodySections', 'atmosphere'],
    ['bodySections', 'music'],
    ['bodySections', 'safety'],
    ['bodySections', 'deepDive', 'checkpoint'],
    ['bodySections', 'deepDive', 'history'],
    ['bodySections', 'deepDive', 'season'],
    ['bodySections', 'deepDive', 'course'],
    ['story', 'scene1'],
    ['story', 'scene2'],
    ['story', 'scene3'],
    ['story', 'scene4'],
    ['story', 'scene5'],
    ['story', 'scene6'],
    ['story', 'scene7'],
    ['story', 'scene8'],
  ];

  for (const path of textFields) {
    let obj = v;
    for (let k = 0; k < path.length - 1; k++) {
      obj = obj?.[path[k]];
      if (!obj) break;
    }
    if (!obj) continue;
    const lastKey = path[path.length - 1];
    if (!obj[lastKey]) continue;
    const original = obj[lastKey];
    const fixed = fixBrokenText(original, name);
    if (fixed !== original) {
      obj[lastKey] = fixed;
      stats.textFixed++;
    }
  }

  // 2. Count current store name density
  const allText = getAllText(v);
  const currentDensity = countStoreName(allText, name);
  stats.densityBefore.min = Math.min(stats.densityBefore.min, currentDensity);
  stats.densityBefore.max = Math.max(stats.densityBefore.max, currentDensity);
  stats.densityBefore.sum += currentDensity;

  // 3. Adjust density to 10-12 range
  if (currentDensity < 10) {
    adjustDensity(v, currentDensity, 10);
    stats.densityAdjusted++;
  } else if (currentDensity > 14) {
    reduceExcessDensity(v, currentDensity, 12);
    stats.densityAdjusted++;
  }

  // 4. Fix planner rules key mapping
  if (v.plannerRules && !v.plannerRules['p']) {
    fixPlannerKeys(v);
    stats.plannerFixed++;
  }

  // 5. Fix description_short
  const origDesc = v.description_short;
  fixDescriptionShort(v);
  if (v.description_short !== origDesc) {
    stats.descShortFixed++;
  }

  // Post-adjustment density
  const afterText = getAllText(v);
  const afterDensity = countStoreName(afterText, name);
  stats.densityAfter.min = Math.min(stats.densityAfter.min, afterDensity);
  stats.densityAfter.max = Math.max(stats.densityAfter.max, afterDensity);
  stats.densityAfter.sum += afterDensity;

  if ((i + 1) % 20 === 0 || i === venues.length - 1) {
    console.log(`  Processed ${i + 1}/${venues.length}...`);
  }
}

// Save
writeFileSync(VENUES_PATH, JSON.stringify(venues, null, 2), 'utf8');

// Report
const n = stats.totalVenues;
console.log('\n===================================================');
console.log('  SEO OPTIMIZATION SUMMARY');
console.log('===================================================');
console.log(`  Total venues:           ${n}`);
console.log(`  Text fixes:             ${stats.textFixed} fields`);
console.log(`  Density adjustments:    ${stats.densityAdjusted} venues`);
console.log(`  Planner key fixes:      ${stats.plannerFixed} venues`);
console.log(`  description_short fixes: ${stats.descShortFixed} venues`);
console.log(`  Density BEFORE — min: ${stats.densityBefore.min}  max: ${stats.densityBefore.max}  avg: ${(stats.densityBefore.sum / n).toFixed(1)}`);
console.log(`  Density AFTER  — min: ${stats.densityAfter.min}  max: ${stats.densityAfter.max}  avg: ${(stats.densityAfter.sum / n).toFixed(1)}`);
console.log('===================================================\n');
