#!/usr/bin/env node
/**
 * generate-intro-sections.mjs
 * Generates 6-component intro sections for all venue detail pages.
 * Components: Hook, Value Promise, Scan Box, Checklist, Risk Reduction, Teasers
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const VENUES_PATH = join(ROOT, 'data', 'venues.json');

const venues = JSON.parse(readFileSync(VENUES_PATH, 'utf-8'));

/* ── Hash for deterministic selection ── */
function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
function pick(arr, seed) { return arr[hash(seed) % arr.length]; }
function pickN(arr, n, seed) {
  const shuffled = [...arr];
  let h = hash(seed);
  for (let i = shuffled.length - 1; i > 0; i--) {
    h = ((h << 5) - h + i) | 0;
    const j = Math.abs(h) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, n);
}

/* ── Hook templates by type ── */
const hookTemplates = {
  club: [
    v => `${v.region}에서 클럽을 찾고 있다면, 입장료와 시간만 낭비하는 실수는 피해야 합니다. ${v.name_display} 분위기를 미리 파악하지 않으면 기대와 다른 밤을 보내기 쉽습니다. 이 가이드에서 방문 전 반드시 알아야 할 정보를 정리했습니다.`,
    v => `${v.name_display}에 처음 간다면 입구에서부터 긴장되기 마련입니다. 드레스코드, 입장 절차, 내부 동선까지 사전에 알고 가면 여유가 생깁니다. ${v.region} 클럽 방문을 준비하는 분들을 위한 실전 가이드입니다.`,
    v => `금요일 밤, ${v.region}에서 어디로 갈지 고민 중이라면 ${v.name_display} 정보를 먼저 확인하세요. 피크타임을 놓치면 빈 플로어에서 시간만 보내고, 너무 늦게 가면 입장 대기가 깁니다. 타이밍과 준비물을 미리 정리했습니다.`,
    v => `${v.name_display} 방문을 결심했지만 구체적으로 뭘 준비해야 할지 막막할 수 있습니다. 교통편, 복장 기준, 최적 도착 시간까지 ${v.region} 현지 정보를 기반으로 정리했습니다. 읽는 데 1분이면 충분합니다.`,
  ],
  night: [
    v => `${v.region} 나이트에 처음이라면 분위기가 낯설 수 있습니다. ${v.name_display}는 어떤 분위기인지, 혼자 가도 괜찮은지, 입장 전 무엇을 준비해야 하는지 이 가이드에서 모두 정리했습니다.`,
    v => `${v.name_display} 방문을 앞두고 복장이나 에티켓이 걱정된다면 제대로 찾아왔습니다. 나이트는 클럽과 분위기가 다르고, ${v.region} 지역 특유의 문화가 있습니다. 처음 방문자가 자주 실수하는 부분을 미리 정리했습니다.`,
    v => `${v.region}에서 나이트를 찾고 있지만 어디가 나에게 맞는지 모르겠다면, ${v.name_display}부터 확인해 보세요. 분위기, 음악 스타일, 시간대별 특징을 한곳에 정리했습니다.`,
    v => `주말 밤 ${v.region}에서 ${v.name_display}를 방문할 계획이라면, 가기 전에 알아두면 좋은 정보가 있습니다. 피크타임, 복장 기준, 안전 수칙까지 한 페이지에 담았습니다.`,
  ],
  lounge: [
    v => `${v.region}에서 분위기 좋은 라운지를 찾는다면 ${v.name_display}를 먼저 살펴보세요. 라운지마다 컨셉이 달라서, 모르고 가면 기대와 다를 수 있습니다. 공간 분위기, 메뉴 특성, 예약 정보를 미리 정리했습니다.`,
    v => `데이트나 소규모 모임 장소로 ${v.name_display}를 고려 중이라면, 방문 전 이 가이드를 확인하세요. ${v.region} 라운지 중에서도 분위기와 가격대가 천차만별이라 사전 정보 파악이 중요합니다.`,
    v => `${v.name_display}에 처음 방문한다면 예약 여부, 드레스코드, 최적 시간대를 먼저 파악하는 것이 좋습니다. ${v.region} 라운지 방문 경험을 한 단계 올려줄 실전 정보를 담았습니다.`,
    v => `${v.region} 라운지 중 ${v.name_display}가 궁금하다면, 분위기부터 가격대까지 방문 전 필수 정보를 정리했습니다. 시간대별 분위기 변화와 추천 좌석까지 안내합니다.`,
  ],
};

/* ── Value Promise templates ── */
const vpTemplates = [
  v => `1분만 읽으면 ${v.name_display} 방문에 필요한 체크리스트 ${v.checklist.length}개, 시간대별 분위기 ${v.timeline.length}단계, 자주 묻는 질문 ${v.faq.length}개를 한번에 파악할 수 있습니다.`,
  v => `이 페이지에서 ${v.name_display}의 피크타임 ${v.timeline.length}단계, 준비물 ${v.checklist.length}개, FAQ ${v.faq.length}개를 1분 안에 확인할 수 있습니다.`,
  v => `${v.name_display} 방문 전 확인할 체크항목 ${v.checklist.length}개와 시간대별 가이드 ${v.timeline.length}단계를 1분이면 파악할 수 있습니다.`,
];

/* ── Scan Box generator ── */
function genScanBox(v) {
  const addr = v.geo.formatted_address !== '확인 필요' ? v.geo.formatted_address : `${v.region} 소재`;
  const lines = [
    `유형: ${v.region} ${v.typeLabel}`,
    `위치: ${addr}`,
    `분위기: ${v.bodySections.atmosphere.split('.')[0]}`,
    `사운드: ${v.bodySections.music.split('.')[0]}`,
  ];
  if (v.timeline[0]) lines.push(`피크타임: ${v.timeline[0].time} — ${v.timeline[0].label}`);
  lines.push(`준비 체크: ${v.checklist.length}개 항목`);
  lines.push(`FAQ: ${v.faq.length}개 답변 수록`);
  if (v.timeline.length > 1) lines.push(`타임라인: ${v.timeline.length}단계 흐름 안내`);
  if (v.bodySections.safety) lines.push(`안전/매너: 에티켓 가이드 포함`);
  return lines.slice(0, 10);
}

/* ── Checklist generator ── */
const mandatoryByType = {
  club: [
    '신분증(주민등록증/운전면허증) 반드시 지참',
    '드레스코드: 올블랙 무난, 슬리퍼/반바지/운동복 입장 불가',
    '게스트 사전 등록 여부 확인 — 할인 적용되는 경우 많음',
  ],
  night: [
    '신분증 필수 — 모바일 신분증은 매장마다 다름',
    '드레스코드: 깔끔한 캐주얼 이상, 정장까지는 불필요',
    '파트너 댄스 기본 에티켓 사전 숙지',
  ],
  lounge: [
    '예약 여부 사전 확인 — 주말은 예약 필수인 곳이 많음',
    '드레스코드: 스마트 캐주얼 이상 권장',
    '최소 주문 금액 또는 테이블 차지 여부 확인',
  ],
};

function genChecklist(v) {
  const items = [...(mandatoryByType[v.type] || mandatoryByType.club)];
  // transport
  const addr = v.geo.formatted_address !== '확인 필요' ? v.geo.formatted_address : null;
  if (addr) {
    items.push(`교통: ${addr} 기준 가장 가까운 지하철/버스 확인`);
  } else {
    items.push(`교통: 네이버 지도에서 ${v.name_display} 경로 사전 확인`);
  }
  // timing
  if (v.timeline[0]) {
    items.push(`도착 시간: ${v.timeline[0].time} 기준 — 너무 이르면 한산, 너무 늦으면 대기`);
  }
  // from existing checklist (add unique ones)
  for (const c of v.checklist) {
    if (items.length >= 8) break;
    if (!items.some(i => i.includes(c.slice(0, 10)))) {
      items.push(c);
    }
  }
  return items.slice(0, 8);
}

/* ── Risk Reduction pools ── */
const riskPools = {
  club: [
    { dont: '피크타임(새벽 1~2시)에 맞춰 도착하려 하지 마세요', doInstead: '21~23시 사이 도착이 대기 없이 입장하기 좋습니다' },
    { dont: '신분증 없이 출발하지 마세요', doInstead: '주민등록증/운전면허증을 반드시 지참 — 모바일은 거부될 수 있습니다' },
    { dont: '처음부터 보틀을 주문하지 마세요', doInstead: '먼저 잔 단위로 주문해 분위기를 파악한 뒤 결정하세요' },
    { dont: '혼자라고 위축되지 마세요', doInstead: '바 카운터에 자리잡고 음악을 즐기면 자연스럽게 분위기에 녹아듭니다' },
    { dont: '운동화/슬리퍼로 가지 마세요', doInstead: '깔끔한 구두나 부츠가 입장 거부를 방지합니다' },
  ],
  night: [
    { dont: '나이트 분위기를 클럽과 같다고 생각하지 마세요', doInstead: '나이트는 파트너 댄스 중심 — 기본 스텝을 미리 알아두면 좋습니다' },
    { dont: '너무 늦은 시간에 도착하지 마세요', doInstead: '나이트는 22~23시가 분위기가 무르익는 시간입니다' },
    { dont: '사진 촬영을 무분별하게 하지 마세요', doInstead: '주변 동의 없는 촬영은 에티켓 위반 — 스태프에게 먼저 확인하세요' },
    { dont: '신분증 없이 방문하지 마세요', doInstead: '모든 나이트에서 신분증 확인은 기본입니다' },
    { dont: '첫 방문에 과음하지 마세요', doInstead: '적당히 마시면서 분위기를 파악하는 것이 재방문으로 이어집니다' },
  ],
  lounge: [
    { dont: '예약 없이 주말에 방문하지 마세요', doInstead: '금·토는 예약 필수인 곳이 많으니 최소 하루 전에 확인하세요' },
    { dont: '편한 복장으로 가지 마세요', doInstead: '라운지는 스마트 캐주얼 이상 — 청바지보다 슬랙스가 무난합니다' },
    { dont: '메뉴 확인 없이 주문하지 마세요', doInstead: '라운지마다 시그니처 칵테일이 다르니 먼저 메뉴판을 확인하세요' },
    { dont: '시끄럽게 대화하지 마세요', doInstead: '라운지는 대화 중심 공간 — 적절한 볼륨이 매너입니다' },
    { dont: '테이블 차지를 모르고 가지 마세요', doInstead: '일부 라운지는 최소 주문이나 테이블 요금이 있으니 사전 확인하세요' },
  ],
};

/* ── Teaser generator ── */
function genTeasers(v) {
  const items = [];
  if (v.timeline.length > 0) items.push(`아래에서 ${v.name_display} 시간대별 분위기 변화 ${v.timeline.length}단계 바로 확인`);
  if (v.checklist.length > 0) items.push(`아래에서 입장 전 체크리스트 ${v.checklist.length}개 바로 확인`);
  if (v.faq.length > 0) items.push(`아래에서 자주 묻는 질문 ${v.faq.length}개 바로 확인`);
  items.push(`아래에서 ${v.name_display} 찾아가는 길 바로 확인`);
  return items.slice(0, 4);
}

/* ── Main generation loop ── */
let passCount = 0;
let failCount = 0;
const failures = [];

for (const v of venues) {
  const seed = v.id + v.name_display;

  // 1. Hook
  const hookPool = hookTemplates[v.type] || hookTemplates.club;
  const hook = pick(hookPool, seed + 'hook')(v);

  // 2. Value Promise
  const valuePromise = pick(vpTemplates, seed + 'vp')(v);

  // 3. Scan Box
  const scanBox = genScanBox(v);

  // 4. Checklist
  const checklist = genChecklist(v);

  // 5. Risk Items
  const pool = riskPools[v.type] || riskPools.club;
  const riskItems = pickN(pool, 3, seed + 'risk');

  // 6. Teasers
  const teasers = genTeasers(v);

  // Assemble
  const intro = { hook, valuePromise, scanBox, checklist, riskItems, teasers };

  // Char count verification
  const allText = [hook, valuePromise, ...scanBox, ...checklist, ...riskItems.map(r => r.dont + r.doInstead), ...teasers].join('');
  const koreanChars = allText.replace(/[^가-힣]/g, '').length;
  const totalChars = allText.replace(/\s/g, '').length;

  // Value element count
  const valueElements = scanBox.length + checklist.length + riskItems.length + teasers.length + 2; // +2 for hook and vp

  if (totalChars < 300) {
    failures.push({ id: v.id, name: v.name_display, reason: `글자 수 부족: ${totalChars}자 (최소 300)` });
    failCount++;
  } else if (valueElements < 8) {
    failures.push({ id: v.id, name: v.name_display, reason: `가치 요소 부족: ${valueElements}개 (최소 8)` });
    failCount++;
  } else {
    passCount++;
  }

  v.intro = intro;
}

// Write back
writeFileSync(VENUES_PATH, JSON.stringify(venues, null, 2), 'utf-8');

// Report
console.log('\n═══ Intro Section Generation Report ═══');
console.log(`전체 venue: ${venues.length}개`);
console.log(`통과: ${passCount}개`);
console.log(`실패: ${failCount}개`);
if (failures.length > 0) {
  console.log('\n실패 목록:');
  for (const f of failures) {
    console.log(`  - ${f.name}: ${f.reason}`);
  }
}

// Sample 5
console.log('\n── 샘플 5개 인트로 요약 ──');
const samples = venues.slice(0, 5);
for (const s of samples) {
  const allText = [s.intro.hook, s.intro.valuePromise, ...s.intro.scanBox, ...s.intro.checklist, ...s.intro.riskItems.map(r=>r.dont+r.doInstead), ...s.intro.teasers].join('');
  const charCount = allText.replace(/\s/g, '').length;
  const elemCount = s.intro.scanBox.length + s.intro.checklist.length + s.intro.riskItems.length + s.intro.teasers.length + 2;
  console.log(`\n[${s.name_display}]`);
  console.log(`  Hook: ${s.intro.hook.slice(0, 50)}...`);
  console.log(`  ScanBox: ${s.intro.scanBox.length}줄 | Checklist: ${s.intro.checklist.length}개 | Risk: ${s.intro.riskItems.length}개 | Teasers: ${s.intro.teasers.length}개`);
  console.log(`  글자 수: ${charCount}자 | 가치 요소: ${elemCount}개 | 예상 읽기: ${Math.ceil(charCount / 350 * 60)}초`);
}

console.log('\n═══ 완료 ═══');
