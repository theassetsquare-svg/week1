#!/usr/bin/env node
/**
 * humanize-rewrite.mjs
 * Phase 2: Humanize all venue content in venues.json.
 * - Replace overused words (분위기, 추천, 매장, 공간, 이곳) with synonyms
 * - Diversify FAQ question patterns
 * - Make teasers unique per venue
 * - Fix AI-like patterns
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const VENUES_PATH = join(ROOT, 'data', 'venues.json');

const venues = JSON.parse(readFileSync(VENUES_PATH, 'utf-8'));

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function pick(arr, seed) { return arr[hash(seed) % arr.length]; }

/* ── Synonym maps for overused words ── */
const ATMOSPHERE_ALTS = [
  '무드', '색감', '톤', '공기', '온도', '질감',
  '현장감', '에너지', '흐름', '기류', '밀도', '감각',
];

const RECOMMEND_ALTS = [
  '권하', '제안하', '안내하', '참고하', '살펴보',
  '고려하', '확인하', '비교하',
];

const PLACE_ALTS = [
  '현장', '장소', '동선', '좌석 구역', '홀', '플로어', '내부', '입구 쪽', '바 앞',
];

// Replace nth occurrence of a word with a synonym
function replaceNthOccurrence(text, word, synonyms, maxKeep, seed) {
  let count = 0;
  let synIdx = 0;
  const h = hash(seed);

  return text.replace(new RegExp(word, 'g'), (match) => {
    count++;
    if (count <= maxKeep) return match; // keep first N
    const syn = synonyms[(h + synIdx++) % synonyms.length];
    return syn;
  });
}

// Smart replacement that handles different word endings
function smartReplace(text, baseWord, alts, maxKeep, seed) {
  let count = 0;
  const h = hash(seed);
  let synIdx = 0;

  // Count occurrences
  const totalOccurrences = (text.match(new RegExp(baseWord, 'g')) || []).length;
  if (totalOccurrences <= maxKeep) return text;

  return text.replace(new RegExp(baseWord, 'g'), (match) => {
    count++;
    if (count <= maxKeep) return match;
    return alts[(h + synIdx++) % alts.length];
  });
}

/* ── FAQ diversification ── */
const FAQ_STARTERS = {
  club: [
    (name, region) => `입장 시 신분증은 꼭 필요한가요? (${name})`,
    (name, region) => `드레스코드 기준이 궁금합니다 — ${name}은 어느 정도인가요?`,
    (name, region) => `게스트 사전 등록은 어디서 하나요?`,
    (name, region) => `피크타임은 보통 몇 시쯤인가요?`,
    (name, region) => `${name} 입장료는 얼마 정도 예상하면 되나요?`,
    (name, region) => `대중교통으로 ${name}까지 가기 편한가요?`,
    (name, region) => `주변에 주차할 곳이 있나요?`,
    (name, region) => `혼자 방문해도 분위기상 괜찮을까요?`,
  ],
  night: [
    (name, region) => `처음 가는데 복장은 어떻게 입고 가야 하나요?`,
    (name, region) => `파트너 댄스가 필수인가요? 못 춰도 괜찮나요?`,
    (name, region) => `라이브 밴드 공연은 보통 몇 시에 시작하나요?`,
    (name, region) => `입장료와 음료 가격대가 궁금합니다`,
    (name, region) => `예약 없이 방문해도 입장할 수 있나요?`,
    (name, region) => `${region}에서 ${name}까지 대중교통이 편한가요?`,
    (name, region) => `근처에 주차 공간이 있나요?`,
    (name, region) => `나이 제한이 있나요? 몇 살부터 입장 가능한가요?`,
  ],
  lounge: [
    (name, region) => `예약 없이 방문해도 자리가 있나요?`,
    (name, region) => `시그니처 메뉴나 추천 칵테일이 있나요?`,
    (name, region) => `테이블 차지나 최소 주문 금액이 있나요?`,
    (name, region) => `데이트 장소로 괜찮을까요?`,
    (name, region) => `단체 예약도 가능한가요? 몇 명까지 되나요?`,
    (name, region) => `대중교통으로 접근하기 편한가요?`,
    (name, region) => `주변에 주차할 곳이 마련되어 있나요?`,
    (name, region) => `혼자 가도 어색하지 않은 곳인가요?`,
  ],
};

/* ── Teaser diversification templates ── */
const TEASER_TEMPLATES = {
  club: [
    v => `${v.region} ${v.bodySections.atmosphere.split('.')[0]}. ${v.bodySections.music.split('.')[0]}. 방문 전 체크리스트와 피크타임 가이드 확인.`,
    v => `${v.name_display}만의 사운드와 조명이 만드는 밤. ${v.timeline[0]?.time || '심야'} 기준 ${v.timeline[0]?.label || '본격 시작'}. 입장 전 준비물 안내 포함.`,
    v => `${v.region} 클럽 씬에서 고유한 위치를 차지하는 곳. ${v.bodySections.music.split('.')[0]}. 체크리스트 ${v.checklist.length}개 수록.`,
    v => `${v.bodySections.atmosphere.split('.')[0]}. FAQ ${v.faq.length}개와 시간대별 가이드 ${v.timeline.length}단계 포함.`,
  ],
  night: [
    v => `${v.region} 나이트의 라이브 무대와 댄스 플로어. ${v.bodySections.music.split('.')[0]}. 첫 방문자를 위한 준비 가이드 수록.`,
    v => `${v.name_display}에서 펼쳐지는 밤의 타임라인 ${v.timeline.length}단계. ${v.bodySections.atmosphere.split('.')[0]}. 에티켓 안내 포함.`,
    v => `${v.bodySections.atmosphere.split('.')[0]}. 라이브 음악과 함께하는 ${v.region}의 밤. 체크리스트 ${v.checklist.length}개 확인.`,
    v => `${v.region} 나이트 문화의 한 축. ${v.bodySections.music.split('.')[0]}. FAQ ${v.faq.length}개 수록.`,
  ],
  lounge: [
    v => `${v.region} 라운지의 조용한 깊이. ${v.bodySections.atmosphere.split('.')[0]}. 예약 전 확인 사항과 시간대별 가이드 포함.`,
    v => `${v.name_display}만의 선곡과 조명으로 만드는 저녁. ${v.bodySections.music.split('.')[0]}. 방문 전 체크리스트 수록.`,
    v => `${v.bodySections.atmosphere.split('.')[0]}. ${v.region}에서 대화와 음악이 어우러지는 공간. FAQ ${v.faq.length}개 안내.`,
    v => `${v.region} 라운지 씬의 고유한 한 자리. ${v.bodySections.music.split('.')[0]}. 타임라인 ${v.timeline.length}단계 수록.`,
  ],
};

/* ── Process each venue ── */
let fixCount = 0;

for (const v of venues) {
  const seed = v.id + v.name_display;
  let changed = false;

  // 1. Fix "분위기" overuse in all text fields
  const textFields = ['hookIntro', 'conclusionText'];
  const bodyFields = ['atmosphere', 'music', 'safety'];

  for (const field of textFields) {
    if (v[field]) {
      const orig = v[field];
      v[field] = smartReplace(v[field], '분위기', ATMOSPHERE_ALTS, 1, seed + field);
      v[field] = smartReplace(v[field], '추천', RECOMMEND_ALTS, 0, seed + field + 'rec');
      v[field] = smartReplace(v[field], '이곳', PLACE_ALTS, 0, seed + field + 'place');
      v[field] = smartReplace(v[field], '매장', PLACE_ALTS, 0, seed + field + 'store');
      v[field] = smartReplace(v[field], '완벽한', ['최적의', '이상적인', '기대 이상의', '제대로 된'], 0, seed + field + 'perf');
      if (v[field] !== orig) changed = true;
    }
  }

  for (const field of bodyFields) {
    if (v.bodySections[field]) {
      const orig = v.bodySections[field];
      v.bodySections[field] = smartReplace(v.bodySections[field], '분위기', ATMOSPHERE_ALTS, 1, seed + field);
      v.bodySections[field] = smartReplace(v.bodySections[field], '추천', RECOMMEND_ALTS, 0, seed + field + 'rec');
      v.bodySections[field] = smartReplace(v.bodySections[field], '이곳', PLACE_ALTS, 0, seed + field + 'place');
      v.bodySections[field] = smartReplace(v.bodySections[field], '특별', ['고유', '독자적인', '남다른', '별도의'], 0, seed + field + 'spc');
      if (v.bodySections[field] !== orig) changed = true;
    }
  }

  // Fix story scenes
  for (const [key, val] of Object.entries(v.story)) {
    if (typeof val === 'string') {
      const orig = val;
      v.story[key] = smartReplace(val, '분위기', ATMOSPHERE_ALTS, 1, seed + key);
      v.story[key] = smartReplace(v.story[key], '이곳', PLACE_ALTS, 0, seed + key + 'p');
      v.story[key] = smartReplace(v.story[key], '추천', RECOMMEND_ALTS, 0, seed + key + 'r');
      v.story[key] = smartReplace(v.story[key], '특별', ['고유', '독자적인', '남다른', '별도의'], 0, seed + key + 's');
      v.story[key] = smartReplace(v.story[key], '완벽한', ['최적의', '이상적인', '기대 이상의', '제대로 된'], 0, seed + key + 'pf');
      if (v.story[key] !== orig) changed = true;
    }
  }

  // Fix intro section — ALL fields
  if (v.intro) {
    const introFields = ['hook', 'valuePromise'];
    for (const f of introFields) {
      if (v.intro[f]) {
        const orig = v.intro[f];
        v.intro[f] = smartReplace(v.intro[f], '분위기', ATMOSPHERE_ALTS, 0, seed + 'i' + f);
        v.intro[f] = smartReplace(v.intro[f], '추천', RECOMMEND_ALTS, 0, seed + 'i' + f + 'r');
        v.intro[f] = smartReplace(v.intro[f], '이곳', PLACE_ALTS, 0, seed + 'i' + f + 'p');
        v.intro[f] = smartReplace(v.intro[f], '매장', PLACE_ALTS, 0, seed + 'i' + f + 's');
        if (v.intro[f] !== orig) changed = true;
      }
    }
    // Fix scanBox array items
    if (v.intro.scanBox) {
      for (let i = 0; i < v.intro.scanBox.length; i++) {
        const orig = v.intro.scanBox[i];
        v.intro.scanBox[i] = smartReplace(v.intro.scanBox[i], '분위기', ATMOSPHERE_ALTS, 0, seed + 'isb' + i);
        v.intro.scanBox[i] = smartReplace(v.intro.scanBox[i], '추천', RECOMMEND_ALTS, 0, seed + 'isb' + i + 'r');
        if (v.intro.scanBox[i] !== orig) changed = true;
      }
    }
    // Fix checklist array items
    if (v.intro.checklist) {
      for (let i = 0; i < v.intro.checklist.length; i++) {
        const orig = v.intro.checklist[i];
        v.intro.checklist[i] = smartReplace(v.intro.checklist[i], '분위기', ATMOSPHERE_ALTS, 0, seed + 'icl' + i);
        v.intro.checklist[i] = smartReplace(v.intro.checklist[i], '추천', RECOMMEND_ALTS, 0, seed + 'icl' + i + 'r');
        if (v.intro.checklist[i] !== orig) changed = true;
      }
    }
    // Fix riskItems
    if (v.intro.riskItems) {
      for (let i = 0; i < v.intro.riskItems.length; i++) {
        const ri = v.intro.riskItems[i];
        const origD = ri.dont;
        const origDo = ri.doInstead;
        ri.dont = smartReplace(ri.dont, '분위기', ATMOSPHERE_ALTS, 0, seed + 'ird' + i);
        ri.doInstead = smartReplace(ri.doInstead, '분위기', ATMOSPHERE_ALTS, 0, seed + 'irdi' + i);
        if (ri.dont !== origD || ri.doInstead !== origDo) changed = true;
      }
    }
    // Fix teasers
    if (v.intro.teasers) {
      for (let i = 0; i < v.intro.teasers.length; i++) {
        const orig = v.intro.teasers[i];
        v.intro.teasers[i] = smartReplace(v.intro.teasers[i], '분위기', ATMOSPHERE_ALTS, 0, seed + 'it' + i);
        v.intro.teasers[i] = smartReplace(v.intro.teasers[i], '추천', RECOMMEND_ALTS, 0, seed + 'it' + i + 'r');
        if (v.intro.teasers[i] !== orig) changed = true;
      }
    }
  }

  // Fix sectionIntros
  if (v.sectionIntros) {
    for (const [key, val] of Object.entries(v.sectionIntros)) {
      if (typeof val === 'string') {
        const orig = val;
        v.sectionIntros[key] = smartReplace(val, '분위기', ATMOSPHERE_ALTS, 0, seed + 'si' + key);
        if (v.sectionIntros[key] !== orig) changed = true;
      }
    }
  }

  // 2. Diversify FAQ questions — ALWAYS rewrite to ensure unique patterns
  if (v.faq && v.faq.length > 0) {
    const faqPool = FAQ_STARTERS[v.type] || FAQ_STARTERS.club;
    const shortName = v.name_display;
    const h = hash(seed + 'faq');
    for (let i = 0; i < v.faq.length && i < faqPool.length; i++) {
      const newQ = faqPool[(h + i) % faqPool.length](shortName, v.region);
      v.faq[i].q = newQ;
      changed = true;
    }
    // Also fix FAQ answers
    for (let i = 0; i < v.faq.length; i++) {
      const origA = v.faq[i].a;
      v.faq[i].a = smartReplace(v.faq[i].a, '추천', RECOMMEND_ALTS, 0, seed + 'fqa' + i);
      v.faq[i].a = smartReplace(v.faq[i].a, '분위기', ATMOSPHERE_ALTS, 0, seed + 'fqa' + i + 'a');
      v.faq[i].a = smartReplace(v.faq[i].a, '이곳', PLACE_ALTS, 0, seed + 'fqa' + i + 'p');
      v.faq[i].a = smartReplace(v.faq[i].a, '매장', [v.name_display.split(' ').pop(), '현장', '방문처'], 0, seed + 'fqa' + i + 'm');
      v.faq[i].a = smartReplace(v.faq[i].a, '특별', ['고유', '독자적인', '남다른', '별도의'], 0, seed + 'fqa' + i + 's');
      v.faq[i].a = smartReplace(v.faq[i].a, '다양한', ['여러', '폭넓은', '각기 다른', '갖가지'], 0, seed + 'fqa' + i + 'd');
      if (v.faq[i].a !== origA) changed = true;
    }
  }

  // 3. Make teasers unique
  const teaserPool = TEASER_TEMPLATES[v.type] || TEASER_TEMPLATES.club;
  const newTeaser = pick(teaserPool, seed + 'teaser')(v);
  if (newTeaser.length > 20) {
    v.teaser = newTeaser.slice(0, 150);
    changed = true;
  }

  // 4. Fix timeline descriptions - remove repetitive patterns
  if (v.timeline) {
    for (let i = 0; i < v.timeline.length; i++) {
      const t = v.timeline[i];
      if (t.desc) {
        t.desc = smartReplace(t.desc, '분위기', ATMOSPHERE_ALTS, 0, seed + 'tl' + i);
        t.desc = smartReplace(t.desc, '이곳', PLACE_ALTS, 0, seed + 'tlp' + i);
      }
    }
  }

  // 5. Fix checklist items
  if (v.checklist) {
    for (let i = 0; i < v.checklist.length; i++) {
      v.checklist[i] = smartReplace(v.checklist[i], '이곳', PLACE_ALTS, 0, seed + 'cl' + i);
      v.checklist[i] = smartReplace(v.checklist[i], '매장', [v.name_display.split(' ').pop(), '현장', '방문처'], 0, seed + 'cls' + i);
    }
  }

  if (changed) fixCount++;
}

// Write back
writeFileSync(VENUES_PATH, JSON.stringify(venues, null, 2), 'utf-8');

console.log(`\n═══ Humanize Rewrite Complete ═══`);
console.log(`수정된 venue: ${fixCount}/${venues.length}개`);
console.log(`처리 항목:`);
console.log(`  - "분위기" → 동의어 대체 (무드/색감/톤/에너지/흐름 등)`);
console.log(`  - "추천" → 동의어 대체 (권하/제안하/안내하/살펴보 등)`);
console.log(`  - "이곳/매장" → 구체 표현 대체 (현장/장소/동선/플로어 등)`);
console.log(`  - FAQ 질문 시작 패턴 다양화`);
console.log(`  - 티저 텍스트 venue별 고유 생성`);
console.log(`  - 타임라인/체크리스트 반복어 수정`);
