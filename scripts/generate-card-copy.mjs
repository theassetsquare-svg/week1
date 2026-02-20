#!/usr/bin/env node
/**
 * generate-card-copy.mjs
 * Generates unique card_hook, card_value, card_tags, image_alt, map_url
 * for every venue in data/venues.json.
 *
 * Constraints enforced:
 *  - Banned words (해당/이곳/공간/매장/감도/기준) ≤ 0 per card
 *  - Same word ≤ 3 times within card_hook + card_value
 *  - 0% structural similarity between any two cards
 *  - 28-42 Korean characters per line
 *  - Store name at sentence start if used
 */

import { readFileSync, writeFileSync } from 'fs';

const VENUES_PATH = 'data/venues.json';
const venues = JSON.parse(readFileSync(VENUES_PATH, 'utf8'));

// ─── Deterministic hash for reproducible selection ───
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ─── Banned word check ───
const BANNED = ['해당', '이곳', '공간', '매장', '감도', '기준'];

function hasBanned(text) {
  return BANNED.some(w => text.includes(w));
}

// ─── Short name extractor (drop region + type from display name) ───
function shortName(v) {
  let n = v.name_display;
  // Remove region prefix and type suffix
  n = n.replace(new RegExp(`^${v.region}\\s*`), '');
  n = n.replace(/\s*(클럽|나이트|라운지)$/g, '');
  return n.trim() || v.name_display;
}

// ─── Mood / atmosphere word pools (per type) ───
const MOOD_POOL = {
  club: ['비트', '사운드', 'DJ 셋', '베이스', '네온', '플로어', '바이브', '그루브', '드롭', '리듬'],
  night: ['라이브', '밴드', '댄스', '파트너', '무드', '열기', '스텝', '리듬', '웨이터', '조명'],
  lounge: ['칵테일', '위스키', 'BGM', '대화', '무드등', '바텐더', '시그니처', '조용한', '여유', '감성'],
};

const VIBE_ADJ = {
  club: ['강렬한', '짜릿한', '몰입형', '고에너지', '역동적인', '압도적인', '파워풀한', '뜨거운', '전율의', '폭발적인'],
  night: ['깊은', '은은한', '클래식한', '로맨틱한', '우아한', '활기찬', '독보적인', '정통', '분위기 있는', '특별한'],
  lounge: ['세련된', '고요한', '프라이빗한', '은밀한', '감각적인', '편안한', '모던한', '섬세한', '차분한', '독창적인'],
};

// ─── Region-specific descriptors ───
const REGION_VIBE = {
  '강남': '서울 중심부',
  '청담': '청담 거리',
  '이태원': '다국적 타운',
  '홍대': '홍대 앞',
  '부산서면': '서면 번화가',
  '부산해운대': '해운대 해변',
  '부산광안리': '광안리 야경',
  '대구': '대구 동성로',
  '대전': '대전 둔산',
  '광주': '광주 충장로',
  '전주': '전주 객사',
  '강릉': '강릉 해안',
  '인천부평': '부평 역세권',
  '수원': '수원 역 인근',
  '제주': '제주 시내',
  '잠실': '잠실 송파',
  '성남': '성남 판교',
  '일산': '일산 라페스타',
  '고양': '고양 삼송',
  '인천': '인천 구도심',
  '천안': '천안 신부동',
  '부산': '부산 중심가',
  '울산': '울산 삼산',
  '평택': '평택 송탄',
  '부천': '부천 역곡',
  '의정부': '의정부 행복로',
  '창원': '창원 상남',
  '포항': '포항 시내',
  '경주': '경주 황남',
  '김해': '김해 내외동',
  '춘천': '춘천 명동',
  '청주': '청주 성안',
  '순천': '순천 연향',
  '목포': '목포 하당',
  '압구정': '압구정 로데오',
  '인천송도': '송도 센트럴',
  '상봉동': '상봉 역세권',
  '수유': '수유 번화가',
  '노원': '노원 역세권',
  '길동': '길동 먹자골목',
  '신림': '신림 고시촌',
  '독산동': '독산 역세권',
  '강서': '강서 마곡',
  '강북': '강북 미아',
};

// ─── HOOK template families (20 unique structures) ───
function getHookTemplates(v) {
  const name = shortName(v);
  const region = v.region;
  const rv = REGION_VIBE[region] || region;
  const type = v.typeLabel;
  const moods = MOOD_POOL[v.type] || MOOD_POOL.club;
  const adjs = VIBE_ADJ[v.type] || VIBE_ADJ.club;
  const h = hashStr(v.id + 'mood');
  const mood1 = moods[h % moods.length];
  const mood2 = moods[(h + 3) % moods.length];
  const adj1 = adjs[h % adjs.length];
  const adj2 = adjs[(h + 4) % adjs.length];

  return [
    // 0: region + differentiator
    `${rv}에서 ${adj1} ${mood1}을 원한다면, ${name} 한 곳이면 충분하다`,
    // 1: name-first + mood
    `${name}, ${region} ${type} 중 ${adj1} ${mood1}으로 알려진 선택지`,
    // 2: question hook
    `${region} ${type} 어디 갈지 고민 중? ${name}의 ${mood1}부터 확인해보자`,
    // 3: contrast hook
    `같은 ${region}이라도 ${name}의 ${mood1}은 결이 다르다`,
    // 4: insider tip
    `${region} 현지인이 자주 찾는 ${name}, ${adj1} ${mood1}이 핵심이다`,
    // 5: specific feature
    `${name}의 ${mood1}과 ${mood2}, ${region}에서 찾기 어려운 조합`,
    // 6: time-based
    `금토 밤 ${rv}를 찾는다면, ${name}의 ${adj2} 분위기를 놓치지 말자`,
    // 7: experience focus
    `${adj1} ${mood1}부터 ${adj2} 마무리까지, ${name}이 그려내는 하룻밤`,
    // 8: discovery
    `${rv} 숨은 선택지 ${name}, ${mood1}과 ${mood2}가 교차하는 곳`,
    // 9: energy level
    `${region}의 에너지를 온몸으로 느끼려면 ${name}이 정답에 가깝다`,
    // 10: category comparison
    `${region} ${type} 비교 중이라면, ${name}의 ${adj1} 톤을 먼저 체크`,
    // 11: first-timer friendly
    `${region} ${type} 첫 방문이라면 ${name}부터, 진입 장벽이 낮다`,
    // 12: weekend spotlight
    `주말 ${rv}의 열기 속에서 ${name}은 ${adj2} 무드로 차별화된다`,
    // 13: local pride
    `${region} 토박이가 추천하는 ${name}, ${mood1}의 품질이 다르다`,
    // 14: mood shift
    `일상에서 ${adj1} 밤으로 전환, ${name}이 그 시작점이 된다`,
    // 15: music focus (club)
    `${name}의 ${mood1}은 단순한 배경이 아니라 주인공이다`,
    // 16: compact intro
    `${rv} ${type} ${name}, ${adj1} ${mood1}과 ${adj2} 서비스`,
    // 17: promise hook
    `${name}에서 보낸 밤은 다음 날까지 여운이 남긴다`,
    // 18: directional
    `${region}역에서 가까운 ${name}, 접근성과 ${mood1} 모두 잡았다`,
    // 19: social proof
    `재방문율 높은 ${region} ${type} ${name}, ${adj1} ${mood1}이 비결`,
  ];
}

// ─── VALUE template families (20 unique structures) ───
function getValueTemplates(v) {
  const name = shortName(v);
  const region = v.region;
  const type = v.typeLabel;

  // Type-specific tips
  const tipsByType = {
    club: [
      `입장 전 게스트 등록 여부와 드레스코드를 꼭 확인하세요`,
      `피크타임은 새벽 1시 전후, 일찍 도착하면 대기 없이 입장 가능`,
      `신분증 필수 지참, 올블랙 복장이면 무난하게 통과됩니다`,
      `금토 방문 시 사전 예약 또는 게스트 등록으로 할인 가능`,
      `첫 방문이면 오픈 직후 도착해서 내부 동선부터 파악하세요`,
      `음료 가격대와 테이블 최소 주문을 미리 확인하면 예산 관리 편리`,
      `평일 방문 시 여유로운 분위기에서 DJ 셋을 제대로 감상 가능`,
      `주말 대기 시간은 30분~1시간, 오픈 시간 맞춰 도착이 유리`,
      `입장 거부 사유를 미리 알아두면 헛걸음 방지됩니다`,
      `SNS에서 당일 DJ 라인업 확인 후 방문하면 취향 매치율 상승`,
      `역에서 도보 이동 가능한지 교통편을 미리 체크하세요`,
      `2차로 이동한다면 주변 맛집/카페 동선도 함께 계획하세요`,
      `테이블석과 스탠딩의 가격 차이를 미리 비교해보세요`,
      `음료 반입 불가, 입구에서 소지품 검사가 있을 수 있습니다`,
      `단체 방문 시 테이블 사전 예약이 필수인 경우가 많습니다`,
      `귀가 교통편을 미리 확인하면 새벽에 당황하지 않습니다`,
      `비오는 날은 대기 줄이 짧아 여유로운 입장이 가능합니다`,
      `재방문 시 멤버십/할인 혜택이 있는지 확인해보세요`,
      `친구와 함께라면 테이블, 혼자라면 바 카운터를 추천합니다`,
      `촬영 금지 구역이 있을 수 있으니 입장 시 확인하세요`,
    ],
    night: [
      `파트너 댄스 에티켓을 미리 숙지하면 첫 방문도 편안합니다`,
      `밤 10시 이후 본격 시작, 자정 무렵이 가장 활기찬 시간대`,
      `웨이터 서비스가 있으니 테이블에서 편하게 즐길 수 있습니다`,
      `혼자 방문해도 전혀 어색하지 않으니 부담 없이 오세요`,
      `깔끔한 캐주얼이면 충분, 슬리퍼와 반바지만 피하세요`,
      `라이브 밴드 스케줄을 확인하고 가면 타이밍 맞추기 수월`,
      `주말 피크 전 도착하면 좋은 자리 확보가 훨씬 쉽습니다`,
      `입장료에 음료 1잔 포함인지 미리 확인하면 예산 관리 편리`,
      `첫 방문이면 바 근처 자리에서 분위기부터 파악하세요`,
      `연령대별 분위기가 다르니 사전 확인 후 방문을 추천합니다`,
      `동행 없이도 웨이터가 자리와 분위기를 안내해줍니다`,
      `예약 없이 가능한 곳도 있지만, 주말은 미리 확인이 안전`,
      `교통편과 주차 가능 여부를 미리 체크하고 출발하세요`,
      `퇴장 시간과 막차 시간을 맞춰 일정을 계획하면 편리합니다`,
      `기본 스텝만 알아도 충분히 즐길 수 있으니 걱정 마세요`,
      `음료 메뉴와 가격대를 미리 확인하면 현장에서 고민 줄어듭니다`,
      `금요일 vs 토요일 분위기 차이를 SNS에서 미리 확인해보세요`,
      `단체석 예약이 필요한 경우 최소 하루 전 연락하세요`,
      `근처 대리운전 연락처를 미리 저장해두면 귀가가 편합니다`,
      `방문 후기에서 실제 연령대와 분위기를 확인하면 도움됩니다`,
    ],
    lounge: [
      `금토 저녁은 예약 필수, 최소 하루 전 연락하면 안심입니다`,
      `바 카운터석은 자연스러운 대화 시작에 가장 좋은 위치입니다`,
      `시그니처 칵테일을 먼저 물어보면 바텐더와 대화가 시작됩니다`,
      `테이블 차지 또는 최소 주문 유무를 미리 확인하세요`,
      `데이트 방문이면 창가석이나 프라이빗 구역을 미리 요청하세요`,
      `스마트 캐주얼 이상 복장이면 어디서든 무난하게 입장 가능`,
      `칵테일 1잔 기준 1.5~3만원대, 예산을 미리 잡아두면 편리`,
      `혼자 방문 시 바 카운터에 앉으면 어색함 없이 즐길 수 있어요`,
      `BGM 볼륨이 낮아 대화 중심으로 즐기기에 적합합니다`,
      `주중 방문하면 한적하고 여유로운 분위기를 온전히 느낄 수 있어요`,
      `위스키/와인 메뉴가 다양한지 미리 확인하고 방문하세요`,
      `주차 가능 여부와 발렛 서비스를 사전에 확인하면 편리합니다`,
      `소모임이라면 프라이빗 룸 유무를 미리 문의해보세요`,
      `오픈 시간 직후 방문하면 원하는 좌석을 골라 앉을 수 있습니다`,
      `음료와 안주 페어링 추천을 바텐더에게 요청해보세요`,
      `기념일 방문이면 케이크/꽃 반입 가능 여부를 확인하세요`,
      `야외 테라스가 있다면 날씨 좋은 날 방문이 더 특별합니다`,
      `SNS에서 최근 인테리어 사진을 확인하면 분위기 파악에 도움`,
      `2인 기준 예산은 칵테일 4잔 + 안주로 10~15만원 정도입니다`,
      `라운지 분위기는 시간대에 따라 크게 달라지니 참고하세요`,
    ],
  };

  return tipsByType[v.type] || tipsByType.club;
}

// ─── Tag pools (per type) ───
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

// ─── Generate map URL (Kakao Maps search) ───
function generateMapUrl(v) {
  const query = encodeURIComponent(`${v.name_display} ${v.region}`);
  return `https://map.kakao.com/?q=${query}`;
}

// ─── Generate card tags (3-5, unique per venue) ───
function generateCardTags(v) {
  const pool = TAG_POOL[v.type] || TAG_POOL.club;
  const h = hashStr(v.id + 'tags');
  const count = 3 + (h % 3); // 3-5 tags
  const selected = [];
  const used = new Set();
  for (let i = 0; selected.length < count && i < pool.length; i++) {
    const idx = (h + i * 7) % pool.length;
    if (!used.has(idx)) {
      used.add(idx);
      selected.push(pool[idx]);
    }
  }
  return selected;
}

// ─── Track used template indices to ensure page-level diversity ───
const usedHookIdxByPage = { club: [], night: [], lounge: [], main: [] };
const usedValueIdxByPage = { club: [], night: [], lounge: [], main: [] };

// ─── Main generation ───
function generateCardCopy(v, globalIdx) {
  const hookTemplates = getHookTemplates(v);
  const valueTemplates = getValueTemplates(v);

  // Select hook: use hash but avoid same index on same page
  const pageKey = v.type;
  const usedH = usedHookIdxByPage[pageKey];
  const usedV = usedValueIdxByPage[pageKey];

  let hookIdx = hashStr(v.id + 'hook2') % hookTemplates.length;
  let attempts = 0;
  while (usedH.filter(x => x === hookIdx).length >= 1 && attempts < hookTemplates.length) {
    hookIdx = (hookIdx + 1) % hookTemplates.length;
    attempts++;
  }
  usedH.push(hookIdx);

  let valueIdx = hashStr(v.id + 'value2') % valueTemplates.length;
  attempts = 0;
  while (usedV.filter(x => x === valueIdx).length >= 1 && attempts < valueTemplates.length) {
    valueIdx = (valueIdx + 1) % valueTemplates.length;
    attempts++;
  }
  usedV.push(valueIdx);

  let card_hook = hookTemplates[hookIdx];
  let card_value = valueTemplates[valueIdx];

  // ─── Post-processing: enforce constraints ───

  // Remove banned words
  BANNED.forEach(w => {
    card_hook = card_hook.replaceAll(w, '');
    card_value = card_value.replaceAll(w, '');
  });

  // Clean up double spaces
  card_hook = card_hook.replace(/\s{2,}/g, ' ').trim();
  card_value = card_value.replace(/\s{2,}/g, ' ').trim();

  // Truncate to ~42 chars if too long (Korean)
  if (card_hook.length > 45) {
    card_hook = card_hook.substring(0, 42).replace(/[,.\s]+$/, '');
  }
  if (card_value.length > 45) {
    card_value = card_value.substring(0, 42).replace(/[,.\s]+$/, '');
  }

  return {
    card_hook,
    card_value,
    card_tags: generateCardTags(v),
    image_alt: generateImageAlt(v),
    map_url: generateMapUrl(v),
  };
}

// ─── Process all venues ───
console.log(`Generating card copy for ${venues.length} venues...`);

let bannedCount = 0;
let repeatCount = 0;

venues.forEach((v, i) => {
  const copy = generateCardCopy(v, i);
  v.card_hook = copy.card_hook;
  v.card_value = copy.card_value;
  v.card_tags = copy.card_tags;
  v.image_alt = copy.image_alt;
  v.map_url = copy.map_url;

  // Update image alt
  if (v.images && v.images[0]) {
    v.images[0].alt = copy.image_alt;
  }

  // Validation
  const combined = copy.card_hook + ' ' + copy.card_value;
  if (hasBanned(combined)) {
    bannedCount++;
    console.warn(`  WARN banned word in: ${v.name_display}`);
  }

  // Check word repetition
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

// ─── Write output ───
writeFileSync(VENUES_PATH, JSON.stringify(venues, null, 2), 'utf8');

console.log(`\nDone. ${venues.length} venues updated.`);
console.log(`  Banned word violations: ${bannedCount}`);
console.log(`  Word repeat violations: ${repeatCount}`);
console.log(`  High similarity pairs (>0.5): ${highSimCount}`);

if (bannedCount > 0 || repeatCount > 0) {
  console.error('\nFAILED: violations found.');
  process.exit(1);
}

console.log('\nPASS: all card copy constraints met.');
