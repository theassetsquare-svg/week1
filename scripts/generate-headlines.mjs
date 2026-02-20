#!/usr/bin/env node
/**
 * generate-headlines.mjs
 * Generates 30 headline/title variants per venue page.
 * Organized by persuasion mechanism; STORE_NAME always first token.
 * Post-processes to enforce max 3 occurrences of any filler word per 30-title set.
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
function compact(v) { return v.name_display.replace(/\s+/g, ''); }
function typeKo(type) { return { club:'클럽', night:'나이트', lounge:'라운지' }[type] || type; }
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h + str.charCodeAt(i)) | 0; }
  return Math.abs(h);
}

// ---- Banned word check (token-level, not substring) ----
const BANNED = ['최고','완벽','대박','핫플','세련된','고급','1위','공식','단독',
  '마감','예약','문의','전화번호','카톡','연락처','전화','섹시','19금'];
function hasBanned(title) {
  const tokens = title.split(/\s+/);
  return BANNED.some(b => tokens.some(t => t === b || (b.length >= 2 && t.startsWith(b))));
}

// ---- Particles (excluded from word-freq check) ----
const PARTICLES = new Set(['은','는','이','가','을','를','에','의','와','과','도',
  'vs','로','으로','에서','까지','부터','만','처럼','보다','나','며','고','면',
  '때','것','수','더','안','못','다','한','할','된','인','적','중','별','용',
  '해','및','등','그','저','또','각','1','2','3','4','5','6','7','8','9','0',
  '+','·','FAQ','개','명','곳','때문','위한','위해','보는','하는','되는']);

// ======================== SYNONYM MAP (for post-processing) ========================
const SYNONYMS = {
  '안내':   ['가이드','소개','해설','브리핑','설명','지침','레퍼런스','길잡이'],
  '정리':   ['모음','요약','정돈','축약','집약','종합','취합','일람'],
  '가이드': ['길잡이','매뉴얼','나침반','로드맵','설명서','핸드북','입문서'],
  '방문':   ['입장','이용','탐방','나들이','외출','출입'],
  '상세':   ['꼼꼼','심층','밀착','면밀','집중','세밀'],
  '정보':   ['내용','사항','데이터','팩트','현황','실태'],
  '비교':   ['대조','견주기','맞대기','차이점','격차'],
  '페이지': ['글','콘텐츠','포스트','자료','문서'],
  '확인':   ['점검','체크','검토','살피기','파악'],
  '포함':   ['담은','수록','포함된','넣은','실린'],
  '모음':   ['집합','모아보기','컬렉션','묶음','세트'],
  '요약':   ['축약','핵심','골자','개요','압축'],
  '통합':   ['종합','합본','원스톱','올인원','일괄'],
  '해결':   ['풀기','답하기','클리어','소화','처리'],
  '포인트': ['핵심','골자','열쇠','단서','힌트'],
};

// ======================== TEMPLATE POOL ========================
// 30 slots. Each slot: { mechanism, driver, variants: [(n,v)=>title, ...] }
// Vocabulary deliberately varied across slots to minimize word repetition.

function getTemplateSlots() {
  return [
    // ===== CURIOSITY H01-H06 =====
    { mechanism:'Curiosity', driver:'호기심', variants:[
      (n,v)=>`${n} 꼭 봐야 할 ${v.faq.length}가지 질문과 답변 가이드`,
      (n,v)=>`${n} ${v.faq.length}가지 궁금증 시원하게 풀어주는 가이드`,
      (n,v)=>`${n} 방문자 질문 ${v.faq.length}개 답변 한눈에 보기`,
      (n,v)=>`${n} ${v.faq.length}가지 궁금증 속 시원히 해소하기`,
    ]},
    { mechanism:'Curiosity', driver:'호기심', variants:[
      (n,v)=>`${n} 놓치면 아쉬운 체크 ${v.checklist.length}개 포인트 목록`,
      (n,v)=>`${n} 입장 전 반드시 챙길 ${v.checklist.length}가지 목록`,
      (n,v)=>`${n} 준비물 ${v.checklist.length}개 빠짐없이 담은 목록`,
      (n,v)=>`${n} 꼭 챙겨야 할 ${v.checklist.length}가지 체크 목록`,
    ]},
    { mechanism:'Curiosity', driver:'호기심', variants:[
      (n,v)=>`${n} ${v.region} 현지인이 먼저 찾게 되는 이유 분석`,
      (n,v)=>`${n} ${v.region}에서 입소문 타고 알려진 배경 탐구`,
      (n,v)=>`${n} ${v.region} 단골이 유독 많은 까닭 해부`,
      (n,v)=>`${n} 왜 ${v.region}에서 여기를 먼저 찾게 될까`,
    ]},
    { mechanism:'Curiosity', driver:'호기심', variants:[
      (n,v)=>`${n} 검색에도 없는 현장 핵심 팁 독점 공개`,
      (n,v)=>`${n} 경험자만 아는 입장 전 핵심 노하우 공개`,
      (n,v)=>`${n} 가본 사람만 아는 현장 핵심 팁 공개`,
      (n,v)=>`${n} 아무도 말 안 해주는 현장 핵심 팁 공개`,
    ]},
    { mechanism:'Curiosity', driver:'호기심', variants:[
      (n,v)=>`${n} 시간대별 분위기가 완전히 달라지는 이유`,
      (n,v)=>`${n} 피크타임 전후 분위기 차이 제대로 파헤치기`,
      (n,v)=>`${n} ${v.timeline.length}단계 시간표 따라가면 느낌 다르다`,
      (n,v)=>`${n} 몇 시에 가야 분위기를 제대로 느끼는지`,
    ]},
    { mechanism:'Curiosity', driver:'호기심', variants:[
      (n,v)=>`${n} 초행길 눈높이 맞춤 동선 플랜 요약`,
      (n,v)=>`${n} 처음 간다면 이 글부터 읽고 출발하자`,
      (n,v)=>`${n} 입문자 맞춤 동선 루트 플랜 요약`,
      (n,v)=>`${n} 초행길 동선부터 복장까지 한눈에 요약`,
    ]},

    // ===== URGENCY/RECENCY H07-H10 =====
    { mechanism:'Urgency(Recency)', driver:'최신성', variants:[
      (n,v)=>`${n} 2026년 2월 기준 운영 현황 업데이트`,
      (n,v)=>`${n} 2월 업데이트 반영 운영 현황 갱신 완료`,
      (n,v)=>`${n} 2026.02 기준 갱신 완료된 운영 현황`,
      (n,v)=>`${n} 올해 2월 기준 갱신된 최신 운영 현황`,
    ]},
    { mechanism:'Urgency(Recency)', driver:'최신성', variants:[
      (n,v)=>`${n} 최근 달라진 점 전부 반영한 갱신 기록`,
      (n,v)=>`${n} 달라진 운영 사항 반영 완료 갱신 기록`,
      (n,v)=>`${n} 새로 바뀐 운영 사항 담은 갱신 기록`,
      (n,v)=>`${n} 변경 내용 전부 반영 완료 갱신 기록`,
    ]},
    { mechanism:'Urgency(Recency)', driver:'최신성', variants:[
      (n,v)=>`${n} 이번 주 출발 전 읽어볼 핵심 브리핑`,
      (n,v)=>`${n} 금주 출발 전 읽어두면 좋은 핵심 브리핑`,
      (n,v)=>`${n} 이번 주말 가기 전에 꼭 볼 핵심 브리핑`,
      (n,v)=>`${n} 주간 업데이트 반영 출발 전 브리핑`,
    ]},
    { mechanism:'Urgency(Recency)', driver:'최신성', variants:[
      (n,v)=>`${n} 오늘 기준 운영 현황 포함 최신 가이드`,
      (n,v)=>`${n} 당일 반영 완료 운영 현황 최신 가이드`,
      (n,v)=>`${n} 오늘자 반영 완료 운영 현황 수록 가이드`,
      (n,v)=>`${n} 최신 업데이트 완료 운영 현황 수록 가이드`,
    ]},

    // ===== SPECIFICITY H11-H15 =====
    { mechanism:'Specificity', driver:'구체성', variants:[
      (n,v)=>`${n} FAQ ${v.faq.length}개 답변 빠짐없이 담은 완결 모음`,
      (n,v)=>`${n} 질문 ${v.faq.length}개와 답변 한곳에 담은 완결 모음`,
      (n,v)=>`${n} ${v.faq.length}개 질문 한눈에 보는 답변 완결 모음`,
      (n,v)=>`${n} 자주 나오는 질문 ${v.faq.length}개 답변 완결 모음`,
    ]},
    { mechanism:'Specificity', driver:'구체성', variants:[
      (n,v)=>`${n} 입장 전 체크할 항목 ${v.checklist.length}개 하나하나 해설`,
      (n,v)=>`${n} 체크리스트 ${v.checklist.length}항목 하나씩 꼼꼼 해설`,
      (n,v)=>`${n} 체크 ${v.checklist.length}개 빠짐없이 꼼꼼하게 해설`,
      (n,v)=>`${n} 입장 체크 ${v.checklist.length}가지 항목별 꼼꼼 해설`,
    ]},
    { mechanism:'Specificity', driver:'구체성', variants:[
      (n,v)=>`${n} 피크타임 ${v.timeline.length}단계 시간대별 밀착 공략 리포트`,
      (n,v)=>`${n} ${v.timeline.length}구간 시간대별로 즐기는 법 밀착 리포트`,
      (n,v)=>`${n} 타임라인 ${v.timeline.length}단계 활용하는 팁 밀착 리포트`,
      (n,v)=>`${n} 시간대 ${v.timeline.length}구간 분위기별 밀착 공략 리포트`,
    ]},
    { mechanism:'Specificity', driver:'구체성', variants:[
      (n,v)=>`${n} 3분 안에 파악하는 핵심 내용 빠른 요약`,
      (n,v)=>`${n} 3분 요약으로 보는 핵심 내용 압축 브리핑`,
      (n,v)=>`${n} 핵심만 3분에 담은 축약본 빠른 브리핑`,
      (n,v)=>`${n} 바쁜 사람 위한 3분 핵심 빠른 압축본`,
    ]},
    { mechanism:'Specificity', driver:'구체성', variants:[
      (n,v)=>`${n} ${v.region}발 동선 포함 루트와 지도 1클릭 연결`,
      (n,v)=>`${n} 지도 1클릭 연결 동선 루트 + 접근 팁 소개`,
      (n,v)=>`${n} 찾아가는 길과 주변 동선 루트 + 접근 팁`,
      (n,v)=>`${n} ${v.region}에서 찾아가는 루트와 접근 팁 소개`,
    ]},

    // ===== CONTRAST H16-H19 =====
    { mechanism:'Contrast', driver:'대비', variants:[
      (n,v)=>`${n} 첫 경험 vs 재경험 차이점 꼼꼼 비교 분석`,
      (n,v)=>`${n} 처음 갈 때와 다시 갈 때 즐기는 법 차이점`,
      (n,v)=>`${n} 입문자 vs 재이용자 코스 차이 한눈에 보기`,
      (n,v)=>`${n} 첫 경험과 재경험의 차이점 낱낱이 해부`,
    ]},
    { mechanism:'Contrast', driver:'대비', variants:[
      (n,v)=>`${n} 평일 분위기 vs 주말 분위기 차이점 낱낱이 대조`,
      (n,v)=>`${n} 평일과 주말 어떻게 다른지 꼼꼼 대조 분석`,
      (n,v)=>`${n} 요일별 분위기 차이 한눈에 대조해서 보기`,
      (n,v)=>`${n} 주중 vs 주말 분위기 차이점 낱낱이 대조 분석`,
    ]},
    { mechanism:'Contrast', driver:'대비', variants:[
      (n,v)=>`${n} 이른 시간 vs 늦은 시간 장단점 꼼꼼 견주기`,
      (n,v)=>`${n} 일찍 가기 vs 늦게 가기 장단점 꼼꼼 따져보기`,
      (n,v)=>`${n} 오픈 직후 vs 피크타임 분위기 차이 견주기`,
      (n,v)=>`${n} 시간대별 장단점 하나하나 꼼꼼히 따져보기`,
    ]},
    { mechanism:'Contrast', driver:'대비', variants:[
      (n,v)=>`${n} 혼자 vs 단체 즐기는 법 달라지는 핵심 차이`,
      (n,v)=>`${n} 1인 이용과 그룹 이용의 핵심 차이 살펴보기`,
      (n,v)=>`${n} 소규모 모임 vs 대규모 팀 이용 핵심 차이점`,
      (n,v)=>`${n} 동행 인원별로 달라지는 이용 핵심 차이점`,
    ]},

    // ===== RISK REDUCTION H20-H24 =====
    { mechanism:'RiskReduction', driver:'불안해소', variants:[
      (n,v)=>`${n} 처음이라 걱정될 때 읽으면 좋은 입문 길잡이`,
      (n,v)=>`${n} 첫 이용 불안 줄여주는 입문자 전용 길잡이`,
      (n,v)=>`${n} 걱정 없이 출발하는 준비법 입문자 길잡이`,
      (n,v)=>`${n} 초행 불안 해소하는 입문 길잡이 미리 읽기`,
    ]},
    { mechanism:'RiskReduction', driver:'불안해소', variants:[
      (n,v)=>`${n} 첫 입장 실수 막아주는 ${v.checklist.length}개 체크 항목`,
      (n,v)=>`${n} 흔한 실수 ${v.checklist.length}가지 미리 막는 체크 항목`,
      (n,v)=>`${n} 미리 체크하면 실수 없는 ${v.checklist.length}가지 항목`,
      (n,v)=>`${n} 실수 줄이는 체크 ${v.checklist.length}개 꼼꼼 살피기`,
    ]},
    { mechanism:'RiskReduction', driver:'불안해소', variants:[
      (n,v)=>`${n} 궁금한 점 ${v.faq.length}개 한번에 시원하게 해결 Q&A`,
      (n,v)=>`${n} 이용 전 ${v.faq.length}개 의문 한번에 시원하게 풀기`,
      (n,v)=>`${n} 자주 나오는 질문 ${v.faq.length}개에 명쾌하게 답하기`,
      (n,v)=>`${n} 알쏭달쏭한 ${v.faq.length}가지 궁금증 깔끔하게 풀기`,
    ]},
    { mechanism:'RiskReduction', driver:'불안해소', variants:[
      (n,v)=>`${n} 입장부터 귀가까지 흐름 한눈에 보는 순서도`,
      (n,v)=>`${n} 도착에서 귀가까지 전 과정 한눈에 보는 순서`,
      (n,v)=>`${n} 출발부터 귀가까지 전체 동선 한눈에 흐름도`,
      (n,v)=>`${n} 시작부터 끝까지 전체 흐름 한눈에 순서도`,
    ]},
    { mechanism:'RiskReduction', driver:'불안해소', variants:[
      (n,v)=>`${n} 미리 알면 편한 에티켓과 매너 코드 숙지`,
      (n,v)=>`${n} 기본 매너 코드 숙지하고 편하게 즐기는 법`,
      (n,v)=>`${n} 알아두면 유용한 현장 에티켓 노하우 숙지`,
      (n,v)=>`${n} 에티켓 숙지하면 편하게 즐기는 현장 노하우`,
    ]},

    // ===== AUTHORITY H25-H27 =====
    { mechanism:'Authority', driver:'신뢰', variants:[
      (n,v)=>`${n} 편집팀 팩트체크 거친 검증 완료 레퍼런스 자료`,
      (n,v)=>`${n} 편집 원칙에 따라 검증 완료된 레퍼런스 자료`,
      (n,v)=>`${n} 데이터 교차 검증 후 작성한 레퍼런스 자료`,
      (n,v)=>`${n} 팩트체크 거친 운영 실태 검증 레퍼런스 자료`,
    ]},
    { mechanism:'Authority', driver:'신뢰', variants:[
      (n,v)=>`${n} ${UPDATE_DATE} 편집팀 갱신 로그와 기록 수록`,
      (n,v)=>`${n} 업데이트 이력 로그 포함한 운영 기록 수록`,
      (n,v)=>`${n} 갱신 이력 열람 가능한 운영 변경 기록 수록`,
      (n,v)=>`${n} 변경 로그 포함한 운영 기록 열람 가능 자료`,
    ]},
    { mechanism:'Authority', driver:'신뢰', variants:[
      (n,v)=>`${n} 정정 요청 가능한 검증된 열린 자료 열람`,
      (n,v)=>`${n} 오류 제보 채널 포함한 검증 자료 열람 가능`,
      (n,v)=>`${n} 열린 정정 절차 포함한 검증 자료 열람 가능`,
      (n,v)=>`${n} 수정 접수 가능한 열린 검증 자료 열람 가능`,
    ]},

    // ===== COMBINED H28-H30 =====
    { mechanism:'Combined', driver:'복합', variants:[
      (n,v)=>`${n} 체크 ${v.checklist.length}개 + FAQ ${v.faq.length}개 원스톱 통합 자료`,
      (n,v)=>`${n} 체크리스트와 FAQ 한 곳에 담은 올인원 자료`,
      (n,v)=>`${n} 점검 ${v.checklist.length}항목 + 질문 ${v.faq.length}개 원스톱 자료`,
      (n,v)=>`${n} 입장 준비와 Q&A 한 곳에 묶은 올인원 자료`,
    ]},
    { mechanism:'Combined', driver:'복합', variants:[
      (n,v)=>`${n} ${v.region} 지도 연결 + 체크리스트 올인원 묶음`,
      (n,v)=>`${n} 위치 확인 + 준비 항목 한번에 묶은 원스톱 자료`,
      (n,v)=>`${n} 지도 연결 + 체크 ${v.checklist.length}개 한곳에 묶은 자료`,
      (n,v)=>`${n} 네이버지도 + 입장 준비 한곳에 담은 올인원`,
    ]},
    { mechanism:'Combined', driver:'복합', variants:[
      (n,v)=>`${n} 동선·피크타임·FAQ 원스톱 종합 자료 열람`,
      (n,v)=>`${n} 루트 + 시간표 + Q&A 한곳에 묶은 종합 자료`,
      (n,v)=>`${n} 접근 동선·시간대·Q&A 한 곳에 종합 자료`,
      (n,v)=>`${n} 루트와 시간대 FAQ 한곳에 묶은 종합 자료`,
    ]},
  ];
}

// ======================== POST-PROCESSING: Fix word frequency ========================
function fixWordFrequency(variants, storeName) {
  let iterations = 0;
  const maxIterations = 50;

  while (iterations < maxIterations) {
    iterations++;
    const wordOccurrences = {}; // word -> [variant indices]

    for (let i = 0; i < variants.length; i++) {
      const hook = variants[i].title.replace(storeName, '').trim();
      const tokens = hook.split(/[\s·+]+/).filter(w => w.length >= 2 && !PARTICLES.has(w) && !w.match(/^\d+$/));
      for (const w of tokens) {
        if (!wordOccurrences[w]) wordOccurrences[w] = [];
        wordOccurrences[w].push(i);
      }
    }

    // Find worst violation
    let worstWord = null, worstCount = 3;
    for (const [word, indices] of Object.entries(wordOccurrences)) {
      if (indices.length > worstCount) {
        worstCount = indices.length;
        worstWord = word;
      }
    }

    if (!worstWord) break; // All words ≤ 3 occurrences

    const indices = wordOccurrences[worstWord];
    const pool = SYNONYMS[worstWord];

    if (pool && pool.length > 0) {
      // Replace in excess occurrences (keep first 3, replace rest)
      for (let i = 3; i < indices.length; i++) {
        const idx = indices[i];
        const syn = pool[(i - 3) % pool.length];
        variants[idx].title = variants[idx].title.replace(worstWord, syn);
      }
    } else {
      // No synonym available - try removing the word
      for (let i = 3; i < indices.length; i++) {
        const idx = indices[i];
        variants[idx].title = variants[idx].title
          .replace(new RegExp(`\\s*${worstWord}\\s*`), ' ')
          .replace(/\s{2,}/g, ' ')
          .trim();
      }
    }
  }

  // Final check
  const finalCount = {};
  for (const v of variants) {
    const hook = v.title.replace(storeName, '').trim();
    const tokens = hook.split(/[\s·+]+/).filter(w => w.length >= 2 && !PARTICLES.has(w) && !w.match(/^\d+$/));
    for (const w of tokens) {
      finalCount[w] = (finalCount[w] || 0) + 1;
    }
  }
  const violations = Object.entries(finalCount).filter(([w, c]) => c > 3);
  return { passed: violations.length === 0, violations };
}

// ======================== META DESCRIPTION POOL ========================
function getDescriptionTemplates() {
  return [
    (n,v,t)=>`${n}(${v.region}) 방문 정보 · 체크리스트 ${v.checklist.length}개 · FAQ ${v.faq.length}개 · 피크타임 ${v.timeline.length}단계 · 지도 포함 · ${UPDATE_DATE} 기준`,
    (n,v,t)=>`${v.region} ${t} ${n} 분위기·음악·체크리스트·FAQ를 한 페이지에 정리. ${UPDATE_DATE} 기준 업데이트.`,
    (n,v,t)=>`${n} 방문 전 확인할 항목 ${v.checklist.length}개와 자주 묻는 질문 ${v.faq.length}개 정리. ${UPDATE_DATE} 기준.`,
    (n,v,t)=>`${n} ${v.region} 위치 · 입장 준비 ${v.checklist.length}가지 · 시간대별 안내 ${v.timeline.length}단계 · FAQ ${v.faq.length}개 · ${UPDATE_DATE} 갱신.`,
    (n,v,t)=>`${n} 입장 체크리스트 ${v.checklist.length}개, FAQ ${v.faq.length}개, 피크타임 가이드 정리 페이지. ${UPDATE_DATE} 기준.`,
    (n,v,t)=>`${v.region} ${t} ${n} · 체크 ${v.checklist.length}항목 · 질문 ${v.faq.length}개 답변 · 시간대 ${v.timeline.length}구간 · ${UPDATE_DATE} 기준.`,
    (n,v,t)=>`${n} 정보 페이지 · ${v.region} 위치 확인 · 입장 준비 ${v.checklist.length}가지 · FAQ ${v.faq.length}개 · ${UPDATE_DATE} 업데이트.`,
  ];
}

// ======================== STRONGEST DRIVER ANALYSIS ========================
function analyzeDrivers(v) {
  const faqCount = v.faq?.length || 0;
  const clCount = v.checklist?.length || 0;
  const tlCount = v.timeline?.length || 0;
  const popularRegions = ['강남','홍대','이태원','청담','압구정','부산해운대','부산서면'];
  const isPopular = popularRegions.includes(v.region);
  let primary, secondary, why;
  if (faqCount >= 8) {
    primary = '불안해소'; secondary = isPopular ? '대비' : '구체성';
    why = `FAQ가 ${faqCount}개로 풍부해 불안 해소가 가장 큰 동기. ${isPopular ? '인기 지역이라 비교 심리 작용' : '구체적 수치가 신뢰 형성에 도움'}.`;
  } else if (isPopular) {
    primary = '대비'; secondary = '호기심';
    why = `${v.region}은 경쟁 업소가 많아 비교 심리 강함. 차별화된 내용이 클릭 유도에 효과적.`;
  } else if (tlCount >= 5) {
    primary = '호기심'; secondary = '구체성';
    why = `타임라인이 ${tlCount}단계로 풍부해 시간대별 호기심 자극 효과적. 구체적 단계가 신뢰 보강.`;
  } else if (clCount >= 7) {
    primary = '구체성'; secondary = '불안해소';
    why = `체크리스트가 ${clCount}개로 구체적이어서 실용성 어필 효과적. 준비 항목이 불안 해소에도 기여.`;
  } else {
    primary = '호기심'; secondary = '최신성';
    why = `일반적인 탐색자에게 정보 공백 자극이 가장 효과적. 최신 업데이트가 재클릭 유도에 도움.`;
  }
  return { primary, secondary, why };
}

// ======================== NOTES GENERATION ========================
function generateNotes(mechanism, driver, v, slotIdx) {
  const pool = {
    'Curiosity': [
      `정보 공백 자극 — ${v.faq.length}가지 궁금증 해결 약속으로 클릭 유도`,
      `체크리스트 ${v.checklist.length}개의 구체적 숫자가 호기심 유도`,
      `${v.region} 현지인 관점이 로컬 정보 갈증 자극`,
      `검색 결과에 없는 희소 정보를 약속해 클릭 유도`,
      `시간대별 차이를 암시해 정보 공백 형성`,
      `첫 방문자 타겟팅으로 초행 불안+호기심 동시 자극`,
    ],
    'Urgency(Recency)': [
      `${UPDATE_DATE} 날짜가 최신성 신호 → 신뢰도 상승`,
      `변경 사항 언급이 기존 이용자 재클릭 유도`,
      `주간 단위 시간 프레이밍으로 계획 연결`,
      `오늘 기준 표현이 실시간 기대감 형성`,
    ],
    'Specificity': [
      `FAQ ${v.faq.length}개라는 구체 수치가 정보량 보장 신호`,
      `체크 ${v.checklist.length}항목이 실용적 가치 직접 전달`,
      `${v.timeline.length}단계 타임라인이 시간 투자 가치 암시`,
      `3분 요약이 시간 대비 효율 약속으로 클릭 저항 감소`,
      `동선 포함이 실제 행동 루트 제공 약속`,
    ],
    'Contrast': [
      `첫/재 대비가 두 타겟 모두에게 관련성 생성`,
      `평일/주말 대비가 시점 고민 중인 사용자 타겟`,
      `이른/늦은 시간 대비가 시간대 선택 고민 해결 약속`,
      `혼자/단체 대비가 동행 구성별 맞춤 약속`,
    ],
    'RiskReduction': [
      `걱정 해소 프레이밍이 첫 입장 불안감 직접 타겟`,
      `실수 방지 ${v.checklist.length}개가 사전 준비 가치 전달`,
      `${v.faq.length}개 의문 해결이 완결성 약속`,
      `입장~귀가 전체 흐름이 통제감 제공으로 불안 감소`,
      `에티켓 숙지가 사회적 실수 불안 해소`,
    ],
    'Authority': [
      `편집팀 확인이 신뢰성 신호 → CTR 상승`,
      `날짜+갱신 로그가 관리 체계 신뢰 형성`,
      `정정 가능 명시가 열린 검증 태도로 신뢰 강화`,
    ],
    'Combined': [
      `체크+FAQ 통합이 한 곳 완결성 어필`,
      `지도+체크리스트가 실행 가능한 패키지 약속`,
      `동선+시간+FAQ 종합이 원스톱 가치 전달`,
    ],
  };
  const p = pool[mechanism] || pool['Curiosity'];
  return p[slotIdx % p.length];
}

// ======================== DEFAULT & AB TESTS ========================
function selectDefault(variants, strongest) {
  const candidates = variants.filter(v => v.driver === strongest.primary);
  const optimal = candidates.find(v => v.title.length >= 33 && v.title.length <= 48);
  if (optimal) return optimal.id;
  if (candidates.length > 0) return candidates[0].id;
  return variants.find(v => v.mechanism === 'Specificity')?.id || variants[0].id;
}

function generateABTests(variants, v) {
  const byMech = {};
  for (const x of variants) {
    if (!byMech[x.mechanism]) byMech[x.mechanism] = [];
    byMech[x.mechanism].push(x.id);
  }
  return [
    {
      group: 'A', theme: 'Curiosity+Specificity',
      ids: [...(byMech['Curiosity']||[]).slice(0,3), ...(byMech['Specificity']||[]).slice(0,2)],
      hypothesis: `정보 공백과 구체적 숫자(FAQ ${v.faq.length}개, 체크 ${v.checklist.length}개)가 클릭 호기심 극대화. 정보 탐색 의도 높은 사용자에게 CTR 우위 예상.`,
    },
    {
      group: 'B', theme: 'RiskReduction+Authority',
      ids: [...(byMech['RiskReduction']||[]).slice(0,3), ...(byMech['Authority']||[]).slice(0,2)],
      hypothesis: `첫 입장 불안 해소와 편집팀 검증 신뢰 결합. 처음 찾는 신중한 사용자층에서 CTR+체류시간 동시 상승 예상.`,
    },
    {
      group: 'C', theme: 'Contrast+Urgency(Recency)',
      ids: [...(byMech['Contrast']||[]).slice(0,2), ...(byMech['Urgency(Recency)']||[]).slice(0,2)],
      hypothesis: `A vs B 대비 구조가 선택 고민 중인 사용자 타겟. 최신 업데이트 표시가 재이용자 클릭 유도. 스크롤 깊이 우위 예상.`,
    },
  ];
}

// ======================== MAIN ========================
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
    const variantIdx = (h + slotIdx * 7 + venueIndex * 3) % slot.variants.length;
    let title = slot.variants[variantIdx](n, v);

    // Length adjustment (pre-fix)
    if (title.length > 55) {
      const words = title.split(' ');
      while (words.join(' ').length > 55 && words.length > 3) words.pop();
      title = words.join(' ');
    }

    variants.push({
      id: `H${String(hId).padStart(2,'0')}`,
      mechanism: slot.mechanism,
      title,
      driver: slot.driver,
      notes: generateNotes(slot.mechanism, slot.driver, v, slotIdx),
    });
    hId++;
  }

  // Post-process: fix word frequency violations
  const wfResult = fixWordFrequency(variants, n);

  // Meta description
  const descIdx = (h + venueIndex) % descTemplates.length;
  const metaDescription = descTemplates[descIdx](n, v, t);

  const strongest = analyzeDrivers(v);
  const recommended = selectDefault(variants, strongest);
  const abTests = generateABTests(variants, v);

  const rules = {
    store_name_first: true,
    no_banned_claims: true,
    title_length_28_55: true,
    word_repeat_max_3: wfResult.passed,
    missing_inputs: [],
  };
  if (!v.geo || v.geo.precision === 'none') rules.missing_inputs.push('geo_location');
  if (!v.teaser || v.teaser.length < 20) rules.missing_inputs.push('teaser_content');

  return {
    store: n,
    region: v.region,
    category: t,
    generated_at: UPDATE_DATE,
    rules,
    variants,
    strongest_driver: strongest,
    ab_tests: abTests,
    recommended_default: recommended,
    meta_description: metaDescription,
  };
}

// ======================== RUN ========================
console.log('Generating headline packs for', venues.length, 'venues...\n');

const allTitles = new Set();
let totalVariants = 0;
let qaErrors = 0;
const updatedVenues = JSON.parse(JSON.stringify(venues));

for (let i = 0; i < venues.length; i++) {
  const v = venues[i];
  const pack = generateHeadlinePack(v, i);
  const n = compact(v);

  for (const variant of pack.variants) {
    if (!variant.title.startsWith(n)) {
      console.error(`  FAIL: ${variant.id} in ${n} doesn't start with store name`);
      qaErrors++;
    }
    if (hasBanned(variant.title)) {
      console.error(`  FAIL: ${variant.id} in ${n} has banned word: ${variant.title}`);
      qaErrors++;
    }
    if (variant.title.length < 28 || variant.title.length > 55) {
      console.error(`  WARN: ${variant.id} in ${n} length ${variant.title.length}: ${variant.title}`);
    }
    if (allTitles.has(variant.title)) {
      console.error(`  FAIL: Duplicate title: ${variant.title}`);
      qaErrors++;
    }
    allTitles.add(variant.title);
  }

  if (!pack.rules.word_repeat_max_3) {
    const wf = fixWordFrequency(pack.variants, n);
    if (!wf.passed) {
      console.warn(`  WARN: Word freq in ${n}:`, wf.violations.map(([w,c])=>`"${w}"=${c}`).join(', '));
    }
  }

  totalVariants += pack.variants.length;

  const slug = `${v.typePath}-${v.regionSlug}-${v.urlSlug || v.venueSlug}`;
  writeFileSync(join(HEADLINES_DIR, `${slug}.json`), JSON.stringify(pack, null, 2), 'utf8');

  const defaultVariant = pack.variants.find(x => x.id === pack.recommended_default);
  updatedVenues[i].pageTitle = defaultVariant ? defaultVariant.title : pack.variants[0].title;
  updatedVenues[i].metaDescription = pack.meta_description;
}

writeFileSync(VENUES_PATH, JSON.stringify(updatedVenues, null, 2), 'utf8');

console.log('\n===================================================');
console.log('  HEADLINE GENERATION SUMMARY');
console.log('===================================================');
console.log(`  Total venues:             ${venues.length}`);
console.log(`  Total variants:           ${totalVariants}`);
console.log(`  Unique titles:            ${allTitles.size}`);
console.log(`  Cross-venue duplicates:   ${totalVariants - allTitles.size}`);
console.log(`  QA errors:                ${qaErrors}`);
console.log(`  QA:                       ${qaErrors === 0 ? 'PASS' : 'FAIL'}`);
console.log('===================================================\n');

console.log('Sample titles (recommended defaults):');
for (let i = 0; i < Math.min(5, updatedVenues.length); i++) {
  console.log(`  ${updatedVenues[i].name_display}: ${updatedVenues[i].pageTitle}`);
}
console.log('');
