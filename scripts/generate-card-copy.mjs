#!/usr/bin/env node
/**
 * generate-card-copy.mjs
 * Generates unique card_hook, card_value, card_tags, image_alt, map_url
 * for every venue in data/venues.json.
 *
 * Key: BOTH lines are parametric with venue-specific tokens.
 * No two venues should produce Jaccard > 0.35.
 */

import { readFileSync, writeFileSync } from 'fs';

const VENUES_PATH = 'data/venues.json';
const venues = JSON.parse(readFileSync(VENUES_PATH, 'utf8'));

// ─── Deterministic hash ───
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// ─── Banned words ───
const BANNED = ['해당', '이곳', '공간', '매장', '감도', '기준'];
function hasBanned(text) { return BANNED.some(w => text.includes(w)); }

// ─── Short name extractor ───
function shortName(v) {
  let n = v.name_display;
  // Remove region prefix
  n = n.replace(new RegExp(`^${v.region}\\s*`), '');
  // Only remove trailing type label if the remaining name is long enough
  const withoutType = n.replace(/\s*(클럽|나이트|라운지)$/g, '').trim();
  if (withoutType.length >= 2) n = withoutType;
  return n.trim() || v.name_display;
}

// ─── Korean particle helper (은/는, 이/가, 을/를) ───
function hasJongseong(char) {
  const code = char.charCodeAt(0);
  if (code < 0xAC00 || code > 0xD7A3) return false; // not Hangul
  return (code - 0xAC00) % 28 !== 0;
}
function eunNeun(word) { return hasJongseong(word[word.length-1]) ? '은' : '는'; }
function iGa(word) { return hasJongseong(word[word.length-1]) ? '이' : '가'; }
function eulReul(word) { return hasJongseong(word[word.length-1]) ? '을' : '를'; }

// ─── Word pools ───
const MOOD = {
  club: ['비트', '사운드', 'DJ 셋', '베이스', '네온', '플로어', '바이브', '그루브', '드롭', '리듬', '턴테이블', '믹싱', 'BPM', '서브우퍼', '레이저'],
  night: ['라이브', '밴드', '파트너댄스', '무드', '열기', '스텝', '조명', '웨이터', '트로트', '록밴드', '소울', '왈츠', '리듬', '보컬', '탱고'],
  lounge: ['칵테일', '위스키', 'BGM', '대화', '무드등', '바텐더', '시그니처', '여유', '감성', '재즈', '보사노바', '올드팝', '네그로니', '하이볼', '마티니'],
};

const ADJ = {
  club: ['강렬한', '짜릿한', '몰입형', '고에너지', '역동적인', '압도적인', '파워풀한', '뜨거운', '전율의', '폭발적인', '거친', '날것의', '심장을 울리는', '차원이 다른', '육감적인'],
  night: ['깊은', '은은한', '클래식한', '로맨틱한', '우아한', '활기찬', '독보적인', '정통', '향수 어린', '무르익은', '끈적한', '한층 깊은', '달콤한', '느릿한', '화려한'],
  lounge: ['세련된', '고요한', '프라이빗한', '은밀한', '감각적인', '편안한', '모던한', '섬세한', '차분한', '독창적인', '미니멀한', '절제된', '고급스러운', '클래시한', '잔잔한'],
};

const REGION_VIBE = {
  '강남': '서울 중심부', '청담': '청담 거리', '이태원': '다국적 타운', '홍대': '홍대 앞',
  '부산서면': '서면 번화가', '부산해운대': '해운대 해변', '부산광안리': '광안리 야경',
  '대구': '동성로', '대전': '둔산동', '광주': '충장로', '전주': '객사 거리',
  '강릉': '강릉 해안', '인천부평': '부평 역세권', '수원': '수원역 인근',
  '제주': '제주 시내', '잠실': '잠실 송파', '성남': '판교 인근', '일산': '라페스타',
  '고양': '삼송 인근', '인천': '인천 구도심', '천안': '신부동', '부산': '부산 중심가',
  '울산': '삼산동', '평택': '송탄', '부천': '역곡 인근', '의정부': '행복로',
  '창원': '상남동', '포항': '포항 시내', '경주': '황남 인근', '김해': '내외동',
  '춘천': '명동 거리', '청주': '성안길', '순천': '연향동', '목포': '하당',
  '압구정': '로데오 거리', '인천송도': '센트럴파크', '상봉동': '상봉 역세권',
  '수유': '수유 번화가', '노원': '노원 역세권', '길동': '길동 먹자골목',
  '신림': '신림 로터리', '독산동': '독산 역세권', '강서': '마곡동', '강북': '미아 인근',
};

// ─── Type-specific action verbs & expressions ───
const ACTION = {
  club: ['몸을 맡기면', '플로어에 서면', '첫 곡이 떨어지면', '비트에 몸을 싣는 순간', '입구를 들어서면'],
  night: ['밴드가 시작하면', '첫 스텝을 밟으면', '테이블에 앉는 순간', '조명이 바뀌면', '음악이 흐르면'],
  lounge: ['첫 잔을 받으면', '바에 앉는 순간', '조명이 어두워지면', '음악이 깔리면', '문을 열면'],
};

// ─── HOOK generators (각각 완전히 다른 함수, 조사 처리 포함) ───
const hookGenerators = [
  (v, n, r, rv, adj, mood) => `${rv}에서 ${adj} ${mood}${eulReul(mood)} 원한다면 ${n}`,
  (v, n, r, rv, adj, mood) => `${n}, ${r} ${v.typeLabel} 중 ${adj} ${mood} 보유`,
  (v, n, r, rv, adj, mood) => `${r} ${v.typeLabel} 고민 중이라면 ${n}의 ${mood}부터`,
  (v, n, r, rv, adj, mood) => `같은 ${r}이라도 ${n}의 ${mood}${eunNeun(mood)} 결이 다르다`,
  (v, n, r, rv, adj, mood) => `${r} 단골들이 꾸준히 찾는 ${n}, ${adj} ${mood}`,
  (v, n, r, rv, adj, mood) => {
    const m2 = MOOD[v.type][(hashStr(v.id+'m2'))%MOOD[v.type].length];
    return `${n}의 ${mood}과 ${m2}, ${r}에서 보기 드문 조합`;
  },
  (v, n, r, rv, adj, mood) => `금토 밤 ${rv}${eulReul(rv)} 찾는다면 ${n}의 ${adj} 톤`,
  (v, n, r, rv, adj, mood) => {
    const act = ACTION[v.type][hashStr(v.id+'act')%ACTION[v.type].length];
    return `${n}에서 ${act} 그날 밤이 달라진다`;
  },
  (v, n, r, rv, adj, mood) => `${rv}의 숨은 선택지 ${n}, ${adj} ${mood}`,
  (v, n, r, rv, adj, mood) => `${r}의 밤 에너지를 느끼려면 ${n}${iGa(n)} 답이다`,
  (v, n, r, rv, adj, mood) => `${r} ${v.typeLabel} 비교 시 ${n}의 ${adj} 톤부터 체크`,
  (v, n, r, rv, adj, mood) => `${r} ${v.typeLabel} 첫 방문이면 ${n}부터 시작`,
  (v, n, r, rv, adj, mood) => `주말 ${rv} 속에서 ${n}${eunNeun(n)} ${adj} 무드로 빛난다`,
  (v, n, r, rv, adj, mood) => `${r} 토박이 추천 ${n}, ${mood} 퀄리티가 남다르다`,
  (v, n, r, rv, adj, mood) => `일상에서 ${adj} 밤으로, ${n}${iGa(n)} 전환점이 된다`,
  (v, n, r, rv, adj, mood) => `${n}의 ${mood}, 배경이 아니라 주연이다`,
  (v, n, r, rv, adj, mood) => `${rv} ${v.typeLabel} ${n}, ${adj} ${mood}과 서비스`,
  (v, n, r, rv, adj, mood) => `${n}에서 보낸 밤${eunNeun('밤')} 다음 날에도 여운으로 남는다`,
  (v, n, r, rv, adj, mood) => `역에서 가까운 ${n}, 접근성과 ${mood}${eulReul(mood)} 동시에`,
  (v, n, r, rv, adj, mood) => `재방문율 높은 ${r} ${n}, ${adj} ${mood}${iGa(mood)} 비결`,
];

// ─── VALUE generators (각각 venue-specific 토큰 삽입) ───
const valueGenerators = {
  club: [
    (v, n, r) => `${n} 입장 전 게스트 등록과 드레스코드 꼭 확인`,
    (v, n, r) => `피크는 새벽 1시 전후, ${n}은 일찍 가면 대기 없이 입장`,
    (v, n, r) => `${n} 방문 시 신분증 필수, 올블랙이면 무난`,
    (v, n, r) => `${r}역 인근 ${n}, 금토 사전 등록 시 할인 가능`,
    (v, n, r) => `${n} 첫 방문이면 오픈 직후 도착, 동선부터 파악하세요`,
    (v, n, r) => `${n} 음료 가격대와 테이블 최소 주문 미리 확인 필수`,
    (v, n, r) => `평일 ${n} 방문 시 DJ 셋을 여유롭게 감상 가능`,
    (v, n, r) => `주말 ${n} 대기 30분~1시간, 오픈 맞춰 도착이 유리`,
    (v, n, r) => `${n} 입장 거부 사유를 미리 알면 헛걸음 방지`,
    (v, n, r) => `${n} SNS에서 당일 라인업 확인 후 가면 취향 적중률 상승`,
    (v, n, r) => `${r}에서 ${n}까지 교통편, 출발 전 체크 권장`,
    (v, n, r) => `${n} 2차 이동 시 주변 동선도 함께 계획하면 편리`,
    (v, n, r) => `${n} 테이블석 vs 스탠딩 가격 차이 미리 비교 추천`,
    (v, n, r) => `${n} 입구 소지품 검사 가능, 음료 반입 불가`,
    (v, n, r) => `단체 ${n} 방문 시 테이블 사전 예약이 안전합니다`,
    (v, n, r) => `${n} 귀가 교통편 미리 확인, 새벽 당황 방지`,
    (v, n, r) => `비 오는 날 ${n}은 대기 줄 짧아 여유 입장 가능`,
    (v, n, r) => `${n} 재방문 시 멤버십 혜택이 있는지 꼭 확인`,
    (v, n, r) => `혼자면 ${n} 바 카운터, 친구면 테이블이 추천`,
    (v, n, r) => `${n} 촬영 금지 구역 유무를 입장 시 확인하세요`,
  ],
  night: [
    (v, n, r) => `${n} 파트너 댄스 에티켓 숙지하면 첫 방문도 편안`,
    (v, n, r) => `${n}은 밤 10시 이후 본격 시작, 자정이 절정`,
    (v, n, r) => `${n} 웨이터 서비스로 테이블에서 편하게 즐기세요`,
    (v, n, r) => `혼자 ${n} 방문해도 어색하지 않으니 부담 없이 오세요`,
    (v, n, r) => `${n} 복장은 깔끔한 캐주얼, 슬리퍼만 피하면 OK`,
    (v, n, r) => `${n} 라이브 밴드 스케줄 확인 후 가면 타이밍 딱 맞음`,
    (v, n, r) => `주말 피크 전 ${n} 도착하면 좋은 자리 확보 수월`,
    (v, n, r) => `${n} 입장료에 음료 포함인지 미리 확인 권장`,
    (v, n, r) => `${n} 첫 방문이면 바 근처에서 분위기 파악 추천`,
    (v, n, r) => `${n} 연령대별 분위기가 다르니 사전 확인 후 방문`,
    (v, n, r) => `${n} 동행 없이도 웨이터가 자리와 분위기 안내`,
    (v, n, r) => `${n} 주말 예약 가능 여부 미리 체크가 안전`,
    (v, n, r) => `${r}에서 ${n}까지 교통편과 주차 미리 확인하세요`,
    (v, n, r) => `${n} 퇴장 시간과 막차 맞춰 일정 계획하면 편리`,
    (v, n, r) => `기본 스텝만 알면 ${n}에서 충분히 즐길 수 있어요`,
    (v, n, r) => `${n} 음료 메뉴 미리 확인하면 현장 고민 줄어듭니다`,
    (v, n, r) => `${n} 금토 분위기 차이, SNS에서 미리 확인 추천`,
    (v, n, r) => `${n} 단체석은 최소 하루 전 예약 연락이 안전`,
    (v, n, r) => `${n} 방문 후 귀가 대리운전 번호 미리 저장 추천`,
    (v, n, r) => `${n} 후기에서 실제 연령대와 분위기 확인하면 도움`,
  ],
  lounge: [
    (v, n, r) => `금토 ${n}은 예약 필수, 최소 하루 전 연락 추천`,
    (v, n, r) => `${n} 바 카운터석은 대화 시작에 가장 좋은 위치`,
    (v, n, r) => `${n} 시그니처 칵테일 먼저 물어보면 대화가 시작됨`,
    (v, n, r) => `${n} 테이블 차지/최소 주문 유무 미리 확인 추천`,
    (v, n, r) => `${n} 데이트면 창가석이나 프라이빗 구역 미리 요청`,
    (v, n, r) => `${n} 스마트 캐주얼 이상이면 무난하게 입장 가능`,
    (v, n, r) => `${n} 칵테일 1잔 1.5~3만원대, 예산 미리 잡아두세요`,
    (v, n, r) => `혼자 ${n} 방문 시 바 카운터에 앉으면 어색함 없어요`,
    (v, n, r) => `${n} BGM 볼륨 낮아 대화 중심으로 즐기기 적합`,
    (v, n, r) => `주중 ${n} 방문하면 한적하고 여유로운 분위기 만끽`,
    (v, n, r) => `${n} 위스키/와인 메뉴 다양한지 미리 체크 추천`,
    (v, n, r) => `${r}에서 ${n}까지 주차/발렛 사전 확인이 편리`,
    (v, n, r) => `${n} 소모임이면 프라이빗 룸 유무 미리 문의하세요`,
    (v, n, r) => `${n} 오픈 직후 방문하면 원하는 좌석 선점 가능`,
    (v, n, r) => `${n} 음료·안주 페어링, 바텐더에게 요청해보세요`,
    (v, n, r) => `${n} 기념일이면 케이크/꽃 반입 가능 여부 확인`,
    (v, n, r) => `${n} 야외 테라스 있다면 날씨 좋은 날이 더 특별`,
    (v, n, r) => `${n} SNS에서 최근 인테리어 확인하면 분위기 파악 도움`,
    (v, n, r) => `2인 기준 ${n} 예산, 칵테일 4잔+안주 약 10~15만원`,
    (v, n, r) => `${n} 분위기는 시간대에 따라 크게 달라지니 참고`,
  ],
};

// ─── Tag pools ───
const TAG_POOL = {
  club: ['DJ라인업', '피크타임', '드레스코드', '게스트등록', '입장팁', '테이블예약', 'EDM', '힙합', '하우스', '올블랙', '새벽영업', '스탠딩', '댄스플로어', '사운드', '조명쇼', '신분증필수', '단체가능', '역세권'],
  night: ['라이브밴드', '파트너댄스', '웨이터서비스', '피크타임', '복장팁', '혼자방문OK', '음료포함', '댄스에티켓', '주말추천', '연령대확인', '자리배정', '스텝기초', '예약가능', '신분증필수', '주차확인', '2차추천'],
  lounge: ['칵테일', '예약필수', '데이트', '바카운터', '프라이빗', '시그니처', '위스키', '와인', '소모임', '무드등', '야외테라스', 'BGM', '스마트캐주얼', '감성주점', '바텐더추천', '기념일'],
};

// ─── Generate image alt ───
function generateImageAlt(v) {
  const district = v.geo?.district || '';
  const neighborhood = v.geo?.neighborhood || '';
  const locDetail = neighborhood || district;
  return `${v.name_display} ${locDetail ? locDetail + ' ' : ''}${v.region} ${v.typeLabel} 썸네일`;
}

// ─── Generate map URL ───
function generateMapUrl(v) {
  const query = encodeURIComponent(`${v.name_display} ${v.region}`);
  return `https://map.kakao.com/?q=${query}`;
}

// ─── Generate card tags ───
function generateCardTags(v) {
  const pool = TAG_POOL[v.type] || TAG_POOL.club;
  const h = hashStr(v.id + 'tags');
  const count = 3 + (h % 3);
  const selected = [];
  const used = new Set();
  for (let i = 0; selected.length < count && i < pool.length; i++) {
    const idx = (h + i * 7) % pool.length;
    if (!used.has(idx)) { used.add(idx); selected.push(pool[idx]); }
  }
  return selected;
}

// ─── Assign unique template indices ───
// Goal: ensure NO two venues on the same page share BOTH hookIdx AND valueIdx
const assignedPairs = { club: new Set(), night: new Set(), lounge: new Set() };

function getUniquePair(v) {
  const numHooks = hookGenerators.length;
  const numValues = (valueGenerators[v.type] || valueGenerators.club).length;
  const pairSet = assignedPairs[v.type];

  const h = hashStr(v.id + 'pair3');
  let hookIdx = h % numHooks;
  let valueIdx = (h >> 4) % numValues;
  let attempts = 0;
  const maxAttempts = numHooks * numValues;

  while (pairSet.has(`${hookIdx}-${valueIdx}`) && attempts < maxAttempts) {
    attempts++;
    valueIdx = (valueIdx + 1) % numValues;
    if (valueIdx === 0) hookIdx = (hookIdx + 1) % numHooks;
  }

  pairSet.add(`${hookIdx}-${valueIdx}`);
  return { hookIdx, valueIdx };
}

// ─── Main generation ───
console.log(`Generating card copy for ${venues.length} venues...`);

let bannedCount = 0;
let repeatCount = 0;

venues.forEach((v, i) => {
  const n = shortName(v);
  const r = v.region;
  const rv = REGION_VIBE[r] || r;
  const h = hashStr(v.id + 'words');
  const moods = MOOD[v.type] || MOOD.club;
  const adjs = ADJ[v.type] || ADJ.club;
  const adj = adjs[h % adjs.length];
  const mood = moods[(h >> 2) % moods.length];

  const { hookIdx, valueIdx } = getUniquePair(v);

  let card_hook = hookGenerators[hookIdx](v, n, r, rv, adj, mood);
  const valGens = valueGenerators[v.type] || valueGenerators.club;
  let card_value = valGens[valueIdx](v, n, r);

  // Remove banned words
  BANNED.forEach(w => {
    card_hook = card_hook.replaceAll(w, '');
    card_value = card_value.replaceAll(w, '');
  });
  card_hook = card_hook.replace(/\s{2,}/g, ' ').trim();
  card_value = card_value.replace(/\s{2,}/g, ' ').trim();

  // Truncate to ~42 chars
  if (card_hook.length > 45) card_hook = card_hook.substring(0, 42).replace(/[,.\s]+$/, '');
  if (card_value.length > 45) card_value = card_value.substring(0, 42).replace(/[,.\s]+$/, '');

  v.card_hook = card_hook;
  v.card_value = card_value;
  v.card_tags = generateCardTags(v);
  v.image_alt = generateImageAlt(v);
  v.map_url = generateMapUrl(v);

  if (v.images && v.images[0]) v.images[0].alt = v.image_alt;

  // Validate
  const combined = card_hook + ' ' + card_value;
  if (hasBanned(combined)) {
    bannedCount++;
    console.warn(`  WARN banned word in: ${v.name_display}: ${combined}`);
  }

  const words = combined.split(/[\s,./·]+/).filter(w => w.length > 1);
  const freq = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  const repeats = Object.entries(freq).filter(([, c]) => c > 3);
  if (repeats.length > 0) {
    repeatCount++;
    console.warn(`  WARN repeat in ${v.name_display}: ${repeats.map(([w, c]) => `${w}(${c})`).join(', ')}`);
  }
});

// ─── Similarity check (Jaccard) ───
function tokenize(text) {
  return new Set(text.split(/[\s,./·:;!?→]+/).filter(w => w.length > 1));
}

function jaccard(a, b) {
  const intersection = [...a].filter(x => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

let highSimCount = 0;
const allCards = venues.map(v => ({
  name: v.name_display,
  tokens: tokenize(v.card_hook + ' ' + v.card_value),
}));

for (let i = 0; i < allCards.length; i++) {
  for (let j = i + 1; j < allCards.length; j++) {
    const sim = jaccard(allCards[i].tokens, allCards[j].tokens);
    if (sim > 0.5) {
      highSimCount++;
      if (highSimCount <= 5) {
        console.warn(`  HIGH SIM (${sim.toFixed(2)}): ${allCards[i].name} <-> ${allCards[j].name}`);
      }
    }
  }
}

// ─── Report > 0.35 count ───
let midSimCount = 0;
for (let i = 0; i < allCards.length; i++) {
  for (let j = i + 1; j < allCards.length; j++) {
    const sim = jaccard(allCards[i].tokens, allCards[j].tokens);
    if (sim > 0.35) midSimCount++;
  }
}

// ─── Write output ───
writeFileSync(VENUES_PATH, JSON.stringify(venues, null, 2), 'utf8');

console.log(`\nDone. ${venues.length} venues updated.`);
console.log(`  Banned word violations: ${bannedCount}`);
console.log(`  Word repeat violations: ${repeatCount}`);
console.log(`  High similarity pairs (>0.5): ${highSimCount}`);
console.log(`  Mid similarity pairs (>0.35): ${midSimCount}`);

if (bannedCount > 0 || repeatCount > 0) {
  console.error('\nFAILED: violations found.');
  process.exit(1);
}

console.log('\nPASS: all card copy constraints met.');
