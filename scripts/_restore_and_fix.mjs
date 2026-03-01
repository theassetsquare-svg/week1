#!/usr/bin/env node
/**
 * Comprehensive venues.json restore & fix script
 *
 * 1. Restore prose fields from ce1beebd (Humanize rewrite - cleanest content)
 * 2. Merge structural fields from 97f75b3e (Feb 28 - has aiSummary, quickPlan, etc.)
 * 3. Fix systematic issues:
 *    - Korean particle spacing (coreName + space + particle → coreName + particle)
 *    - ${name} template variable replacement
 *    - Step N label removal from prose
 *    - Banned word replacement
 *    - Regenerate broken aiSummary & description_short
 *    - Fix broken teasers
 */
import { readFileSync, writeFileSync } from 'fs';

// Load both versions
const humanize = JSON.parse(readFileSync('/tmp/venues_humanize.json', 'utf8'));
const feb28 = JSON.parse(readFileSync('/tmp/venues_feb28.json', 'utf8'));

// Build index by id
const humanizeById = new Map(humanize.map(v => [v.id, v]));
const feb28ById = new Map(feb28.map(v => [v.id, v]));

// Fields to take from ce1beebd (prose/content fields - cleanest versions)
const PROSE_FIELDS = [
  'hookIntro', 'teaser', 'conclusionText', 'story', 'bodySections',
  'sectionIntros', 'faq', 'intro', 'checklist', 'timeline',
  'storyFrame', 'plannerRules',
];

// Fields to take from 97f75b3e ONLY (structural additions not in ce1beebd)
const STRUCTURAL_FIELDS = [
  'aiSummary', 'quickPlan', 'card_hook', 'card_tags', 'card_value',
  'description_short', 'image_alt', 'map_url',
];

// Fields from either version (prefer feb28 for latest SEO updates)
const SEO_FIELDS = [
  'pageTitle', 'h1Title', 'seoTitle', 'seoDescription', 'metaDescription',
  'urlSlug',
];

// Start with ce1beebd as base, merge in structural fields
const merged = humanize.map(hv => {
  const fv = feb28ById.get(hv.id);
  const result = { ...hv };

  if (fv) {
    // Add structural fields from feb28
    for (const field of STRUCTURAL_FIELDS) {
      if (fv[field] !== undefined) {
        result[field] = JSON.parse(JSON.stringify(fv[field]));
      }
    }
    // Take SEO fields from feb28 (more polished)
    for (const field of SEO_FIELDS) {
      if (fv[field] !== undefined) {
        result[field] = fv[field];
      }
    }
    // Take geo from feb28 (may have updates)
    if (fv.geo) result.geo = JSON.parse(JSON.stringify(fv.geo));
    // Take images from feb28 (may have updates)
    if (fv.images) result.images = JSON.parse(JSON.stringify(fv.images));
    if (fv.imagePrompts) result.imagePrompts = JSON.parse(JSON.stringify(fv.imagePrompts));
    // Take relatedVenueIds from feb28
    if (fv.relatedVenueIds) result.relatedVenueIds = JSON.parse(JSON.stringify(fv.relatedVenueIds));
  }

  return result;
});

console.log(`Step 1: Merged ${merged.length} venues from ce1beebd + 97f75b3e`);

// ═══════════════════════════════════════════════════════════════
// Step 2: Fix Korean particle spacing
// ═══════════════════════════════════════════════════════════════

const PARTICLES = ['은', '는', '을', '를', '이', '가', '의', '에', '에서', '으로', '로', '과', '와', '도', '만', '까지', '부터', '에게', '한테', '처럼', '만큼', '보다', '라는', '이라는', '이다', '이란'];

function getCoreName(v) {
  let name = v.name_display || '';
  // Remove region prefix
  if (v.region && name.startsWith(v.region + ' ')) {
    name = name.substring(v.region.length + 1);
  }
  // Remove type suffix
  name = name.replace(/\s+(클럽|나이트|라운지)\s*$/, '').trim();
  return name;
}

let particleFixes = 0;
merged.forEach(v => {
  const coreName = getCoreName(v);
  if (!coreName || coreName.length < 2) return;

  // Fix "coreName 은" → "coreName은" for all particles
  function fixParticles(obj) {
    if (typeof obj === 'string') {
      let fixed = obj;
      for (const p of PARTICLES) {
        // Match coreName followed by space and particle (only when particle is followed by space, punctuation, or end)
        const regex = new RegExp(
          escapeRegex(coreName) + '\\s+(' + escapeRegex(p) + ')(?=[\\s.,!?·\'"\\)\\]」—]|$)',
          'g'
        );
        fixed = fixed.replace(regex, coreName + '$1');
      }
      if (fixed !== obj) particleFixes++;
      return fixed;
    }
    if (Array.isArray(obj)) return obj.map(item => fixParticles(item));
    if (typeof obj === 'object' && obj !== null) {
      const r = {};
      for (const [k, val] of Object.entries(obj)) r[k] = fixParticles(val);
      return r;
    }
    return obj;
  }

  // Apply to all text fields
  const SKIP = new Set(['id', 'type', 'typePath', 'typeLabel', 'regionSlug', 'venueSlug', 'urlSlug', 'geo', 'images', 'imagePrompts', 'relatedVenueIds', 'map_url', 'name_display', 'name_input', 'name_seo', 'region', 'card_tags', 'sourcePath']);
  for (const [k, val] of Object.entries(v)) {
    if (SKIP.has(k)) continue;
    v[k] = fixParticles(val);
  }
});
console.log(`Step 2: Fixed ${particleFixes} particle spacing issues`);

// ═══════════════════════════════════════════════════════════════
// Step 3: Fix ${name} template variables
// ═══════════════════════════════════════════════════════════════

let templateFixes = 0;
merged.forEach(v => {
  function fixTemplate(obj) {
    if (typeof obj === 'string') {
      if (obj.includes('${name}')) {
        templateFixes++;
        return obj.replace(/\$\{name\}/g, v.name_display);
      }
      return obj;
    }
    if (Array.isArray(obj)) return obj.map(item => fixTemplate(item));
    if (typeof obj === 'object' && obj !== null) {
      const r = {};
      for (const [k, val] of Object.entries(obj)) r[k] = fixTemplate(val);
      return r;
    }
    return obj;
  }

  for (const [k, val] of Object.entries(v)) {
    v[k] = fixTemplate(val);
  }
});
console.log(`Step 3: Fixed ${templateFixes} template variable replacements`);

// ═══════════════════════════════════════════════════════════════
// Step 4: Fix "Step N" labels in prose (not in timeline/planner)
// ═══════════════════════════════════════════════════════════════

const PROSE_ONLY = ['hookIntro', 'teaser', 'conclusionText', 'bodySections', 'sectionIntros', 'intro', 'story', 'faq', 'aiSummary', 'description_short', 'card_hook'];
let stepFixes = 0;
merged.forEach(v => {
  function fixStep(obj) {
    if (typeof obj === 'string') {
      // Replace "Step N (label)" with just "label" or remove
      let fixed = obj;
      fixed = fixed.replace(/Step\s+\d+\s*\(([^)]+)\)/g, '$1');
      fixed = fixed.replace(/Step\s+\d+\s*—\s*/g, '');
      fixed = fixed.replace(/Step\s+\d+/g, '');
      if (fixed !== obj) stepFixes++;
      return fixed;
    }
    if (Array.isArray(obj)) return obj.map(item => fixStep(item));
    if (typeof obj === 'object' && obj !== null) {
      const r = {};
      for (const [k, val] of Object.entries(obj)) r[k] = fixStep(val);
      return r;
    }
    return obj;
  }

  for (const field of PROSE_ONLY) {
    if (v[field] !== undefined) {
      v[field] = fixStep(v[field]);
    }
  }
});
console.log(`Step 4: Fixed ${stepFixes} Step N label leaks`);

// ═══════════════════════════════════════════════════════════════
// Step 5: Fix banned words
// ═══════════════════════════════════════════════════════════════

const BANNED_REPLACEMENTS = {
  '해당': '그',
  '이곳': '여기',
  '매장': '업소',
  '감도': '분위기',
};
// 공간 and 기준 need context-aware replacement
const SKIP_BAN = new Set(['id', 'type', 'typePath', 'typeLabel', 'regionSlug', 'venueSlug', 'urlSlug', 'geo', 'images', 'imagePrompts', 'relatedVenueIds', 'map_url', 'name_display', 'name_input', 'name_seo', 'region', 'card_tags', 'sourcePath', 'keywords']);
let bannedFixes = 0;

merged.forEach(v => {
  const prot = new Set();
  [v.name_display, v.name_input, v.name_seo].filter(Boolean).forEach(n => {
    (n.match(/[\uAC00-\uD7AF]{2,}/g) || []).forEach(p => prot.add(p));
  });
  if (v.region) (v.region.match(/[\uAC00-\uD7AF]{2,}/g) || []).forEach(p => prot.add(p));

  function fixBanned(obj) {
    if (typeof obj === 'string') {
      let fixed = obj;
      // Simple replacements
      for (const [banned, replacement] of Object.entries(BANNED_REPLACEMENTS)) {
        if (prot.has(banned)) continue;
        const regex = new RegExp(`(?<![\\uAC00-\\uD7AF])${banned}(?![\\uAC00-\\uD7AF])`, 'g');
        fixed = fixed.replace(regex, replacement);
      }
      // Context-aware: 공간 → varies
      if (!prot.has('공간')) {
        fixed = fixed.replace(/(?<![\uAC00-\uD7AF])공간(?![\uAC00-\uD7AF])/g, (match, offset) => {
          const ctx = fixed.substring(Math.max(0, offset - 10), offset);
          if (ctx.includes('프라이빗')) return '자리';
          if (ctx.includes('실내') || ctx.includes('내부')) return '분위기';
          return '자리';
        });
      }
      // Context-aware: 기준 → varies
      if (!prot.has('기준')) {
        fixed = fixed.replace(/(?<![\uAC00-\uD7AF])기준(?![\uAC00-\uD7AF])/g, '조건');
      }
      if (fixed !== obj) bannedFixes++;
      return fixed;
    }
    if (Array.isArray(obj)) return obj.map(item => fixBanned(item));
    if (typeof obj === 'object' && obj !== null) {
      const r = {};
      for (const [k, val] of Object.entries(obj)) {
        if (SKIP_BAN.has(k)) { r[k] = val; continue; }
        r[k] = fixBanned(val);
      }
      return r;
    }
    return obj;
  }

  for (const [k, val] of Object.entries(v)) {
    if (SKIP_BAN.has(k)) continue;
    v[k] = fixBanned(val);
  }
});
console.log(`Step 5: Fixed ${bannedFixes} banned word instances`);

// ═══════════════════════════════════════════════════════════════
// Step 6: Regenerate broken aiSummary entries
// ═══════════════════════════════════════════════════════════════

let aiSummaryFixes = 0;
merged.forEach(v => {
  if (!v.aiSummary) return;

  const coreName = getCoreName(v);
  const typeName = v.typeLabel || v.type;

  // Regenerate aiSummary from actual data fields
  const newSummary = [];
  newSummary.push(`유형: ${v.region} ${typeName}`);

  if (v.geo && v.geo.formatted_address && v.geo.formatted_address !== '확인 필요') {
    newSummary.push(`위치: ${v.geo.formatted_address}`);
  } else {
    newSummary.push(`위치: ${v.region}`);
  }

  // Atmosphere - first sentence of bodySections.atmosphere
  if (v.bodySections?.atmosphere) {
    const firstSentence = v.bodySections.atmosphere.split('.')[0] + '.';
    newSummary.push(`분위기: ${firstSentence}`);
  }

  // Sound - first sentence of bodySections.music
  if (v.bodySections?.music) {
    const firstSentence = v.bodySections.music.split('.')[0] + '.';
    newSummary.push(`사운드: ${firstSentence}`);
  }

  // Peak time from timeline
  if (v.timeline && v.timeline.length > 0) {
    const peak = v.timeline.find(t => t.label?.includes('피크') || t.label?.includes('절정')) || v.timeline[Math.floor(v.timeline.length / 2)];
    if (peak) {
      newSummary.push(`피크타임: ${peak.time} — ${peak.label}`);
    }
  }

  // Checklist summary
  if (v.checklist && v.checklist.length > 0) {
    newSummary.push(`준비 체크: ${v.checklist[0]}`);
  }

  // FAQ count
  if (v.faq && v.faq.length > 0) {
    newSummary.push(`FAQ: ${v.faq.length}개 답변 수록`);
  }

  // Checklist count
  if (v.checklist && v.checklist.length > 0) {
    newSummary.push(`체크리스트: ${v.checklist.length}개 항목`);
  }

  // Update date
  newSummary.push(`정보 확인일: 2026-02-18 — 변경 가능, 방문 전 재확인 권장`);

  v.aiSummary = newSummary;
  aiSummaryFixes++;
});
console.log(`Step 6: Regenerated ${aiSummaryFixes} aiSummary arrays`);

// ═══════════════════════════════════════════════════════════════
// Step 7: Fix broken teasers
// ═══════════════════════════════════════════════════════════════

let teaserFixes = 0;
merged.forEach(v => {
  // If teaser is too short or garbled, regenerate from hookIntro
  if (!v.teaser || v.teaser.length < 40 || v.teaser.includes(' 은 ') || v.teaser.includes('  ')) {
    if (v.hookIntro && v.hookIntro.length > 40) {
      // Take first 1-2 sentences from hookIntro
      const sentences = v.hookIntro.split(/(?<=[.!?])\s+/);
      v.teaser = sentences.slice(0, 2).join(' ');
      if (v.teaser.length > 150) v.teaser = sentences[0];
      teaserFixes++;
    }
  }
});
console.log(`Step 7: Fixed ${teaserFixes} broken teasers`);

// ═══════════════════════════════════════════════════════════════
// Step 8: Fix broken description_short
// ═══════════════════════════════════════════════════════════════

let descFixes = 0;
merged.forEach(v => {
  if (!v.description_short || v.description_short.length < 20 || v.description_short.includes('·') || v.description_short.includes('  ')) {
    // Generate from teaser or hookIntro
    const source = v.teaser || v.hookIntro || '';
    if (source.length > 20) {
      const firstSentence = source.split(/(?<=[.!?])\s+/)[0];
      v.description_short = firstSentence.length > 80 ? firstSentence.substring(0, 77) + '...' : firstSentence;
      descFixes++;
    }
  }
});
console.log(`Step 8: Fixed ${descFixes} broken description_short`);

// ═══════════════════════════════════════════════════════════════
// Step 9: Clean up remaining garbled patterns
// ═══════════════════════════════════════════════════════════════

let cleanupFixes = 0;
merged.forEach(v => {
  function cleanup(obj) {
    if (typeof obj === 'string') {
      let fixed = obj;
      // Fix double spaces
      fixed = fixed.replace(/\s{2,}/g, ' ');
      // Fix ". ." → "."
      fixed = fixed.replace(/\.\s*\./g, '.');
      // Fix "면에서도." orphaned fragment
      fixed = fixed.replace(/\.\s*면에서도\./g, '.');
      // Fix ", ," → ","
      fixed = fixed.replace(/,\s*,/g, ',');
      // Fix " ." → "."
      fixed = fixed.replace(/\s+\./g, '.');
      // Fix ".." → "."
      fixed = fixed.replace(/\.{2,}/g, '.');
      // Fix trailing spaces before periods
      fixed = fixed.replace(/\s+([.!?,])/g, '$1');
      // Remove empty parentheses
      fixed = fixed.replace(/\(\s*\)/g, '');
      // Fix "하합니다" → "합니다"
      fixed = fixed.replace(/하합니다/g, '합니다');
      // Fix orphaned "가장 것으로" → "유명한 것으로"
      fixed = fixed.replace(/가장\s+것으로/g, '유명한 것으로');
      // Fix "씬에서도 수준으로" → "씬에서도 높은 수준으로"
      fixed = fixed.replace(/씬에서도\s+수준으로/g, '씬에서도 높은 수준으로');
      // Trim
      fixed = fixed.trim();
      if (fixed !== obj) cleanupFixes++;
      return fixed;
    }
    if (Array.isArray(obj)) return obj.map(item => cleanup(item));
    if (typeof obj === 'object' && obj !== null) {
      const r = {};
      for (const [k, val] of Object.entries(obj)) r[k] = cleanup(val);
      return r;
    }
    return obj;
  }

  for (const [k, val] of Object.entries(v)) {
    if (['id', 'type', 'typePath', 'typeLabel', 'regionSlug', 'venueSlug', 'urlSlug', 'images', 'imagePrompts', 'relatedVenueIds', 'map_url', 'name_display', 'name_input', 'name_seo', 'region', 'card_tags', 'sourcePath', 'geo'].includes(k)) continue;
    v[k] = cleanup(val);
  }
});
console.log(`Step 9: Cleaned up ${cleanupFixes} garbled patterns`);

// ═══════════════════════════════════════════════════════════════
// Step 10: Ensure metaDescription is not broken
// ═══════════════════════════════════════════════════════════════

let metaFixes = 0;
merged.forEach(v => {
  if (!v.metaDescription || v.metaDescription.length < 30 || v.metaDescription.includes('  ') || v.metaDescription.includes('..')) {
    const source = v.teaser || v.hookIntro || '';
    if (source.length > 30) {
      const firstSentence = source.split(/(?<=[.!?])\s+/)[0];
      v.metaDescription = firstSentence.length > 155 ? firstSentence.substring(0, 152) + '...' : firstSentence;
      metaFixes++;
    }
  }
  if (!v.seoDescription || v.seoDescription.length < 30) {
    v.seoDescription = v.metaDescription;
    metaFixes++;
  }
});
console.log(`Step 10: Fixed ${metaFixes} broken meta descriptions`);

// Save
writeFileSync('data/venues.json', JSON.stringify(merged, null, 2), 'utf8');
console.log(`\n=== SAVED: ${merged.length} venues to data/venues.json ===`);

// Verification
let remainingGarbled = 0;
let remainingBanned = 0;
const BANNED_WORDS = ['해당', '이곳', '공간', '매장', '감도', '기준'];

merged.forEach(v => {
  const allText = JSON.stringify(v);
  const coreName = getCoreName(v);
  if (coreName && allText.includes(coreName + ' 은 ')) remainingGarbled++;
  for (const bw of BANNED_WORDS) {
    const regex = new RegExp(`(?<![\\uAC00-\\uD7AF])${bw}(?![\\uAC00-\\uD7AF])`, 'g');
    // Check only in non-skip fields
    const textOnly = [];
    function walk(obj) {
      if (typeof obj === 'string') textOnly.push(obj);
      else if (Array.isArray(obj)) obj.forEach(walk);
      else if (typeof obj === 'object' && obj !== null) {
        for (const [k, val] of Object.entries(obj)) {
          if (SKIP_BAN.has(k)) continue;
          walk(val);
        }
      }
    }
    walk(v);
    const joined = textOnly.join(' ');
    if (regex.test(joined)) remainingBanned++;
  }
});
console.log(`\nVerification:`);
console.log(`  Remaining garbled particles: ${remainingGarbled}`);
console.log(`  Remaining banned word venues: ${remainingBanned}`);

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
