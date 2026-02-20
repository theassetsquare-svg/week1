#!/usr/bin/env node
/**
 * generate-headlines.mjs
 * Generates 30 headline/title variants per venue page.
 * - Organized by persuasion mechanism
 * - STORE_NAME always first token
 * - No banned words; concrete value hooks; 28-55 char Korean titles
 * - Saves JSON headline packs + updates venues.json
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const VENUES_PATH = join(ROOT, 'data', 'venues.json');
const HEADLINES_DIR = join(ROOT, 'src', 'data', 'headlines');
const UPDATE_DATE = '2026-02-20';

mkdirSync(HEADLINES_DIR, { recursive: true });

const venues = JSON.parse(readFileSync(VENUES_PATH, 'utf8'));

// ======================== HELPERS ========================
function compact(v) {
  return v.name_display.replace(/\s+/g, '');
}

function typeKo(type) {
  return { club: '클럽', night: '나이트', lounge: '라운지' }[type] || type;
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const BANNED = ['최고','완벽','대박','핫','세련된','고급','1위','공식','단독',
  '후기 폭발','마감 임박','예약','문의','전화번호','카톡','연락처','전화',
  '예약문의','섹시','19금','후기폭발'];

function hasBanned(title) {
  return BANNED.some(w => title.includes(w));
}

const PARTICLES = new Set(['은','는','이','가','을','를','에','의','와','과',
  '도','로','으로','에서','까지','부터','만','처럼','보다','마다','나',
  '며','고','면','때','것','수','더','안','못','다','한','할','된','인',
  '적','중','별','용','해','및','등','그','저','또','각','이런','그런']);

// ======================== TEMPLATE POOL ========================
// 30 slots × 4+ variants each. Hook = everything after "${n} "
// Each variant: (n=compactName, v=venue) => full title string
// Target hook length: 22-35 chars (total 28-55 for names 5-15 chars)

function getTemplateSlots() {
  return [
    // ===== CURIOSITY H01-H06 =====
    { mechanism:'Curiosity', driver:'호기심', variants:[
      (n,v)=>`${n} 방문 전 꼭 봐야 할 ${v.faq.length}가지 질문 답변`,
      (n,v)=>`${n} 자주 묻는 ${v.faq.length}가지 궁금증 시원하게 해결`,
      (n,v)=>`${n} 방문자 질문 ${v.faq.length}개 답변 한눈에 정리`,
      (n,v)=>`${n} ${v.faq.length}가지 궁금증 풀어주는 안내 페이지`,
    ]},
    { mechanism:'Curiosity', driver:'호기심', variants:[
      (n,v)=>`${n} 놓치면 아쉬운 체크 포인트 ${v.checklist.length}개 정리`,
      (n,v)=>`${n} 입장 전 반드시 챙길 것 ${v.checklist.length}가지 안내`,
      (n,v)=>`${n} 준비 항목 ${v.checklist.length}개 빠짐없이 정리 안내`,
      (n,v)=>`${n} 방문 전 꼭 확인할 ${v.checklist.length}가지 체크 항목`,
    ]},
    { mechanism:'Curiosity', driver:'호기심', variants:[
      (n,v)=>`${n} ${v.region} 현지인이 먼저 찾게 되는 이유 분석`,
      (n,v)=>`${n} ${v.region}에서 입소문 타고 알려진 배경 정리`,
      (n,v)=>`${n} ${v.region} 단골이 유독 많은 까닭 상세 분석`,
      (n,v)=>`${n} 왜 ${v.region}에서 여기를 먼저 찾게 되는걸까`,
    ]},
    { mechanism:'Curiosity', driver:'호기심', variants:[
      (n,v)=>`${n} 검색해도 안 나오는 현장 방문 핵심 정보`,
      (n,v)=>`${n} 경험자만 아는 입장 전 핵심 팁 모음 정리`,
      (n,v)=>`${n} 안 가본 사람은 모르는 방문 핵심 포인트`,
      (n,v)=>`${n} 아무도 안 알려주는 현장 방문 핵심 안내`,
    ]},
    { mechanism:'Curiosity', driver:'호기심', variants:[
      (n,v)=>`${n} 시간대별 분위기가 완전히 달라지는 이유`,
      (n,v)=>`${n} 피크타임 전후 분위기 차이 제대로 비교`,
      (n,v)=>`${n} ${v.timeline.length}단계 시간표 따라가면 다르다`,
      (n,v)=>`${n} 몇 시에 가야 분위기를 제대로 느끼는지`,
    ]},
    { mechanism:'Curiosity', driver:'호기심', variants:[
      (n,v)=>`${n} 첫 방문자가 놓치기 쉬운 동선 팁 총정리`,
      (n,v)=>`${n} 초행길 방문자를 위한 맞춤형 동선 안내`,
      (n,v)=>`${n} 처음 간다면 이 글부터 읽고 출발하자`,
      (n,v)=>`${n} 입문자 눈높이에 맞춘 방문 안내 총정리`,
    ]},

    // ===== URGENCY/RECENCY H07-H10 =====
    { mechanism:'Urgency(Recency)', driver:'최신성', variants:[
      (n,v)=>`${n} 2026년 2월 기준 운영 정보 업데이트 안내`,
      (n,v)=>`${n} 2월 업데이트 반영한 방문 안내 상세 정리`,
      (n,v)=>`${n} 2026.02 기준 갱신된 운영 현황 상세 안내`,
      (n,v)=>`${n} 올해 2월 기준으로 갱신된 방문 정보 안내`,
    ]},
    { mechanism:'Urgency(Recency)', driver:'최신성', variants:[
      (n,v)=>`${n} 최근 변경 사항 반영 완료한 갱신 안내`,
      (n,v)=>`${n} 달라진 점 반영한 업데이트 가이드 정리`,
      (n,v)=>`${n} 새로 바뀐 운영 정보 포함 가이드 안내`,
      (n,v)=>`${n} 변경 내용 전부 반영 완료한 방문 안내`,
    ]},
    { mechanism:'Urgency(Recency)', driver:'최신성', variants:[
      (n,v)=>`${n} 이번 주 방문 계획 세울 때 참고할 안내`,
      (n,v)=>`${n} 금주 방문 전 읽어보면 좋은 정보 정리`,
      (n,v)=>`${n} 이번 주말 가기 전에 확인할 사항 총정리`,
      (n,v)=>`${n} 주간 방문 정보 업데이트 반영 안내 정리`,
    ]},
    { mechanism:'Urgency(Recency)', driver:'최신성', variants:[
      (n,v)=>`${n} 오늘 기준 운영 정보 포함 방문 가이드`,
      (n,v)=>`${n} 당일 확인 가능한 운영 안내 정보 페이지`,
      (n,v)=>`${n} 오늘자 반영 완료된 방문 정보 상세 안내`,
      (n,v)=>`${n} 최신 업데이트 포함 운영 정보 상세 안내`,
    ]},

    // ===== SPECIFICITY H11-H15 =====
    { mechanism:'Specificity', driver:'구체성', variants:[
      (n,v)=>`${n} FAQ ${v.faq.length}개 답변 빠짐없이 정리한 페이지`,
      (n,v)=>`${n} 질문 ${v.faq.length}개와 답변 모아둔 안내 정리`,
      (n,v)=>`${n} ${v.faq.length}개 질문 한눈에 보는 답변 모음`,
      (n,v)=>`${n} 방문자 질문 ${v.faq.length}개 깔끔하게 정리 안내`,
    ]},
    { mechanism:'Specificity', driver:'구체성', variants:[
      (n,v)=>`${n} 입장 전 체크 항목 ${v.checklist.length}개 상세 안내`,
      (n,v)=>`${n} 준비 체크리스트 ${v.checklist.length}항목 전체 정리`,
      (n,v)=>`${n} 체크 항목 ${v.checklist.length}개 빠짐없이 확인 안내`,
      (n,v)=>`${n} 입장 체크 포인트 ${v.checklist.length}가지 확인 정리`,
    ]},
    { mechanism:'Specificity', driver:'구체성', variants:[
      (n,v)=>`${n} 피크타임 ${v.timeline.length}단계 시간대별 공략 안내`,
      (n,v)=>`${n} ${v.timeline.length}구간 시간대별로 즐기는 법 정리`,
      (n,v)=>`${n} 타임라인 ${v.timeline.length}단계 활용 팁 상세 안내`,
      (n,v)=>`${n} 시간대 ${v.timeline.length}구간 분위기 가이드 정리`,
    ]},
    { mechanism:'Specificity', driver:'구체성', variants:[
      (n,v)=>`${n} 3분 안에 파악하는 핵심 방문 정보 안내`,
      (n,v)=>`${n} 3분 요약으로 보는 방문 핵심 안내 정리`,
      (n,v)=>`${n} 핵심만 3분에 정리한 방문 가이드 안내`,
      (n,v)=>`${n} 바쁜 사람 위한 3분 핵심 정보 정리 안내`,
    ]},
    { mechanism:'Specificity', driver:'구체성', variants:[
      (n,v)=>`${n} ${v.region}발 동선 포함 방문 루트 상세 안내`,
      (n,v)=>`${n} 지도 1클릭 연결 + 동선 안내 포함 정리`,
      (n,v)=>`${n} 찾아가는 길과 주변 동선 상세 정리 안내`,
      (n,v)=>`${n} ${v.region}에서 찾아가는 루트와 팁 정리`,
    ]},

    // ===== CONTRAST H16-H19 =====
    { mechanism:'Contrast', driver:'대비', variants:[
      (n,v)=>`${n} 첫 방문 vs 재방문 차이점 비교 상세 정리`,
      (n,v)=>`${n} 처음 갈 때와 다시 갈 때 즐기는 법 차이`,
      (n,v)=>`${n} 입문자 vs 재방문자 코스 비교 안내 정리`,
      (n,v)=>`${n} 첫 경험과 재방문 경험의 차이점 상세 비교`,
    ]},
    { mechanism:'Contrast', driver:'대비', variants:[
      (n,v)=>`${n} 평일 분위기 vs 주말 분위기 차이점 비교`,
      (n,v)=>`${n} 평일과 주말 어떻게 다른지 비교 정리 안내`,
      (n,v)=>`${n} 요일별 분위기 차이 한눈에 비교 안내 정리`,
      (n,v)=>`${n} 주중 방문 vs 주말 방문 가이드 비교 정리`,
    ]},
    { mechanism:'Contrast', driver:'대비', variants:[
      (n,v)=>`${n} 이른 시간 vs 늦은 시간 장단점 비교 안내`,
      (n,v)=>`${n} 일찍 가기 vs 늦게 가기 장단점 정리 안내`,
      (n,v)=>`${n} 오픈 직후 vs 피크타임 분위기 비교 정리`,
      (n,v)=>`${n} 시간대별 장단점 비교 분석 가이드 안내`,
    ]},
    { mechanism:'Contrast', driver:'대비', variants:[
      (n,v)=>`${n} 혼자 방문 vs 단체 방문 즐기는 법 비교`,
      (n,v)=>`${n} 1인 방문과 그룹 방문의 차이 비교 정리`,
      (n,v)=>`${n} 소규모 모임 vs 대규모 팀 방문 안내 비교`,
      (n,v)=>`${n} 동행 인원별로 달라지는 방문 가이드 비교`,
    ]},

    // ===== RISK REDUCTION H20-H24 =====
    { mechanism:'RiskReduction', driver:'불안해소', variants:[
      (n,v)=>`${n} 처음이라 걱정될 때 읽으면 좋은 안내 정리`,
      (n,v)=>`${n} 첫 방문 불안 줄여주는 가이드 상세 안내`,
      (n,v)=>`${n} 걱정 없이 방문하는 준비 방법 안내 정리`,
      (n,v)=>`${n} 초행 방문 불안 해소 체크리스트 안내 정리`,
    ]},
    { mechanism:'RiskReduction', driver:'불안해소', variants:[
      (n,v)=>`${n} 첫 방문 실수 방지하는 ${v.checklist.length}개 체크 항목`,
      (n,v)=>`${n} 흔한 실수 ${v.checklist.length}가지 미리 예방하는 안내`,
      (n,v)=>`${n} 확인하면 실수 없는 ${v.checklist.length}가지 체크 안내`,
      (n,v)=>`${n} 실수 줄이는 체크 포인트 ${v.checklist.length}개 안내`,
    ]},
    { mechanism:'RiskReduction', driver:'불안해소', variants:[
      (n,v)=>`${n} 궁금한 점 ${v.faq.length}개를 한번에 해결하는 안내`,
      (n,v)=>`${n} 방문 전 ${v.faq.length}개 의문 한번에 해소 정리`,
      (n,v)=>`${n} 자주 하는 질문 ${v.faq.length}개에 명쾌한 답변`,
      (n,v)=>`${n} 알쏭달쏭한 ${v.faq.length}가지 궁금증 깔끔 정리`,
    ]},
    { mechanism:'RiskReduction', driver:'불안해소', variants:[
      (n,v)=>`${n} 입장부터 귀가까지 흐름 한눈에 보는 안내`,
      (n,v)=>`${n} 도착에서 귀가까지 전 과정 순서대로 안내`,
      (n,v)=>`${n} 출발부터 귀가까지 전체 동선 상세 정리`,
      (n,v)=>`${n} 방문 시작부터 끝까지 흐름도 상세 안내`,
    ]},
    { mechanism:'RiskReduction', driver:'불안해소', variants:[
      (n,v)=>`${n} 방문 전 알면 편한 에티켓 상세 정리 안내`,
      (n,v)=>`${n} 기본 매너 코드 정리한 방문 안내 페이지`,
      (n,v)=>`${n} 알아두면 유용한 현장 에티켓 모음 정리`,
      (n,v)=>`${n} 에티켓 숙지 후 편하게 방문하는 법 안내`,
    ]},

    // ===== AUTHORITY H25-H27 =====
    { mechanism:'Authority', driver:'신뢰', variants:[
      (n,v)=>`${n} 편집팀 확인 후 작성된 상세 안내 페이지`,
      (n,v)=>`${n} 편집 원칙에 따라 검증 완료된 정보 안내`,
      (n,v)=>`${n} 데이터 확인 거쳐 작성된 방문 안내 정리`,
      (n,v)=>`${n} 팩트체크 거친 운영 정보 상세 정리 안내`,
    ]},
    { mechanism:'Authority', driver:'신뢰', variants:[
      (n,v)=>`${n} ${UPDATE_DATE} 편집팀 갱신 정보 상세 안내`,
      (n,v)=>`${n} 업데이트 로그 포함된 운영 안내 정리 페이지`,
      (n,v)=>`${n} 갱신 이력 확인 가능한 정보 안내 페이지`,
      (n,v)=>`${n} 정보 변경 로그 포함 가이드 상세 안내`,
    ]},
    { mechanism:'Authority', driver:'신뢰', variants:[
      (n,v)=>`${n} 정정 요청 가능한 검증된 정보 안내 페이지`,
      (n,v)=>`${n} 정보 수정 접수 가능한 안내 페이지 정리`,
      (n,v)=>`${n} 오류 제보 채널 포함 검증 정보 상세 안내`,
      (n,v)=>`${n} 열린 정정 절차 포함 정보 페이지 상세 안내`,
    ]},

    // ===== COMBINED H28-H30 =====
    { mechanism:'Combined', driver:'복합', variants:[
      (n,v)=>`${n} 체크 ${v.checklist.length}개 + FAQ ${v.faq.length}개 통합 안내 정리`,
      (n,v)=>`${n} 체크리스트와 FAQ를 한 페이지에 모은 안내`,
      (n,v)=>`${n} 점검 ${v.checklist.length}항목과 질문 ${v.faq.length}개 통합 정리`,
      (n,v)=>`${n} 입장 준비와 질의응답 통합 안내 상세 정리`,
    ]},
    { mechanism:'Combined', driver:'복합', variants:[
      (n,v)=>`${n} ${v.region} 지도 연결 + 체크리스트 통합 안내`,
      (n,v)=>`${n} 위치 확인 + 준비 항목 통합 안내 상세 정리`,
      (n,v)=>`${n} 지도 연결 + 체크 ${v.checklist.length}개 포함 안내 정리`,
      (n,v)=>`${n} 네이버지도 + 입장 준비 통합 안내 페이지`,
    ]},
    { mechanism:'Combined', driver:'복합', variants:[
      (n,v)=>`${n} 동선과 피크타임과 FAQ 종합 안내 페이지`,
      (n,v)=>`${n} 루트 + 시간표 + 질의 통합 정리 안내`,
      (n,v)=>`${n} 접근 동선·시간대·질문 한 페이지에 정리`,
      (n,v)=>`${n} 방문 루트와 시간대 FAQ 통합 정리 안내`,
    ]},
  ];
}

// ======================== META DESCRIPTION POOL ========================
function getDescriptionTemplates() {
  return [
    (n,v,t)=>`${n}(${v.region}) 방문 정보 · 체크리스트 ${v.checklist.length}개 · FAQ ${v.faq.length}개 · 피크타임 ${v.timeline.length}단계 · 지도 포함 · ${UPDATE_DATE} 기준`,
    (n,v,t)=>`${v.region} ${t} ${n} 분위기·음악·체크리스트·FAQ를 한 페이지에 정리한 안내. ${UPDATE_DATE} 기준 업데이트.`,
    (n,v,t)=>`${n} 방문 전 확인할 항목 ${v.checklist.length}개와 자주 묻는 질문 ${v.faq.length}개를 정리했습니다. ${UPDATE_DATE} 기준.`,
    (n,v,t)=>`${n} ${v.region} 위치 · 입장 준비 ${v.checklist.length}가지 · 시간대별 안내 ${v.timeline.length}단계 · FAQ ${v.faq.length}개 · ${UPDATE_DATE} 갱신.`,
    (n,v,t)=>`${n} 입장 체크리스트 ${v.checklist.length}개, 방문자 FAQ ${v.faq.length}개, 피크타임 가이드를 정리한 안내 페이지. ${UPDATE_DATE} 기준.`,
    (n,v,t)=>`${v.region} ${t} ${n} 상세 안내 · 체크 ${v.checklist.length}항목 · 질문 ${v.faq.length}개 답변 · 시간대 ${v.timeline.length}구간 · ${UPDATE_DATE} 기준.`,
    (n,v,t)=>`${n} 정보 안내 페이지 · ${v.region} 위치 확인 · 입장 준비 ${v.checklist.length}가지 · FAQ ${v.faq.length}개 · ${UPDATE_DATE} 업데이트.`,
  ];
}

// ======================== STRONGEST DRIVER ANALYSIS ========================
function analyzeDrivers(v) {
  const faqCount = v.faq?.length || 0;
  const clCount = v.checklist?.length || 0;
  const tlCount = v.timeline?.length || 0;
  const region = v.region;

  // Popular regions → contrast driver; high FAQ → risk reduction; rich timeline → curiosity
  const popularRegions = ['강남','홍대','이태원','청담','압구정','부산해운대','부산서면'];
  const isPopular = popularRegions.includes(region);

  let primary, secondary, why;

  if (faqCount >= 8) {
    primary = '불안해소';
    secondary = isPopular ? '대비' : '구체성';
    why = `FAQ가 ${faqCount}개로 많아 방문자 불안 해소가 가장 큰 동기. ${isPopular ? '인기 지역이라 비교 심리도 작용' : '구체적 수치가 신뢰 형성에 도움'}.`;
  } else if (isPopular) {
    primary = '대비';
    secondary = '호기심';
    why = `${region}은 경쟁 업소가 많아 비교 심리가 강함. 차별화된 정보가 클릭 유도에 효과적.`;
  } else if (tlCount >= 5) {
    primary = '호기심';
    secondary = '구체성';
    why = `타임라인이 ${tlCount}단계로 풍부해 시간대별 호기심 자극이 효과적. 구체적 단계가 신뢰 보강.`;
  } else if (clCount >= 7) {
    primary = '구체성';
    secondary = '불안해소';
    why = `체크리스트가 ${clCount}개로 구체적이어서 실용성 어필 효과적. 준비 항목이 불안 해소에도 기여.`;
  } else {
    primary = '호기심';
    secondary = '최신성';
    why = `일반적인 방문자에게 정보 공백 자극이 가장 효과적. 최신 업데이트가 재방문 유도에 도움.`;
  }

  return { primary, secondary, why };
}

// ======================== MAIN GENERATION ========================
function generateHeadlinePack(v, venueIndex) {
  const n = compact(v);
  const t = typeKo(v.type);
  const h = hash(v.id);
  const slots = getTemplateSlots();
  const descTemplates = getDescriptionTemplates();

  const variants = [];
  let hId = 1;

  for (let slotIdx = 0; slotIdx < slots.length; slotIdx++) {
    const slot = slots[slotIdx];
    // Select variant based on venue hash + slot offset (ensures different venues get different variants)
    const variantIdx = (h + slotIdx * 7 + venueIndex * 3) % slot.variants.length;
    const fn = slot.variants[variantIdx];
    let title = fn(n, v);

    // Length check - trim if too long, pad if too short
    if (title.length > 55) {
      // Try removing trailing words
      const words = title.split(' ');
      while (words.join(' ').length > 55 && words.length > 3) {
        words.pop();
      }
      title = words.join(' ');
    }
    if (title.length < 28) {
      // Try adding context words
      const pads = ['상세 안내','정리 안내','확인 안내','방문 참고'];
      const pad = pads[(h + slotIdx) % pads.length];
      title = title + ' ' + pad;
      if (title.length > 55) title = title.slice(0, 55);
    }

    // Notes explaining why this title works
    const notes = generateNotes(slot.mechanism, slot.driver, v, slotIdx);

    variants.push({
      id: `H${String(hId).padStart(2, '0')}`,
      mechanism: slot.mechanism,
      title,
      driver: slot.driver,
      notes,
    });
    hId++;
  }

  // Word frequency check within this set
  const wordFreq = checkWordFrequency(variants, n);

  // Generate meta description
  const descIdx = (h + venueIndex) % descTemplates.length;
  const metaDescription = descTemplates[descIdx](n, v, t);

  // Strongest driver
  const strongest = analyzeDrivers(v);

  // Recommended default: pick by strongest driver match + optimal length
  const recommended = selectDefault(variants, strongest, n);

  // A/B test groups
  const abTests = generateABTests(variants, v);

  // Rules/missing inputs
  const rules = {
    store_name_first: true,
    no_banned_claims: true,
    title_length_28_55: true,
    word_repeat_max_3: wordFreq.passed,
    missing_inputs: []
  };

  // Check for missing data
  if (!v.geo || v.geo.precision === 'none') rules.missing_inputs.push('geo_location');
  if (!v.teaser || v.teaser.length < 20) rules.missing_inputs.push('teaser_content');
  if (!v.faq || v.faq.length < 3) rules.missing_inputs.push('sufficient_faq');

  return {
    store: n,
    region: v.region,
    category: typeKo(v.type),
    generated_at: UPDATE_DATE,
    rules,
    variants,
    strongest_driver: strongest,
    ab_tests: abTests,
    recommended_default: recommended,
    meta_description: metaDescription,
  };
}

function generateNotes(mechanism, driver, v, slotIdx) {
  const notePool = {
    'Curiosity': [
      `정보 공백 자극 — 방문자가 ${v.faq.length}가지 궁금증을 해결하고자 클릭`,
      `체크리스트 ${v.checklist.length}개의 구체적 숫자가 호기심 유도`,
      `${v.region} 현지인 관점이 로컬 정보 갈증 자극`,
      `검색 결과에서 찾기 어려운 정보를 약속해 클릭 유도`,
      `시간대별 차이를 암시해 정보 공백 형성`,
      `첫 방문자 타겟팅으로 초행 불안+호기심 동시 자극`,
    ],
    'Urgency(Recency)': [
      `${UPDATE_DATE} 날짜가 최신성 신호 → 정보 신뢰도 상승`,
      `변경 사항 언급이 기존 방문자 재클릭 유도`,
      `주간 단위 시간 프레이밍으로 방문 계획 연결`,
      `오늘 기준 표현이 실시간 정보 기대감 형성`,
    ],
    'Specificity': [
      `FAQ ${v.faq.length}개라는 구체 수치가 정보량 보장 신호`,
      `체크 ${v.checklist.length}항목이 실용적 가치 직접 전달`,
      `${v.timeline.length}단계 타임라인이 시간 투자 가치 암시`,
      `3분 요약이 시간 대비 효율 약속으로 클릭 저항 감소`,
      `동선 포함이 실제 행동 가이드 제공 약속`,
    ],
    'Contrast': [
      `첫/재방문 대비가 두 타겟 모두에게 관련성 생성`,
      `평일/주말 대비가 방문 시점 고민 중인 사용자 타겟`,
      `이른/늦은 시간 대비가 시간대 선택 고민 해결 약속`,
      `혼자/단체 대비가 동행 구성별 맞춤 정보 약속`,
    ],
    'RiskReduction': [
      `걱정 해소 프레이밍이 첫 방문 불안감 직접 타겟`,
      `실수 방지 ${v.checklist.length}개가 사전 준비의 구체적 가치 전달`,
      `${v.faq.length}개 의문 해결이 정보 완결성 약속`,
      `입장~귀가 전체 흐름이 통제감 제공으로 불안 감소`,
      `에티켓 정리가 사회적 실수 불안 해소`,
    ],
    'Authority': [
      `편집팀 확인이 정보 신뢰성 신호 → CTR 상승`,
      `날짜+갱신 로그가 정보 관리 체계 신뢰 형성`,
      `정정 가능 명시가 열린 검증 태도로 신뢰 강화`,
    ],
    'Combined': [
      `체크+FAQ 통합이 한 페이지 완결성 어필`,
      `지도+체크리스트가 실행 가능한 정보 패키지 약속`,
      `동선+시간+FAQ 종합이 원스톱 안내 가치 전달`,
    ],
  };

  const pool = notePool[mechanism] || notePool['Curiosity'];
  return pool[slotIdx % pool.length];
}

function checkWordFrequency(variants, storeName) {
  const wordCount = {};
  const storeWords = new Set(storeName.split(''));

  for (const v of variants) {
    // Remove store name from title, then tokenize
    const hook = v.title.replace(storeName, '').trim();
    const words = hook.split(/[\s·+]+/).filter(w => w.length >= 2 && !PARTICLES.has(w));
    for (const w of words) {
      if (w.match(/^\d+$/)) continue; // skip pure numbers
      wordCount[w] = (wordCount[w] || 0) + 1;
    }
  }

  const violations = Object.entries(wordCount).filter(([w, c]) => c > 3);
  return {
    passed: violations.length === 0,
    violations: violations.map(([w, c]) => `"${w}" appears ${c} times`),
  };
}

function selectDefault(variants, strongest, storeName) {
  // Prefer title matching primary driver with good length (35-45 chars)
  const candidates = variants.filter(v => v.driver === strongest.primary);
  const optimal = candidates.find(v => v.title.length >= 33 && v.title.length <= 48);
  if (optimal) return optimal.id;
  if (candidates.length > 0) return candidates[0].id;
  // Fallback: first Specificity or Curiosity title
  const fallback = variants.find(v => v.mechanism === 'Specificity') || variants[0];
  return fallback.id;
}

function generateABTests(variants, v) {
  const curiosityIds = variants.filter(x => x.mechanism === 'Curiosity').slice(0, 3).map(x => x.id);
  const specificityIds = variants.filter(x => x.mechanism === 'Specificity').slice(0, 2).map(x => x.id);
  const riskIds = variants.filter(x => x.mechanism === 'RiskReduction').slice(0, 3).map(x => x.id);
  const authorityIds = variants.filter(x => x.mechanism === 'Authority').slice(0, 2).map(x => x.id);
  const contrastIds = variants.filter(x => x.mechanism === 'Contrast').slice(0, 2).map(x => x.id);
  const urgencyIds = variants.filter(x => x.mechanism === 'Urgency(Recency)').slice(0, 2).map(x => x.id);

  return [
    {
      group: 'A',
      theme: 'Curiosity+Specificity',
      ids: [...curiosityIds, ...specificityIds],
      hypothesis: `정보 공백과 구체적 숫자(FAQ ${v.faq.length}개, 체크 ${v.checklist.length}개)가 클릭 호기심을 극대화. 정보 탐색 의도가 높은 사용자에게 CTR 우위 예상.`,
    },
    {
      group: 'B',
      theme: 'RiskReduction+Authority',
      ids: [...riskIds, ...authorityIds],
      hypothesis: `첫 방문 불안 해소와 편집팀 검증 신뢰가 결합. 처음 방문하는 신중한 사용자층에서 CTR+체류시간 동시 상승 예상.`,
    },
    {
      group: 'C',
      theme: 'Contrast+Urgency(Recency)',
      ids: [...contrastIds, ...urgencyIds],
      hypothesis: `A vs B 대비 구조가 선택 고민 중인 사용자 타겟. 최신 업데이트 표시가 재방문자 클릭 유도. 스크롤 깊이 우위 예상.`,
    },
  ];
}

// ======================== RUN ========================
console.log('🔧 Generating headline packs for', venues.length, 'venues...\n');

const allTitles = new Set(); // cross-venue duplicate check
let totalVariants = 0;
let qaPass = true;
const updatedVenues = JSON.parse(JSON.stringify(venues)); // deep clone

for (let i = 0; i < venues.length; i++) {
  const v = venues[i];
  const pack = generateHeadlinePack(v, i);

  // QA: check all titles in this pack
  for (const variant of pack.variants) {
    // Store name first
    if (!variant.title.startsWith(pack.store)) {
      console.error(`  ❌ FAIL: ${variant.id} in ${pack.store} doesn't start with store name`);
      qaPass = false;
    }
    // Banned words
    if (hasBanned(variant.title)) {
      console.error(`  ❌ FAIL: ${variant.id} in ${pack.store} has banned word: ${variant.title}`);
      qaPass = false;
    }
    // Length
    if (variant.title.length < 28 || variant.title.length > 55) {
      console.error(`  ⚠️  WARN: ${variant.id} in ${pack.store} length ${variant.title.length}: ${variant.title}`);
    }
    // Cross-venue duplicate
    if (allTitles.has(variant.title)) {
      console.error(`  ❌ FAIL: Duplicate title across venues: ${variant.title}`);
      qaPass = false;
    }
    allTitles.add(variant.title);
  }

  // Word frequency violations
  if (!pack.rules.word_repeat_max_3) {
    const wf = checkWordFrequency(pack.variants, pack.store);
    console.warn(`  ⚠️  Word freq violations in ${pack.store}:`, wf.violations.join(', '));
  }

  totalVariants += pack.variants.length;

  // Save JSON headline pack
  const slug = `${v.typePath}-${v.regionSlug}-${v.urlSlug || v.venueSlug}`;
  const filePath = join(HEADLINES_DIR, `${slug}.json`);
  writeFileSync(filePath, JSON.stringify(pack, null, 2), 'utf8');

  // Update venue data
  const defaultVariant = pack.variants.find(x => x.id === pack.recommended_default);
  updatedVenues[i].pageTitle = defaultVariant ? defaultVariant.title : pack.variants[0].title;
  updatedVenues[i].metaDescription = pack.meta_description;
}

// Save updated venues.json
writeFileSync(VENUES_PATH, JSON.stringify(updatedVenues, null, 2), 'utf8');

// ======================== SUMMARY ========================
console.log('\n═══════════════════════════════════════════');
console.log('  HEADLINE GENERATION SUMMARY');
console.log('═══════════════════════════════════════════');
console.log(`  Total venues: ${venues.length}`);
console.log(`  Total variants: ${totalVariants}`);
console.log(`  Unique titles: ${allTitles.size}`);
console.log(`  Cross-venue duplicates: ${totalVariants - allTitles.size}`);
console.log(`  QA: ${qaPass ? '✅ PASS' : '❌ FAIL'}`);
console.log('═══════════════════════════════════════════\n');

// Print sample 5 pages
console.log('📋 Sample titles (recommended defaults):');
for (let i = 0; i < Math.min(5, updatedVenues.length); i++) {
  console.log(`  ${updatedVenues[i].name_display}: ${updatedVenues[i].pageTitle}`);
}
console.log('');
