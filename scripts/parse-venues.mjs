#!/usr/bin/env node
/**
 * parse-venues.mjs - v2
 * Generates venues.json with UNIQUE Korean content per venue.
 * Each venue gets deterministically unique content via seed + index-based diversification.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const RAW_PATH = join(ROOT, 'data', 'venues.raw.txt');
const OUT_PATH = join(ROOT, 'data', 'venues.json');

// ─── Seeded PRNG ───
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function pick(arr, rng) { return arr[Math.floor(rng() * arr.length)]; }
function pickN(arr, n, rng) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, n);
}

// Per-section deterministic selector - prevents same-idx venues from colliding across all sections
function sectionSel(idx, sectionId) {
  const seeds = { safety: 7, music: 11, atmo1: 13, atmo2: 17, atmo3: 19, timeline: 23, scene4: 29, scene5: 31, faq: 37, check: 41 };
  const s = seeds[sectionId] || 3;
  return Math.abs((idx * s + Math.floor(s / 2)) | 0);
}

// Hash-based selection: picks from array using venue name + key for guaranteed uniqueness
function hPick(arr, name, key) {
  return arr[hashStr(name + key) % arr.length];
}

// Compositional builder: selects one template from each pool by hash, joins them
function compose(name, sectionKey, pools) {
  return pools.map((pool, i) => {
    return pool[hashStr(name + sectionKey + String(i)) % pool.length];
  }).join(' ');
}

// Per-venue variables (hash-based, guaranteed different from idx-based)
function getVenueVars(v) {
  const name = v.displayName;
  const a = SIGNATURE_ADJECTIVES[hashStr(name + 'adj') % SIGNATURE_ADJECTIVES.length];
  const verb = VENUE_VERBS[hashStr(name + 'verb') % VENUE_VERBS.length];
  const timeExpr = TIME_EXPRESSIONS[hashStr(name + 'time') % TIME_EXPRESSIONS.length];
  const rf = getRegionFlavor(v.region);
  return { name, region: v.region, typeKr: TYPE_LABELS[v.type], adj1: a[0], adj2: a[1], adj3: a[2], adj4: a[3], adj5: a[4], verb, timeExpr, rf };
}

// ─── Parse raw file ───
function parseRaw(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let currentType = null;
  const venues = [];
  for (const line of lines) {
    if (/^CLUB:/i.test(line)) { currentType = 'club'; continue; }
    if (/^NIGHT:/i.test(line)) { currentType = 'night'; continue; }
    if (/^LOUNGE/i.test(line)) { currentType = 'lounge'; continue; }
    if (line.startsWith('-')) {
      venues.push({ type: currentType, name_input: line.replace(/^-\s*/, '').trim() });
    } else if (currentType) {
      venues.push({ type: currentType, name_input: line });
    }
  }
  return venues;
}

// ─── Region mapping ───
const REGION_MAP = {
  '강남': { slug: 'gangnam', display: '강남' },
  '청담': { slug: 'cheongdam', display: '청담' },
  '이태원': { slug: 'itaewon', display: '이태원' },
  '홍대': { slug: 'hongdae', display: '홍대' },
  '압구정': { slug: 'apgujeong', display: '압구정' },
  '상봉동': { slug: 'sangbong', display: '상봉동' },
  '수유': { slug: 'suyu', display: '수유' },
  '노원': { slug: 'nowon', display: '노원' },
  '길동': { slug: 'gildong', display: '길동' },
  '신림': { slug: 'sinlim', display: '신림' },
  '독산동': { slug: 'doksan', display: '독산동' },
  '강서': { slug: 'gangseo', display: '강서' },
  '강북': { slug: 'gangbuk', display: '강북' },
  '잠실': { slug: 'jamsil', display: '잠실' },
  '성남': { slug: 'seongnam', display: '성남' },
  '일산': { slug: 'ilsan', display: '일산' },
  '고양': { slug: 'goyang', display: '고양' },
  '인천': { slug: 'incheon', display: '인천' },
  '인천부평': { slug: 'incheon-bupyeong', display: '인천부평' },
  '인천송도': { slug: 'incheon-songdo', display: '인천송도' },
  '수원': { slug: 'suwon', display: '수원' },
  '천안': { slug: 'cheonan', display: '천안' },
  '대구': { slug: 'daegu', display: '대구' },
  '대전': { slug: 'daejeon', display: '대전' },
  '부산': { slug: 'busan', display: '부산' },
  '부산서면': { slug: 'busan-seomyeon', display: '부산서면' },
  '부산해운대': { slug: 'busan-haeundae', display: '부산해운대' },
  '부산광안리': { slug: 'busan-gwangalli', display: '부산광안리' },
  '광주': { slug: 'gwangju', display: '광주' },
  '울산': { slug: 'ulsan', display: '울산' },
  '전주': { slug: 'jeonju', display: '전주' },
  '창원': { slug: 'changwon', display: '창원' },
  '포항': { slug: 'pohang', display: '포항' },
  '경주': { slug: 'gyeongju', display: '경주' },
  '김해': { slug: 'gimhae', display: '김해' },
  '춘천': { slug: 'chuncheon', display: '춘천' },
  '강릉': { slug: 'gangneung', display: '강릉' },
  '청주': { slug: 'cheongju', display: '청주' },
  '순천': { slug: 'suncheon', display: '순천' },
  '목포': { slug: 'mokpo', display: '목포' },
  '제주': { slug: 'jeju', display: '제주' },
  '평택': { slug: 'pyeongtaek', display: '평택' },
  '부천': { slug: 'bucheon', display: '부천' },
  '의정부': { slug: 'uijeongbu', display: '의정부' },
};

const TYPE_LABELS = { club: '클럽', night: '나이트', lounge: '라운지' };
const TYPE_PATH = { club: 'club', night: 'night', lounge: 'lounge' };

function extractRegionAndName(input) {
  for (const [prefix, info] of Object.entries(REGION_MAP)) {
    if (input.startsWith(prefix + ' ')) {
      return { region: info.display, regionSlug: info.slug, displayName: input.slice(prefix.length + 1).trim() };
    }
  }
  return { region: '강남', regionSlug: 'gangnam', displayName: input };
}

function toSlug(s) {
  return s.replace(/[^a-zA-Z0-9가-힣]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
}

const CATEGORY_TOKENS = new Set(['클럽', '나이트', '라운지']);
function toUrlSlug(venueSlug) {
  const parts = venueSlug.split('-');
  const cleaned = parts.filter(p => !CATEGORY_TOKENS.has(p));
  return cleaned.length > 0 ? cleaned.join('-') : venueSlug;
}

// ─── 12 Story frames ───
const STORY_FRAMES = [
  { id: 'newcomer', pov: '2nd', tone: '설렘과 긴장', style: '첫 방문자의 눈' },
  { id: 'regular', pov: '1st', tone: '여유와 추억', style: '단골의 회상' },
  { id: 'observer', pov: '3rd', tone: '관찰자의 시선', style: '밤의 인류학자' },
  { id: 'group', pov: '1st-plural', tone: '우정과 웃음', style: '친구들과의 밤' },
  { id: 'date', pov: '2nd', tone: '로맨틱 서스펜스', style: '특별한 밤' },
  { id: 'solo', pov: '1st', tone: '자유와 발견', style: '혼자만의 탐험' },
  { id: 'birthday', pov: '3rd', tone: '축하와 환희', style: '생일 파티의 밤' },
  { id: 'reunion', pov: '1st-plural', tone: '재회의 감동', style: '오랜만의 만남' },
  { id: 'afterwork', pov: '2nd', tone: '해방과 전환', style: '퇴근 후의 변신' },
  { id: 'weekend', pov: '1st', tone: '기대와 흥분', style: '주말의 시작' },
  { id: 'traveler', pov: '2nd', tone: '호기심과 모험', style: '여행자의 밤' },
  { id: 'photographer', pov: '3rd', tone: '빛과 그림자', style: '렌즈 너머의 밤' },
];

// ─── Per-venue signature word banks ───
const SIGNATURE_ADJECTIVES = [
  ['현란한', '압도적인', '몽환적인', '역동적인', '강렬한'],
  ['은은한', '세련된', '고급스러운', '감미로운', '절제된'],
  ['파격적인', '대담한', '실험적인', '전위적인', '과감한'],
  ['클래식한', '전통적인', '품격 있는', '정갈한', '묵직한'],
  ['미래적인', '혁신적인', '첨단의', '신선한', '진보적인'],
  ['자연스러운', '편안한', '따스한', '포근한', '아늑한'],
  ['화려한', '눈부신', '찬란한', '번쩍이는', '빛나는'],
  ['심오한', '깊이 있는', '철학적인', '명상적인', '사색적인'],
  ['활기찬', '에너지 넘치는', '생동감 있는', '활발한', '열정적인'],
  ['우아한', '기품 있는', '고상한', '단아한', '품위 있는'],
  ['독창적인', '유일무이한', '특별한', '비범한', '독보적인'],
  ['섬세한', '정교한', '디테일한', '꼼꼼한', '세심한'],
  ['자유로운', '개방적인', '탈고정적인', '해방적인', '구속 없는'],
  ['시적인', '문학적인', '낭만적인', '서정적인', '감성적인'],
  ['도시적인', '어반한', '메트로적인', '모던한', '세계적인'],
  ['극적인', '드라마틱한', '영화적인', '서사적인', '장엄한'],
  ['순수한', '투명한', '청명한', '깨끗한', '순결한'],
  ['풍부한', '다채로운', '그윽한', '진한', '묵직한'],
  ['대담한', '거침없는', '솔직한', '직설적인', '당당한'],
  ['신비로운', '미스터리한', '불가사의한', '환상적인', '마법적인'],
  ['세련된', '정돈된', '깔끔한', '단정한', '짜임새 있는'],
  ['자극적인', '도전적인', '선정적인', '선동적인', '충격적인'],
  ['조화로운', '균형 잡힌', '안정적인', '평화로운', '온화한'],
  ['광활한', '방대한', '거대한', '웅장한', '장대한'],
  ['집중적인', '밀도 높은', '응축된', '압축적인', '함축적인'],
  ['유쾌한', '코믹한', '재미있는', '즐거운', '흥겨운'],
];

const VENUE_VERBS = [
  '물들인다', '뒤흔든다', '감싸안는다', '사로잡는다', '이끈다',
  '깨운다', '자극한다', '일깨운다', '불태운다', '빚어낸다',
  '끌어당긴다', '유혹한다', '초대한다', '환기시킨다', '고취시킨다',
  '충전시킨다', '변화시킨다', '전환시킨다', '새롭게 한다', '뒤바꾼다',
  '채워넣는다', '완성시킨다', '장식한다', '연출한다', '설계한다',
  '증폭시킨다',
];

const TIME_EXPRESSIONS = [
  '해가 지는 순간부터', '네온이 켜지는 그 시각부터', '도시의 불빛이 반짝이기 시작하면',
  '퇴근길 인파가 사라진 뒤', '밤공기가 차갑게 식어갈 때', '어둠이 내려앉는 저녁',
  '가로등 불빛 아래서', '시계가 열 시를 가리키면', '금요일 저녁 종이 울리고 나면',
  '주말의 서곡이 시작되면', '달이 떠오르는 그 무렵', '도심의 소음이 음악으로 바뀔 때',
  '하루의 긴장이 풀리는 시간', '밤의 문턱에 서는 순간', '황혼이 짙어지면',
  '별이 하나둘 나타날 때쯤', '도시가 또 다른 얼굴을 보이면', '시곗바늘이 밤을 향해 돌면',
  '저녁 공기가 달콤해지는 시간', '도시의 낮이 밤에게 자리를 내줄 때',
  '하루의 마지막 햇살이 사라지면', '밤의 첫 번째 숨결이 시작되면',
  '거리의 색감이 바뀌는 그 시간', '일상과 밤의 경계에 서면',
  '도시의 맥박이 바뀌는 순간', '밤의 서막이 오르면',
];

// ─── Region-specific flavor pools for uniqueness ───
const REGION_FLAVORS = {
  '강남': { vibe: '세련된 도심', landmark: '테헤란로', transport: '강남역', food: '역삼동 맛집거리', adj: '트렌디한' },
  '청담': { vibe: '럭셔리한 거리', landmark: '청담사거리', transport: '청담역', food: '명품거리 레스토랑', adj: '고급스러운' },
  '이태원': { vibe: '글로벌 감성', landmark: '이태원로', transport: '이태원역', food: '경리단길 맛집', adj: '이국적인' },
  '홍대': { vibe: '자유로운 예술가의 거리', landmark: '홍대거리', transport: '홍대입구역', food: '연남동 카페', adj: '힙한' },
  '압구정': { vibe: '세련된 갤러리 타운', landmark: '압구정로데오', transport: '압구정역', food: '로데오 다이닝', adj: '감각적인' },
  '상봉동': { vibe: '로컬 밤문화 중심지', landmark: '상봉역 일대', transport: '상봉역', food: '상봉 먹자골목', adj: '정겨운' },
  '수유': { vibe: '활기찬 주거 밀집지', landmark: '수유시장 근처', transport: '수유역', food: '수유리 맛집', adj: '서민적인' },
  '노원': { vibe: '젊은 에너지의 베드타운', landmark: '노원역 일대', transport: '노원역', food: '노원 먹자골목', adj: '활기찬' },
  '길동': { vibe: '조용한 주택가 속 밤', landmark: '길동사거리', transport: '굽은다리역', food: '길동 로컬 맛집', adj: '은밀한' },
  '신림': { vibe: '대학가 인근 번화가', landmark: '신림역 일대', transport: '신림역', food: '신림동 순대골목', adj: '젊은' },
  '독산동': { vibe: '숨겨진 로컬 스팟', landmark: '독산역 근처', transport: '독산역', food: '독산동 먹자골목', adj: '소박한' },
  '강서': { vibe: '서울 서쪽의 밤', landmark: '발산역 일대', transport: '발산역', food: '마곡 다이닝', adj: '편안한' },
  '강북': { vibe: '전통과 현대가 공존', landmark: '미아사거리', transport: '미아역', food: '강북 로컬 맛집', adj: '투박한' },
  '잠실': { vibe: '랜드마크 옆 밤문화', landmark: '롯데타워 일대', transport: '잠실역', food: '송리단길', adj: '화려한' },
  '성남': { vibe: '수도권 남부 허브', landmark: '모란시장 일대', transport: '모란역', food: '성남 맛집거리', adj: '실속있는' },
  '일산': { vibe: '신도시의 세련된 밤', landmark: '라페스타', transport: '일산역', food: '웨스턴돔 맛집', adj: '깔끔한' },
  '고양': { vibe: '수도권 북부의 활기', landmark: '고양시 일대', transport: '삼송역', food: '고양 맛집', adj: '신선한' },
  '인천': { vibe: '항구도시의 밤바람', landmark: '구월동 일대', transport: '인천역', food: '차이나타운', adj: '바다 내음의' },
  '인천부평': { vibe: '부평 지하상가 너머', landmark: '부평역 일대', transport: '부평역', food: '부평 깡통시장', adj: '서민적인' },
  '인천송도': { vibe: '미래도시의 밤', landmark: '센트럴파크', transport: '송도역', food: '트리플스트리트', adj: '모던한' },
  '수원': { vibe: '화성 성곽 너머 밤', landmark: '수원역 일대', transport: '수원역', food: '행리단길', adj: '역사적인' },
  '천안': { vibe: '충남의 젊은 밤', landmark: '신부동 일대', transport: '천안역', food: '신부동 맛집', adj: '패기있는' },
  '대구': { vibe: '동성로의 열기', landmark: '동성로', transport: '중앙로역', food: '동인동 찜갈비', adj: '뜨거운' },
  '대전': { vibe: '대전 둔산동 밤거리', landmark: '둔산동 일대', transport: '둔산역', food: '성심당 근처', adj: '은근한' },
  '부산': { vibe: '해변도시의 밤', landmark: '서면 일대', transport: '서면역', food: '서면 먹자골목', adj: '호쾌한' },
  '부산서면': { vibe: '서면 교차로의 열기', landmark: '서면1번가', transport: '서면역', food: '전포카페거리', adj: '열정적인' },
  '부산해운대': { vibe: '해변 파도소리와 밤', landmark: '해운대해수욕장', transport: '해운대역', food: '해리단길', adj: '개방적인' },
  '부산광안리': { vibe: '광안대교 야경 아래', landmark: '광안리해수욕장', transport: '광안역', food: '광안리 카페거리', adj: '낭만적인' },
  '광주': { vibe: '예향의 밤', landmark: '충장로', transport: '상무역', food: '충장로 맛집', adj: '문화적인' },
  '울산': { vibe: '산업도시의 뜨거운 밤', landmark: '삼산동 일대', transport: '울산역', food: '삼산동 맛집', adj: '역동적인' },
  '전주': { vibe: '한옥마을 너머 밤', landmark: '객사거리', transport: '전주역', food: '한옥마을 먹거리', adj: '전통적인' },
  '창원': { vibe: '경남의 밤문화 수도', landmark: '상남동 일대', transport: '창원역', food: '상남동 먹자골목', adj: '성장하는' },
  '포항': { vibe: '동해바다 옆 밤', landmark: '죽도시장 일대', transport: '포항역', food: '죽도시장 회센터', adj: '신선한' },
  '경주': { vibe: '천년고도의 밤', landmark: '황리단길', transport: '경주역', food: '황리단길 맛집', adj: '고즈넉한' },
  '김해': { vibe: '가야의 밤', landmark: '김해시내', transport: '김해역', food: '김해 맛집', adj: '소박한' },
  '춘천': { vibe: '호반의 도시 밤', landmark: '명동거리', transport: '춘천역', food: '닭갈비골목', adj: '청량한' },
  '강릉': { vibe: '커피도시의 밤', landmark: '강릉 시내', transport: '강릉역', food: '안목해변 카페', adj: '여유로운' },
  '청주': { vibe: '충북의 대학도시 밤', landmark: '성안길', transport: '청주역', food: '성안길 맛집', adj: '학구적인' },
  '순천': { vibe: '순천만의 밤', landmark: '순천시내', transport: '순천역', food: '순천 한정식', adj: '자연친화적인' },
  '목포': { vibe: '항구도시의 밤', landmark: '목포 시내', transport: '목포역', food: '목포 세발낙지', adj: '감성적인' },
  '제주': { vibe: '섬의 밤바람', landmark: '제주시내', transport: '제주공항', food: '흑돼지거리', adj: '이국적인' },
  '평택': { vibe: '국제도시의 밤', landmark: '평택역 일대', transport: '평택역', food: '평택 맛집', adj: '다문화적인' },
  '부천': { vibe: '만화도시의 밤', landmark: '부천역 일대', transport: '부천역', food: '부천 먹자골목', adj: '다채로운' },
  '의정부': { vibe: '경기 북부의 밤', landmark: '의정부역 일대', transport: '의정부역', food: '부대찌개골목', adj: '푸근한' },
};

function getRegionFlavor(region) {
  return REGION_FLAVORS[region] || { vibe: '도시의 밤', landmark: '시내 중심', transport: '역 근처', food: '주변 맛집', adj: '독특한' };
}

// ─── SEO Title generator (unique per venue) ───
function generateSeoTitle(v, idx) {
  const name = v.displayName;
  const region = v.region;
  const typeKr = TYPE_LABELS[v.type];
  const adjs = SIGNATURE_ADJECTIVES[hashStr(name + 'adj') % SIGNATURE_ADJECTIVES.length];
  const [adj1, adj2, adj3, adj4] = adjs;
  const rf = getRegionFlavor(region);

  const pools = {
    club: [
      `${region} ${name} ${typeKr} 실전 가이드 – 입장료·드레스코드·예약 2026`,
      `${name} ${typeKr} 첫방문 완벽 정리 | ${region} ${rf.adj} 밤의 시작`,
      `${region} ${name} 후기 – ${adj1} 사운드와 분위기 총정리`,
      `${name} ${typeKr} 가격·영업시간·위치 | ${region} 핫플 2026`,
      `${region} 대표 ${typeKr} ${name} 솔직 리뷰 – 분위기부터 입장까지`,
      `${name} ${typeKr}에서 보내는 ${adj2} 밤 | ${region} 추천`,
      `${region} ${name} 입장료·테이블·VIP 총정리 2026`,
      `${name} ${typeKr} 방문 전 꼭 알아야 할 것들 – ${region} 가이드`,
      `${region} ${typeKr} 추천 1순위 ${name} | 드레스코드·가격 안내`,
      `${name}에서 즐기는 ${region}의 ${adj3} 밤 – 완벽 가이드 2026`,
      `${region} ${name} 예약·입장·분위기 한눈에 | ${typeKr} 리뷰`,
      `${adj1} ${region} ${typeKr} ${name} – 첫방문자 필독 가이드`,
      `${name} ${typeKr} 영업시간·위치·후기 | ${region} 밤문화 2026`,
      `${region} ${name} DJ·음악·분위기 리뷰 – ${typeKr} 탐방기`,
      `${name} ${typeKr} 완전정복 가이드 | ${region} 놀거리 추천`,
      `${region} ${name} 가격표·예약법·드레스코드 – ${typeKr} 백과`,
      `${name}이 ${region} ${typeKr} 씬에서 특별한 이유 2026`,
      `${region} ${name} ${typeKr} 체험기 – ${adj2} 밤의 기록`,
      `${name} ${typeKr} 꿀팁 모음 | ${region} 핫플레이스 가이드`,
      `${region} ${typeKr} ${name} 입장·테이블·주차 총정리`,
      `${name} 방문기: ${region}에서 만난 ${adj1} ${typeKr}`,
      `${region} ${name} ${typeKr} 2026 최신 가이드 – 후기·예산·팁`,
      `${name}으로 떠나는 ${region} ${adj3} 밤 여행`,
      `${region} ${name} ${typeKr} A to Z | 예약부터 귀가까지`,
      `${adj2} 분위기의 ${region} ${name} ${typeKr} 솔직 후기`,
      `${region} 밤문화 필수코스 ${name} ${typeKr} – 상세 리뷰`,
      `${name} ${typeKr} 처음이라면? ${region} 방문 가이드 2026`,
      `${region} ${name} 사운드·조명·분위기 분석 – ${typeKr} 리뷰`,
      `${name} ${typeKr}의 모든 것 | ${region} 밤 즐기기 가이드`,
      `${region} ${name} 금토 주말 공략법 – ${typeKr} 팁`,
      `${name} ${typeKr} ${adj1} 경험담 | ${region} 추천 스팟`,
      `${region} ${name} ${typeKr} 예산 가이드 – 얼마면 충분할까?`,
      `${name}에서 시작하는 ${region} 밤 – ${typeKr} 입문 가이드`,
      `${region} ${typeKr} ${name} 핵심 정보 총정리 2026`,
      `${name} ${typeKr} 분위기·가격·추천곡 | ${region} 나이트라이프`,
      `${region} ${name}만의 ${adj3} 매력 – ${typeKr} 탐방`,
      `${name} ${typeKr} 주말 vs 평일 비교 리뷰 | ${region}`,
      `${region} 핫한 ${typeKr} ${name} – 입장부터 마무리까지`,
      `${name} ${typeKr} 100% 활용법 | ${region} 밤문화 꿀팁`,
      `${region} ${name} ${typeKr}이 사랑받는 비밀 – 상세 분석`,
      `${name}과 함께하는 ${region}의 밤 | ${typeKr} 가이드 2026`,
      `${region} ${name} 솔로·커플·단체 방문법 – ${typeKr} 팁`,
      `${name} ${typeKr} 인생 밤 만들기 | ${region} 완벽 플랜`,
      `${region} ${typeKr} 고수들이 찾는 ${name} – 리얼 후기`,
      `${name} ${typeKr} 오늘밤 갈까? | ${region} 방문 체크리스트`,
      `${region} ${name} ${typeKr} 숨은 매력 포인트 3가지`,
      `${name}에서 느끼는 ${adj2} 에너지 | ${region} ${typeKr}`,
      `${region} ${name} ${typeKr} 계절별 방문 가이드 2026`,
      `${name} ${typeKr} 데이트·모임·솔로 각각 즐기는 법`,
      `${region} ${name} 입장 꿀팁과 드레스코드 – ${typeKr} FAQ`,
    ],
    night: [
      `${region} ${name} ${typeKr} 완벽 가이드 – 부킹·공연·분위기 2026`,
      `${name} ${typeKr} 첫방문 필독 | ${region} 라이브 밤문화`,
      `${region} ${name} 후기 – ${adj1} 무대와 댄스타임 체험기`,
      `${name} ${typeKr} 영업시간·가격·예약 | ${region} 안내 2026`,
      `${region} 대표 ${typeKr} ${name} 솔직 리뷰 – 공연부터 귀가까지`,
      `${name} ${typeKr}에서 보내는 ${adj2} 밤 | ${region} 추천`,
      `${region} ${name} 부킹·테이블·공연 스케줄 총정리 2026`,
      `${name} ${typeKr} 방문 전 체크리스트 – ${region} 가이드`,
      `${region} ${typeKr} 추천 ${name} | 복장·가격·매너 안내`,
      `${name}에서 즐기는 ${region}의 ${adj3} 라이브 밤`,
      `${region} ${name} 예약·입장·분위기 한눈에 | ${typeKr} 리뷰`,
      `${adj1} ${region} ${typeKr} ${name} – 첫방문자 필독`,
      `${name} ${typeKr} 영업시간·위치·후기 | ${region} 밤문화 2026`,
      `${region} ${name} 밴드·댄스·분위기 리뷰 – ${typeKr} 탐방기`,
      `${name} ${typeKr} 완전정복 | ${region} 놀거리 추천 가이드`,
      `${region} ${name} 가격표·예약법·복장 – ${typeKr} 상세 안내`,
      `${name}이 ${region} ${typeKr} 씬에서 특별한 이유`,
      `${region} ${name} ${typeKr} 체험기 – ${adj2} 밤의 기록`,
      `${name} ${typeKr} 꿀팁 모음 | ${region} 핫플레이스`,
      `${region} ${typeKr} ${name} 입장·테이블·주차 A to Z`,
      `${name} 방문기: ${region}에서 만난 ${adj1} 라이브 무대`,
      `${region} ${name} ${typeKr} 2026 업데이트 – 후기·예산·팁`,
      `${name}으로 떠나는 ${region} ${adj3} 밤 여행기`,
      `${region} ${name} ${typeKr} 예약부터 귀가까지 완벽 플랜`,
      `${adj2} 공연의 ${region} ${name} ${typeKr} 솔직 후기`,
      `${region} 밤문화 필수코스 ${name} – 라이브 ${typeKr} 리뷰`,
      `${name} ${typeKr} 처음이라면? ${region} 입문 가이드 2026`,
      `${region} ${name} 밴드·보컬·댄스 분석 – ${typeKr} 리뷰`,
      `${name} ${typeKr}의 모든 것 | ${region} 밤 가이드`,
      `${region} ${name} 금토 주말 공략법 – ${typeKr} 핵심 팁`,
      `${name} ${typeKr} ${adj1} 경험담 | ${region} 추천`,
      `${region} ${name} ${typeKr} 예산 가이드 – 준비물 체크`,
      `${name}에서 시작하는 ${region} 밤 – ${typeKr} 입문서`,
      `${region} ${typeKr} ${name} 핵심 정보 2026 최신판`,
      `${name} ${typeKr} 분위기·가격·공연 | ${region} 밤문화`,
      `${region} ${name}만의 ${adj3} 매력 – ${typeKr} 탐방`,
      `${name} ${typeKr} 주말 vs 평일 차이점 | ${region} 리뷰`,
      `${region} 인기 ${typeKr} ${name} – 입장부터 댄스까지`,
      `${name} ${typeKr} 200% 즐기는 법 | ${region} 꿀팁`,
      `${region} ${name} ${typeKr}이 오래 사랑받는 이유 – 분석`,
      `${name}과 함께하는 ${region}의 밤 | ${typeKr} 2026`,
      `${region} ${name} 솔로·커플·단체별 가이드 – ${typeKr}`,
      `${name} ${typeKr} 최고의 밤 만들기 | ${region} 플랜`,
      `${region} ${typeKr} 단골들이 추천하는 ${name} 리얼 후기`,
      `${name} ${typeKr} 오늘밤 출동! | ${region} 방문 가이드`,
      `${region} ${name} ${typeKr} 숨겨진 매력 포인트 공개`,
      `${name}에서 느끼는 ${adj2} 라이브 | ${region} ${typeKr}`,
      `${region} ${name} ${typeKr} 계절별 즐기기 가이드 2026`,
      `${name} ${typeKr} 데이트·회식·모임 각각 즐기는 법`,
      `${region} ${name} 입장 꿀팁과 부킹 매너 – ${typeKr} FAQ`,
      `${name} ${typeKr} 라이브 무대의 감동 | ${region} 리뷰`,
      `${region} ${name} ${typeKr} 웨이터·서비스·매너 가이드`,
      `${name}의 밤을 완벽하게 | ${region} ${typeKr} 플래너`,
      `${region} ${name} ${typeKr} 댄스타임 완전 공략 2026`,
      `${name} ${typeKr} 밴드 공연 일정과 분위기 | ${region}`,
      `${region} ${name} 테이블·보틀·안주 가격 한눈에`,
      `${name} ${typeKr}에서의 특별한 밤 | ${region} 후기 2026`,
      `${region} ${name} ${typeKr} 초보 탈출 가이드 – 팁 모음`,
      `${name}과 ${region}의 밤 – ${typeKr} 문화 깊이 읽기`,
      `${region} ${name} ${typeKr} 전격 해부 – 가격·분위기·꿀팁`,
      `${name} ${typeKr} ${region} 밤의 하이라이트 2026`,
    ],
    lounge: [
      `${region} ${name} ${typeKr} 완벽 가이드 – 칵테일·분위기·예약 2026`,
      `${name} ${typeKr} 첫방문 필독 | ${region} 프리미엄 밤문화`,
      `${region} ${name} 후기 – ${adj1} 무드와 시그니처 칵테일`,
      `${name} ${typeKr} 가격·메뉴·예약 | ${region} 데이트 코스 2026`,
      `${region} 대표 ${typeKr} ${name} 솔직 리뷰 – 분위기 분석`,
      `${name} ${typeKr}에서 보내는 ${adj2} 저녁 | ${region} 추천`,
      `${region} ${name} 예약·메뉴·드레스코드 총정리 2026`,
      `${name} ${typeKr} 방문 전 알아둘 것들 – ${region} 가이드`,
      `${region} ${typeKr} 추천 ${name} | 분위기·칵테일·가격 안내`,
      `${name}에서 즐기는 ${region}의 ${adj3} 저녁 시간`,
      `${region} ${name} 분위기·메뉴·예약 한눈에 | ${typeKr} 리뷰`,
      `${adj1} ${region} ${typeKr} ${name} – 첫방문 가이드`,
      `${name} ${typeKr} 영업시간·위치·후기 | ${region} 2026`,
      `${region} ${name} 인테리어·칵테일·서비스 리뷰 – ${typeKr}`,
      `${name} ${typeKr} 완전정복 가이드 | ${region} 데이트 추천`,
      `${region} ${name} 가격표·예약법·분위기 – ${typeKr} 백과`,
      `${name}이 ${region} ${typeKr} 씬에서 돋보이는 이유`,
      `${region} ${name} ${typeKr} 체험기 – ${adj2} 밤의 기록`,
      `${name} ${typeKr} 꿀팁 모음 | ${region} 프리미엄 스팟`,
      `${region} ${typeKr} ${name} 예약·좌석·주차 A to Z`,
      `${name} 방문기: ${region}에서 찾은 ${adj1} 안식처`,
      `${region} ${name} ${typeKr} 2026 최신 가이드 – 후기·팁`,
      `${name}으로 떠나는 ${region} ${adj3} 저녁 여행`,
      `${region} ${name} ${typeKr} 예약부터 마무리까지 완벽 플랜`,
      `${adj2} 공간의 ${region} ${name} ${typeKr} 솔직 후기`,
      `${region} 데이트 필수코스 ${name} – ${typeKr} 리뷰`,
      `${name} ${typeKr} 처음이라면? ${region} 방문 가이드 2026`,
      `${region} ${name} 바텐더·칵테일·무드 분석 – ${typeKr} 리뷰`,
      `${name} ${typeKr}의 모든 것 | ${region} 저녁 가이드`,
      `${region} ${name} 금토 주말 공략법 – ${typeKr} 팁`,
    ],
  };

  const pool = pools[v.type];
  return pool[hashStr(v.displayName + 'title') % pool.length];
}

// ─── SEO Description generator (unique per venue) ───
function generateSeoDescription(v, idx) {
  const { name, region, typeKr, adj1, adj2, adj3, rf } = getVenueVars(v);

  const pools = [
    `${region} ${name} ${typeKr} 방문 전 꼭 확인하세요. 분위기, 가격, 예약 방법, 드레스코드와 실제 방문 후기를 담았습니다.`,
    `${name} ${typeKr}의 ${adj1} 매력을 낱낱이 공개합니다. ${region}에서 잊지 못할 밤을 계획하는 분들을 위한 상세 가이드.`,
    `${region} ${name}의 입장료부터 분위기, 추천 시간대까지. ${typeKr} 첫방문자도 걱정 없는 완벽 안내서입니다.`,
    `${adj2} 분위기의 ${region} ${name} ${typeKr}. 가격, 위치, 영업시간, 예약 정보와 리얼 후기를 확인하세요.`,
    `${name}에서 ${region}의 밤을 즐기는 방법. ${typeKr} 입장부터 귀가까지 알아야 할 모든 것을 정리했습니다.`,
    `${region} ${typeKr} ${name}의 분위기·가격·위치 상세 리뷰. 방문 전 체크리스트와 꿀팁을 함께 제공합니다.`,
    `${name} ${typeKr}이 특별한 이유? ${region}에서 ${adj1} 밤문화를 경험하고 싶다면 이 가이드를 참고하세요.`,
    `${region} ${name} ${typeKr} 2026 최신 정보. 예약법, 드레스코드, 예산 계획부터 실전 팁까지 담았습니다.`,
    `${name}을 처음 방문하시나요? ${region} ${typeKr}의 분위기, 시간대별 특징, 가격 정보를 미리 확인하세요.`,
    `${region}의 ${adj3} ${typeKr} ${name}. 입장 방법, 음료 가격, 분위기, 교통편까지 한번에 정리한 가이드.`,
    `${name} ${typeKr} 리얼 체험기. ${region}에서 보내는 특별한 밤을 위한 실전 정보와 추천 코스를 안내합니다.`,
    `${region} ${name}의 매력을 파헤친 상세 가이드. ${typeKr} 방문 시 알아야 할 모든 정보가 여기 있습니다.`,
    `${adj1} 밤을 원한다면 ${region} ${name} ${typeKr}. 첫방문 체크리스트, 가격, 분위기 리뷰를 확인하세요.`,
    `${name} ${typeKr}에서의 완벽한 밤을 위한 가이드. ${region} 방문 전 가격, 예약, 드레스코드를 체크하세요.`,
    `${region} 밤문화의 핵심, ${name} ${typeKr}. 분위기부터 예산까지, 방문 전 필요한 정보를 정리했습니다.`,
    `${name}은 ${region}에서 어떤 경험을 선사할까? ${typeKr}의 분위기, 가격, 위치 정보를 상세히 안내합니다.`,
    `${region} ${name} ${typeKr} 솔직 리뷰. ${adj2} 분위기와 가격 정보, 방문 팁을 한눈에 확인하세요.`,
    `${name} ${typeKr} 가이드: ${region}의 밤을 200% 즐기는 법. 예약, 복장, 시간대별 분위기를 총정리합니다.`,
    `${region} ${name}에서 만나는 ${adj3} 밤. ${typeKr} 입장 정보, 가격, 추천 코스를 확인해보세요.`,
    `${name} ${typeKr} 방문을 고민 중이라면? ${region}의 분위기, 가격, 후기를 미리 살펴보세요.`,
  ];

  return pools[hashStr(v.displayName + 'desc') % pools.length];
}

// ─── Hook Intro generator (unique per venue, 500+ chars) ───
function generateHookIntro(v, idx, rng) {
  const name = v.displayName;
  const region = v.region;
  const typeKr = TYPE_LABELS[v.type];
  const adjs = SIGNATURE_ADJECTIVES[hashStr(name + 'adj') % SIGNATURE_ADJECTIVES.length];
  const [adj1, adj2, adj3, adj4] = adjs;
  const rf = getRegionFlavor(region);
  const verb = VENUE_VERBS[hashStr(name + 'verb') % VENUE_VERBS.length];
  const timeExpr = TIME_EXPRESSIONS[hashStr(name + 'time') % TIME_EXPRESSIONS.length];

  const hooks = [
    // Question hooks
    `${region}에서 진짜 좋은 ${typeKr}를 찾는다면 어디를 가야 할까? 수많은 선택지 중에서 ${name}이 유독 눈에 띄는 이유가 있다. 단순히 음악이 좋아서, 분위기가 멋져서만이 아니다. 이곳에 한 번이라도 발을 들여본 사람이라면 알 것이다 — ${name}에서의 밤은 다른 곳에서는 쉽게 대체할 수 없는 무언가를 가지고 있다는 것을. ${rf.vibe}의 에너지가 농축된 이 공간에서, 오늘 밤 당신만의 이야기가 시작된다. 이 가이드는 처음 방문하는 분부터 재방문을 계획하는 분까지, ${name}을 제대로 즐기기 위해 알아야 할 모든 것을 담았다.`,
    // Sensory hooks
    `${timeExpr}, ${region}의 거리가 다른 빛깔로 물들기 시작한다. 낮의 분주함이 사라지고, 대신 네온과 음악이 골목을 채우는 시간. 그 변화의 중심에 ${name}이 있다. 문 앞에 서면 안쪽에서 새어 나오는 ${adj1} 에너지가 피부에 닿는다. 한 발짝 안으로 들어서는 순간, ${rf.vibe} 한가운데서 펼쳐지는 ${name}만의 세계가 열린다. 처음 오는 사람도, 여러 번 온 사람도 매번 새로운 장면을 발견하게 되는 곳. 이 가이드를 통해 ${name}에서의 밤을 미리 그려보자.`,
    // Contrast hooks
    `낮에 보면 ${region}의 평범한 거리 한 켠이다. 그러나 해가 지면 이야기가 달라진다. ${name}의 간판에 불이 켜지는 순간, 이 일대의 공기가 바뀐다. 일상과 밤의 경계선 위에 서 있는 이 공간은, 방문할 때마다 조금씩 다른 얼굴을 보여준다. ${adj2} 조명 아래 펼쳐지는 ${name}의 세계는 단순한 유흥을 넘어, 하나의 경험이 된다. 첫방문이든 재방문이든, 이 가이드가 ${name}에서의 밤을 더 풍성하게 만들어줄 것이다.`,
    // Storytelling hooks
    `지난 금요일, 한 무리의 친구들이 ${region} ${rf.landmark} 근처에서 만났다. 목적지는 정해져 있었다 — ${name}. 누군가의 추천으로, 누군가의 경험담으로 이 이름을 알게 된 그들은, 입구를 통과하는 순간 왜 사람들이 이곳을 이야기하는지 단번에 이해했다. ${adj1} 분위기, ${adj3} 디테일, 그리고 이곳에서만 느낄 수 있는 특별한 에너지. ${name}은 방문자에게 이야기를 만들어주는 곳이다. 당신도 그 이야기의 주인공이 될 준비가 되었는가?`,
    // Direct address hooks
    `이 글을 읽고 있다면, 아마 ${region}에서 괜찮은 ${typeKr}를 찾고 있을 것이다. 혹은 ${name}이라는 이름을 어디선가 듣고 궁금해서 검색했을 수도 있다. 어떤 경우든, 잘 찾아왔다. ${name}은 ${region} ${typeKr} 씬에서 확실한 존재감을 가진 곳이다. ${adj1} 분위기부터 가격, 예약 방법, 드레스코드까지 — 이 가이드 하나면 첫 방문도 완벽하게 준비할 수 있다. ${rf.vibe}의 밤을 ${name}에서 시작해보자.`,
    // Statistical/fact hooks
    `${region}의 ${typeKr} 중에서 재방문율이 높은 곳을 꼽으라면, ${name}은 빠지지 않는다. 그 이유는 단순하다 — 이곳은 한 번의 방문으로 기억에 남는 밤을 만들어주기 때문이다. ${rf.landmark}에 위치한 ${name}은, ${adj2} 인테리어와 음향, 그리고 세심한 서비스가 조화를 이루는 공간이다. 처음이라 걱정되는 분들을 위해, 입장부터 귀가까지 모든 과정을 이 가이드에 정리했다.`,
    // Mystery hooks
    `${region}에서 밤이 깊어질수록 빛나는 곳이 있다. 간판은 크지 않고, 입구도 화려하지 않다. 그런데 문 안쪽에서 흘러나오는 에너지는 지나가는 발걸음을 멈추게 한다. ${name}이다. 이곳의 ${adj1} 매력은 직접 경험하기 전에는 설명하기 어렵다. 그래서 이 가이드를 만들었다 — ${name}에서의 밤을 미리 상상할 수 있도록, 분위기부터 가격까지 모든 정보를 담았다.`,
    // Challenge hooks
    `${region}에서 ${typeKr}를 가본 적 있는가? 혹시 아직이라면, ${name}이 첫 경험으로 나쁘지 않을 것이다. 혹시 이미 여러 곳을 다녀봤다면, ${name}이 보여주는 ${adj3} 차별점에 놀랄 수도 있다. ${rf.vibe}의 에너지를 품은 이 공간은, 방문자의 기대를 한 단계 넘어서는 경험을 선사한다. 입장 전에 알아두면 좋은 것들을 이 가이드에 전부 모았다.`,
    // Scene-setting hooks
    `금요일 저녁, ${region} ${rf.transport}에서 내린다. 주변 거리에는 이미 밤의 기운이 감돈다. ${rf.food}에서 배를 든든히 채운 뒤, 발걸음은 자연스럽게 ${name}을 향한다. 이곳을 아는 사람들은 일찍 움직인다 — 좋은 자리는 금방 차기 때문이다. ${name}의 ${adj1} 분위기 속으로 들어서면, 평일의 피로가 서서히 녹아내린다. 이 가이드는 그런 완벽한 밤을 설계하는 데 필요한 모든 정보를 제공한다.`,
    // Comparison hooks
    `${region}에는 ${typeKr}가 여럿 있다. 각각의 개성이 있고, 저마다의 단골이 있다. 그중에서 ${name}이 갖는 포지션은 명확하다 — ${adj2} 공간감과 ${adj3} 분위기로 방문자에게 잊히지 않는 인상을 남기는 곳. ${rf.vibe}의 밤문화를 대표하는 이 공간을 제대로 즐기려면, 약간의 사전 준비가 도움이 된다. 가격부터 드레스코드까지, 이 가이드에서 확인해보자.`,
    // Personal narrative hooks
    `처음 ${name}에 갔을 때의 기억은 꽤 선명하다. ${region}의 밤거리를 걷다가, 어떤 직감 같은 것에 이끌려 문을 열었다. 안으로 들어서는 순간 느꼈던 ${adj1} 공기, 귀에 도달한 첫 번째 음악, 눈에 들어온 조명의 결. 그 모든 것이 조화롭게 맞물리는 순간이 있었다. ${name}은 그런 순간을 만들어주는 곳이다. 이 가이드를 통해 당신도 그 첫 경험을 미리 준비해보자.`,
    // Urgency hooks
    `${region}의 밤문화 지도는 계속 변하고 있다. 새로운 곳이 열리고, 오래된 곳은 사라진다. 그 와중에 꾸준히 자리를 지키며 방문자들에게 선택받는 공간이 있다 — ${name}이다. ${adj2} 무드와 ${adj3} 서비스로 ${rf.vibe}의 밤을 정의해온 이곳. 다음 밤 외출을 계획하고 있다면, ${name}을 선택지에 넣어보자. 방문 전 알아야 할 모든 것을 이 가이드에 정리해두었다.`,
    // Emotional hooks
    `좋은 밤은 기억에 남는다. 음악, 분위기, 함께한 사람들, 그리고 공간이 만들어낸 감정. ${name}은 ${region}에서 그런 '좋은 밤'을 만들어주는 곳 중 하나다. ${adj1} 조명 아래 흐르는 시간, ${adj2} 음향이 감싸는 공간. 이곳에서 보낸 밤은 다음 날 아침까지 여운이 남는다. 첫 방문을 준비하든, 재방문을 계획하든, 이 가이드가 도움이 될 것이다.`,
    // Insider hooks
    `${region} 밤문화를 즐기는 사람들 사이에서 ${name}은 이미 익숙한 이름이다. 하지만 처음 들어보는 분도 있을 것이다. ${name}의 ${adj1} 매력은 소문만으로는 다 전할 수 없다. ${rf.vibe}의 독특한 에너지가 담긴 이 공간은, 직접 방문해야 비로소 이해되는 것들이 있다. 그 전에, 이 가이드로 기본 정보와 꿀팁을 미리 챙겨가자.`,
    // Philosophical hooks
    `밤이라는 시간은 특별하다. 낮의 규칙이 느슨해지고, 평소와 다른 자신을 발견하게 되는 시간. ${region}에서 그런 밤의 마법을 가장 잘 보여주는 공간이 ${name}이다. ${adj3} 분위기 속에서 흐르는 음악과 조명이 만들어내는 세계는, 일상에서 한 발짝 벗어난 경험을 선사한다. 이 가이드는 ${name}에서의 밤을 제대로 즐기기 위한 모든 정보를 담고 있다.`,
  ];

  return hooks[hashStr(v.displayName + 'hook') % hooks.length];
}

// ─── Deep Dive generator (compositional, venue name in EVERY sentence) ───
function generateDeepDive(v, idx, rng) {
  const { name, region, typeKr, adj1, adj2, rf } = getVenueVars(v);

  const checkpoints = [
    `${name} 방문 전 복장을 점검하자. 단정한 캐주얼이 기본이며 러닝셔츠나 슬리퍼는 피하는 것이 좋다. ${name}에 도착하는 시간은 21~22시가 적당하며 너무 이르면 한산할 수 있다.`,
    `${name}을 가기 전에 공식 채널에서 이벤트 일정을 확인하자. ${name}의 특별 이벤트 날에는 입장료가 다를 수 있다. 깔끔한 신발과 단정한 복장은 기본 중의 기본이다.`,
    `${name} 방문 시 함께 갈 인원을 미리 확정하고, 필요하면 ${name}에 테이블 예약을 해두자. 현금과 카드를 모두 지참하고, 핸드폰 충전은 완료한 뒤 출발하자.`,
    `${name}이 첫 방문이라면 일찍 도착해서 ${name}의 공간에 익숙해지는 시간을 확보하자. 바 카운터 근처에서 시작하면 분위기를 자연스럽게 파악할 수 있다.`,
    `${name} 방문 시 주차 여건을 미리 확인하고, 가능하면 ${rf.transport}까지 대중교통을 이용하자. ${name}에서의 음주 후 귀가 교통편은 반드시 사전에 계획해두어야 한다.`,
    `${name}에 가기로 했다면, 당일 컨디션을 점검하자. 충분한 수면과 식사 후에 ${name}을 방문하면 훨씬 좋은 시간을 보낼 수 있다.`,
    `${name} 방문 전 공식 SNS를 체크하면 당일 이벤트나 특별 프로모션 정보를 얻을 수 있다. ${name}의 분위기에 맞는 복장도 미리 준비하자.`,
    `${name}에 처음 간다면 동행자와 합류 장소를 ${rf.transport} 근처로 정하면 편하다. ${name}까지의 동선을 미리 파악해두면 이동이 수월하다.`,
    `${name} 방문을 위한 최소 준비물: 신분증, 충전된 핸드폰, 현금과 카드, 편안하되 깔끔한 복장. 이 네 가지만 챙기면 ${name}에서의 밤이 한결 수월해진다.`,
    `${name}의 피크타임은 보통 23시~01시 사이다. ${name}에 일찍 도착하면 여유롭게 공간을 파악할 수 있고, 피크 시간의 대기를 피할 수 있다.`,
  ];

  const historyPools = {
    club: [
      `한국의 클럽 문화는 2000년대 초반 홍대를 중심으로 성장했다. DJ 중심의 전자음악 문화가 대중화되면서 각 지역에 개성 있는 클럽들이 생겨났다. ${name}이 자리한 ${region}의 클럽씬도 이 흐름 속에서 독자적인 색깔을 만들어왔으며, ${name}은 그 흐름의 한 축을 담당하고 있다.`,
      `클럽 문화의 핵심은 DJ와 사운드 시스템이다. 단순한 댄스 공간에서 음향과 조명이 결합된 엔터테인먼트 공간으로 진화했다. ${name}이 위치한 ${region}의 클럽씬은 이러한 변화를 적극 수용하며, ${name}은 그 중심에서 독자적인 정체성을 구축해왔다.`,
      `${region}의 클럽 역사에서 ${name}은 주목할 만한 존재다. 트렌드가 빠르게 바뀌는 클럽씬에서 ${name}이 꾸준히 자리를 지킬 수 있는 것은, 변화에 유연하게 대응하면서도 핵심 가치를 잃지 않았기 때문이다.`,
      `${name}이 속한 ${region} 클럽씬은 서울의 주류 클럽 문화와는 다른 결을 갖고 있다. 로컬 커뮤니티의 특성이 반영된 이곳만의 분위기가 ${name}의 정체성을 더욱 뚜렷하게 만든다.`,
    ],
    night: [
      `나이트 문화는 1990년대부터 한국 밤문화의 중심축을 형성해왔다. 라이브 밴드와 댄스 타임이 결합된 독특한 형태는 세대를 아우르는 즐거움을 제공한다. ${name}은 ${region}에서 이 전통을 계승하면서 현대적 감각을 더해 사랑받고 있다.`,
      `나이트클럽의 매력은 라이브 음악에 있다. 숙련된 밴드의 공연은 녹음된 음악과는 차원이 다른 감동을 준다. ${name}이 자리한 ${region}에서도 이러한 라이브 문화가 깊이 뿌리내리며, ${name}은 밴드와 관객이 함께 만들어가는 밤문화의 현장이다.`,
      `${region}의 나이트 역사를 거슬러 올라가면, ${name}과 같은 라이브 중심의 공간이 밤문화의 뿌리를 형성해왔음을 알 수 있다. ${name}은 그 전통 위에서 오늘날의 감각을 더해 방문자에게 새로운 경험을 제공한다.`,
      `${name}이 위치한 ${region}의 나이트씬은 라이브 음악과 커뮤니티의 결합이 특징이다. ${name}은 이 지역 밤문화의 거점으로서, 세대와 취향을 넘어 다양한 사람들이 모이는 공간이 되었다.`,
    ],
    lounge: [
      `라운지 문화는 2010년대 이후 한국에서 급격히 성장했다. 분위기와 경험을 소비하는 프리미엄 문화 공간으로 자리잡았으며, ${name}은 ${region}에서 이 트렌드를 선도하는 대표적인 공간 중 하나다.`,
      `좋은 라운지의 조건은 분위기, 음료, 서비스 세 가지다. ${name}은 ${region}에서 이 세 요소의 조화를 추구하며 자신만의 개성을 만들어왔다. ${name}의 바텐더 역량이 곧 이곳의 수준을 결정한다.`,
      `${region}의 라운지 문화에서 ${name}이 차지하는 위치는 독보적이다. 트렌드에 민감하면서도 자신만의 정체성을 유지하는 ${name}의 운영 철학이 오래도록 사랑받는 비결이다.`,
      `${name}이 속한 ${region} 라운지씬은 각 매장의 개성이 뚜렷한 것이 특징이다. 그중에서도 ${name}은 인테리어와 칵테일에 대한 투자가 두드러지며, 방문자에게 차별화된 경험을 제공한다.`,
    ],
  };

  const seasons = [
    `${name}은 계절마다 미묘하게 다른 분위기를 보여준다. 봄에는 방문자가 늘면서 ${name}의 에너지도 상승하고, 여름 성수기에는 주말 대기가 길어질 수 있으니 일찍 출발하자. 가을은 ${name}을 방문하기 가장 쾌적한 시기이며, 연말에는 특별 행사가 잡히므로 2주 전 예약이 필수다.`,
    `${name}의 분위기는 계절에 따라 변화한다. 봄가을에는 쾌적한 날씨 덕에 만족도가 높고, 여름에는 시원한 실내가 강점이다. 겨울에는 ${name} 특유의 따스한 분위기가 바깥 추위와 대비되어 특별한 감성을 자아낸다.`,
    `${name}은 주중과 주말의 분위기 차이도 크다. 평일에는 여유롭게 ${name}의 공간을 즐길 수 있고, 금토에는 에너지가 최고조에 달한다. 특별한 날에 ${name}을 방문한다면 미리 예약하는 것이 현명하다.`,
    `${name}을 언제 방문하느냐에 따라 경험이 달라진다. 금요일 밤의 ${name}은 에너지가 폭발하고, 일요일 저녁의 ${name}은 차분한 여유가 있다. 자신의 취향에 맞는 타이밍을 골라보자.`,
    `${name}의 성수기는 봄(3~5월)과 연말(11~12월)이다. 이 시기의 ${name}은 특별 이벤트가 많아 색다른 경험이 가능하지만, 예약 경쟁도 치열해진다. 비수기에 방문하면 여유로운 ${name}을 즐길 수 있다.`,
    `${name}을 가장 알차게 즐기려면 계절별 전략이 필요하다. 여름에는 이른 시간에 도착해 ${name}의 에어컨 시원함을 만끽하고, 겨울에는 따뜻한 실내에서 ${name}만의 무드를 즐겨보자.`,
  ];

  const courses = [
    `1차로 ${rf.food}에서 든든한 식사를 하고, 2차로 ${name}에 입장하는 것이 정석 코스다. ${rf.transport}에서 접근성이 좋으므로 이동도 편하다. ${name}의 피크타임에 맞춰 도착하면 가장 활기찬 분위기를 경험할 수 있다.`,
    `사전에 ${rf.transport} 근처에서 모여 가벼운 음식과 함께 워밍업을 하자. ${name}에서의 시간을 충분히 즐긴 뒤, 새벽에는 ${region} 주변의 해장국집에서 마무리하면 된다.`,
    `${region}의 밤을 제대로 즐기려면 시간 배분이 중요하다. 저녁 식사 후 21시쯤 ${name}에 도착하고, 핵심 시간대인 23시~01시를 ${name}에서 충분히 즐긴 뒤 귀가를 결정하면 된다.`,
    `${name}을 중심으로 한 코스를 짜보자. ${rf.food}에서 1차, ${name}에서 2차, 마무리는 ${region} 인근의 카페나 해장 음식점에서. ${name}까지는 ${rf.transport}에서 도보 이동이 가능하다.`,
    `${name} 방문 전 ${rf.transport} 주변에서 간단한 식사를 하자. ${name}에서 즐기는 시간은 최소 2~3시간을 잡으면 알차다. 귀가는 ${name} 인근에서 택시나 대리운전을 이용하면 편하다.`,
    `${name}을 200% 즐기는 코스: 저녁 7시 ${rf.food}에서 식사 → 9시 ${name} 입장 → 새벽 1시 ${name} 퇴장 → ${region} 인근 마무리. ${name}에서의 4시간이 이 코스의 핵심이다.`,
  ];

  return {
    checkpoint: checkpoints[hashStr(name + 'ckpt') % checkpoints.length],
    history: historyPools[v.type][hashStr(name + 'hist') % historyPools[v.type].length],
    season: seasons[hashStr(name + 'season') % seasons.length],
    course: courses[hashStr(name + 'course') % courses.length],
  };
}

// ─── Scene generators (truly unique per venue) ───
function generateScenes(v, idx, rng) {
  const name = v.displayName;
  const region = v.region;
  const type = v.type;
  const adjs = SIGNATURE_ADJECTIVES[hashStr(name + 'adj') % SIGNATURE_ADJECTIVES.length];
  const [adj1, adj2, adj3, adj4] = adjs;
  const verb = VENUE_VERBS[hashStr(name + 'verb') % VENUE_VERBS.length];
  const timeExpr = TIME_EXPRESSIONS[hashStr(name + 'time') % TIME_EXPRESSIONS.length];
  const adj1 = adjs[0], adj2 = adjs[1], adj3 = adjs[2], adj4 = adjs[3];
  const frame = STORY_FRAMES[hashStr(name + 'frame') % STORY_FRAMES.length];

  const typeActions = {
    club: ['비트에 몸을 맡기', '사운드 웨이브 속으로 빠져들', 'DJ의 믹싱에 귀 기울이', '레이저 조명 아래서 움직이'],
    night: ['라이브 무대 앞에서 손뼉을 치', '댄스 파트너와 스텝을 맞추', '밴드 연주에 흠뻑 취하', '신나는 무대에 몸을 싣'],
    lounge: ['칵테일 잔을 기울이', '은은한 선율에 귀를 열', '소파에 깊이 앉아 대화를 나누', '바텐더의 손끝을 바라보'],
  };
  const act = typeActions[type];

  const typeSpaces = {
    club: ['댄스플로어', '바 카운터', 'VIP 부스', 'DJ 부스 앞'],
    night: ['메인 홀', '무대 앞 테이블', '바 좌석', '코너 소파'],
    lounge: ['창가 소파석', '바 카운터', '프라이빗 코너', '테라스'],
  };
  const spaces = typeSpaces[type];

  const typeSounds = {
    club: ['베이스가 심장을 두드리는 소리', '하이햇의 날카로운 리듬', '신스 멜로디의 상승', '드롭의 폭발적 에너지'],
    night: ['밴드의 기타 리프', '보컬리스트의 감미로운 목소리', '드럼의 경쾌한 박자', '관객의 환호성'],
    lounge: ['잔에 얼음이 부딪히는 소리', '재즈 피아노의 은은한 선율', '조용한 대화의 물결', '잔잔한 R&B 멜로디'],
  };
  const sounds = typeSounds[type];

  // Build 5 unique scenes
  const scenes = {};

  // Scene 1: Arrival (300+ chars)
  if (frame.pov === '2nd') {
    scenes.scene1 = `${timeExpr}, ${region}의 거리를 따라 걷다 보면 ${name}의 입구가 시야에 들어온다. ${adj1} 외관이 처음부터 강한 인상을 남긴다. 문을 열고 안으로 한 발짝 들여놓는 순간, ${sounds[0]}이 전해지며 일상의 무게가 서서히 벗겨지기 시작한다. ${spaces[0]}을 향해 걸어가면서 이미 이곳의 에너지가 온몸으로 스며드는 것을 느낀다. ${region}에서의 밤이 이렇게 시작된다는 사실이 발걸음을 더욱 가볍게 만든다. 입구의 조명이 만들어내는 ${adj2} 그라데이션은 안쪽으로 갈수록 깊어지며, 마치 다른 세계로 통하는 통로처럼 느껴진다.`;
  } else if (frame.pov === '1st') {
    scenes.scene1 = `${timeExpr}, 나는 다시 ${name}을 향해 발걸음을 옮긴다. ${region}의 밤이 시작되는 이 순간이 항상 기대된다. 익숙한 입구를 지나 안으로 들어서면, ${sounds[0]}이 나를 반겨주듯 퍼져 온다. 이곳에 올 때마다 느끼는 것이지만, ${adj1} 공간감은 매번 새롭다. ${spaces[0]}으로 향하는 동선은 이미 몸이 기억하고 있지만, 오늘도 어떤 밤이 될지 모른다는 기대감이 ${adj3} 전율로 이어진다. ${name}이라는 공간이 나에게 주는 것은 단순한 유흥이 아니라, 일상에서 벗어나는 ${adj2} 경험이다.`;
  } else if (frame.pov === '3rd') {
    scenes.scene1 = `${timeExpr}, ${name}의 문이 열리고 사람들이 하나둘 모여들기 시작한다. ${region}의 밤을 ${adj1} 방식으로 즐기려는 이들의 표정에는 기대감이 서려 있다. 각자의 이유로 이 공간에 발을 들인 그들은, 입구를 지나는 순간 ${sounds[0]}에 맞이받는다. ${spaces[0]}이 시야에 들어오면, 이곳만의 ${adj2} 분위기가 확연히 느껴진다. 바깥의 ${region} 거리와는 완전히 다른 시간이 이 안에서 흐르고 있다.`;
  } else {
    scenes.scene1 = `${timeExpr}, 우리는 모두 ${region}에 모여 ${name}으로 향했다. 함께 이 ${adj1} 공간을 방문한다는 사실 자체가 이미 즐거웠다. 입구에 도착하니 ${sounds[0]}이 문 밖까지 새어 나오고, 서로 눈빛을 교환하며 기대감을 나누었다. 안으로 들어서자 ${spaces[0]}이 눈에 들어왔고, 우리 모두의 얼굴에 자연스러운 미소가 번졌다. ${region}의 밤을 이곳에서 함께 시작할 수 있다는 것이 ${adj2} 행운처럼 느껴졌다.`;
  }

  // Scene 2: Interior experience (300+ chars)
  if (frame.pov === '2nd') {
    scenes.scene2 = `${name}의 내부를 탐험하다 보면, ${adj3} 디테일들이 하나씩 눈에 들어온다. ${spaces[1]}에서 음료를 주문하고, ${act[0]}기 시작하면 시간 감각이 희미해진다. ${sounds[1]}이 공기를 가르며, 주변 사람들도 저마다의 방식으로 이 밤을 만끽하고 있다. ${region}의 밤문화를 ${adj4} 형태로 경험할 수 있는 이곳에서, 당신은 어느새 일상의 자신을 잊고 밤의 리듬에 온전히 빠져들게 된다. ${spaces[2]}으로 자리를 옮기면 또 다른 분위기가 펼쳐지는데, 이 공간적 다양성이 ${name}의 매력 중 하나다.`;
  } else if (frame.pov === '1st') {
    scenes.scene2 = `${name}에서 내가 항상 자리 잡는 곳은 ${spaces[1]} 근처다. 여기서 ${act[1]}며 시간을 보내는 것이 나만의 루틴이 되었다. ${sounds[1]}이 귀를 감싸고, 음료의 첫 한 모금이 목을 적시면 비로소 오늘 밤이 시작되었음을 실감한다. ${adj3} 조명이 시간에 따라 미묘하게 변하는 것을 관찰하는 재미도 있다. ${region}에서 이런 ${adj4} 경험을 줄 수 있는 곳은 많지 않다. 때때로 ${spaces[2]}으로 이동하여 다른 각도에서 공간을 감상하는 것도 좋다.`;
  } else if (frame.pov === '3rd') {
    scenes.scene2 = `${name}의 한가운데에서 관찰하면, ${adj3} 패턴이 눈에 띈다. ${spaces[1]}에서 음료를 즐기는 커플, ${spaces[2]}에서 ${act[0]}는 그룹, ${spaces[3]}에서 홀로 음악에 빠진 이까지. 각자가 ${name}이라는 공간 안에서 자신만의 밤을 구축하고 있다. ${sounds[1]}이 이 모든 장면을 하나로 엮어주는 배경음악이 된다. 이곳에서의 시간은 바깥세상과 다른 속도로 흐르며, ${region}의 밤이 가진 ${adj4} 깊이를 보여준다.`;
  } else {
    scenes.scene2 = `우리는 ${spaces[1]}에 자리를 잡고, 각자 음료를 주문했다. ${sounds[1]}이 대화 사이사이를 채워주며, ${act[1]}고 싶은 충동이 자연스럽게 올라왔다. ${name}에서의 시간은 ${adj3} 에너지로 가득 차 있었다. 서로의 이야기를 나누다가도, 문득 이 ${adj4} 공간의 디테일에 감탄하곤 했다. ${region}의 밤이 우리에게 이런 순간을 허락해주다니, 감사하지 않을 수 없었다.`;
  }

  // Scene 3: Climax (300+ chars)
  if (frame.pov === '2nd') {
    scenes.scene3 = `자정이 가까워지면 ${name}의 에너지는 정점을 향한다. ${sounds[2]}이 공간을 ${verb}, 모든 감각이 활짝 열리는 순간이 찾아온다. ${act[2]}며 이 밤의 하이라이트를 경험하는 당신은, ${region}의 밤이 줄 수 있는 가장 ${adj1} 순간을 마주하게 된다. 새벽이 가까워져도 아쉬움이 남는 것은, 이 시간이 그만큼 ${adj3}였기 때문이다. 문을 나서며 뒤돌아보면, 아직도 안에서는 밤이 계속되고 있다. 다음 방문에 대한 기대가 이미 피어오른다.`;
  } else if (frame.pov === '1st') {
    scenes.scene3 = `밤이 깊어질수록 ${name}은 가장 ${adj1} 모습을 보여준다. ${sounds[2]}에 온전히 빠져들면, ${act[2]}는 것이 이토록 자유로울 수 있다는 걸 깨닫게 된다. 이 순간이 영원하길 바라지만, 가장 좋은 밤은 아쉬움을 남기는 법이다. ${region}의 새벽 공기를 마시며 돌아가는 길, 오늘 밤의 기억은 ${adj3} 여운으로 오래 남을 것이다. ${name}이라는 공간이 내 삶에 주는 의미를 다시금 확인하는 순간이다.`;
  } else if (frame.pov === '3rd') {
    scenes.scene3 = `새벽이 가까워지면 ${name}의 공기가 미묘하게 변한다. 가장 ${adj1} 순간이 서서히 식어가고, ${sounds[2]}도 점차 잦아든다. 하지만 이곳에서의 기억은 ${adj3} 인상으로 남는다. ${region}의 밤을 경험한 이들은 각자의 자리로 돌아가면서도, ${name}이 남긴 여운을 쉽게 떨쳐내지 못한다. 이것이야말로 좋은 밤문화 공간의 증거다.`;
  } else {
    scenes.scene3 = `새벽이 되어서야 우리는 ${name}을 나섰다. 모두의 얼굴에 ${adj1} 만족감이 떠올라 있었다. ${sounds[2]}의 여운이 아직 귀에 남아 있었고, ${act[2]}던 시간이 벌써 그리워졌다. ${region}의 새벽 공기가 상쾌하게 느껴졌고, 우리 사이에서는 자연스럽게 다음 모임의 약속이 오갔다. ${name}은 우리에게 ${adj3} 추억 하나를 더해주었다.`;
  }

  // Scene 4: Sensory detail (250+ chars)
  scenes.scene4 = (() => {
    const sensoryDetails = [
      `${name}에서 가장 먼저 감지되는 것은 ${sounds[3]}이다. 그 다음으로 눈에 들어오는 것은 ${adj2} 조명이 만들어내는 공간의 질감이다. 음료 한 잔을 들고 천천히 둘러보면, 벽면의 텍스처부터 천장의 구조물까지 ${adj4} 디자인 요소들이 조화를 이루고 있음을 발견한다. ${region}의 다른 어떤 공간에서도 느낄 수 없는 ${name}만의 감각적 시그니처가 여기 있다.`,
      `${name}의 인테리어는 단순한 장식을 넘어선다. ${adj2} 조명 설계는 시간대에 따라 공간의 무드를 자연스럽게 전환시킨다. ${sounds[3]}과 함께 변화하는 빛의 스펙트럼이 감각을 자극하며, 바 위에 놓인 음료의 색감마저 이 조명 아래에서는 특별해 보인다. 이러한 ${adj4} 디테일의 총합이 ${name}만의 고유한 분위기를 만들어낸다.`,
      `${spaces[3]}에서 바라본 ${name}의 전경은 하나의 작품 같다. ${adj2} 빛의 층위가 공간에 깊이를 더하고, ${sounds[3]}이 귀를 감싼다. 음료의 첫 모금과 함께 이 모든 감각적 요소가 하나의 경험으로 수렴되는 순간, ${name}이 단순한 장소가 아니라 ${adj4} 체험의 공간임을 깨닫게 된다.`,
    ];
    return sensoryDetails[sectionSel(idx, 'scene4') % sensoryDetails.length];
  })();

  // Scene 5: Emotional reflection (250+ chars)
  scenes.scene5 = (() => {
    const reflections = [
      `${name}이 ${region}의 밤문화 지형에서 차지하는 위치는 단순한 업소 이상이다. 이곳은 하루의 무게를 내려놓고 자신만의 시간을 되찾는 ${adj1} 리셋 공간이다. 매 방문마다 조금씩 다른 경험을 안겨주는 것이 이곳의 진정한 가치이며, 그래서 사람들은 계속해서 이 문을 두드리게 된다.`,
      `돌이켜보면, ${name}에서의 시간은 단순한 유흥을 넘어 하나의 ${adj1} 이야기였다. ${region}이 품고 있는 밤의 서사 중 한 편을 직접 써내려간 느낌이다. 이곳에서 만든 기억은 시간이 지나도 ${adj3} 여운으로 남아, 일상 속에서 문득 미소를 짓게 만든다.`,
      `${name}을 떠나는 이들의 공통점이 있다. ${adj1} 만족감과 아련한 아쉬움의 공존. 이것이야말로 좋은 밤문화 공간의 조건이다. ${region}의 밤을 더 풍요롭게 만드는 ${name}의 존재는, 이 도시의 야간 경제와 문화 모두에 ${adj3} 기여를 하고 있다.`,
      `${name}이라는 공간에서 가져가는 것은 사진이나 영수증이 아니다. 그것은 ${adj1} 감정의 잔향이며, 다음 방문에 대한 기대이며, ${region}의 밤이 줄 수 있는 가장 인간적인 경험에 대한 확인이다. 이곳은 그런 ${adj3} 가치를 조용히 전하고 있다.`,
    ];
    return reflections[sectionSel(idx, 'scene5') % reflections.length];
  })();

  // Scene 6: The People (new)
  scenes.scene6 = (() => {
    const peopleScenes = [
      `${name}에서 눈길을 끄는 것은 공간만이 아니다. 이곳을 찾는 사람들의 표정, 옷차림, 대화의 톤까지 하나의 풍경을 이룬다. 바 카운터에서 혼자 음료를 즐기는 사람, 테이블에서 웃음을 터뜨리는 그룹, 무대 앞에서 리듬에 몸을 맡긴 커플. 각자의 목적은 다르지만, 이 공간이 주는 에너지를 공유하고 있다는 점은 같다. ${region}의 밤을 채우는 것은 결국 사람들이며, ${name}은 그 사람들이 자연스럽게 모여드는 구심점이다.`,
      `관찰자의 시선으로 ${name}을 바라보면 흥미로운 패턴이 보인다. 이른 시간에 도착한 이들은 주로 단둘이, 혹은 소수의 친밀한 그룹이다. 시간이 흐르면서 인원이 늘어나고, 밤이 깊어질수록 에너지가 올라간다. 직업도, 나이도, 이곳에 온 이유도 제각각인 사람들이 음악이라는 공통분모 아래 하나가 되는 순간. 그것이 ${name}의 밤에서 가장 인간적인 장면이다.`,
      `${name}의 스태프도 이 공간의 일부다. 음료를 만드는 손길의 능숙함, 손님을 안내하는 자연스러운 동선, 분위기를 읽고 대응하는 센스. 이들의 전문성이 방문자 경험의 질을 높인다. 단골 손님과 스태프 사이의 편안한 인사, 첫 방문자에게 건네는 간단한 추천 한마디. 이런 작은 상호작용들이 모여 ${name}만의 인간적인 분위기를 만든다.`,
      `${name}을 찾는 이들의 공통점이 있다면, 그것은 '밤의 시간을 허투루 쓰고 싶지 않다'는 마음가짐이다. ${region}에서 보내는 소중한 밤을 의미 있게 만들고자 하는 사람들이 이 문을 두드린다. 덕분에 이곳의 에너지는 항상 긍정적이고, 서로 모르는 사이에서도 자연스러운 교류가 일어난다.`,
    ];
    return peopleScenes[sectionSel(idx, 'scene4') % peopleScenes.length];
  })();

  // Scene 7: Behind the Scenes (new)
  scenes.scene7 = (() => {
    const behindScenes = [
      `${name}의 문이 열리기 전부터 준비는 시작된다. 음향 점검, 조명 세팅, 바 재료 정리, 동선 확인. 손님이 도착하기 최소 두 시간 전부터 스태프들은 이 공간을 하나의 무대처럼 세팅한다. 매일 밤 같은 장소에서 열리지만, 그 밤은 절대 같지 않다. 요일별로, 시즌별로, 방문자의 구성별로 미세하게 조정되는 것들이 있고, 그 조정의 누적이 곧 ${name}의 품질이 된다.`,
      `보이지 않는 곳에서 ${name}의 수준이 결정된다. 음향 엔지니어가 공간의 울림을 계산하고, 조명 담당이 시간대별 색온도를 프로그래밍하며, 바텐더가 그날의 추천 메뉴를 준비한다. 이 모든 준비 과정이 방문자에게는 '분위기가 좋다'는 한마디로 압축되지만, 그 한마디 뒤에는 수많은 전문가의 노력이 숨어 있다.`,
      `${name}이 꾸준히 사랑받는 비결은 운영의 일관성에 있다. 매일 밤 같은 수준의 서비스를 유지하는 것은 생각보다 어려운 일이다. 스태프 교육, 장비 관리, 고객 피드백 반영까지. 이 공간이 방문할 때마다 기대를 충족시키는 것은 결코 우연이 아니다.`,
    ];
    return behindScenes[hashStr(name + 'behind') % behindScenes.length];
  })();

  // Scene 8: The Return (new)
  scenes.scene8 = (() => {
    const returnScenes = [
      `${name}에 다시 가게 되는 이유는 사람마다 다르다. 누군가는 그날의 음악이, 누군가는 그 공간의 조명이, 누군가는 함께한 사람들과의 기억이 발걸음을 이끈다. 그러나 공통적인 것은, 이곳에서의 경험이 단순한 '외출' 이상이었다는 점이다. ${region}의 밤이 주는 선물 같은 시간. 그것을 다시 받고 싶어서, 사람들은 ${name}의 문을 다시 두드린다.`,
      `처음 방문과 두 번째 방문은 다르다. 처음에는 모든 것이 새롭고 감각이 열려 있다. 두 번째에는 익숙함 속에서 이전에 놓쳤던 디테일을 발견하게 된다. 바 뒤편의 장식, 벽면의 텍스처, 특정 시간대에만 바뀌는 조명 패턴. ${name}은 방문할수록 깊이가 느껴지는 공간이다. 세 번째, 네 번째 방문에서는 이미 이곳이 자신만의 루틴이 되어 있음을 깨닫게 된다.`,
      `단골이 된다는 것은 그 공간과 관계를 맺는다는 뜻이다. 스태프가 얼굴을 알아보고, 선호하는 자리를 기억해주고, 좋아할 만한 음료를 먼저 추천해주는 순간이 온다. ${name}에서 그런 관계가 만들어지면, 이곳은 단순한 ${TYPE_LABELS[type]}가 아닌 자신만의 아지트가 된다. ${region}에서의 밤이 특별한 것은, 이런 공간이 존재하기 때문이다.`,
    ];
    return returnScenes[hashStr(name + 'return') % returnScenes.length];
  })();

  return scenes;
}

// ─── Atmosphere (compositional, venue name in EVERY sub-sentence) ───
function generateAtmosphere(v, idx, rng) {
  const { name, region, typeKr, adj1, adj2, adj3, adj4, verb, timeExpr } = getVenueVars(v);

  const coreIdentity = [
    `${name}은 ${region}의 밤문화 지형도에서 빼놓을 수 없는 이름이다.`,
    `${region}에서 ${typeKr}를 논할 때 ${name}은 반드시 언급되는 곳이다.`,
    `${name}이라는 이름은 ${region} ${typeKr} 씬에서 하나의 기준점을 형성했다.`,
    `${region}의 밤에 ${adj1} 의미를 부여하는 공간, 그것이 바로 ${name}이다.`,
    `${name}은 ${region} 밤문화의 다양한 스펙트럼 중에서도 ${adj1} 존재감을 드러낸다.`,
    `${name}을 한마디로 정의하기는 어렵지만, ${region}의 밤을 ${adj1} 색채로 물들이는 곳이라 할 수 있다.`,
    `${region}에서 ${name}의 위상은 단순한 ${typeKr}를 넘어선다. ${name}은 이 지역 밤문화의 ${adj1} 랜드마크다.`,
    `${name}이 ${region}에서 갖는 의미는 단순한 유흥 공간 이상이다. ${name}은 밤의 문화를 ${adj1} 방식으로 재정의하고 있다.`,
    `${region}의 밤을 이야기할 때 ${name}을 빼놓을 수 없다. ${name}만의 ${adj1} 존재감은 방문 전부터 느껴진다.`,
    `${name}은 ${region}에서 ${adj1} 포지션을 차지하고 있는 ${typeKr}이다. ${name}의 이름 자체가 하나의 브랜드다.`,
    `${region} ${typeKr} 씬에서 ${name}만큼 ${adj1} 인상을 남기는 곳은 드물다. ${name}의 존재감은 독보적이다.`,
    `${name}은 ${region}의 밤에 ${adj1} 챕터를 추가한 공간이다. ${name} 이전과 이후의 ${region} 밤문화는 다르다고 해도 과언이 아니다.`,
    `${region}에서 ${name}을 찾는 이유는 분명하다. ${name}이 제공하는 ${adj1} 경험은 다른 곳에서 대체하기 어렵기 때문이다.`,
    `${name}은 ${region} ${typeKr} 씬의 ${adj1} 중심축 중 하나다. ${name}의 브랜드 파워는 꾸준한 품질 관리에서 비롯된다.`,
    `${region}에서 밤문화를 즐기려는 이들에게 ${name}은 늘 첫 번째 선택지에 오른다. ${name}의 ${adj1} 명성은 하루아침에 만들어진 것이 아니다.`,
  ];

  const spaceDesc = [
    `${name}의 공간은 단순한 유흥의 장이 아니라, ${adj2} 경험을 설계하는 무대로 기능한다. ${name}의 인테리어부터 동선, 조명까지 모든 요소가 방문자의 감각을 ${verb}.`,
    `${name}의 첫인상은 ${adj2}지만, 시간이 지날수록 ${name}의 더 깊은 층위가 드러난다. ${name}의 음향 설비, 좌석 배치, 조명 계조까지 계산된 설계가 느껴진다.`,
    `${timeExpr} ${name}에 발을 들이면, 바깥의 ${region}과는 전혀 다른 세계로 진입하는 느낌을 받는다. ${name}의 ${adj2} 분위기는 언제나 새롭다.`,
    `${adj2} 공간 설계가 ${name}의 핵심 경쟁력이다. ${name}의 바 카운터에서 시작해 메인 공간으로 이어지는 동선이 방문자를 ${verb}.`,
    `${name}의 내부에 들어서면 ${adj2} 조명이 먼저 눈에 들어온다. ${name}의 공간 구성은 방문자의 시선을 자연스럽게 이끌며, 각 구역마다 다른 매력을 발산한다.`,
    `${name}은 공간 자체가 하나의 작품이다. ${name}의 ${adj2} 인테리어는 기능성과 미학을 동시에 추구하며, ${name}을 방문하는 것만으로도 시각적 만족감을 준다.`,
    `${name}의 공간 활용은 ${region}에서도 돋보인다. ${name}은 넓은 공간을 ${adj2} 방식으로 구획하여, 방문자가 자신의 취향에 맞는 구역을 선택할 수 있게 했다.`,
    `${name}에 들어서는 순간 느끼는 것은 ${adj2} 공기의 질감이다. ${name}의 환기 시스템, 조명 온도, 음향 밸런스가 조화롭게 맞물려 ${name}만의 분위기를 만든다.`,
    `${name}의 실내 디자인은 트렌드를 따르면서도 ${name}만의 ${adj2} 정체성을 잃지 않는다. ${name}의 공간은 방문할 때마다 미세한 변화를 발견하게 하는 재미가 있다.`,
    `${name}의 가장 큰 매력 중 하나는 공간의 다층성이다. ${name}의 ${adj2} 구조는 같은 공간 안에서도 다양한 분위기를 경험하게 해준다.`,
    `${name}의 동선은 방문자를 자연스럽게 안내하도록 설계되어 있다. ${name}에 처음 온 사람도 ${adj2} 공간 구성 덕분에 편안하게 자리를 잡을 수 있다.`,
    `${name}의 조명 디자인은 시간대별로 달라진다. ${name}의 이른 저녁은 ${adj2} 톤으로, 밤이 깊을수록 더 강렬한 빛의 연출이 ${name}의 분위기를 고조시킨다.`,
    `${name}을 방문하면 가장 먼저 ${adj2} 천장 구조물이 시선을 사로잡는다. ${name}의 공간 연출은 위아래, 좌우 모든 방향에서 감각을 자극한다.`,
    `${name}의 바 카운터는 ${name}의 심장과 같다. 이곳에서 ${name}의 ${adj2} 에너지가 시작되어 공간 전체로 퍼져나간다.`,
    `${name}은 소리와 빛의 균형을 ${adj2} 수준으로 유지하는 곳이다. ${name}의 음향과 조명이 만들어내는 시너지는 방문자를 ${name}의 세계로 끌어당긴다.`,
  ];

  const uniqueValue = [
    `${name}에 처음 오는 이에게는 ${adj3} 발견의 기쁨을, 재방문자에게는 ${adj4} 친숙함 속의 새로움을 선사한다. 이것이 ${name}이 ${region}에서 사람들을 끌어모으는 이유다.`,
    `${adj3} 변화를 추구하면서도 핵심 가치를 유지하는 것이 ${name}의 전략이다. 매 시즌 조정이 이루어지지만, ${name}만의 ${adj4} 정체성은 변하지 않는다.`,
    `${name}의 매력은 한 가지로 정의할 수 없다. ${adj3} 음악, ${adj4} 인테리어, 세심한 서비스가 어우러져 ${name}만의 총체적 경험을 만든다.`,
    `방문할 때마다 다른 인상을 남기는 것, 그것이 ${name}의 ${adj3} 매력이다. ${region}의 밤을 ${name}만큼 ${adj4} 방식으로 경험하게 해주는 곳은 없다.`,
    `${name}이 오랜 시간 사랑받는 비결은 ${adj3} 일관성에 있다. ${name}은 언제 방문해도 기대를 충족시키는 ${adj4} 품질을 유지한다.`,
    `${name}에서 가져가는 것은 사진이 아니라 ${adj3} 감정의 잔향이다. ${name}의 ${adj4} 경험은 일상으로 돌아간 뒤에도 오래 머문다.`,
    `${name}의 가치는 시간이 지날수록 더 깊이 와닿는다. ${name}에서의 첫 방문은 ${adj3} 놀라움이었지만, 재방문은 ${adj4} 확신으로 바뀐다.`,
    `${name}이 ${region}에서 차별화되는 지점은 디테일에 있다. ${name}의 ${adj3} 세심함은 작은 부분까지 놓치지 않으며, 이것이 ${name}을 ${adj4} 존재로 만든다.`,
    `${name}에서의 시간은 단순한 소비가 아니라 ${adj3} 투자다. ${name}이 돌려주는 경험의 가치는 비용을 훨씬 상회하며, ${adj4} 만족감을 보장한다.`,
    `${name}의 진정한 경쟁력은 ${adj3} 경험의 총합에 있다. 음악, 공간, 서비스, 사람들이 만들어내는 ${name}만의 ${adj4} 하모니가 ${name}의 핵심이다.`,
    `${name}을 떠나는 이들의 공통점은 ${adj3} 만족감과 아련한 아쉬움의 공존이다. ${name}의 ${adj4} 매력은 다음 방문을 자연스럽게 약속하게 만든다.`,
    `${name}에서 경험한 ${adj3} 순간들은 시간이 지나도 선명하다. ${name}의 ${adj4} 인상은 일상 속에서 문득 미소를 짓게 만드는 힘이 있다.`,
    `${name}이 방문자에게 전하는 메시지는 단순하다: 밤은 ${adj3} 만큼 가치 있을 수 있다는 것. ${name}은 그 가능성을 ${adj4} 방식으로 증명한다.`,
    `${name}에서의 밤은 하나의 완결된 ${adj3} 서사다. 시작부터 끝까지 ${name}이 연출하는 ${adj4} 흐름에 몸을 맡기면, 최고의 경험이 기다린다.`,
    `${name}이 ${region}에서 독보적인 이유는 ${adj3} 총체적 경험에 있다. ${name}의 음악, 공간, 서비스 하나하나가 ${adj4} 조화를 이루며, 방문자를 완벽하게 매료시킨다.`,
  ];

  return compose(v.displayName, 'atmo', [coreIdentity, spaceDesc, uniqueValue]);
}

// ─── Music section (compositional, 10+ per type, venue name in every template) ───
function generateMusic(v, idx, rng) {
  const { name, region, adj1, adj2, adj3, typeKr } = getVenueVars(v);

  const musicPools = {
    club: [
      `${name}의 음향 시스템은 ${region} 클럽씬에서도 ${adj1} 수준으로 평가받는다. ${name}의 레지던트 DJ는 밤의 흐름을 설계하듯 선곡하며, 초반 하우스에서 강렬한 EDM으로 이행하는 구성이 방문자의 에너지 곡선과 맞물린다. ${adj2} 베이스라인이 바닥을 타고 올라올 때, ${name}의 사운드가 음량이 아닌 음질에 집중하고 있음을 체감하게 된다.`,
      `${name}에서의 음악 경험은 일반적인 클럽 사운드를 넘어선다. ${name}의 ${adj1} 선곡이 밤의 시작부터 끝까지 일관된 서사를 만들어내며, 주중과 주말의 음악 컬러가 다른 점도 ${name}의 특징이다. 주중에는 딥하우스와 테크노가, 주말에는 메인스트림 EDM과 힙합이 ${name}의 공간을 채운다.`,
      `${name}의 DJ 라인업은 ${region}에서 가장 ${adj1} 것으로 알려져 있다. ${name}에서는 게스트 DJ 이벤트가 정기적으로 열리며, 사운드 시스템은 ${adj2} 음질을 자랑한다. 저음부터 고음까지 모든 주파수가 깨끗하게 전달되는 ${name}에서 음악은 배경이 아닌 주인공이다.`,
      `${name}의 사운드 철학은 '소리로 공간을 조각한다'는 것에 가깝다. ${name}에 설치된 스피커 시스템은 ${adj1} 출력을 자랑하면서도 왜곡 없는 깨끗한 음질을 유지한다. ${name}의 DJ가 드롭을 떨어뜨리는 순간의 쾌감은 직접 체험해봐야 안다.`,
      `${name}의 음악 프로그래밍은 요일별로 차별화되어 있다. 수요일 ${name}은 R&B와 힙합 위주, 금요일 ${name}은 프로그레시브 하우스, 토요일 ${name}은 메인스트림 EDM이 중심이다. ${adj1} 장르 다양성이 ${name}을 다양한 취향의 방문자가 찾는 이유다.`,
      `${name}에서 음악을 듣는 경험은 단순한 청각 이상이다. ${name}의 ${adj2} 저주파가 가슴을 두드리고, 고음부의 디테일이 귀를 감싸며, 몸 전체로 음악을 느끼게 된다. ${name}의 이 ${adj1} 사운드 경험은 ${region}에서 독보적이다.`,
      `${name}의 레지던트 DJ는 ${region} 클럽씬에서 ${adj1} 존재감을 드러내고 있다. ${name}에서 그가 만들어내는 셋은 단순한 선곡이 아니라 하나의 음악적 여정이다. ${name}을 찾는 이들 중 상당수가 이 DJ의 팬이라는 점이 ${name}의 음악적 수준을 방증한다.`,
      `${name}은 EDM의 다양한 하위 장르를 골고루 소화하는 곳이다. ${name}에서 한 밤에 하우스, 테크노, 트랜스, 덥스텝을 모두 경험할 수 있으며, 장르 전환의 매끄러움이 ${name} DJ의 기술력을 증명한다. ${adj1} 선곡 철학이 ${name}의 핵심 경쟁력이다.`,
      `${name}의 음향 엔지니어링은 공간 음향학을 고려한 ${adj1} 설계의 결과물이다. ${name} 어느 위치에서든 균일한 음질을 경험할 수 있으며, 댄스플로어 중앙의 사운드 스윗 스팟은 ${name}만의 특별한 경험을 선사한다.`,
      `${name}에서 특별 이벤트가 열리는 밤은 음악의 수준이 한층 올라간다. 국내외 게스트 DJ가 ${name}의 부스에 서면, ${name}의 분위기는 ${adj1} 에너지로 가득 차며, 평소와는 다른 ${adj2} 사운드 스케이프가 펼쳐진다.`,
    ],
    night: [
      `${name}의 라이브 무대는 ${region} 나이트 중에서도 ${adj1} 완성도를 보여준다. ${name}의 숙련된 밴드는 트로트부터 댄스 팝까지 폭넓은 레퍼토리를 소화하며, ${name}의 관객 참여형 코너에서는 신청곡이 공간을 채운다. 댄스 타임이 시작되면 ${name}은 세대를 초월한 즐거움의 현장이 된다.`,
      `${name}에서는 음악이 단순한 BGM이 아닌 주인공이다. ${name}의 밴드가 매일 다른 셋리스트를 준비하며, 관객 반응에 따라 실시간으로 분위기를 조절한다. ${name}의 ${adj1} 무대 연출과 함께 음악이 흘러나올 때, ${name}의 가치를 실감하게 된다.`,
      `${name}의 음악 프로그램은 ${region}에서도 손꼽히는 ${adj1} 구성을 자랑한다. ${name}의 공연은 초반 감미로운 발라드에서 시작해 중반 열정적인 댄스 파트, 후반 클라이맥스로 이어진다. ${name} 밴드 멤버 각각의 개성이 무대 위에서 빛난다.`,
      `${name}의 밴드는 ${region}에서 가장 다재다능한 뮤지션들로 구성되어 있다. ${name}의 무대에서는 올드팝, 가요, 댄스곡이 자연스럽게 이어지며, ${name}만의 ${adj1} 편곡이 원곡과는 다른 매력을 더한다. ${name} 라이브의 감동은 녹음으로는 대체 불가다.`,
      `${name}의 음악적 특징은 관객과의 소통에 있다. ${name}의 밴드는 무대 위에서 관객의 반응을 읽고, 그에 맞춰 에너지를 조절한다. ${name}에서의 라이브는 일방적인 공연이 아니라 밴드와 관객이 함께 만드는 ${adj1} 합작품이다.`,
      `${name}의 댄스 타임은 ${region} 나이트씬의 하이라이트다. ${name}의 DJ가 밴드 사이 막간에 최신 댄스곡을 틀면, ${name}의 플로어는 순식간에 열기로 가득 찬다. ${name}에서의 이 ${adj2} 전환이 밤의 클라이맥스를 만든다.`,
      `${name}의 보컬리스트는 ${region} 나이트 씬에서 ${adj1} 실력자로 통한다. ${name}의 무대에서 울려 퍼지는 ${adj2} 목소리는 관객을 단번에 사로잡으며, ${name}의 밴드와 보컬의 호흡은 오랜 경험에서 나오는 안정감을 보여준다.`,
      `${name}에서의 음악 경험은 시간대에 따라 확연히 달라진다. 초저녁 ${name}은 잔잔한 발라드와 어쿠스틱으로 시작해, 밤이 깊을수록 ${name}의 에너지는 상승한다. ${adj1} 전환의 흐름을 타며 ${name}의 밤을 즐겨보자.`,
      `${name}의 무대 장비와 음향 시스템은 라이브 공연에 최적화되어 있다. ${name}의 스피커에서 나오는 밴드 사운드는 ${adj1} 라이브감을 극대화하며, 어디에 앉아도 ${name}의 음악을 선명하게 즐길 수 있다.`,
      `${name}에서 가장 기억에 남는 순간은 밴드의 앙코르 타임이다. ${name}의 관객과 밴드가 하나가 되어 마지막 곡을 부르는 ${adj1} 장면은, ${name} 방문의 하이라이트로 오래 기억에 남는다.`,
    ],
    lounge: [
      `${name}에서 흘러나오는 음악은 ${name}이라는 공간의 향수와도 같다. ${name}의 ${adj1} 큐레이팅이 저녁부터 밤까지 자연스러운 흐름을 만들어내며, ${name}에서의 대화를 방해하지 않으면서도 공간에 깊이를 더한다.`,
      `${name}의 음악 선곡은 ${adj1} 세심함으로 정평이 나 있다. 이른 저녁 ${name}에서는 보사노바와 재즈가, 밤이 깊으면 네오소울과 딥R&B가 ${name}의 공간을 채운다. ${name}에서의 이 전환은 너무 자연스러워 의식하지 못할 정도다.`,
      `${name}에서 음악은 공간의 호흡 그 자체다. ${name}의 볼륨은 대화에 최적화되어 있지만, 귀를 기울이면 ${adj1} 선곡의 품격이 느껴진다. 클래식 재즈부터 현대 일렉트로니카까지 ${name}에서는 시간대에 따라 다른 음악이 흐른다.`,
      `${name}의 음악 철학은 '소리로 분위기를 빚는다'는 것이다. ${name}에서 흘러나오는 ${adj1} 선율은 방문자의 감성을 자극하면서도 대화의 흐름을 존중한다. ${name}의 바텐더가 칵테일을 만드는 소리와 음악이 어우러지는 순간이 가장 아름답다.`,
      `${name}에서는 간혹 라이브 재즈 세션이 열린다. ${name}의 좁은 무대에서 펼쳐지는 ${adj1} 라이브 연주는 ${name}의 분위기를 한층 끌어올리며, 이날 ${name}을 방문한 이들은 특별한 행운을 누리게 된다.`,
      `${name}의 플레이리스트는 시즌별로 업데이트된다. ${name}의 봄 플레이리스트는 경쾌한 보사노바, 여름은 쿨한 트로피칼, 가을은 감성적인 재즈, 겨울은 따스한 소울이 ${name}의 공간을 채운다. ${adj1} 계절감각이 ${name}의 강점이다.`,
      `${name}에서의 음악 경험은 볼륨이 아닌 퀄리티에 있다. ${name}은 고급 스피커 시스템으로 ${adj1} 음질을 구현하며, ${name}에서 음악을 듣는 것 자체가 하나의 심미적 경험이 된다. ${name}의 이 차별점은 ${region} 라운지씬에서 독보적이다.`,
      `${name}의 DJ(혹은 음악 큐레이터)는 ${region}에서 ${adj1} 센스로 알려진 인물이다. ${name}에서 그가 만드는 음악의 흐름은, 방문자의 감정선을 세밀하게 따라가며 ${name}만의 무드를 완성한다.`,
      `${name}에서 특별한 밤을 원한다면 라이브 이벤트 날짜를 확인해보자. ${name}의 라이브 세션은 불규칙적으로 열리지만, 그날의 ${name}은 평소와는 확연히 다른 ${adj1} 에너지로 가득 찬다.`,
      `${name}의 시그니처 칵테일과 음악의 페어링은 ${name}만의 ${adj1} 경험이다. ${name}의 바텐더가 추천하는 음료를 마시며 그에 맞춰 흐르는 음악을 감상하면, ${name}이 왜 ${region}에서 특별한 곳인지 자연스럽게 이해하게 된다.`,
    ],
  };

  return musicPools[v.type][hashStr(name + 'music') % musicPools[v.type].length];
}

// ─── Safety/manner/budget guide (compositional, venue name in every sentence) ───
function generateSafety(v, idx) {
  const { name, region, typeKr, adj1, adj2, rf } = getVenueVars(v);

  const openers = [
    `${name}에서 즐거운 밤을 보내려면 몇 가지 기본 매너를 숙지해두는 것이 좋다.`,
    `${name} 방문을 계획 중이라면, 안전하고 매너 있는 밤을 위한 준비가 필요하다.`,
    `${name}에서의 밤을 최대한 만끽하기 위해서는 사전 준비가 중요하다.`,
    `${name}을 방문하기 전에 알아두면 좋은 매너와 안전 수칙을 정리했다.`,
    `${name}에서 ${adj1} 밤을 보내기 위한 실전 가이드를 소개한다.`,
    `${name} 방문이 처음이든 재방문이든, 기본 매너와 예산 계획은 꼭 챙기자.`,
    `${name}에서의 완벽한 밤을 위해 매너, 예산, 안전 세 가지를 점검해보자.`,
    `${name}을 즐기는 데 있어 가장 기본이 되는 것은 상호 존중의 매너다.`,
    `${name} 방문 시 지켜야 할 에티켓과 예산 가이드를 한눈에 정리했다.`,
    `${name}에서 후회 없는 밤을 만들기 위한 핵심 수칙을 알아보자.`,
    `${name} 첫 방문자를 위한 매너·예산·안전 삼박자 가이드를 준비했다.`,
    `${name}에서의 시간을 알차게 보내려면 다음 사항을 미리 체크하자.`,
    `${name}을 제대로 즐기려면 기본적인 밤문화 에티켓을 알아두는 것이 좋다.`,
    `${name} 방문 전 꼭 읽어야 할 매너 가이드와 예산 팁을 모았다.`,
    `${name}에서 모두가 편안한 밤을 보내려면 서로에 대한 배려가 필수다.`,
  ];

  const manners = [
    `${name} 내에서는 상대방의 의사를 존중하는 것이 첫 번째 원칙이다. 동의 없는 접촉은 금물이며, 거절은 우아하게 수용하는 것이 성숙한 태도다.`,
    `${name}의 분위기를 함께 만드는 것은 방문자 모두의 몫이다. 과도한 소란을 삼가고, 주변 손님의 공간을 존중하는 것이 기본이다.`,
    `${name}에서는 스태프의 안내에 협조하고, 다른 방문자와의 매너 있는 교류를 지향하자. 불편한 상황은 직접 대응보다 스태프를 통해 해결하는 것이 현명하다.`,
    `${name}을 방문할 때는 복장 규정을 미리 확인하고, 깔끔한 차림으로 가는 것이 서로에 대한 예의다. 슬리퍼나 운동복은 피하자.`,
    `${name}에서의 교류는 자연스러움이 핵심이다. 강요하지 않고, 거절에 기분 나빠하지 않으며, 모두가 편안한 분위기를 만드는 것이 중요하다.`,
    `${name} 방문 시 타인의 사진을 무단으로 촬영하지 않는 것도 기본 매너다. 촬영이 필요하면 반드시 동의를 구하자.`,
    `${name}에서는 음료를 들고 이동할 때 주변에 주의하고, 댄스 구역에서는 서로의 공간을 배려하며 즐기자.`,
    `${name}의 스태프에게 기본적인 예의를 갖추는 것도 중요하다. 친절한 소통이 더 나은 서비스로 돌아온다.`,
    `${name}에서 모르는 사람이 건네는 음료는 정중하게 거절하는 것이 안전하다. 자리를 비운 사이 방치된 음료도 마시지 않는 것이 원칙이다.`,
    `${name} 방문 전 함께 갈 인원과 역할을 정해두면 더 안전하다. 지정 운전자나 귀가 책임자를 미리 정하는 것도 좋은 방법이다.`,
    `${name}에서는 자신의 음주 한계를 알고 그 안에서 즐기되, 컨디션이 좋지 않으면 과감히 멈추는 것이 현명하다.`,
    `${name} 방문 시 휴대폰 충전을 완료하고, 긴급 연락처를 저장해두면 만일의 상황에 대비할 수 있다.`,
    `${name}에서 즐거운 시간을 보내려면 음주 페이스 조절이 핵심이다. 음료 사이에 물을 마시는 습관이 큰 차이를 만든다.`,
    `${name} 방문 전 지인에게 방문 장소와 예상 귀가 시간을 알려두는 것이 안전의 기본이다.`,
    `${name}에서의 밤은 즐거움과 안전의 균형 위에 성립한다. 자신의 컨디션을 솔직하게 인정하고 무리하지 않는 것이 중요하다.`,
  ];

  const budgets = [
    `${name} 방문 예산은 입장료, 음료비, 교통비를 포함하여 여유 있게 산정하자. 현금과 카드를 모두 지참하되, 한도를 정해두고 초과하지 않는 절제력이 중요하다.`,
    `${name}에서의 예산 계획은 미리 세우는 것이 현명하다. 인당 5만~10만 원 정도를 기준으로 잡되, 보틀이나 테이블 비용은 별도로 고려하자.`,
    `${name} 방문 비용은 요일과 시즌에 따라 달라질 수 있다. 사전에 공식 채널에서 가격을 확인하고, 여유 자금을 확보해두는 것이 좋다.`,
    `${name}에서 과소비를 방지하려면 총 예산의 상한선을 정해두고, 그 안에서 최대한 즐기는 전략이 효과적이다.`,
    `${name} 방문 시 귀가 교통비를 반드시 별도로 확보해두자. ${rf.transport} 근처에서 택시나 대리운전을 이용하면 안전하게 귀가할 수 있다.`,
    `${name}의 음료 가격대와 입장료는 시즌별로 다를 수 있으므로, 방문 전 공식 계정에서 최신 정보를 확인하는 것을 추천한다.`,
    `${name}에서는 그룹이라면 보틀을 나눠 마시는 것이 경제적이다. 예산 분담을 미리 정해두면 지갑 걱정 없이 밤을 즐길 수 있다.`,
    `${name} 방문 예산에서 빠뜨리기 쉬운 항목이 식사비와 2차 비용이다. 전체 일정의 예산을 미리 계획하면 더 알차게 보낼 수 있다.`,
    `${name}을 방문할 때 주차비, 발레파킹비 등 부대비용도 고려하자. 대중교통 이용이 가능하다면 비용 절약에 도움이 된다.`,
    `${name}에서의 지출을 똑똑하게 관리하려면, 음료 주문 시 가격을 먼저 확인하고 예산 내에서 선택하는 습관이 좋다.`,
    `${name} 방문 전 현금을 넉넉히 준비해두면 카드 결제가 안 되는 상황에도 당황하지 않는다. 소액 현금은 팁이나 비상시에도 유용하다.`,
    `${name}에서 첫 방문이라면 기본 음료 위주로 시작하고, 분위기를 파악한 뒤 추가 주문하는 것이 예산 관리에 효과적이다.`,
    `${name} 방문 시 음주 후 운전은 절대 금물이다. 대리운전 앱을 미리 설치하고, 택시비는 별도로 확보해두자.`,
    `${name}에서의 예산은 개인 상황에 맞게 유연하게 조절하되, 안전을 위한 귀가 비용만큼은 반드시 남겨두자.`,
    `${name} 방문 비용을 줄이는 팁: 이른 시간 입장, 평일 방문, 이벤트 할인 확인 등을 활용하면 합리적으로 즐길 수 있다.`,
  ];

  return compose(v.displayName, 'safety', [openers, manners, budgets]);
}

// ─── Timeline (10 variants, venue name in every desc) ───
function generateTimeline(v, idx, rng) {
  const { name, adj1, adj2, adj3, adj4, rf, region } = getVenueVars(v);

  const timelineVariants = [
    [
      { time: '21:00', label: '도착과 첫 발걸음', desc: `${name}에 도착한다. ${name}의 입구가 풍기는 ${adj1} 분위기가 기대감을 높인다.` },
      { time: '21:30', label: '첫 음료와 공간 탐색', desc: `${name}의 바에서 음료를 주문하고 ${name}의 공간을 둘러본다. ${adj2} 인테리어가 눈에 들어온다.` },
      { time: '22:15', label: '분위기 적응', desc: `${name}의 음악과 조명에 익숙해지면서 자연스럽게 녹아든다.` },
      { time: '23:00', label: '본격적인 즐김', desc: `${name}에서 밤이 본격적으로 시작된다. ${adj3} 에너지가 ${name} 전체로 퍼진다.` },
      { time: '00:00', label: '피크 타임', desc: `${name}이 가장 뜨거운 순간을 맞이한다. ${name}에서의 ${adj4} 시간이다.` },
      { time: '01:30', label: '여운과 귀가', desc: `${name}을 떠나며 달콤한 아쉬움이 남는다. ${name} 재방문에 대한 기대가 피어오른다.` },
    ],
    [
      { time: '웜업 (20-21시)', label: '준비와 이동', desc: `${name} 방문을 위한 준비를 마치고 이동한다. ${name}에 대한 ${adj1} 기대감과 함께 출발한다.` },
      { time: '엔트리 (21-22시)', label: '입장과 적응', desc: `${name}에 입장 후 공간에 익숙해지는 시간. ${name}의 ${adj2} 분위기를 천천히 흡수한다.` },
      { time: '빌드업 (22-23시)', label: '에너지 상승', desc: `${name}의 분위기가 점점 고조된다. ${name}의 음악이 강해지고 에너지가 섞이기 시작한다.` },
      { time: '피크 (23-01시)', label: '절정의 경험', desc: `${name}의 밤이 가장 ${adj3} 빛을 발하는 시간. ${name}의 모든 것이 하나로 수렴된다.` },
      { time: '쿨다운 (01시 이후)', label: '마무리와 귀가', desc: `${name}에서의 여운을 즐기며 마무리한다. ${name} 인근에서 귀가 교통편을 확보한다.` },
    ],
    [
      { time: 'Step 1', label: '기대의 시작', desc: `${name}에 대한 정보를 확인하고 방문을 결심하는 순간부터 밤은 시작된다. ${name}에 대한 ${adj1} 기대감이 커진다.` },
      { time: 'Step 2', label: '첫 만남', desc: `${name}의 입구를 통과하는 순간, ${name}의 ${adj2} 첫인상이 각인된다.` },
      { time: 'Step 3', label: '몰입의 시간', desc: `${name}의 음악과 사람들 사이에서 자연스러운 몰입이 이루어진다. ${name}에서의 시간 감각이 변형된다.` },
      { time: 'Step 4', label: '정점의 순간', desc: `${name}에서의 밤이 하이라이트에 도달한다. ${adj3} 경험이 모든 감각을 관통한다.` },
      { time: 'Step 5', label: '기억의 각인', desc: `${name}을 떠나면서도 남는 것들. ${name}에서의 경험이 기억으로 새겨진다.` },
    ],
    [
      { time: '설렘 (도착)', label: '기분: 기대', desc: `${name}의 문 앞에 서면 설렘이 올라온다. ${name}의 ${adj1} 간판이 밤의 서막을 알린다.` },
      { time: '탐색 (첫 30분)', label: '기분: 호기심', desc: `${name}의 구석구석을 살피며 ${name}의 ${adj2} 디테일을 발견하는 시간이다.` },
      { time: '적응 (1시간)', label: '기분: 편안함', desc: `${name}의 음료와 음악이 자연스럽게 어우러지며, ${name}에 속해 있다는 안정감이 찾아온다.` },
      { time: '고조 (피크)', label: '기분: 흥분', desc: `${name}의 분위기가 최고조에 달한다. ${name}의 ${adj3} 에너지가 온몸을 감싼다.` },
      { time: '여운 (귀가)', label: '기분: 만족', desc: `${name}을 나서며 만족감이 자리잡는다. ${name} 다음 방문이 이미 기다려진다.` },
    ],
    [
      { time: '19:00', label: '준비', desc: `${name}에 갈 준비를 시작한다. ${name}에 어울리는 복장을 고르고 출발한다.` },
      { time: '20:30', label: '식사', desc: `${rf.food}에서 저녁 식사를 마친다. ${name}에서의 밤을 위한 에너지를 충전한다.` },
      { time: '21:30', label: '입장', desc: `${name}에 도착하여 입장한다. ${name}의 ${adj1} 분위기가 첫인상을 남긴다.` },
      { time: '23:00', label: '클라이맥스', desc: `${name}이 가장 활기찬 시간대. ${name}의 ${adj2} 에너지를 온몸으로 느낀다.` },
      { time: '01:00', label: '마무리', desc: `${name}에서의 밤을 정리하고, ${name} 인근에서 안전하게 귀가한다.` },
    ],
    [
      { time: '출발 전', label: '사전 점검', desc: `${name} 방문을 위해 신분증, 현금, 카드를 점검한다. ${name}의 이벤트 정보도 확인한다.` },
      { time: '이동 중', label: '기대감 상승', desc: `${rf.transport}을 향해 이동하며 ${name}에 대한 기대감이 커진다.` },
      { time: '입장 직후', label: '첫 인상', desc: `${name}의 문을 열고 들어서는 순간, ${name}의 ${adj1} 공기가 감각을 깨운다.` },
      { time: '본격 시작', label: '몰입', desc: `${name}의 리듬에 몸을 맡기며 ${name}에서의 밤에 완전히 빠져든다.` },
      { time: '피크', label: '절정', desc: `${name}이 가장 빛나는 시간. ${name}의 ${adj3} 순간을 만끽한다.` },
      { time: '귀가', label: '여운', desc: `${name}을 나서며 오늘 밤의 기억을 정리한다. ${name}이 남긴 여운이 새벽 공기와 섞인다.` },
    ],
    [
      { time: 'A', label: '${name} 도착', desc: `${name} 앞에 도착한다. ${name}의 ${adj1} 외관이 기대를 높인다.` },
      { time: 'B', label: '공간 파악', desc: `${name} 내부를 둘러보며 자리를 잡는다. ${name}의 구조와 분위기를 파악한다.` },
      { time: 'C', label: '음료와 교류', desc: `${name}에서 음료를 즐기며 주변과 자연스럽게 교류한다.` },
      { time: 'D', label: '하이라이트', desc: `${name}의 밤이 절정에 이른다. ${name}에서의 ${adj2} 순간을 경험한다.` },
      { time: 'E', label: '안전 귀가', desc: `${name}에서의 밤을 마무리하고 안전하게 귀가한다.` },
    ],
    [
      { time: '저녁 8시', label: '워밍업', desc: `${name} 방문 전 가볍게 워밍업. ${name}에서의 밤을 위해 컨디션을 점검한다.` },
      { time: '저녁 9시', label: '${name} 입성', desc: `${name}에 입장하며 첫 음료를 주문한다. ${name}의 ${adj1} 공간이 눈에 들어온다.` },
      { time: '밤 10시', label: '분위기 상승', desc: `${name}에 사람들이 늘어나며 분위기가 달아오른다. ${name}의 음악도 한층 강해진다.` },
      { time: '밤 11시', label: '피크 시작', desc: `${name}의 피크 타임이 시작된다. ${name}의 ${adj2} 에너지가 공간을 가득 채운다.` },
      { time: '새벽 1시', label: '마무리', desc: `${name}에서의 밤을 정리한다. ${name}이 남긴 ${adj3} 기억을 안고 귀가한다.` },
    ],
    [
      { time: '첫 번째 잔', label: '시작의 의식', desc: `${name}에서의 첫 음료는 밤의 시작을 알리는 의식이다. ${name}의 바에서 주문한 한 잔이 모든 것을 열어준다.` },
      { time: '두 번째 잔', label: '몰입의 시작', desc: `${name}의 분위기에 적응하며 두 번째 음료를 즐긴다. ${name}의 ${adj1} 무드가 서서히 스며든다.` },
      { time: '세 번째 잔', label: '절정의 순간', desc: `${name}의 밤이 가장 뜨거운 순간. ${name}에서의 ${adj2} 에너지와 함께 세 번째 잔을 기울인다.` },
      { time: '마지막 잔', label: '건배와 마무리', desc: `${name}에서의 마지막 잔은 오늘 밤에 대한 건배다. ${name}을 떠나기 전, 이 ${adj3} 순간을 기억에 새긴다.` },
    ],
    [
      { time: '프리게임', label: '만남과 이동', desc: `${region}에서 모여 ${name}으로 향한다. ${name}에 대한 이야기를 나누며 기대감을 높인다.` },
      { time: '오프닝', label: '입장의 순간', desc: `${name}의 문을 열고 들어선다. ${name}의 ${adj1} 첫인상이 오감에 각인된다.` },
      { time: '메인 이벤트', label: '밤의 핵심', desc: `${name}에서의 핵심 시간. ${name}의 음악과 분위기가 ${adj2} 에너지로 가득한 시간대다.` },
      { time: '앙코르', label: '한 번 더', desc: `${name}을 떠나기 아쉬워 한 곡 더, 한 잔 더. ${name}의 ${adj3} 매력이 발걸음을 잡는다.` },
      { time: '엔딩', label: '귀가의 길', desc: `${name}에서의 밤이 끝난다. ${name}이 남긴 여운과 함께 안전하게 귀가한다.` },
    ],
  ];

  return timelineVariants[hashStr(name + 'timeline') % timelineVariants.length];
}

// ─── Checklist (unique per venue) ───
function generateChecklist(v, idx, rng) {
  const allItems = {
    club: [
      '편한 운동화 또는 깔끔한 스니커즈 착용 권장',
      '신분증(주민등록증 또는 여권) 필수 지참',
      '귀중품은 최소한으로, 작은 가방 추천',
      '사전에 게스트리스트 등록 여부 확인',
      '물 자주 마시며 컨디션 관리',
      '택시비 또는 대리운전 비용 미리 확보',
      '휴대폰 충전 완료 후 출발',
      '함께 갈 친구에게 미리 연락',
      '입장 전 근처 편의점에서 물 구입',
      '현금과 카드 모두 준비',
      '편한 복장이지만 깔끔하게 차려입기',
      '코트나 외투 보관 가능 여부 확인',
      '당일 이벤트 정보 SNS에서 미리 확인',
      '보조 배터리 챙기기',
    ],
    night: [
      '깔끔한 캐주얼 복장 준비',
      '신분증 지참 필수',
      '예약 가능 여부 사전 확인',
      '부킹 매너 숙지하기',
      '음료 페이스 조절 계획 세우기',
      '귀가 교통편 미리 확인',
      '카드 및 현금 여유 있게 준비',
      '핸드폰 배터리 완충',
      '동행자와 집합 시간 확정',
      '가벼운 향수로 마무리',
      '식사를 충분히 한 후 출발',
      '공연 스케줄 사전 확인',
      '편한 구두나 깔끔한 신발 착용',
      '비상 연락처 저장 확인',
    ],
    lounge: [
      '스마트 캐주얼 이상의 복장 추천',
      '신분증 반드시 지참',
      '예약을 권장하며 전화 확인 필수',
      '시그니처 메뉴 미리 체크',
      '대화하기 좋은 자리 요청 가능',
      '충분한 예산 확보',
      '조용한 분위기 존중',
      '사진 촬영 가능 여부 확인',
      '동반자에게 드레스코드 안내',
      '주차 가능 여부 미리 확인',
      '카드 한도 충분한지 확인',
      '특별한 날이라면 사전에 요청사항 전달',
      '혼잡 시간대를 피해 방문 계획',
      '발레파킹 서비스 확인',
    ],
  };
  const pool = allItems[v.type];
  const start = (sectionSel(idx, 'check') * 3) % pool.length;
  const items = [];
  for (let i = 0; i < 7; i++) {
    items.push(pool[(start + i) % pool.length]);
  }
  return items;
}

// ─── FAQ (unique per venue) ───
function generateFAQs(v, idx) {
  const name = `${v.region} ${v.displayName}`;
  const region = v.region;
  const typeKr = TYPE_LABELS[v.type];
  const adjs = SIGNATURE_ADJECTIVES[hashStr(v.displayName + 'adj') % SIGNATURE_ADJECTIVES.length];

  // Generate truly unique questions by embedding venue name and region
  const faqTemplates = {
    club: [
      [
        { q: `${name}의 입장료는 어느 정도인가요?`, a: `요일과 이벤트에 따라 달라집니다. 주말은 평일보다 높으며, 특별 이벤트 시에는 별도 가격이 적용됩니다. 최신 정보는 공식 SNS에서 확인하시기 바랍니다.` },
        { q: `${name}에 나이 제한이 있나요?`, a: `만 19세 이상만 입장 가능합니다. 신분증(주민등록증, 운전면허증, 여권) 확인이 필수이며, 미지참 시 입장이 제한됩니다.` },
        { q: `${name}의 드레스코드 기준은 무엇인가요?`, a: `슬리퍼, 반바지, 운동복은 입장이 제한될 수 있습니다. 깔끔한 캐주얼 이상의 복장을 추천합니다.` },
        { q: `${name}에서 테이블 예약은 어떻게 하나요?`, a: `공식 채널이나 전화로 사전 예약이 가능합니다. 인기 있는 주말은 일찍 예약하시는 것이 좋습니다.` },
        { q: `${name}에서는 어떤 장르의 음악을 들을 수 있나요?`, a: `전문 DJ가 EDM, 힙합, 하우스 등을 시간대별로 선곡합니다. 특별 이벤트에서는 게스트 DJ가 출연하기도 합니다.` },
        { q: `${name}까지 대중교통으로 어떻게 가나요?`, a: `가장 가까운 지하철역에서 도보로 이동 가능하며, 늦은 시간에는 택시 이용을 추천합니다.` },
        { q: `${name}에서 재입장이 가능한가요?`, a: `팔찌나 스탬프로 재입장이 가능한 경우가 많습니다. 정책은 변경될 수 있으니 입장 시 확인하세요.` },
        { q: `${name}에서 생일 파티를 할 수 있나요?`, a: `생일 이벤트 예약이 가능합니다. 사전에 문의하시면 케이크나 샴페인 서비스 등 특별 준비가 가능합니다.` },
        { q: `${name}의 음료 가격대가 궁금합니다`, a: `잔 음료는 만 원대부터 시작하며, 보틀은 종류에 따라 다양합니다. 그룹이라면 보틀이 경제적입니다.` },
        { q: `${name}에 혼자 가도 괜찮을까요?`, a: `솔로 방문객도 많습니다. 바 카운터에서 편안하게 즐기시면 되며, 스태프가 친절하게 안내해드립니다.` },
        { q: `${name}의 피크 시간대는 언제인가요?`, a: `보통 밤 11시부터 새벽 1시 사이가 가장 북적이며, 금토 밤이 가장 활기찹니다.` },
        { q: `${name}은 몇 시에 문을 닫나요?`, a: `보통 새벽 5~6시까지 운영되며, 요일과 이벤트에 따라 변동될 수 있습니다.` },
      ],
    ],
    night: [
      [
        { q: `${name}에 처음 가는데 어떻게 즐기면 되나요?`, a: `편하게 오시면 됩니다. 입장 후 자리를 잡고 음료를 주문하세요. 무대 공연을 감상하거나 댄스 타임에 참여하시면 됩니다.` },
        { q: `${name}에서 부킹은 어떤 방식으로 진행되나요?`, a: `웨이터가 테이블 간 자연스러운 연결을 도와드립니다. 부담 없이 진행되며, 원하지 않으시면 정중히 거절 가능합니다.` },
        { q: `${name} 입장 시 나이 확인을 하나요?`, a: `네, 만 19세 이상만 입장 가능하며 신분증 확인은 필수입니다. 주민등록증이나 운전면허증을 지참하세요.` },
        { q: `${name} 방문 시 어떤 복장이 좋을까요?`, a: `단정한 캐주얼이면 충분합니다. 슬리퍼, 반바지, 운동복은 피하고 깔끔한 차림으로 방문하세요.` },
        { q: `${name}에서 음료 가격은 어느 정도인가요?`, a: `기본 음료는 만 원대부터 시작합니다. 테이블 이용 시 보틀 주문이 일반적이며, 그룹이면 나눠 마시는 것이 경제적입니다.` },
        { q: `${name}까지 주차가 가능한가요?`, a: `인근 주차 시설을 이용하시거나 대중교통 이용을 권장합니다. 음주 후에는 반드시 대리운전을 이용하세요.` },
        { q: `${name}에서 라이브 공연은 매일 있나요?`, a: `공연 스케줄은 요일에 따라 다릅니다. 방문 전 공식 채널에서 이번 주 공연 일정을 확인해보세요.` },
        { q: `${name}의 영업시간이 궁금합니다`, a: `보통 저녁 8~9시 오픈하여 새벽 3~5시까지 운영됩니다. 요일에 따라 변동되니 사전 확인을 추천합니다.` },
        { q: `${name}에서 테이블 예약은 필수인가요?`, a: `필수는 아니지만 주말이나 특별한 날에는 예약을 추천합니다. 전화나 공식 채널로 예약 가능합니다.` },
        { q: `${name}에서 단체 모임을 할 수 있나요?`, a: `단체석 사전 예약이 가능합니다. 인원에 맞는 테이블을 준비해드리며, 생일 등 이벤트도 가능합니다.` },
        { q: `${name}에 혼자 방문해도 어색하지 않나요?`, a: `혼자 오시는 분도 꽤 있습니다. 바 카운터에서 편하게 음료를 즐기시면 되고, 자연스러운 만남의 기회도 있습니다.` },
        { q: `${name}에서 음식도 주문 가능한가요?`, a: `간단한 안주류가 제공되는 경우가 많습니다. 상세 메뉴는 현장에서 확인하시거나 사전에 문의해주세요.` },
      ],
    ],
    lounge: [
      [
        { q: `${name}의 전반적인 분위기는 어떤가요?`, a: `${adj1} 분위기의 ${region} 대표 라운지입니다. 대화를 나누기에 최적화된 음량과 조명으로 편안한 시간을 보내실 수 있습니다.` },
        { q: `${name}에 예약 없이 갈 수 있나요?`, a: `평일은 워크인이 가능하지만, 금토 저녁에는 예약을 강력히 추천합니다. 인기 시간대에는 대기가 생길 수 있습니다.` },
        { q: `${name}의 드레스코드가 까다로운가요?`, a: `스마트 캐주얼 이상을 권장합니다. 너무 캐주얼한 복장은 분위기와 맞지 않을 수 있습니다.` },
        { q: `${name}에서의 예상 비용이 궁금해요`, a: `칵테일 기준 1.5~3만 원대이며, 안주와 함께 인당 5~10만 원 정도를 예상하시면 됩니다.` },
        { q: `${name}은 데이트 장소로 적합한가요?`, a: `프라이빗하고 ${adj2} 분위기로 데이트에 매우 적합합니다. 커플 소파석을 미리 요청하시면 좋습니다.` },
        { q: `${name}에서 단체 예약이 되나요?`, a: `소규모 모임부터 프라이빗룸까지 다양한 옵션이 있습니다. 인원과 목적에 맞춰 최적의 공간을 준비해드립니다.` },
        { q: `${name}은 몇 시까지 영업하나요?`, a: `평일은 새벽 1시 전후, 주말은 새벽 3시 전후까지 운영되는 것이 일반적입니다.` },
        { q: `${name}에서 추천하는 시그니처 메뉴가 있나요?`, a: `바텐더가 직접 만드는 시그니처 칵테일이 대표 메뉴입니다. 취향을 말씀하시면 맞춤 추천을 받으실 수 있습니다.` },
        { q: `${name}까지 주차는 가능한가요?`, a: `발레파킹 또는 인근 주차장 이용이 가능합니다. 사전 확인을 추천드립니다.` },
        { q: `${name}에서 흡연이 가능한가요?`, a: `실내는 금연이며, 별도의 흡연 구역이나 테라스가 마련되어 있습니다.` },
        { q: `${name}의 음악이 대화에 방해되지 않나요?`, a: `대화를 나누기 좋은 볼륨으로 세팅되어 있습니다. ${adj1} 분위기의 배경 음악이 자연스럽게 흐릅니다.` },
        { q: `${name}에서 2차로 오기 좋은가요?`, a: `${adj2} 분위기에서 마무리하기 좋아 2차 장소로 많이 찾으십니다. 특히 늦은 시간대의 분위기가 좋습니다.` },
      ],
    ],
  };

  const pool = faqTemplates[v.type][0];
  const start = hashStr(v.displayName + 'faq') % pool.length;
  const faqs = [];
  for (let i = 0; i < 8; i++) {
    faqs.push(pool[(start + i) % pool.length]);
  }
  return faqs;
}

// ─── Teaser (unique per venue) ───
function generateTeaser(v, idx) {
  const { name, region, typeKr, adj1, adj2 } = getVenueVars(v);
  const adjs = [adj1, adj2];

  const teasers = [
    `${region}의 밤을 ${adj1} 경험으로 바꾸는 ${name}. 방문자 모두에게 잊지 못할 순간을 선사합니다.`,
    `${name}은 ${region} ${typeKr} 씬에서 ${adj1} 존재감을 드러내는 곳입니다. 오늘 밤의 목적지로 추천합니다.`,
    `${adj1} 분위기와 ${adj2} 서비스가 어우러진 ${name}. ${region}의 밤을 새롭게 정의합니다.`,
    `${region}에서 ${adj1} 밤을 찾는다면 ${name}이 답입니다. ${typeKr}의 정수를 경험해보세요.`,
    `${name}이 선사하는 ${adj1} 밤문화 경험. ${region}을 대표하는 ${typeKr}입니다.`,
    `${region}의 밤을 ${adj1} 방식으로 즐기고 싶다면, ${name}의 문을 두드려 보세요.`,
    `${name}은 ${region} ${typeKr} 중에서도 ${adj2} 특색을 가진 공간입니다.`,
    `${adj1} 공간감과 ${adj2} 음악으로 완성되는 ${name}의 밤을 만나보세요.`,
    `${region}에서 가장 ${adj1} 밤을 경험할 수 있는 곳, ${name}입니다.`,
    `${name}은 ${region}의 밤에 ${adj1} 색채를 입히는 특별한 공간입니다.`,
    `${adj1} 밤문화의 진수를 보여주는 ${name}. ${region}의 자부심입니다.`,
    `${region}의 밤을 완성시키는 ${adj1} 키워드, 그것은 바로 ${name}입니다.`,
    `${name}에서 ${region}의 밤이 가진 ${adj1} 잠재력을 발견하세요.`,
    `${adj2} 무드와 함께하는 ${name}의 밤. ${region} 밤문화의 새 지평을 엽니다.`,
    `${name}: ${region}에서 가장 ${adj1} 밤을 약속하는 ${typeKr}입니다.`,
    `${region}의 밤에 ${adj1} 이야기를 더하는 곳, ${name}을 만나보세요.`,
    `${name}은 ${region} 밤문화 지도에서 ${adj1} 좌표를 찍고 있습니다.`,
    `${adj1} 조명 아래 펼쳐지는 ${name}의 밤. ${region}을 사로잡는 ${typeKr}입니다.`,
    `${region}에서 ${adj1} 시간을 보내고 싶다면, ${name}이 최적의 선택입니다.`,
    `${name}이 들려주는 ${adj1} 밤의 서사. ${region}의 밤문화를 대표합니다.`,
    `${region}의 밤을 ${adj1} 방식으로 재해석한 공간, ${name}에 오신 것을 환영합니다.`,
    `${name}은 ${region}에서 ${adj1} 밤을 설계하는 장인의 공간입니다.`,
    `${adj1} 에너지가 감도는 ${name}. ${region} ${typeKr}의 새로운 기준입니다.`,
    `${region}의 밤이 ${adj1} 꿈을 꾸는 곳, 그곳이 바로 ${name}입니다.`,
    `${name}에서 시작되는 ${region}의 ${adj1} 밤 여행을 경험하세요.`,
    `${adj1} 순간들이 모여 하나의 밤을 완성하는 곳, ${name}입니다.`,
  ];

  return teasers[hashStr(name + 'teaser') % teasers.length];
}

// ─── Keywords (unique per venue for 0% similarity) ───
function generateKeywords(v, idx) {
  const typeKr = TYPE_LABELS[v.type];
  const baseKeywords = [
    `${v.displayName}`, `${v.displayName} 후기`, `${v.displayName} 가격`,
    `${v.displayName} 영업시간`, `${v.displayName} 위치`, `${v.displayName} 드레스코드`,
    `${v.displayName} 예약`, `${v.displayName} 입장료`, `${v.displayName} 주차`,
    `${v.region} ${typeKr}`, `${v.region} ${typeKr} 추천`, `${v.region} 밤문화`,
    `${v.region} ${v.displayName}`, `${v.region} 놀거리`, `${v.region} 핫플`,
  ];
  const typeSpecific = {
    club: [`${v.region} 클럽 순위`, `${v.displayName} DJ`, `${v.displayName} 음악`, `${v.region} EDM`, `${v.region} 힙합클럽`, `${v.displayName} VIP`, `${v.displayName} 게스트`, `${v.displayName} 테이블`],
    night: [`${v.region} 나이트 순위`, `${v.displayName} 부킹`, `${v.displayName} 공연`, `${v.region} 성인나이트`, `${v.region} 나이트클럽`, `${v.displayName} 댄스`, `${v.displayName} 밴드`, `${v.displayName} 웨이터`],
    lounge: [`${v.region} 라운지바`, `${v.displayName} 칵테일`, `${v.displayName} 분위기`, `${v.region} 데이트`, `${v.region} 루프탑`, `${v.displayName} 시그니처`, `${v.displayName} 프라이빗`, `${v.displayName} 와인`],
  };
  // Pick different type-specific keywords per venue index
  const pool = typeSpecific[v.type];
  const start = (idx * 2) % pool.length;
  const picked = [];
  for (let i = 0; i < 5; i++) picked.push(pool[(start + i) % pool.length]);
  return [...baseKeywords, ...picked];
}

// ─── Planner rules ───
function generatePlannerRules(v, idx) {
  const adjs = SIGNATURE_ADJECTIVES[hashStr(v.displayName + 'adj') % SIGNATURE_ADJECTIVES.length];
  const name = v.displayName;
  const typeSpecific = {
    club: {
      '목적': {
        '대화': `${name}의 바 카운터 근처 좌석이 대화에 적합합니다. 상대적으로 ${adj1} 구역에서 음료와 함께 대화를 즐기세요.`,
        '댄스': `메인 플로어 중앙이 최적의 위치입니다. ${name}의 ${adj2} DJ 사운드를 온몸으로 느끼세요.`,
        '단체': `테이블 예약을 추천합니다. ${name}의 보틀 서비스와 함께 그룹만의 ${adj3} 시간을 만드세요.`,
        '첫방문': `일찍 도착하여 ${name}의 공간에 익숙해지세요. 바에서 한 잔 하며 분위기를 살피는 것이 좋습니다.`,
      },
      '시간대': {
        '이른 (21-23시)': `${name}의 여유로운 분위기를 경험할 수 있습니다. 공간 탐험에 최적인 시간입니다.`,
        '피크 (23-01시)': `가장 ${adj4} 시간대입니다. 입장 줄이 길 수 있으니 일찍 도착하세요.`,
        '늦은 (01시 이후)': `분위기가 무르익은 시간입니다. ${name}의 진한 밤을 원한다면 이 시간이 적합합니다.`,
      },
    },
    night: {
      '목적': {
        '대화': `${name}의 무대에서 먼 테이블이 대화에 적합합니다. ${adj1} 분위기에서 편안하게 이야기하세요.`,
        '댄스': `댄스 타임에 적극 참여하세요. ${name}의 무대 앞이 가장 ${adj2} 자리입니다.`,
        '단체': `큰 테이블을 예약하고 ${name}에서 함께 즐기세요. ${adj3} 단체 이벤트도 가능합니다.`,
        '첫방문': `부담 없이 ${name}의 음악과 분위기를 즐기세요. 웨이터에게 좋은 자리를 추천받으세요.`,
      },
      '시간대': {
        '이른 (20-22시)': `${name}에서 편안하게 식사와 음료를 즐길 수 있는 ${adj1} 시간입니다.`,
        '피크 (22-00시)': `공연과 이벤트가 집중되는 시간입니다. ${name}의 ${adj2} 무대를 기대하세요.`,
        '늦은 (00시 이후)': `가장 열정적인 시간대로, ${name}에서의 댄스와 교류가 ${adj3} 방식으로 활발합니다.`,
      },
    },
    lounge: {
      '목적': {
        '대화': `${name}의 코너 소파석이 가장 적합합니다. ${adj1} 프라이빗 공간을 요청하세요.`,
        '댄스': `${name}은 대화 중심의 라운지지만, 음악에 맞춰 가벼운 움직임은 자연스럽습니다.`,
        '단체': `${name}의 프라이빗룸이나 단체석을 예약하세요. ${adj2} 맞춤 서비스도 가능합니다.`,
        '첫방문': `${name}의 시그니처 칵테일을 추천받아 보세요. 바텐더와의 대화가 ${adj3} 경험이 됩니다.`,
      },
      '시간대': {
        '이른 (19-21시)': `${name}에서 여유로운 ${adj1} 분위기를 즐기기 좋은 시간입니다.`,
        '피크 (21-23시)': `${name}의 분위기가 가장 ${adj2} 시간대입니다.`,
        '늦은 (23시 이후)': `${name}에서 ${adj3} 분위기로 밤을 차분하게 마무리하기 좋습니다.`,
      },
    },
  };
  return typeSpecific[v.type];
}

// ─── Image prompts ───
function generateImagePrompts(v, idx) {
  const adjs = SIGNATURE_ADJECTIVES[hashStr(v.displayName + 'adj') % SIGNATURE_ADJECTIVES.length];
  const typeEnglish = { club: 'nightclub', night: 'dance hall', lounge: 'lounge' };
  return [
    `Fictional illustration: Stylish Korean adults arriving at a ${adj1} ${typeEnglish[v.type]} entrance in ${v.region}, street vibe with neon lights, fashion-forward silhouettes, no identifiable faces, no text or logos, dark moody atmosphere with warm accents`,
    `Fictional illustration: Elegant silhouettes of Korean adults enjoying ${adj2} conversation at a VIP table, cocktail glasses, ambient lighting, fashionable outfits, no identifiable faces, no text or logos, sophisticated nightlife mood`,
    `Fictional illustration: Dynamic silhouettes of stylish Korean adults in a ${adj3} ${typeEnglish[v.type]} setting with ${v.type === 'club' ? 'DJ booth and laser lights' : v.type === 'night' ? 'live stage and band energy' : 'premium bar and mixologist'}, vibrant lighting effects, no identifiable faces, no text or logos`,
  ];
}

// ─── Main ───
function main() {
  const raw = readFileSync(RAW_PATH, 'utf8');
  const rawVenues = parseRaw(raw);

  const venues = rawVenues.map((rv, idx) => {
    const rng = mulberry32(hashStr(rv.name_input + idx));
    const { region, regionSlug, displayName } = extractRegionAndName(rv.name_input);
    const venueSlug = toSlug(displayName.replace(/\s+/g, '-'));

    const v = { region, regionSlug, displayName, type: rv.type };

    const story = generateScenes(v, idx, rng);
    const atmosphere = generateAtmosphere(v, idx, rng);
    const music = generateMusic(v, idx, rng);
    const safety = generateSafety(v, idx);
    const deepDive = generateDeepDive(v, idx, rng);
    const timeline = generateTimeline(v, idx, rng);
    const checklist = generateChecklist(v, idx, rng);
    const faq = generateFAQs(v, idx);
    const plannerRules = generatePlannerRules(v, idx);
    const imagePrompts = generateImagePrompts(v, idx);
    const teaser = generateTeaser(v, idx);
    const keywords = generateKeywords(v, idx);
    const seoTitle = generateSeoTitle(v, idx);
    const seoDescription = generateSeoDescription(v, idx);
    const hookIntro = generateHookIntro(v, idx, rng);

    const venue = {
      id: `venue-${idx + 1}`,
      type: rv.type,
      typePath: TYPE_PATH[rv.type],
      typeLabel: TYPE_LABELS[rv.type],
      name_input: rv.name_input,
      name_display: displayName.startsWith(region) ? displayName : `${region} ${displayName}`,
      name_seo: `${region} ${displayName}`,
      region,
      regionSlug,
      venueSlug,
      urlSlug: toUrlSlug(venueSlug),
      geo: { formatted_address: '', lat: 0, lon: 0, city: '', district: '', neighborhood: '', precision: 'none' },
      keywords,
      teaser,
      seoTitle,
      seoDescription,
      hookIntro,
      storyFrame: STORY_FRAMES[hashStr(displayName + 'frame') % STORY_FRAMES.length],
      story,
      bodySections: { atmosphere, music, safety, deepDive },
      timeline,
      checklist,
      faq,
      plannerRules,
      images: [
        { src: `/venues/${regionSlug}/${venueSlug}/model-fun-1.svg`, alt: `${region} ${displayName} 분위기 – 입구 패션 일러스트` },
        { src: `/venues/${regionSlug}/${venueSlug}/model-fun-2.svg`, alt: `${region} ${displayName} 분위기 – 테이블 무드 일러스트` },
        { src: `/venues/${regionSlug}/${venueSlug}/model-fun-3.svg`, alt: `${region} ${displayName} 분위기 – 댄스 에너지 일러스트` },
      ],
      imagePrompts,
      relatedVenueIds: { sameRegion: [], sameType: [], nearby: [], guides: ['first-visit', 'dress-code'] },
    };

    // No more uniquifyText — checklist stays generic, brand name controlled by generators

    return venue;
  });

  // Build related venue links
  venues.forEach((v, i) => {
    v.relatedVenueIds.sameRegion = venues
      .filter((o, j) => j !== i && o.regionSlug === v.regionSlug)
      .slice(0, 6)
      .map(o => o.id);
    v.relatedVenueIds.sameType = venues
      .filter((o, j) => j !== i && o.type === v.type)
      .slice(0, 6)
      .map(o => o.id);
  });

  mkdirSync(join(ROOT, 'data'), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(venues, null, 2), 'utf8');
  console.log(`✅ Generated ${venues.length} venues → ${OUT_PATH}`);
}

main();
