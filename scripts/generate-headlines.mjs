#!/usr/bin/env node
/**
 * generate-headlines.mjs v2
 * Generates 30 headline/title variants per venue page.
 * Uses name_display (with spaces) as STORE_NAME prefix.
 * Also generates h1Title, sectionIntros, conclusionText for store name density (10-12 mentions).
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
function typeKo(type) { return { club: '클럽', night: '나이트', lounge: '라운지' }[type] || type; }
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h + str.charCodeAt(i)) | 0; }
  return Math.abs(h);
}

const BANNED = ['최고', '완벽', '대박', '핫플', '세련된', '고급', '1위', '공식', '단독',
  '마감', '예약', '문의', '전화번호', '카톡', '연락처', '전화', '섹시', '19금'];
function hasBanned(title) {
  return BANNED.some(b => title.includes(b));
}

const PARTICLES = new Set(['은', '는', '이', '가', '을', '를', '에', '의', '와', '과', '도',
  'vs', '로', '으로', '에서', '까지', '부터', '만', '처럼', '보다', '나', '며', '고', '면',
  '때', '것', '수', '더', '안', '못', '다', '한', '할', '된', '인', '적', '중', '별', '용',
  '해', '및', '등', '그', '저', '또', '각', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
  '+', '·', 'FAQ', '개', '명', '곳', '때문', '위한', '위해', '보는', '하는', '되는']);

const SYNONYMS = {
  '안내': ['가이드', '소개', '해설', '브리핑', '설명', '지침'],
  '정리': ['모음', '요약', '정돈', '축약', '종합', '취합'],
  '가이드': ['길잡이', '매뉴얼', '나침반', '로드맵', '핸드북'],
  '방문': ['입장', '이용', '탐방'],
  '정보': ['내용', '사항', '데이터', '팩트', '현황'],
  '확인': ['점검', '체크', '검토', '살피기', '파악'],
  '포함': ['담은', '수록', '넣은', '실린'],
  '요약': ['축약', '핵심', '골자', '개요', '압축'],
  '해결': ['풀기', '답하기', '클리어', '처리'],
  '길잡이': ['매뉴얼', '핸드북', '입문서', '나침반'],
  '모음': ['묶음', '세트', '컬렉션'],
  '자료': ['레퍼런스', '문서', '콘텐츠'],
  '열람': ['보기', '조회', '읽기'],
  '꼼꼼': ['면밀', '세밀', '빈틈없이', '철저'],
  '낱낱이': ['하나하나', '빠짐없이', '속속들이'],
  '비교': ['대조', '견주기', '맞대기'],
  '체크': ['점검', '확인', '살피기', '검토'],
  '공개': ['소개', '안내', '제시', '공유'],
  '숙지': ['파악', '이해', '습득'],
};

// ======================== 30 HEADLINE SLOT TEMPLATES ========================
// Each slot has 4-5 variant functions. hash-based selection ensures uniqueness per venue.
function getTemplateSlots() {
  return [
    // ===== CURIOSITY H01-H06 =====
    { mechanism: 'Curiosity', driver: '호기심', variants: [
      (n, v) => `${n} 처음 갈 때 놓치기 쉬운 ${v.checklist.length}가지`,
      (n, v) => `${n} 첫 방문 때 놓치는 ${v.checklist.length}가지 포인트`,
      (n, v) => `${n} 방문 전 모르면 아쉬운 ${v.checklist.length}가지`,
      (n, v) => `${n} 꼭 알아야 할 ${v.checklist.length}가지 포인트 정리`,
    ]},
    { mechanism: 'Curiosity', driver: '호기심', variants: [
      (n, v) => `${n} 단골과 초방의 동선이 다른 이유 분석`,
      (n, v) => `${n} 경험자와 초보의 차이, 동선부터 다르다`,
      (n, v) => `${n} 재방문자가 다르게 움직이는 이유 분석`,
      (n, v) => `${n} 단골이 초방과 다르게 즐기는 법 분석`,
    ]},
    { mechanism: 'Curiosity', driver: '호기심', variants: [
      (n, v) => `${n} ${v.region}에서 이곳을 먼저 찾게 되는 이유`,
      (n, v) => `${n} ${v.region} 현지에서 입소문 타는 배경 탐구`,
      (n, v) => `${n} 왜 ${v.region}에서 여기를 먼저 찾을까`,
      (n, v) => `${n} ${v.region}에서 이곳이 눈에 띄는 이유`,
    ]},
    { mechanism: 'Curiosity', driver: '호기심', variants: [
      (n, v) => `${n} FAQ ${v.faq.length}개에서 드러난 의외의 답변`,
      (n, v) => `${n} 질문 ${v.faq.length}개 속 의외의 사실 발견`,
      (n, v) => `${n} ${v.faq.length}개 질문에 숨겨진 핵심 정보`,
      (n, v) => `${n} FAQ ${v.faq.length}개에서 찾은 뜻밖의 팁`,
    ]},
    { mechanism: 'Curiosity', driver: '호기심', variants: [
      (n, v) => `${n} 시간대별 분위기가 확 달라지는 이유`,
      (n, v) => `${n} 피크타임 전후로 분위기가 바뀌는 이유`,
      (n, v) => `${n} 몇 시에 가야 분위기를 제대로 느끼는지`,
      (n, v) => `${n} 시간대 ${v.timeline.length}구간별 분위기 차이`,
    ]},
    { mechanism: 'Curiosity', driver: '호기심', variants: [
      (n, v) => `${n} 처음 간다면 이 글부터 읽고 출발하기`,
      (n, v) => `${n} 초행길이라면 먼저 읽어볼 동선 플랜`,
      (n, v) => `${n} 입문자 맞춤 동선 루트와 복장 요약`,
      (n, v) => `${n} 초행 동선부터 복장까지 한눈에 정리`,
    ]},

    // ===== RECENCY H07-H10 =====
    { mechanism: 'Recency', driver: '시의성', variants: [
      (n, v) => `${n} 2026년 2월 기준 운영 현황 업데이트`,
      (n, v) => `${n} 2월 갱신 완료 운영 현황 최신 정리`,
      (n, v) => `${n} 2026.02 기준 갱신된 운영 현황 정리`,
      (n, v) => `${n} 올해 2월 기준 운영 현황 갱신 완료`,
    ]},
    { mechanism: 'Recency', driver: '시의성', variants: [
      (n, v) => `${n} 최근 달라진 점 전부 반영한 갱신 기록`,
      (n, v) => `${n} 새로 바뀐 운영 사항 반영 완료 기록`,
      (n, v) => `${n} 변경 내용 전부 반영 완료된 갱신 기록`,
      (n, v) => `${n} 달라진 운영 사항 모두 반영한 기록`,
    ]},
    { mechanism: 'Recency', driver: '시의성', variants: [
      (n, v) => `${n} 이번 주 출발 전 읽어볼 핵심 브리핑`,
      (n, v) => `${n} 금주 출발 전 읽어두면 좋은 브리핑`,
      (n, v) => `${n} 이번 주말 가기 전에 볼 핵심 브리핑`,
      (n, v) => `${n} 주간 업데이트 반영 출발 전 브리핑`,
    ]},
    { mechanism: 'Recency', driver: '시의성', variants: [
      (n, v) => `${n} 오늘 기준 운영 현황 포함 최신 가이드`,
      (n, v) => `${n} 당일 반영 운영 현황 수록 가이드`,
      (n, v) => `${n} 오늘자 운영 현황까지 수록한 가이드`,
      (n, v) => `${n} 최신 업데이트 완료 운영 현황 가이드`,
    ]},

    // ===== SPECIFICITY H11-H15 =====
    { mechanism: 'Specificity', driver: '구체성', variants: [
      (n, v) => `${n} FAQ ${v.faq.length}개 답변 빠짐없이 담은 모음`,
      (n, v) => `${n} 질문 ${v.faq.length}개와 답변 한곳에 담은 모음`,
      (n, v) => `${n} ${v.faq.length}개 질문 한눈에 보는 답변 모음`,
      (n, v) => `${n} 자주 나오는 질문 ${v.faq.length}개 답변 모음`,
    ]},
    { mechanism: 'Specificity', driver: '구체성', variants: [
      (n, v) => `${n} 입장 전 체크할 항목 ${v.checklist.length}개 해설`,
      (n, v) => `${n} 체크리스트 ${v.checklist.length}항목 하나씩 해설`,
      (n, v) => `${n} 체크 ${v.checklist.length}개 빠짐없이 해설 정리`,
      (n, v) => `${n} 입장 체크 ${v.checklist.length}가지 항목별 해설`,
    ]},
    { mechanism: 'Specificity', driver: '구체성', variants: [
      (n, v) => `${n} 타임라인 ${v.timeline.length}단계 시간대별 리포트`,
      (n, v) => `${n} ${v.timeline.length}구간 시간대별 즐기는 법 리포트`,
      (n, v) => `${n} 시간대 ${v.timeline.length}단계 활용 팁 리포트`,
      (n, v) => `${n} ${v.timeline.length}구간 분위기별 공략 리포트`,
    ]},
    { mechanism: 'Specificity', driver: '구체성', variants: [
      (n, v) => `${n} 3분 안에 파악하는 핵심 내용 빠른 요약`,
      (n, v) => `${n} 3분 요약으로 보는 핵심 내용 압축 정리`,
      (n, v) => `${n} 핵심만 3분에 담은 축약본 빠른 정리`,
      (n, v) => `${n} 바쁜 사람 위한 3분 핵심 빠른 압축본`,
    ]},
    { mechanism: 'Specificity', driver: '구체성', variants: [
      (n, v) => `${n} ${v.region} 동선 포함 루트와 지도 연결`,
      (n, v) => `${n} 지도 연결 동선 루트와 접근 팁 소개`,
      (n, v) => `${n} 찾아가는 길과 주변 동선 루트 안내`,
      (n, v) => `${n} ${v.region}에서 찾아가는 루트 접근 팁`,
    ]},

    // ===== CONTRAST H16-H19 =====
    { mechanism: 'Contrast', driver: '대비', variants: [
      (n, v) => `${n} 첫 방문 vs 재방문 차이점 비교 분석`,
      (n, v) => `${n} 처음 갈 때와 다시 갈 때 즐기는 법 차이`,
      (n, v) => `${n} 입문자 vs 재이용자 코스 차이 비교`,
      (n, v) => `${n} 첫 경험과 재경험의 차이점 낱낱이 분석`,
    ]},
    { mechanism: 'Contrast', driver: '대비', variants: [
      (n, v) => `${n} 평일 분위기 vs 주말 분위기 대조 분석`,
      (n, v) => `${n} 평일과 주말 어떻게 다른지 꼼꼼 비교`,
      (n, v) => `${n} 요일별 분위기 차이 한눈에 대조 정리`,
      (n, v) => `${n} 주중 vs 주말 분위기 차이점 대조 분석`,
    ]},
    { mechanism: 'Contrast', driver: '대비', variants: [
      (n, v) => `${n} 이른 시간 vs 늦은 시간 장단점 견주기`,
      (n, v) => `${n} 일찍 가기 vs 늦게 가기 장단점 따져보기`,
      (n, v) => `${n} 오픈 직후 vs 피크타임 분위기 차이 비교`,
      (n, v) => `${n} 시간대별 장단점 하나하나 따져보기`,
    ]},
    { mechanism: 'Contrast', driver: '대비', variants: [
      (n, v) => `${n} 혼자 vs 단체 즐기는 법 달라지는 핵심`,
      (n, v) => `${n} 1인 이용과 그룹 이용의 핵심 차이 정리`,
      (n, v) => `${n} 소규모 vs 대규모 이용 핵심 차이점 정리`,
      (n, v) => `${n} 동행 인원별로 달라지는 이용 핵심 차이`,
    ]},

    // ===== RISK REDUCTION H20-H24 =====
    { mechanism: 'RiskReduction', driver: '불안해소', variants: [
      (n, v) => `${n} 처음이라 걱정될 때 이것부터 확인하기`,
      (n, v) => `${n} 첫 이용 불안 줄여주는 입문자 길잡이`,
      (n, v) => `${n} 걱정 없이 출발하는 준비법 입문 길잡이`,
      (n, v) => `${n} 초행 불안 해소하는 입문 길잡이 미리 읽기`,
    ]},
    { mechanism: 'RiskReduction', driver: '불안해소', variants: [
      (n, v) => `${n} 첫 입장 실수 막는 체크 ${v.checklist.length}개 항목`,
      (n, v) => `${n} 흔한 실수 ${v.checklist.length}가지 미리 막는 체크표`,
      (n, v) => `${n} 미리 체크하면 실수 없는 ${v.checklist.length}가지`,
      (n, v) => `${n} 실수 줄이는 사전 체크 ${v.checklist.length}개 항목`,
    ]},
    { mechanism: 'RiskReduction', driver: '불안해소', variants: [
      (n, v) => `${n} 궁금한 점 ${v.faq.length}개 한번에 해소 Q&A`,
      (n, v) => `${n} 이용 전 ${v.faq.length}개 의문 한번에 풀기`,
      (n, v) => `${n} 자주 묻는 질문 ${v.faq.length}개 명쾌하게 답변`,
      (n, v) => `${n} ${v.faq.length}가지 궁금증 깔끔하게 풀어보기`,
    ]},
    { mechanism: 'RiskReduction', driver: '불안해소', variants: [
      (n, v) => `${n} 입장부터 귀가까지 흐름 한눈에 보기`,
      (n, v) => `${n} 도착에서 귀가까지 전 과정 순서 안내`,
      (n, v) => `${n} 출발부터 귀가까지 전체 동선 흐름도`,
      (n, v) => `${n} 시작부터 끝까지 전체 흐름 한눈에 안내`,
    ]},
    { mechanism: 'RiskReduction', driver: '불안해소', variants: [
      (n, v) => `${n} 에티켓과 매너 코드 미리 숙지하기`,
      (n, v) => `${n} 기본 매너 코드 알고 편하게 즐기는 법`,
      (n, v) => `${n} 알아두면 유용한 현장 에티켓 노하우`,
      (n, v) => `${n} 에티켓 파악하면 편하게 즐기는 노하우`,
    ]},

    // ===== AUTHORITY H25-H27 =====
    { mechanism: 'Authority', driver: '신뢰', variants: [
      (n, v) => `${n} 편집팀 팩트체크 거친 검증 레퍼런스`,
      (n, v) => `${n} 편집 원칙 따라 검증 완료된 레퍼런스`,
      (n, v) => `${n} 데이터 교차 검증 후 작성한 레퍼런스`,
      (n, v) => `${n} 팩트체크 거친 운영 실태 검증 자료`,
    ]},
    { mechanism: 'Authority', driver: '신뢰', variants: [
      (n, v) => `${n} ${UPDATE_DATE} 편집팀 갱신 로그 기록`,
      (n, v) => `${n} 업데이트 이력 포함한 운영 기록 수록`,
      (n, v) => `${n} 갱신 이력 열람 가능한 운영 변경 기록`,
      (n, v) => `${n} 변경 로그 포함 운영 기록 열람 가능`,
    ]},
    { mechanism: 'Authority', driver: '신뢰', variants: [
      (n, v) => `${n} 정정 요청 가능한 검증 자료 열람`,
      (n, v) => `${n} 오류 제보 채널 포함 검증 자료 공개`,
      (n, v) => `${n} 열린 정정 절차 포함 검증 자료 공개`,
      (n, v) => `${n} 수정 접수 가능한 열린 검증 자료`,
    ]},

    // ===== COMBINED H28-H30 =====
    { mechanism: 'Combined', driver: '복합', variants: [
      (n, v) => `${n} 체크 ${v.checklist.length}개 + FAQ ${v.faq.length}개 원스톱 자료`,
      (n, v) => `${n} 체크리스트와 FAQ 한 곳에 담은 종합 자료`,
      (n, v) => `${n} 점검 ${v.checklist.length}항목 + 질문 ${v.faq.length}개 종합 자료`,
      (n, v) => `${n} 입장 준비와 Q&A 한 곳에 묶은 자료`,
    ]},
    { mechanism: 'Combined', driver: '복합', variants: [
      (n, v) => `${n} ${v.region} 지도 연결 + 체크리스트 한곳 묶음`,
      (n, v) => `${n} 위치 확인 + 준비 항목 한번에 묶은 자료`,
      (n, v) => `${n} 지도 + 체크 ${v.checklist.length}개 한곳에 담은 자료`,
      (n, v) => `${n} 지도 + 입장 준비 한곳에 담은 종합 안내`,
    ]},
    { mechanism: 'Combined', driver: '복합', variants: [
      (n, v) => `${n} 동선·피크타임·FAQ 종합 자료 열람`,
      (n, v) => `${n} 루트 + 시간표 + Q&A 한곳에 묶은 자료`,
      (n, v) => `${n} 접근 동선·시간대·Q&A 한 곳에 종합`,
      (n, v) => `${n} 루트와 시간대별 FAQ 종합 자료 안내`,
    ]},
  ];
}

// ======================== META DESCRIPTION POOL ========================
function getDescriptionTemplates() {
  return [
    (n, v, t) => `${n}(${v.region}) 방문 정보 — 체크리스트 ${v.checklist.length}개, FAQ ${v.faq.length}개, 피크타임 ${v.timeline.length}단계, 지도 포함. ${UPDATE_DATE} 기준 갱신.`,
    (n, v, t) => `${v.region} ${t} ${n} 분위기·사운드·체크리스트·FAQ를 한 페이지에 정리했습니다. ${UPDATE_DATE} 기준 업데이트.`,
    (n, v, t) => `${n} 방문 전 확인할 항목 ${v.checklist.length}개와 자주 묻는 질문 ${v.faq.length}개를 정리한 페이지입니다. ${UPDATE_DATE} 기준.`,
    (n, v, t) => `${n} ${v.region} 위치 확인, 입장 준비 ${v.checklist.length}가지, 시간대별 안내 ${v.timeline.length}단계, FAQ ${v.faq.length}개. ${UPDATE_DATE} 갱신.`,
    (n, v, t) => `${n} 입장 체크리스트 ${v.checklist.length}개, FAQ ${v.faq.length}개, 피크타임 가이드를 정리한 페이지. ${UPDATE_DATE} 기준 갱신.`,
    (n, v, t) => `${v.region} ${t} ${n} — 체크 ${v.checklist.length}항목, 질문 ${v.faq.length}개 답변, 시간대 ${v.timeline.length}구간. ${UPDATE_DATE} 기준 갱신.`,
    (n, v, t) => `${n} 정보 페이지 — ${v.region} 위치 확인, 입장 준비 ${v.checklist.length}가지, FAQ ${v.faq.length}개 포함. ${UPDATE_DATE} 업데이트 완료.`,
    (n, v, t) => `${n}의 위치·분위기·준비물을 3분 안에 파악할 수 있게 정리한 가이드. ${UPDATE_DATE} 기준 갱신.`,
    (n, v, t) => `${n} 방문을 앞두고 있다면 이 가이드를 먼저 확인하세요. 위치·분위기·체크리스트·FAQ를 모두 담았습니다. ${UPDATE_DATE} 기준.`,
    (n, v, t) => `${n}은 ${v.region}에 위치한 ${t}입니다. 현장 확인 기반 정보 ${v.checklist.length + v.faq.length}가지, 타임라인 ${v.timeline.length}단계 안내. ${UPDATE_DATE} 갱신.`,
    (n, v, t) => `${n}에서의 밤을 미리 계획해보세요. 시간대별 분위기, 준비물 ${v.checklist.length}가지, FAQ ${v.faq.length}개. ${UPDATE_DATE} 기준 갱신.`,
    (n, v, t) => `${n} ${t} 분위기·동선을 갱신 데이터 기반으로 안내합니다. 처음 방문자를 위한 체크리스트 ${v.checklist.length}개 포함. ${UPDATE_DATE} 기준.`,
    (n, v, t) => `${n} 위치 확인부터 입장 준비까지, 방문에 필요한 정보 ${v.checklist.length + v.faq.length}가지를 정리했습니다. ${UPDATE_DATE} 기준 갱신.`,
  ];
}

// ======================== H1 TITLE POOL ========================
function getH1Templates() {
  return [
    (n, v, t) => `${n} 방문 가이드 — 체크리스트·FAQ·타임라인`,
    (n, v, t) => `${n} 방문 전 알아야 할 모든 것`,
    (n, v, t) => `${n} ${v.region} ${t} 현장 정보 안내`,
    (n, v, t) => `${n} 첫 방문자를 위한 가이드`,
    (n, v, t) => `${n} 가이드 — 준비물 ${v.checklist.length}개, FAQ ${v.faq.length}개`,
    (n, v, t) => `${n} ${t} 방문 정보 총정리`,
    (n, v, t) => `${n} 안내 — 위치·분위기·체크리스트`,
    (n, v, t) => `${n} 정보 — ${v.region} ${t} 가이드`,
    (n, v, t) => `${n} 입장 안내와 FAQ ${v.faq.length}개`,
    (n, v, t) => `${n} 가이드 — 갱신 기준 현장 정보`,
    (n, v, t) => `${n} ${v.region} ${t} 방문 준비 가이드`,
    (n, v, t) => `${n} 체크리스트·타임라인·FAQ 안내`,
    (n, v, t) => `${n} 방문 가이드 — ${v.region} ${t}`,
  ];
}

// ======================== SECTION INTROS FOR STORE NAME DENSITY ========================
function genSectionIntros(v) {
  const n = v.name_display;
  const t = typeKo(v.type);
  const r = v.region;
  const idx = hash(v.id);

  const summaryTitlePool = [
    `${n} 핵심 정보`,
    `${n} 요약 정보`,
    `${n} 한눈에 보기`,
  ];

  const atmosphereLeadPool = [
    `${n}의 공간 분위기를 정리합니다.`,
    `${n}에 들어서면 느낄 수 있는 분위기입니다.`,
    `${n}이 전하는 공간의 첫인상을 확인하세요.`,
  ];

  const musicLeadPool = [
    `${n}에서 경험할 수 있는 사운드입니다.`,
    `${n}의 음악과 사운드 특징을 소개합니다.`,
    `${n}에서 들을 수 있는 장르를 안내합니다.`,
  ];

  const faqLeadPool = [
    `${n}에 대해 자주 묻는 질문을 모았습니다.`,
    `${n} 방문 전 궁금한 점을 정리했습니다.`,
    `${n}에 관한 질문과 답변을 확인하세요.`,
  ];

  const checklistLeadPool = [
    `${n} 방문 전 꼭 확인할 항목입니다.`,
    `${n}에 가기 전 체크해야 할 사항입니다.`,
    `${n} 입장을 앞두고 점검할 항목입니다.`,
  ];

  const timelineLeadPool = [
    `${n}의 시간대별 분위기 변화를 살펴봅니다.`,
    `${n} 방문 시간에 따른 분위기 차이를 안내합니다.`,
    `${n}에서 시간대별로 달라지는 분위기입니다.`,
  ];

  return {
    summaryTitle: summaryTitlePool[idx % summaryTitlePool.length],
    atmosphereLead: atmosphereLeadPool[idx % atmosphereLeadPool.length],
    musicLead: musicLeadPool[idx % musicLeadPool.length],
    faqLead: faqLeadPool[idx % faqLeadPool.length],
    checklistLead: checklistLeadPool[idx % checklistLeadPool.length],
    timelineLead: timelineLeadPool[idx % timelineLeadPool.length],
  };
}

// ======================== CONCLUSION TEXT (4-5 store name mentions) ========================
function genConclusionText(v) {
  const n = v.name_display;
  const r = v.region;
  const t = typeKo(v.type);
  const idx = hash(v.id);

  const clubConclusions = [
    `${n}은 ${r}에서 밤의 에너지를 경험할 수 있는 공간입니다. ${n}의 피크타임 가이드와 입장 전 체크리스트를 확인한 뒤, ${n} 방문을 준비해보세요. ${n}에서의 밤이 기대된다면 위의 정보를 참고해 출발하세요.`,
    `${r} ${t} ${n}의 분위기를 미리 확인했다면 이제 출발 준비만 남았습니다. ${n}의 체크리스트를 점검하고, ${n} 타임라인을 참고하세요. ${n}에서 잊지 못할 밤을 보내세요.`,
    `${n}의 밤은 준비된 사람에게 더 특별합니다. ${n} 체크리스트를 모두 확인했다면, ${n}의 타임라인에 맞춰 출발하세요. ${n}에서의 경험이 궁금하다면 FAQ도 확인해보세요.`,
    `어두운 플로어 위, 같은 비트에 몸을 맡기는 순간이 ${n}의 시작입니다. ${n}의 피크타임 가이드를 확인하고, ${n} 입장 전 체크리스트를 점검하세요. ${n}에서의 밤이 기다리고 있습니다.`,
  ];

  const nightConclusions = [
    `${n}은 ${r}에서 라이브 음악과 함께하는 밤을 찾는 이들에게 추천하는 공간입니다. ${n}의 타임라인과 준비물 체크리스트를 확인한 뒤 ${n}을 방문해보세요. ${n}의 밤이 기다리고 있습니다.`,
    `${r} ${t} ${n}에서의 밤을 계획하고 있다면, ${n}의 체크리스트부터 확인하세요. ${n} 타임라인을 참고해 방문 시간을 정하고, ${n}에서의 밤을 즐겨보세요.`,
    `${n}의 무대 위 조명이 켜지면 밤이 시작됩니다. ${n}의 준비물 체크리스트를 점검하고, ${n} 타임라인으로 방문 계획을 세워보세요. ${n}에서의 경험이 새로운 추억이 됩니다.`,
    `라이브 밴드의 첫 곡이 울리면 ${n}의 밤이 시작됩니다. ${n}의 타임라인과 체크리스트를 확인하세요. ${n}에서 새로운 인연과 음악을 동시에 찾아보세요. ${n} 방문이 기대됩니다.`,
  ];

  const loungeConclusions = [
    `${n}은 ${r}에서 분위기 좋은 공간을 찾는 이들에게 추천하는 ${t}입니다. ${n}의 시간대별 추천과 체크리스트를 확인하고 ${n}을 방문해보세요. ${n}에서의 시간이 기대됩니다.`,
    `${r} ${t} ${n}에서의 저녁을 계획하고 있다면, ${n}의 체크리스트부터 점검하세요. ${n} 시나리오 플래너를 활용하고, ${n}에서의 시간을 설계해보세요.`,
    `${n}의 조명 아래, 잔을 기울이는 시간을 상상해보세요. ${n}의 체크리스트를 확인하고, ${n} 시간대별 추천을 참고하세요. ${n}에서의 밤이 특별해집니다.`,
    `낮은 조명 아래 대화가 깊어지는 곳, ${n}입니다. ${n}의 체크리스트와 시간대별 추천을 확인한 뒤, ${n}에서의 저녁을 계획해보세요. ${n} 방문이 기대됩니다.`,
  ];

  const pool = v.type === 'club' ? clubConclusions : v.type === 'night' ? nightConclusions : loungeConclusions;
  return pool[idx % pool.length];
}

// ======================== WORD FREQUENCY FIX ========================
function fixWordFrequency(variants, storeName) {
  let iterations = 0;
  while (iterations < 50) {
    iterations++;
    const wordOccurrences = {};

    for (let i = 0; i < variants.length; i++) {
      const hook = variants[i].title.replace(storeName, '').trim();
      const tokens = hook.split(/[\s·+]+/).filter(w => w.length >= 2 && !PARTICLES.has(w) && !w.match(/^\d+$/));
      for (const w of tokens) {
        if (!wordOccurrences[w]) wordOccurrences[w] = [];
        wordOccurrences[w].push(i);
      }
    }

    let worstWord = null, worstCount = 3;
    for (const [word, indices] of Object.entries(wordOccurrences)) {
      if (indices.length > worstCount) {
        worstCount = indices.length;
        worstWord = word;
      }
    }
    if (!worstWord) break;

    const indices = wordOccurrences[worstWord];
    const pool = SYNONYMS[worstWord];
    if (pool && pool.length > 0) {
      for (let i = 3; i < indices.length; i++) {
        const idx = indices[i];
        const syn = pool[(i - 3) % pool.length];
        variants[idx].title = variants[idx].title.replace(worstWord, syn);
      }
    } else {
      break; // no synonyms available, can't fix further
    }
  }

  const finalCount = {};
  for (const v of variants) {
    const hook = v.title.replace(storeName, '').trim();
    const tokens = hook.split(/[\s·+]+/).filter(w => w.length >= 2 && !PARTICLES.has(w) && !w.match(/^\d+$/));
    for (const w of tokens) { finalCount[w] = (finalCount[w] || 0) + 1; }
  }
  const violations = Object.entries(finalCount).filter(([w, c]) => c > 3);
  return { passed: violations.length === 0, violations };
}

// ======================== STRONGEST DRIVER ========================
function analyzeDrivers(v) {
  const faqCount = v.faq?.length || 0;
  const clCount = v.checklist?.length || 0;
  const tlCount = v.timeline?.length || 0;
  const popular = ['강남', '홍대', '이태원', '청담', '압구정', '부산해운대', '부산서면'];
  const isPopular = popular.includes(v.region);
  let primary, secondary, why;
  if (faqCount >= 8) {
    primary = '불안해소'; secondary = isPopular ? '대비' : '구체성';
    why = `FAQ가 ${faqCount}개로 풍부해 불안 해소가 핵심 동기. ${isPopular ? '인기 지역이라 비교 심리 작용' : '구체 수치가 신뢰 형성에 기여'}.`;
  } else if (isPopular) {
    primary = '대비'; secondary = '호기심';
    why = `${v.region}은 경쟁 업소가 많아 비교 심리 강함. 차별화된 내용이 클릭 유도에 효과적.`;
  } else if (tlCount >= 5) {
    primary = '호기심'; secondary = '구체성';
    why = `타임라인 ${tlCount}단계로 시간대별 호기심 자극 효과적. 구체 단계가 신뢰 보강.`;
  } else {
    primary = '구체성'; secondary = '불안해소';
    why = `체크리스트 ${clCount}개의 구체적 수치가 실용성 전달. 준비 항목이 불안 해소에 기여.`;
  }
  return { primary, secondary, why };
}

// ======================== DEFAULT SELECTION ========================
function selectDefault(variants, strongest) {
  const candidates = variants.filter(v => v.driver === strongest.primary);
  const optimal = candidates.find(v => v.title.length >= 25 && v.title.length <= 48);
  if (optimal) return optimal.id;
  if (candidates.length > 0) return candidates[0].id;
  return variants.find(v => v.mechanism === 'Specificity')?.id || variants[0].id;
}

// ======================== A/B TESTS ========================
function generateABTests(variants, v) {
  const byMech = {};
  for (const x of variants) {
    if (!byMech[x.mechanism]) byMech[x.mechanism] = [];
    byMech[x.mechanism].push(x.id);
  }
  return [
    {
      group: 'A', theme: 'Curiosity+Specificity',
      ids: [...(byMech['Curiosity'] || []).slice(0, 3), ...(byMech['Specificity'] || []).slice(0, 2)],
      hypothesis: `정보 공백과 구체 숫자(FAQ ${v.faq.length}개, 체크 ${v.checklist.length}개)가 클릭 호기심 극대화. 정보 탐색 의도 높은 사용자에게 CTR 우위 예상.`,
    },
    {
      group: 'B', theme: 'RiskReduction+Authority',
      ids: [...(byMech['RiskReduction'] || []).slice(0, 3), ...(byMech['Authority'] || []).slice(0, 2)],
      hypothesis: `첫 입장 불안 해소와 편집팀 검증 신뢰 결합. 신중한 사용자층에서 CTR+체류시간 동시 상승 예상.`,
    },
    {
      group: 'C', theme: 'Contrast+Recency',
      ids: [...(byMech['Contrast'] || []).slice(0, 2), ...(byMech['Recency'] || []).slice(0, 2)],
      hypothesis: `A vs B 대비 구조가 선택 고민 중인 사용자 타겟. 최신 업데이트 표시가 재이용자 클릭 유도. 스크롤 깊이 우위 예상.`,
    }
  ];
}

// ======================== NOTES ========================
function generateNotes(mechanism, v, slotIdx) {
  const pool = {
    'Curiosity': [
      `정보 공백 자극으로 클릭 유도`, `체크리스트 숫자가 호기심 유발`,
      `현지인 관점이 로컬 정보 갈증 자극`, `FAQ에서 발견한 의외의 정보 약속`,
      `시간대별 차이 암시로 정보 공백 형성`, `첫 방문자 타겟팅으로 초행 불안+호기심 동시 자극`,
    ],
    'Recency': [
      `날짜 명시가 최신성 신호`, `변경 사항 언급으로 재클릭 유도`,
      `주간 단위 시간 프레이밍`, `오늘 기준 표현이 실시간 기대감 형성`,
    ],
    'Specificity': [
      `FAQ 수치가 정보량 보장 신호`, `체크 항목 수가 실용성 전달`,
      `타임라인 단계가 시간 가치 암시`, `3분 요약이 효율 약속`,
      `동선 포함이 행동 루트 제공 약속`,
    ],
    'Contrast': [
      `첫/재 대비가 두 타겟 모두에게 관련성 생성`, `평일/주말 대비가 시점 고민 해결`,
      `이른/늦은 시간 대비가 시간대 선택 도움`, `혼자/단체 대비가 동행 구성별 맞춤 약속`,
    ],
    'RiskReduction': [
      `걱정 해소 프레이밍이 불안감 직접 타겟`, `실수 방지 수치가 사전 준비 가치 전달`,
      `의문 해결이 완결성 약속`, `전체 흐름이 통제감 제공`, `에티켓 숙지가 사회적 불안 해소`,
    ],
    'Authority': [
      `편집팀 확인이 신뢰성 신호`, `갱신 로그가 관리 체계 신뢰 형성`, `정정 가능 명시가 열린 검증 태도`,
    ],
    'Combined': [
      `체크+FAQ 통합이 한 곳 완결성 어필`, `지도+체크리스트가 실행 패키지 약속`, `동선+시간+FAQ 종합이 원스톱 가치 전달`,
    ],
  };
  const p = pool[mechanism] || pool['Curiosity'];
  return p[slotIdx % p.length];
}

// ======================== MAIN ========================
console.log('Generating headline packs for', venues.length, 'venues...\n');

const allTitles = new Set();
const allDescs = new Set();
let totalVariants = 0;
let qaErrors = 0;
const updatedVenues = JSON.parse(JSON.stringify(venues));
const h1Templates = getH1Templates();
const descTemplates = getDescriptionTemplates();

for (let i = 0; i < venues.length; i++) {
  const v = venues[i];
  const n = v.name_display;
  const t = typeKo(v.type);
  const h = hash(v.id);
  const slots = getTemplateSlots();

  // Generate 30 variants
  const variants = [];
  let hId = 1;
  for (let slotIdx = 0; slotIdx < slots.length; slotIdx++) {
    const slot = slots[slotIdx];
    const variantIdx = (h + slotIdx * 7 + i * 3) % slot.variants.length;
    let title = slot.variants[variantIdx](n, v);

    // Trim if too long
    if (title.length > 55) {
      const words = title.split(' ');
      while (words.join(' ').length > 55 && words.length > 3) words.pop();
      title = words.join(' ');
    }

    variants.push({
      id: `H${String(hId).padStart(2, '0')}`,
      mechanism: slot.mechanism,
      title,
      driver: slot.driver,
      notes: generateNotes(slot.mechanism, v, slotIdx),
    });
    hId++;
  }

  // Fix word frequency
  const wfResult = fixWordFrequency(variants, n);

  // QA checks
  for (const vr of variants) {
    if (!vr.title.startsWith(n)) {
      console.error(`  FAIL: ${vr.id} in ${n} doesn't start with store name`);
      qaErrors++;
    }
    if (hasBanned(vr.title)) {
      console.error(`  FAIL: ${vr.id} in ${n} has banned word: ${vr.title}`);
      qaErrors++;
    }
    if (allTitles.has(vr.title)) {
      console.error(`  WARN: Duplicate title across venues: ${vr.title}`);
    }
    allTitles.add(vr.title);
  }
  totalVariants += variants.length;

  // Strongest driver
  const strongest = analyzeDrivers(v);
  const recommended = selectDefault(variants, strongest);
  const abTests = generateABTests(variants, v);

  // Meta description (unique across pages)
  const descIdx = (h + i) % descTemplates.length;
  let metaDesc = descTemplates[descIdx](n, v, t);
  let descAttempt = 0;
  while (allDescs.has(metaDesc) && descAttempt < descTemplates.length) {
    descAttempt++;
    metaDesc = descTemplates[(descIdx + descAttempt) % descTemplates.length](n, v, t);
  }
  allDescs.add(metaDesc);

  // H1 title (unique per page)
  const h1Idx = (h + i * 5) % h1Templates.length;
  const h1Title = h1Templates[h1Idx](n, v, t);

  // Section intros for store name density
  const sectionIntros = genSectionIntros(v);

  // Conclusion text with 4-5 store name mentions
  const conclusionText = genConclusionText(v);

  // Build rules
  const rules = {
    store_name_first: true,
    no_banned_claims: true,
    title_length_range: '15-55 chars',
    word_repeat_max_3: wfResult.passed,
    missing_inputs: [],
  };
  if (!v.geo || v.geo.precision === 'none') rules.missing_inputs.push('geo_location');

  // Save headline pack JSON
  const slug = `${v.typePath}-${v.regionSlug}-${(v.urlSlug || v.venueSlug).replace(/\s+/g, '-')}`;
  const pack = {
    store: n,
    region: v.region,
    category: t,
    generated_at: UPDATE_DATE,
    rules,
    variants,
    strongest_driver: strongest,
    ab_tests: abTests,
    recommended_default: recommended,
  };
  writeFileSync(join(HEADLINES_DIR, `${slug}.json`), JSON.stringify(pack, null, 2), 'utf8');

  // Update venue data
  const defaultVariant = variants.find(x => x.id === recommended);
  updatedVenues[i].pageTitle = defaultVariant ? defaultVariant.title : variants[0].title;
  updatedVenues[i].metaDescription = metaDesc;
  updatedVenues[i].h1Title = h1Title;
  updatedVenues[i].sectionIntros = sectionIntros;
  updatedVenues[i].conclusionText = conclusionText;

  if ((i + 1) % 20 === 0 || i === venues.length - 1) {
    console.log(`  Processed ${i + 1}/${venues.length} venues...`);
  }
}

// Save updated venues.json
writeFileSync(VENUES_PATH, JSON.stringify(updatedVenues, null, 2), 'utf8');

// Final QA summary
console.log('\n===================================================');
console.log('  HEADLINE GENERATION SUMMARY');
console.log('===================================================');
console.log(`  Total venues:             ${venues.length}`);
console.log(`  Total variants:           ${totalVariants}`);
console.log(`  Unique titles:            ${allTitles.size}`);
console.log(`  Cross-venue duplicates:   ${totalVariants - allTitles.size}`);
console.log(`  QA errors:                ${qaErrors}`);
console.log(`  Unique meta descriptions: ${allDescs.size}`);
console.log(`  QA:                       ${qaErrors === 0 ? 'PASS' : 'NEEDS REVIEW'}`);
console.log('===================================================\n');

// Sample outputs
console.log('Sample titles (per category):');
for (const type of ['club', 'night', 'lounge']) {
  console.log(`\n--- ${type.toUpperCase()} ---`);
  updatedVenues.filter(v => v.type === type).slice(0, 3).forEach(v => {
    console.log(`  ${v.name_display}:`);
    console.log(`    Title: ${v.pageTitle}`);
    console.log(`    H1:    ${v.h1Title}`);
    console.log(`    Desc:  ${v.metaDescription.slice(0, 80)}...`);
  });
}
console.log('\n✅ Headline packs generated + venues.json updated');
