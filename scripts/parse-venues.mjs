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

// uniquifyText removed — brand name placement now controlled by distributeStoreName()

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
  const adjs = SIGNATURE_ADJECTIVES[idx % SIGNATURE_ADJECTIVES.length];
  const rf = getRegionFlavor(region);

  const pools = {
    club: [
      `${region} ${name} ${typeKr} 실전 가이드 – 입장료·드레스코드·예약 2026`,
      `${name} ${typeKr} 첫방문 완벽 정리 | ${region} ${rf.adj} 밤의 시작`,
      `${region} ${name} 후기 – ${adjs[0]} 사운드와 분위기 총정리`,
      `${name} ${typeKr} 가격·영업시간·위치 | ${region} 핫플 2026`,
      `${region} 대표 ${typeKr} ${name} 솔직 리뷰 – 분위기부터 입장까지`,
      `${name} ${typeKr}에서 보내는 ${adjs[1]} 밤 | ${region} 추천`,
      `${region} ${name} 입장료·테이블·VIP 총정리 2026`,
      `${name} ${typeKr} 방문 전 꼭 알아야 할 것들 – ${region} 가이드`,
      `${region} ${typeKr} 추천 1순위 ${name} | 드레스코드·가격 안내`,
      `${name}에서 즐기는 ${region}의 ${adjs[2]} 밤 – 완벽 가이드 2026`,
      `${region} ${name} 예약·입장·분위기 한눈에 | ${typeKr} 리뷰`,
      `${adjs[0]} ${region} ${typeKr} ${name} – 첫방문자 필독 가이드`,
      `${name} ${typeKr} 영업시간·위치·후기 | ${region} 밤문화 2026`,
      `${region} ${name} DJ·음악·분위기 리뷰 – ${typeKr} 탐방기`,
      `${name} ${typeKr} 완전정복 가이드 | ${region} 놀거리 추천`,
      `${region} ${name} 가격표·예약법·드레스코드 – ${typeKr} 백과`,
      `${name}이 ${region} ${typeKr} 씬에서 특별한 이유 2026`,
      `${region} ${name} ${typeKr} 체험기 – ${adjs[1]} 밤의 기록`,
      `${name} ${typeKr} 꿀팁 모음 | ${region} 핫플레이스 가이드`,
      `${region} ${typeKr} ${name} 입장·테이블·주차 총정리`,
      `${name} 방문기: ${region}에서 만난 ${adjs[0]} ${typeKr}`,
      `${region} ${name} ${typeKr} 2026 최신 가이드 – 후기·예산·팁`,
      `${name}으로 떠나는 ${region} ${adjs[2]} 밤 여행`,
      `${region} ${name} ${typeKr} A to Z | 예약부터 귀가까지`,
      `${adjs[1]} 분위기의 ${region} ${name} ${typeKr} 솔직 후기`,
      `${region} 밤문화 필수코스 ${name} ${typeKr} – 상세 리뷰`,
      `${name} ${typeKr} 처음이라면? ${region} 방문 가이드 2026`,
      `${region} ${name} 사운드·조명·분위기 분석 – ${typeKr} 리뷰`,
      `${name} ${typeKr}의 모든 것 | ${region} 밤 즐기기 가이드`,
      `${region} ${name} 금토 주말 공략법 – ${typeKr} 팁`,
      `${name} ${typeKr} ${adjs[0]} 경험담 | ${region} 추천 스팟`,
      `${region} ${name} ${typeKr} 예산 가이드 – 얼마면 충분할까?`,
      `${name}에서 시작하는 ${region} 밤 – ${typeKr} 입문 가이드`,
      `${region} ${typeKr} ${name} 핵심 정보 총정리 2026`,
      `${name} ${typeKr} 분위기·가격·추천곡 | ${region} 나이트라이프`,
      `${region} ${name}만의 ${adjs[2]} 매력 – ${typeKr} 탐방`,
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
      `${name}에서 느끼는 ${adjs[1]} 에너지 | ${region} ${typeKr}`,
      `${region} ${name} ${typeKr} 계절별 방문 가이드 2026`,
      `${name} ${typeKr} 데이트·모임·솔로 각각 즐기는 법`,
      `${region} ${name} 입장 꿀팁과 드레스코드 – ${typeKr} FAQ`,
    ],
    night: [
      `${region} ${name} ${typeKr} 완벽 가이드 – 부킹·공연·분위기 2026`,
      `${name} ${typeKr} 첫방문 필독 | ${region} 라이브 밤문화`,
      `${region} ${name} 후기 – ${adjs[0]} 무대와 댄스타임 체험기`,
      `${name} ${typeKr} 영업시간·가격·예약 | ${region} 안내 2026`,
      `${region} 대표 ${typeKr} ${name} 솔직 리뷰 – 공연부터 귀가까지`,
      `${name} ${typeKr}에서 보내는 ${adjs[1]} 밤 | ${region} 추천`,
      `${region} ${name} 부킹·테이블·공연 스케줄 총정리 2026`,
      `${name} ${typeKr} 방문 전 체크리스트 – ${region} 가이드`,
      `${region} ${typeKr} 추천 ${name} | 복장·가격·매너 안내`,
      `${name}에서 즐기는 ${region}의 ${adjs[2]} 라이브 밤`,
      `${region} ${name} 예약·입장·분위기 한눈에 | ${typeKr} 리뷰`,
      `${adjs[0]} ${region} ${typeKr} ${name} – 첫방문자 필독`,
      `${name} ${typeKr} 영업시간·위치·후기 | ${region} 밤문화 2026`,
      `${region} ${name} 밴드·댄스·분위기 리뷰 – ${typeKr} 탐방기`,
      `${name} ${typeKr} 완전정복 | ${region} 놀거리 추천 가이드`,
      `${region} ${name} 가격표·예약법·복장 – ${typeKr} 상세 안내`,
      `${name}이 ${region} ${typeKr} 씬에서 특별한 이유`,
      `${region} ${name} ${typeKr} 체험기 – ${adjs[1]} 밤의 기록`,
      `${name} ${typeKr} 꿀팁 모음 | ${region} 핫플레이스`,
      `${region} ${typeKr} ${name} 입장·테이블·주차 A to Z`,
      `${name} 방문기: ${region}에서 만난 ${adjs[0]} 라이브 무대`,
      `${region} ${name} ${typeKr} 2026 업데이트 – 후기·예산·팁`,
      `${name}으로 떠나는 ${region} ${adjs[2]} 밤 여행기`,
      `${region} ${name} ${typeKr} 예약부터 귀가까지 완벽 플랜`,
      `${adjs[1]} 공연의 ${region} ${name} ${typeKr} 솔직 후기`,
      `${region} 밤문화 필수코스 ${name} – 라이브 ${typeKr} 리뷰`,
      `${name} ${typeKr} 처음이라면? ${region} 입문 가이드 2026`,
      `${region} ${name} 밴드·보컬·댄스 분석 – ${typeKr} 리뷰`,
      `${name} ${typeKr}의 모든 것 | ${region} 밤 가이드`,
      `${region} ${name} 금토 주말 공략법 – ${typeKr} 핵심 팁`,
      `${name} ${typeKr} ${adjs[0]} 경험담 | ${region} 추천`,
      `${region} ${name} ${typeKr} 예산 가이드 – 준비물 체크`,
      `${name}에서 시작하는 ${region} 밤 – ${typeKr} 입문서`,
      `${region} ${typeKr} ${name} 핵심 정보 2026 최신판`,
      `${name} ${typeKr} 분위기·가격·공연 | ${region} 밤문화`,
      `${region} ${name}만의 ${adjs[2]} 매력 – ${typeKr} 탐방`,
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
      `${name}에서 느끼는 ${adjs[1]} 라이브 | ${region} ${typeKr}`,
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
      `${region} ${name} 후기 – ${adjs[0]} 무드와 시그니처 칵테일`,
      `${name} ${typeKr} 가격·메뉴·예약 | ${region} 데이트 코스 2026`,
      `${region} 대표 ${typeKr} ${name} 솔직 리뷰 – 분위기 분석`,
      `${name} ${typeKr}에서 보내는 ${adjs[1]} 저녁 | ${region} 추천`,
      `${region} ${name} 예약·메뉴·드레스코드 총정리 2026`,
      `${name} ${typeKr} 방문 전 알아둘 것들 – ${region} 가이드`,
      `${region} ${typeKr} 추천 ${name} | 분위기·칵테일·가격 안내`,
      `${name}에서 즐기는 ${region}의 ${adjs[2]} 저녁 시간`,
      `${region} ${name} 분위기·메뉴·예약 한눈에 | ${typeKr} 리뷰`,
      `${adjs[0]} ${region} ${typeKr} ${name} – 첫방문 가이드`,
      `${name} ${typeKr} 영업시간·위치·후기 | ${region} 2026`,
      `${region} ${name} 인테리어·칵테일·서비스 리뷰 – ${typeKr}`,
      `${name} ${typeKr} 완전정복 가이드 | ${region} 데이트 추천`,
      `${region} ${name} 가격표·예약법·분위기 – ${typeKr} 백과`,
      `${name}이 ${region} ${typeKr} 씬에서 돋보이는 이유`,
      `${region} ${name} ${typeKr} 체험기 – ${adjs[1]} 밤의 기록`,
      `${name} ${typeKr} 꿀팁 모음 | ${region} 프리미엄 스팟`,
      `${region} ${typeKr} ${name} 예약·좌석·주차 A to Z`,
      `${name} 방문기: ${region}에서 찾은 ${adjs[0]} 안식처`,
      `${region} ${name} ${typeKr} 2026 최신 가이드 – 후기·팁`,
      `${name}으로 떠나는 ${region} ${adjs[2]} 저녁 여행`,
      `${region} ${name} ${typeKr} 예약부터 마무리까지 완벽 플랜`,
      `${adjs[1]} 공간의 ${region} ${name} ${typeKr} 솔직 후기`,
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
  const name = v.displayName;
  const region = v.region;
  const typeKr = TYPE_LABELS[v.type];
  const adjs = SIGNATURE_ADJECTIVES[idx % SIGNATURE_ADJECTIVES.length];
  const rf = getRegionFlavor(region);

  const pools = [
    `${region} ${name} ${typeKr} 방문 전 꼭 확인하세요. 분위기, 가격, 예약 방법, 드레스코드와 실제 방문 후기를 담았습니다.`,
    `${name} ${typeKr}의 ${adjs[0]} 매력을 낱낱이 공개합니다. ${region}에서 잊지 못할 밤을 계획하는 분들을 위한 상세 가이드.`,
    `${region} ${name}의 입장료부터 분위기, 추천 시간대까지. ${typeKr} 첫방문자도 걱정 없는 완벽 안내서입니다.`,
    `${adjs[1]} 분위기의 ${region} ${name} ${typeKr}. 가격, 위치, 영업시간, 예약 정보와 리얼 후기를 확인하세요.`,
    `${name}에서 ${region}의 밤을 즐기는 방법. ${typeKr} 입장부터 귀가까지 알아야 할 모든 것을 정리했습니다.`,
    `${region} ${typeKr} ${name}의 분위기·가격·위치 상세 리뷰. 방문 전 체크리스트와 꿀팁을 함께 제공합니다.`,
    `${name} ${typeKr}이 특별한 이유? ${region}에서 ${adjs[0]} 밤문화를 경험하고 싶다면 이 가이드를 참고하세요.`,
    `${region} ${name} ${typeKr} 2026 최신 정보. 예약법, 드레스코드, 예산 계획부터 실전 팁까지 담았습니다.`,
    `${name}을 처음 방문하시나요? ${region} ${typeKr}의 분위기, 시간대별 특징, 가격 정보를 미리 확인하세요.`,
    `${region}의 ${adjs[2]} ${typeKr} ${name}. 입장 방법, 음료 가격, 분위기, 교통편까지 한번에 정리한 가이드.`,
    `${name} ${typeKr} 리얼 체험기. ${region}에서 보내는 특별한 밤을 위한 실전 정보와 추천 코스를 안내합니다.`,
    `${region} ${name}의 매력을 파헤친 상세 가이드. ${typeKr} 방문 시 알아야 할 모든 정보가 여기 있습니다.`,
    `${adjs[0]} 밤을 원한다면 ${region} ${name} ${typeKr}. 첫방문 체크리스트, 가격, 분위기 리뷰를 확인하세요.`,
    `${name} ${typeKr}에서의 완벽한 밤을 위한 가이드. ${region} 방문 전 가격, 예약, 드레스코드를 체크하세요.`,
    `${region} 밤문화의 핵심, ${name} ${typeKr}. 분위기부터 예산까지, 방문 전 필요한 정보를 정리했습니다.`,
    `${name}은 ${region}에서 어떤 경험을 선사할까? ${typeKr}의 분위기, 가격, 위치 정보를 상세히 안내합니다.`,
    `${region} ${name} ${typeKr} 솔직 리뷰. ${adjs[1]} 분위기와 가격 정보, 방문 팁을 한눈에 확인하세요.`,
    `${name} ${typeKr} 가이드: ${region}의 밤을 200% 즐기는 법. 예약, 복장, 시간대별 분위기를 총정리합니다.`,
    `${region} ${name}에서 만나는 ${adjs[2]} 밤. ${typeKr} 입장 정보, 가격, 추천 코스를 확인해보세요.`,
    `${name} ${typeKr} 방문을 고민 중이라면? ${region}의 분위기, 가격, 후기를 미리 살펴보세요.`,
  ];

  return pools[hashStr(v.displayName + 'desc') % pools.length];
}

// ─── Hook Intro generator (unique per venue, 500+ chars) ───
function generateHookIntro(v, idx, rng) {
  const name = v.displayName;
  const region = v.region;
  const typeKr = TYPE_LABELS[v.type];
  const adjs = SIGNATURE_ADJECTIVES[idx % SIGNATURE_ADJECTIVES.length];
  const rf = getRegionFlavor(region);
  const verb = VENUE_VERBS[idx % VENUE_VERBS.length];
  const timeExpr = TIME_EXPRESSIONS[idx % TIME_EXPRESSIONS.length];

  const hooks = [
    // Question hooks
    `${region}에서 진짜 좋은 ${typeKr}를 찾는다면 어디를 가야 할까? 수많은 선택지 중에서 ${name}이 유독 눈에 띄는 이유가 있다. 단순히 음악이 좋아서, 분위기가 멋져서만이 아니다. 이곳에 한 번이라도 발을 들여본 사람이라면 알 것이다 — ${name}에서의 밤은 다른 곳에서는 쉽게 대체할 수 없는 무언가를 가지고 있다는 것을. ${rf.vibe}의 에너지가 농축된 이 공간에서, 오늘 밤 당신만의 이야기가 시작된다. 이 가이드는 처음 방문하는 분부터 재방문을 계획하는 분까지, ${name}을 제대로 즐기기 위해 알아야 할 모든 것을 담았다.`,
    // Sensory hooks
    `${timeExpr}, ${region}의 거리가 다른 빛깔로 물들기 시작한다. 낮의 분주함이 사라지고, 대신 네온과 음악이 골목을 채우는 시간. 그 변화의 중심에 ${name}이 있다. 문 앞에 서면 안쪽에서 새어 나오는 ${adjs[0]} 에너지가 피부에 닿는다. 한 발짝 안으로 들어서는 순간, ${rf.vibe} 한가운데서 펼쳐지는 ${name}만의 세계가 열린다. 처음 오는 사람도, 여러 번 온 사람도 매번 새로운 장면을 발견하게 되는 곳. 이 가이드를 통해 ${name}에서의 밤을 미리 그려보자.`,
    // Contrast hooks
    `낮에 보면 ${region}의 평범한 거리 한 켠이다. 그러나 해가 지면 이야기가 달라진다. ${name}의 간판에 불이 켜지는 순간, 이 일대의 공기가 바뀐다. 일상과 밤의 경계선 위에 서 있는 이 공간은, 방문할 때마다 조금씩 다른 얼굴을 보여준다. ${adjs[1]} 조명 아래 펼쳐지는 ${name}의 세계는 단순한 유흥을 넘어, 하나의 경험이 된다. 첫방문이든 재방문이든, 이 가이드가 ${name}에서의 밤을 더 풍성하게 만들어줄 것이다.`,
    // Storytelling hooks
    `지난 금요일, 한 무리의 친구들이 ${region} ${rf.landmark} 근처에서 만났다. 목적지는 정해져 있었다 — ${name}. 누군가의 추천으로, 누군가의 경험담으로 이 이름을 알게 된 그들은, 입구를 통과하는 순간 왜 사람들이 이곳을 이야기하는지 단번에 이해했다. ${adjs[0]} 분위기, ${adjs[2]} 디테일, 그리고 이곳에서만 느낄 수 있는 특별한 에너지. ${name}은 방문자에게 이야기를 만들어주는 곳이다. 당신도 그 이야기의 주인공이 될 준비가 되었는가?`,
    // Direct address hooks
    `이 글을 읽고 있다면, 아마 ${region}에서 괜찮은 ${typeKr}를 찾고 있을 것이다. 혹은 ${name}이라는 이름을 어디선가 듣고 궁금해서 검색했을 수도 있다. 어떤 경우든, 잘 찾아왔다. ${name}은 ${region} ${typeKr} 씬에서 확실한 존재감을 가진 곳이다. ${adjs[0]} 분위기부터 가격, 예약 방법, 드레스코드까지 — 이 가이드 하나면 첫 방문도 완벽하게 준비할 수 있다. ${rf.vibe}의 밤을 ${name}에서 시작해보자.`,
    // Statistical/fact hooks
    `${region}의 ${typeKr} 중에서 재방문율이 높은 곳을 꼽으라면, ${name}은 빠지지 않는다. 그 이유는 단순하다 — 이곳은 한 번의 방문으로 기억에 남는 밤을 만들어주기 때문이다. ${rf.landmark}에 위치한 ${name}은, ${adjs[1]} 인테리어와 음향, 그리고 세심한 서비스가 조화를 이루는 공간이다. 처음이라 걱정되는 분들을 위해, 입장부터 귀가까지 모든 과정을 이 가이드에 정리했다.`,
    // Mystery hooks
    `${region}에서 밤이 깊어질수록 빛나는 곳이 있다. 간판은 크지 않고, 입구도 화려하지 않다. 그런데 문 안쪽에서 흘러나오는 에너지는 지나가는 발걸음을 멈추게 한다. ${name}이다. 이곳의 ${adjs[0]} 매력은 직접 경험하기 전에는 설명하기 어렵다. 그래서 이 가이드를 만들었다 — ${name}에서의 밤을 미리 상상할 수 있도록, 분위기부터 가격까지 모든 정보를 담았다.`,
    // Challenge hooks
    `${region}에서 ${typeKr}를 가본 적 있는가? 혹시 아직이라면, ${name}이 첫 경험으로 나쁘지 않을 것이다. 혹시 이미 여러 곳을 다녀봤다면, ${name}이 보여주는 ${adjs[2]} 차별점에 놀랄 수도 있다. ${rf.vibe}의 에너지를 품은 이 공간은, 방문자의 기대를 한 단계 넘어서는 경험을 선사한다. 입장 전에 알아두면 좋은 것들을 이 가이드에 전부 모았다.`,
    // Scene-setting hooks
    `금요일 저녁, ${region} ${rf.transport}에서 내린다. 주변 거리에는 이미 밤의 기운이 감돈다. ${rf.food}에서 배를 든든히 채운 뒤, 발걸음은 자연스럽게 ${name}을 향한다. 이곳을 아는 사람들은 일찍 움직인다 — 좋은 자리는 금방 차기 때문이다. ${name}의 ${adjs[0]} 분위기 속으로 들어서면, 평일의 피로가 서서히 녹아내린다. 이 가이드는 그런 완벽한 밤을 설계하는 데 필요한 모든 정보를 제공한다.`,
    // Comparison hooks
    `${region}에는 ${typeKr}가 여럿 있다. 각각의 개성이 있고, 저마다의 단골이 있다. 그중에서 ${name}이 갖는 포지션은 명확하다 — ${adjs[1]} 공간감과 ${adjs[2]} 분위기로 방문자에게 잊히지 않는 인상을 남기는 곳. ${rf.vibe}의 밤문화를 대표하는 이 공간을 제대로 즐기려면, 약간의 사전 준비가 도움이 된다. 가격부터 드레스코드까지, 이 가이드에서 확인해보자.`,
    // Personal narrative hooks
    `처음 ${name}에 갔을 때의 기억은 꽤 선명하다. ${region}의 밤거리를 걷다가, 어떤 직감 같은 것에 이끌려 문을 열었다. 안으로 들어서는 순간 느꼈던 ${adjs[0]} 공기, 귀에 도달한 첫 번째 음악, 눈에 들어온 조명의 결. 그 모든 것이 조화롭게 맞물리는 순간이 있었다. ${name}은 그런 순간을 만들어주는 곳이다. 이 가이드를 통해 당신도 그 첫 경험을 미리 준비해보자.`,
    // Urgency hooks
    `${region}의 밤문화 지도는 계속 변하고 있다. 새로운 곳이 열리고, 오래된 곳은 사라진다. 그 와중에 꾸준히 자리를 지키며 방문자들에게 선택받는 공간이 있다 — ${name}이다. ${adjs[1]} 무드와 ${adjs[2]} 서비스로 ${rf.vibe}의 밤을 정의해온 이곳. 다음 밤 외출을 계획하고 있다면, ${name}을 선택지에 넣어보자. 방문 전 알아야 할 모든 것을 이 가이드에 정리해두었다.`,
    // Emotional hooks
    `좋은 밤은 기억에 남는다. 음악, 분위기, 함께한 사람들, 그리고 공간이 만들어낸 감정. ${name}은 ${region}에서 그런 '좋은 밤'을 만들어주는 곳 중 하나다. ${adjs[0]} 조명 아래 흐르는 시간, ${adjs[1]} 음향이 감싸는 공간. 이곳에서 보낸 밤은 다음 날 아침까지 여운이 남는다. 첫 방문을 준비하든, 재방문을 계획하든, 이 가이드가 도움이 될 것이다.`,
    // Insider hooks
    `${region} 밤문화를 즐기는 사람들 사이에서 ${name}은 이미 익숙한 이름이다. 하지만 처음 들어보는 분도 있을 것이다. ${name}의 ${adjs[0]} 매력은 소문만으로는 다 전할 수 없다. ${rf.vibe}의 독특한 에너지가 담긴 이 공간은, 직접 방문해야 비로소 이해되는 것들이 있다. 그 전에, 이 가이드로 기본 정보와 꿀팁을 미리 챙겨가자.`,
    // Philosophical hooks
    `밤이라는 시간은 특별하다. 낮의 규칙이 느슨해지고, 평소와 다른 자신을 발견하게 되는 시간. ${region}에서 그런 밤의 마법을 가장 잘 보여주는 공간이 ${name}이다. ${adjs[2]} 분위기 속에서 흐르는 음악과 조명이 만들어내는 세계는, 일상에서 한 발짝 벗어난 경험을 선사한다. 이 가이드는 ${name}에서의 밤을 제대로 즐기기 위한 모든 정보를 담고 있다.`,
  ];

  return hooks[hashStr(v.displayName + 'hook') % hooks.length];
}

// ─── Deep Dive generator (unique per venue) ───
function generateDeepDive(v, idx, rng) {
  const name = v.displayName;
  const region = v.region;
  const typeKr = TYPE_LABELS[v.type];
  const adjs = SIGNATURE_ADJECTIVES[idx % SIGNATURE_ADJECTIVES.length];
  const rf = getRegionFlavor(region);

  const checkpoints = [
    `복장은 단정한 캐주얼이 기본이며 러닝셔츠나 슬리퍼는 피하자. 향수는 은은한 제품을 추천하고, 너무 과한 건 역효과다. 도착은 21~22시가 적당하며 너무 이르면 한산할 수 있다.`,
    `가기 전에 공식 채널에서 이벤트 일정을 확인하자. 특별 이벤트 날에는 입장료가 다를 수 있다. 깔끔한 신발과 단정한 복장은 기본 중의 기본이다.`,
    `함께 갈 인원을 미리 확정하고, 필요하면 테이블 예약을 해두자. 현금과 카드를 모두 지참하고, 핸드폰 충전은 완료한 뒤 출발하자.`,
    `첫 방문이라면 일찍 도착해서 공간에 익숙해지는 시간을 확보하자. 바 카운터 근처에서 시작하면 분위기를 자연스럽게 파악할 수 있다.`,
    `주차 여건을 미리 확인하고, 가능하면 대중교통을 이용하자. 음주 후 귀가 교통편은 반드시 사전에 계획해두어야 한다.`,
  ];

  const historyPools = {
    club: [
      `한국의 클럽 문화는 2000년대 초반 홍대를 중심으로 폭발적으로 성장했다. DJ 중심의 전자음악 문화가 대중화되면서, 각 지역마다 개성 있는 클럽들이 생겨났다. ${region}의 클럽씬도 이 흐름 속에서 독자적인 색깔을 만들어왔으며, 현재는 국내외 아티스트가 방문하는 수준까지 성장했다.`,
      `클럽 문화의 핵심은 DJ와 사운드 시스템이다. 초기의 단순한 댄스 공간에서, 음향 기술과 조명 연출이 결합된 종합 엔터테인먼트 공간으로 진화했다. ${region} 클럽씬은 이러한 변화를 적극적으로 수용하며 독자적인 정체성을 구축해왔다.`,
    ],
    night: [
      `나이트 문화는 1990년대부터 한국 밤문화의 중심축을 형성해왔다. 라이브 밴드 공연과 댄스 타임이 결합된 독특한 형태는, 세대를 아우르는 즐거움을 제공한다. ${region}의 나이트씬은 이 전통을 계승하면서도 현대적 감각을 더해, 지금도 많은 이들에게 사랑받고 있다.`,
      `나이트클럽의 매력은 라이브 음악에 있다. 숙련된 밴드의 공연은 녹음된 음악과는 차원이 다른 감동을 준다. ${region}에서도 이러한 라이브 문화가 깊이 뿌리내리며, 밴드와 관객이 함께 만들어가는 독특한 밤문화 생태계가 형성되어 있다.`,
    ],
    lounge: [
      `라운지 문화는 2010년대 이후 한국에서 급격히 성장했다. 단순히 술을 마시는 공간에서, 분위기와 경험을 소비하는 프리미엄 문화 공간으로 자리잡았다. ${region}의 라운지씬은 특히 인테리어와 칵테일에 대한 투자가 두드러지며, 방문자에게 차별화된 경험을 제공한다.`,
      `좋은 라운지의 조건은 세 가지다: 분위기, 음료, 서비스. ${region}의 라운지들은 이 세 요소의 조화를 추구하며 각자의 개성을 만들어왔다. 바텐더의 역량이 곧 라운지의 수준을 결정하며, 시그니처 칵테일은 각 매장의 정체성이 된다.`,
    ],
  };

  const seasons = [
    `봄에는 날씨가 풀리면서 방문자가 늘어나는 시즌이다. 야외 공간이 있다면 특히 인기가 높다. 여름 성수기에는 주말 대기가 길어질 수 있으니 일찍 출발하는 것을 추천한다. 가을은 선선한 날씨 덕에 가장 쾌적한 방문 시기이며, 연말에는 크리스마스와 새해 행사가 잡히므로 2주 전 예약이 필수다.`,
    `계절마다 분위기가 미묘하게 달라진다. 봄과 가을에는 쾌적한 날씨 덕에 방문자 만족도가 높고, 여름에는 에어컨이 잘 되는 실내 공간의 쾌적함이 장점이다. 겨울에는 ${rf.vibe}의 따스한 분위기가 바깥 추위와 대비되어 특별한 감성을 자아낸다.`,
    `주중과 주말의 분위기 차이도 크다. 평일에는 여유롭게 공간을 즐길 수 있고, 금토에는 에너지가 최고조에 달한다. 공휴일 전날은 주말만큼 붐비므로 참고하자. 특별한 날에 방문한다면 미리 예약하는 것이 현명하다.`,
  ];

  const courses = [
    `1차로 ${rf.food}에서 든든한 식사를 하고, 2차로 ${name}에 입장하는 것이 정석 코스다. ${rf.transport}에서 접근성이 좋으므로 이동도 편하다. 피크타임에 맞춰 도착하면 가장 활기찬 분위기를 경험할 수 있고, 마무리는 주변 카페에서 가볍게 마무리하면 완벽한 밤이 완성된다.`,
    `사전에 ${rf.transport} 근처에서 모여 가벼운 음식과 함께 워밍업을 하자. ${name}에서의 시간을 충분히 즐긴 뒤, 새벽에는 ${region} 주변의 해장국집이나 편의점에서 마무리하면 된다. 귀가는 대리운전이나 택시를 이용하자.`,
    `${region}의 밤을 제대로 즐기려면 시간 배분이 중요하다. 저녁 식사 후 21시쯤 ${name}에 도착하고, 핵심 시간대인 23시~01시를 충분히 즐긴 뒤, 01시 이후 체력에 따라 더 머물거나 귀가를 결정하면 된다.`,
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
  const adjs = SIGNATURE_ADJECTIVES[idx % SIGNATURE_ADJECTIVES.length];
  const verb = VENUE_VERBS[idx % VENUE_VERBS.length];
  const timeExpr = TIME_EXPRESSIONS[idx % TIME_EXPRESSIONS.length];
  const adj1 = adjs[0], adj2 = adjs[1], adj3 = adjs[2], adj4 = adjs[3];
  const frame = STORY_FRAMES[idx % STORY_FRAMES.length];

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

  return scenes;
}

// ─── Atmosphere (unique per venue) ───
function generateAtmosphere(v, idx, rng) {
  const name = v.displayName;
  const region = v.region;
  const typeKr = TYPE_LABELS[v.type];
  const adjs = SIGNATURE_ADJECTIVES[idx % SIGNATURE_ADJECTIVES.length];
  const verb = VENUE_VERBS[idx % VENUE_VERBS.length];
  const timeExpr = TIME_EXPRESSIONS[idx % TIME_EXPRESSIONS.length];

  const coreIdentity = [
    `${name}은 ${region}의 밤문화 지형도에서 빼놓을 수 없는 이름이다.`,
    `${region}에서 ${typeKr}를 논할 때 ${name}은 반드시 언급되는 곳이다.`,
    `${name}이라는 이름은 ${region} ${typeKr} 씬에서 하나의 기준점을 형성했다.`,
    `${region}의 밤에 ${adjs[0]} 의미를 부여하는 공간, 그것이 바로 ${name}이다.`,
    `${name}은 ${region} 밤문화의 다양한 스펙트럼 중에서도 ${adjs[0]} 존재감을 드러낸다.`,
  ];

  const spaceDesc = [
    `이 공간은 단순한 유흥의 장이 아니라, ${adjs[1]} 경험을 설계하는 무대로 기능한다. 인테리어의 구성부터 동선의 흐름, 조명의 리듬까지 모든 요소가 방문자의 감각을 ${verb}.`,
    `공간의 첫인상은 ${adjs[1]}지만, 시간이 지날수록 더 깊은 층위가 드러난다. 음향 설비의 질, 좌석 배치의 효율성, 조명의 계조 변화까지 계산된 설계가 느껴지는 곳이다.`,
    `${timeExpr} 이 공간에 발을 들이면, 바깥의 ${region}과는 전혀 다른 시간대로 진입하는 느낌을 받는다. ${adjs[1]} 분위기는 첫 방문자에게도, 단골에게도 항상 새로운 면을 보여준다.`,
    `${adjs[1]} 공간 설계가 이곳의 핵심 경쟁력이다. 바 카운터에서 시작해 메인 공간으로 자연스럽게 이어지는 동선이 방문자를 ${verb}. ${region}에서 이 수준의 공간 경험은 흔치 않다.`,
  ];

  const uniqueValue = [
    `처음 방문하는 이에게는 ${adjs[2]} 발견의 기쁨을, 여러 번째 방문하는 이에게는 ${adjs[3]} 친숙함 속의 새로움을 선사한다. 이것이 ${name}이 ${region}에서 꾸준히 사람들을 끌어모으는 이유다.`,
    `${adjs[2]} 변화를 추구하면서도 핵심 가치는 일관되게 유지하는 것이 ${name}의 전략이다. 매 시즌 미세한 조정이 이루어지지만, 이곳만의 ${adjs[3]} 정체성은 변하지 않는다.`,
    `${name}의 매력은 한 가지로 정의할 수 없다. ${adjs[2]} 음악, ${adjs[3]} 인테리어, 세심한 서비스가 어우러져 만들어내는 총체적 경험이 이곳의 진가다.`,
    `방문할 때마다 다른 인상을 남기는 것, 그것이 ${name}의 ${adjs[2]} 매력이다. ${region}의 밤을 ${adjs[3]} 방식으로 경험하게 해주는 곳은 이곳뿐이다.`,
  ];

  return coreIdentity[sectionSel(idx, 'atmo1') % coreIdentity.length] + ' ' + spaceDesc[sectionSel(idx, 'atmo2') % spaceDesc.length] + ' ' + uniqueValue[sectionSel(idx, 'atmo3') % uniqueValue.length];
}

// ─── Music section (unique per venue) ───
function generateMusic(v, idx, rng) {
  const name = v.displayName;
  const region = v.region;
  const adjs = SIGNATURE_ADJECTIVES[idx % SIGNATURE_ADJECTIVES.length];

  const musicPools = {
    club: [
      `${name}의 음향 시스템은 ${region} 클럽씬에서도 ${adjs[0]} 수준으로 평가받는다. 레지던트 DJ의 선곡 철학은 단순한 히트곡 나열이 아니라, 밤의 흐름을 설계하는 것에 가깝다. 초반의 가벼운 하우스에서 시작해 점점 강렬한 EDM으로 이행하는 구성은, 방문자의 에너지 곡선과 정확히 맞물린다. ${adjs[1]} 베이스라인이 바닥을 타고 올라올 때, 이곳의 사운드가 단순한 음량이 아닌 음질에 집중하고 있음을 체감하게 된다. 힙합 세트가 삽입되는 시간대에는 분위기가 확 바뀌며, 이 전환의 매끄러움이 ${name}의 기술력을 증명한다.`,
      `${name}에서의 음악 경험은 일반적인 클럽 사운드를 넘어선다. ${adjs[0]} 선곡이 밤의 시작부터 끝까지 일관된 서사를 만들어내며, ${region}의 트렌드를 가장 빠르게 반영하는 곳이기도 하다. 주중과 주말의 음악 컬러가 다른 점도 특징인데, 주중에는 ${adjs[1]} 딥하우스와 테크노가, 주말에는 메인스트림 EDM과 힙합이 주를 이룬다. 이 다양성이 다양한 취향의 방문자를 만족시키는 비결이다.`,
      `${name}의 DJ 라인업은 ${region}에서 가장 ${adjs[0]} 것으로 알려져 있다. 게스트 DJ 이벤트가 정기적으로 열리며, 해외 아티스트가 방문하는 경우도 적지 않다. 사운드 시스템은 ${adjs[1]} 음질을 자랑하며, 저음부터 고음까지 모든 주파수 대역이 깨끗하게 전달된다. 음악은 이곳에서 배경이 아닌 주인공이며, 그 철학이 공간의 모든 곳에 배어 있다.`,
    ],
    night: [
      `${name}의 라이브 무대는 ${region} 나이트 중에서도 ${adjs[0]} 완성도를 보여준다. 숙련된 밴드의 연주력은 매일 밤 증명되며, 트로트부터 댄스 팝, 발라드까지 폭넓은 레퍼토리를 소화한다. 관객 참여형 코너에서는 신청곡이 연주되어 추억의 노래가 공간을 채우기도 한다. 댄스 타임이 시작되면 세대를 초월한 즐거움이 폭발하며, 무대와 객석의 경계가 허물어지는 ${adjs[1]} 순간이 찾아온다. 이것이 라이브 음악의 힘이며, ${name}이 오래도록 사랑받는 이유다.`,
      `${name}에서는 음악이 단순한 BGM이 아닌 주인공이다. ${adjs[0]} 밴드가 매일 밤 다른 셋리스트를 준비하며, 관객의 반응에 따라 실시간으로 분위기를 조절한다. ${region}의 밤을 책임지는 이 밴드의 역량은, 첫 곡이 연주되는 순간부터 확인할 수 있다. ${adjs[1]} 무대 연출과 함께 음악이 흘러나올 때, 이곳의 가치를 부정하기 어렵다. 댄스 타임의 에너지는 특히 인상적이며, 나이와 배경을 불문한 화합의 장이 펼쳐진다.`,
      `${name}의 음악 프로그램은 ${region}에서도 손꼽히는 ${adjs[0]} 구성을 자랑한다. 공연은 여러 파트로 나뉘어 진행되는데, 초반의 감미로운 발라드 세션에서 시작해 중반의 열정적인 댄스 파트, 후반의 클라이맥스로 이어지는 구조가 관객의 감정선을 ${adjs[1]} 방식으로 이끌어낸다. 밴드 멤버 각각의 개성이 무대 위에서 빛나며, 이들의 호흡이 만들어내는 합치의 순간은 감동적이기까지 하다.`,
    ],
    lounge: [
      `${name}에서 흘러나오는 음악은 공간의 향수와도 같다. ${adjs[0]} 큐레이팅이 저녁의 시작부터 밤의 마무리까지 자연스러운 흐름을 만들어낸다. 재즈, 소울, R&B를 기반으로 한 선곡은 대화를 방해하지 않으면서도 공간에 ${adjs[1]} 깊이를 더한다. 시간대별로 미묘하게 변하는 음악의 톤은, 이곳의 분위기가 정적인 것이 아니라 살아 숨 쉬는 것임을 알려준다. 바텐더가 음료를 만드는 소리와 음악이 어우러질 때, ${name}만의 고유한 사운드스케이프가 완성된다.`,
      `${name}의 음악 선곡은 ${adjs[0]} 세심함으로 정평이 나 있다. 이른 저녁에는 보사노바와 재즈가, 밤이 깊어지면 네오소울과 딥R&B가 공간을 채운다. 이 전환은 너무나 자연스러워서 의식하지 못할 정도다. ${region}의 라운지 중에서 음악에 이토록 ${adjs[1]} 철학을 담은 곳은 드물다. 간혹 진행되는 라이브 재즈 세션은 이곳의 음악적 정체성을 더욱 공고히 한다.`,
      `${name}에서 음악은 공간의 호흡 그 자체다. 볼륨은 대화를 나누기에 최적화되어 있지만, 귀를 기울이면 ${adjs[0]} 선곡의 품격이 느껴진다. 클래식한 재즈 스탠다드부터 현대적 일렉트로니카까지, ${adjs[1]} 스펙트럼의 음악이 시간대에 따라 흐른다. ${region} 라운지씬에서 음악적 완성도로 이곳을 따라올 곳을 찾기 쉽지 않다.`,
    ],
  };

  return musicPools[v.type][sectionSel(idx, 'music') % musicPools[v.type].length];
}

// ─── Safety/manner/budget guide (unique per venue idx) ───
function generateSafety(v, idx) {
  const typeKr = TYPE_LABELS[v.type];
  const region = v.region;
  const adjs = SIGNATURE_ADJECTIVES[idx % SIGNATURE_ADJECTIVES.length];

  const safetyPools = [
    `${typeKr}에서의 즐거운 밤을 위해 지켜야 할 기본 매너가 있다. 무엇보다 상대방의 의사를 존중하는 것이 첫 번째 원칙이다. 동의 없는 신체 접촉은 절대 금물이며, 거절의 의사는 우아하게 수용하는 것이 성숙한 태도다. 음주는 자신의 한계를 알고 그 안에서 즐기되, 중간중간 물을 충분히 마시는 것이 다음 날까지 좋은 기억으로 남기는 비결이다. 귀가 교통편은 반드시 사전에 확보해두자. ${region}에서 대리운전이나 택시 앱을 미리 준비해두면 마음 놓고 즐길 수 있다. 예산은 입장료, 음료비, 교통비를 포함하여 여유 있게 잡되, 한도를 정해두고 초과하지 않는 절제력도 중요하다.`,
    `밤문화를 ${adjs[0]} 방식으로 즐기려면 자신만의 원칙을 세우는 것이 도움된다. 첫째, 예산의 상한선을 미리 정하고 그 범위 내에서 최대한 만끽한다. 둘째, 음주량을 스스로 관리하며 컨디션이 좋지 않을 때는 과감히 멈춘다. 셋째, 모르는 사람의 음료를 받지 않는 기본 수칙을 지킨다. 넷째, 귀중품은 최소한으로, 중요한 것은 안쪽 주머니에 보관한다. 다섯째, 신뢰할 수 있는 사람에게 자신의 위치를 공유해둔다. ${region}의 ${typeKr}에서 이런 기본 수칙만 지켜도 안전하고 즐거운 밤이 보장된다.`,
    `${region}에서 ${typeKr}를 방문할 때의 예산 계획은 미리 세우는 것이 현명하다. 입장료(있는 경우), 음료비, 교통비, 비상금까지 포함하여 총 예산을 산정하자. 현금과 카드를 모두 지참하되, 과소비를 방지하기 위해 한도를 정해두는 것이 좋다. 매너 면에서는 주변 손님들의 공간을 존중하고, 과도한 소란이나 무례한 행동은 삼가야 한다. 스태프에 대한 기본적인 예의도 잊지 말자. 불편한 상황이 발생하면 직접 대응하기보다 스태프를 통해 해결하는 것이 ${adjs[0]} 현명한 방법이다. 서로가 서로의 밤을 존중할 때, 모두가 ${adjs[1]} 시간을 보낼 수 있다.`,
    `안전한 밤을 위한 실전 가이드를 숙지해두자. ${region}의 ${typeKr}를 방문할 때, 혼자라면 반드시 지인에게 방문 장소와 예상 귀가 시간을 알려두어야 한다. 음주 중에도 판단력을 유지할 수 있는 수준에서 즐기고, 체력적으로 무리가 오면 주저하지 말고 자리를 뜨자. 모르는 사람이 건네는 음료는 정중하게 거절하고, 자리를 비웠던 음료는 마시지 않는 것이 원칙이다. 예산은 최소 인당 5만 원에서 넉넉하게 10만 원 정도를 기준으로 잡되, 개인 상황에 맞게 유연하게 조절하자. ${adjs[0]} 밤을 위한 가장 기본적인 투자는 안전에 대한 준비다.`,
    `${typeKr} 방문의 핵심은 즐거움과 안전의 균형이다. ${region}의 밤문화를 ${adjs[0]} 수준으로 경험하려면, 먼저 자신의 컨디션을 점검하는 것부터 시작하자. 충분한 수면과 식사 후에 방문하면 훨씬 좋은 시간을 보낼 수 있다. 음주 페이스는 음료 한 잔당 30분 이상의 간격을 권장하며, 물을 병행하는 것이 효과적이다. 귀가 시에는 무조건 안전한 교통수단을 이용하되, 대중교통 막차 시간을 미리 확인해두면 선택지가 넓어진다. 기본 매너로는 소란 금지, 타인의 공간 존중, 스태프에 대한 예의가 있으며, 이는 모두에게 ${adjs[1]} 밤을 보장하는 최소한의 조건이다.`,
  ];

  return safetyPools[sectionSel(idx, 'safety') % safetyPools.length];
}

// ─── Timeline (unique per venue) ───
function generateTimeline(v, idx, rng) {
  const name = v.displayName;
  const adjs = SIGNATURE_ADJECTIVES[idx % SIGNATURE_ADJECTIVES.length];

  const timelineVariants = [
    // Variant 0: Standard timeline
    [
      { time: '21:00', label: '도착과 첫 발걸음', desc: `${name}에 도착한다. 입구의 ${adjs[0]} 분위기가 기대감을 높인다. 드레스코드 확인과 입장 절차를 마치고 내부로 들어선다.` },
      { time: '21:30', label: '첫 음료와 공간 탐색', desc: `바에서 음료를 주문하고 공간을 둘러본다. ${adjs[1]} 인테리어와 조명이 눈에 들어오며, 오늘 밤의 무대가 서서히 윤곽을 드러낸다.` },
      { time: '22:15', label: '분위기 적응', desc: `음악과 조명에 익숙해지면서 자연스럽게 공간에 녹아든다. 주변 테이블의 분위기도 점점 활기를 띠기 시작한다.` },
      { time: '23:00', label: '본격적인 즐김', desc: `밤이 본격적으로 시작되는 시간. ${adjs[2]} 에너지가 공간 전체로 퍼지며, 음악의 볼륨도 한층 올라간다.` },
      { time: '00:00', label: '피크 타임', desc: `${name}이 가장 뜨거운 순간을 맞이한다. 모든 감각이 활짝 열리는 ${adjs[3]} 시간대다.` },
      { time: '01:30', label: '여운과 귀가', desc: `달콤한 아쉬움을 안고 밤을 정리한다. 다음 방문에 대한 기대가 자연스럽게 피어오른다.` },
    ],
    // Variant 1: Phase system
    [
      { time: '웜업 (20-21시)', label: '준비와 이동', desc: `집에서 ${name} 방문을 위한 준비를 마치고 이동한다. ${adjs[0]} 기대감과 함께 출발한다.` },
      { time: '엔트리 (21-22시)', label: '입장과 적응', desc: `입장 후 공간에 익숙해지는 시간. 음료를 주문하고 ${adjs[1]} 분위기를 천천히 흡수한다.` },
      { time: '빌드업 (22-23시)', label: '에너지 상승', desc: `분위기가 점점 고조된다. 음악이 강해지고, 사람들의 에너지가 ${adjs[2]} 방식으로 섞이기 시작한다.` },
      { time: '피크 (23-01시)', label: '절정의 경험', desc: `${name}의 밤이 가장 ${adjs[3]} 빛을 발하는 시간. 모든 것이 하나로 수렴되는 순간이다.` },
      { time: '쿨다운 (01시 이후)', label: '마무리와 귀가', desc: `밤의 여운을 즐기며 서서히 마무리한다. 안전한 귀가를 위한 교통편을 확보한다.` },
    ],
    // Variant 2: Experiential stages
    [
      { time: '1단계', label: '기대의 시작', desc: `${name}에 대한 정보를 확인하고 방문을 결심하는 순간부터 밤은 시작된다. ${adjs[0]} 기대감이 발걸음을 재촉한다.` },
      { time: '2단계', label: '첫 만남', desc: `입구를 통과하는 순간, ${adjs[1]} 첫인상이 각인된다. 이곳만의 공기가 피부에 닿는 것을 느낀다.` },
      { time: '3단계', label: '몰입의 시간', desc: `공간과 음악, 사람들 사이에서 자연스러운 몰입이 이루어진다. 시간 감각이 ${adjs[2]} 방식으로 변형된다.` },
      { time: '4단계', label: '정점의 순간', desc: `밤의 하이라이트. ${adjs[3]} 경험이 모든 감각을 관통하는 순간이 찾아온다.` },
      { time: '5단계', label: '기억의 각인', desc: `떠나면서도 남는 것들. ${name}에서의 경험이 하나의 기억으로 정리되어 마음에 새겨진다.` },
    ],
    // Variant 3: Mood progression
    [
      { time: '설렘 (도착)', label: '기분: 기대', desc: `${name}의 문 앞에 서면 설렘이 올라온다. ${adjs[0]} 간판과 입구의 분위기가 이미 밤의 서막을 알린다.` },
      { time: '탐색 (첫 30분)', label: '기분: 호기심', desc: `공간의 구석구석을 살피며 이곳의 ${adjs[1]} 디테일을 발견하는 시간이다.` },
      { time: '적응 (1시간)', label: '기분: 편안함', desc: `음료와 음악이 자연스럽게 어우러지며, 이 공간에 속해 있다는 ${adjs[2]} 안정감이 찾아온다.` },
      { time: '고조 (피크)', label: '기분: 흥분', desc: `분위기가 최고조에 달하는 순간, ${adjs[3]} 에너지가 온몸을 감싼다.` },
      { time: '여운 (귀가)', label: '기분: 만족', desc: `밖으로 나서며 든든한 만족감이 자리잡는다. 다음 방문이 이미 기다려진다.` },
    ],
  ];

  return timelineVariants[sectionSel(idx, 'timeline') % timelineVariants.length];
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
  const adjs = SIGNATURE_ADJECTIVES[idx % SIGNATURE_ADJECTIVES.length];

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
        { q: `${name}의 전반적인 분위기는 어떤가요?`, a: `${adjs[0]} 분위기의 ${region} 대표 라운지입니다. 대화를 나누기에 최적화된 음량과 조명으로 편안한 시간을 보내실 수 있습니다.` },
        { q: `${name}에 예약 없이 갈 수 있나요?`, a: `평일은 워크인이 가능하지만, 금토 저녁에는 예약을 강력히 추천합니다. 인기 시간대에는 대기가 생길 수 있습니다.` },
        { q: `${name}의 드레스코드가 까다로운가요?`, a: `스마트 캐주얼 이상을 권장합니다. 너무 캐주얼한 복장은 분위기와 맞지 않을 수 있습니다.` },
        { q: `${name}에서의 예상 비용이 궁금해요`, a: `칵테일 기준 1.5~3만 원대이며, 안주와 함께 인당 5~10만 원 정도를 예상하시면 됩니다.` },
        { q: `${name}은 데이트 장소로 적합한가요?`, a: `프라이빗하고 ${adjs[1]} 분위기로 데이트에 매우 적합합니다. 커플 소파석을 미리 요청하시면 좋습니다.` },
        { q: `${name}에서 단체 예약이 되나요?`, a: `소규모 모임부터 프라이빗룸까지 다양한 옵션이 있습니다. 인원과 목적에 맞춰 최적의 공간을 준비해드립니다.` },
        { q: `${name}은 몇 시까지 영업하나요?`, a: `평일은 새벽 1시 전후, 주말은 새벽 3시 전후까지 운영되는 것이 일반적입니다.` },
        { q: `${name}에서 추천하는 시그니처 메뉴가 있나요?`, a: `바텐더가 직접 만드는 시그니처 칵테일이 대표 메뉴입니다. 취향을 말씀하시면 맞춤 추천을 받으실 수 있습니다.` },
        { q: `${name}까지 주차는 가능한가요?`, a: `발레파킹 또는 인근 주차장 이용이 가능합니다. 사전 확인을 추천드립니다.` },
        { q: `${name}에서 흡연이 가능한가요?`, a: `실내는 금연이며, 별도의 흡연 구역이나 테라스가 마련되어 있습니다.` },
        { q: `${name}의 음악이 대화에 방해되지 않나요?`, a: `대화를 나누기 좋은 볼륨으로 세팅되어 있습니다. ${adjs[0]} 분위기의 배경 음악이 자연스럽게 흐릅니다.` },
        { q: `${name}에서 2차로 오기 좋은가요?`, a: `${adjs[1]} 분위기에서 마무리하기 좋아 2차 장소로 많이 찾으십니다. 특히 늦은 시간대의 분위기가 좋습니다.` },
      ],
    ],
  };

  const pool = faqTemplates[v.type][0];
  const start = (sectionSel(idx, 'faq') * 2) % pool.length;
  const faqs = [];
  for (let i = 0; i < 8; i++) {
    faqs.push(pool[(start + i) % pool.length]);
  }
  return faqs;
}

// ─── Teaser (unique per venue) ───
function generateTeaser(v, idx) {
  const adjs = SIGNATURE_ADJECTIVES[idx % SIGNATURE_ADJECTIVES.length];
  const name = v.displayName;
  const region = v.region;
  const typeKr = TYPE_LABELS[v.type];

  const teasers = [
    `${region}의 밤을 ${adjs[0]} 경험으로 바꾸는 ${name}. 방문자 모두에게 잊지 못할 순간을 선사합니다.`,
    `${name}은 ${region} ${typeKr} 씬에서 ${adjs[0]} 존재감을 드러내는 곳입니다. 오늘 밤의 목적지로 추천합니다.`,
    `${adjs[0]} 분위기와 ${adjs[1]} 서비스가 어우러진 ${name}. ${region}의 밤을 새롭게 정의합니다.`,
    `${region}에서 ${adjs[0]} 밤을 찾는다면 ${name}이 답입니다. ${typeKr}의 정수를 경험해보세요.`,
    `${name}이 선사하는 ${adjs[0]} 밤문화 경험. ${region}을 대표하는 ${typeKr}입니다.`,
    `${region}의 밤을 ${adjs[0]} 방식으로 즐기고 싶다면, ${name}의 문을 두드려 보세요.`,
    `${name}은 ${region} ${typeKr} 중에서도 ${adjs[1]} 특색을 가진 공간입니다.`,
    `${adjs[0]} 공간감과 ${adjs[1]} 음악으로 완성되는 ${name}의 밤을 만나보세요.`,
    `${region}에서 가장 ${adjs[0]} 밤을 경험할 수 있는 곳, ${name}입니다.`,
    `${name}은 ${region}의 밤에 ${adjs[0]} 색채를 입히는 특별한 공간입니다.`,
    `${adjs[0]} 밤문화의 진수를 보여주는 ${name}. ${region}의 자부심입니다.`,
    `${region}의 밤을 완성시키는 ${adjs[0]} 키워드, 그것은 바로 ${name}입니다.`,
    `${name}에서 ${region}의 밤이 가진 ${adjs[0]} 잠재력을 발견하세요.`,
    `${adjs[1]} 무드와 함께하는 ${name}의 밤. ${region} 밤문화의 새 지평을 엽니다.`,
    `${name}: ${region}에서 가장 ${adjs[0]} 밤을 약속하는 ${typeKr}입니다.`,
    `${region}의 밤에 ${adjs[0]} 이야기를 더하는 곳, ${name}을 만나보세요.`,
    `${name}은 ${region} 밤문화 지도에서 ${adjs[0]} 좌표를 찍고 있습니다.`,
    `${adjs[0]} 조명 아래 펼쳐지는 ${name}의 밤. ${region}을 사로잡는 ${typeKr}입니다.`,
    `${region}에서 ${adjs[0]} 시간을 보내고 싶다면, ${name}이 최적의 선택입니다.`,
    `${name}이 들려주는 ${adjs[0]} 밤의 서사. ${region}의 밤문화를 대표합니다.`,
    `${region}의 밤을 ${adjs[0]} 방식으로 재해석한 공간, ${name}에 오신 것을 환영합니다.`,
    `${name}은 ${region}에서 ${adjs[0]} 밤을 설계하는 장인의 공간입니다.`,
    `${adjs[0]} 에너지가 감도는 ${name}. ${region} ${typeKr}의 새로운 기준입니다.`,
    `${region}의 밤이 ${adjs[0]} 꿈을 꾸는 곳, 그곳이 바로 ${name}입니다.`,
    `${name}에서 시작되는 ${region}의 ${adjs[0]} 밤 여행을 경험하세요.`,
    `${adjs[0]} 순간들이 모여 하나의 밤을 완성하는 곳, ${name}입니다.`,
  ];

  return teasers[idx % teasers.length];
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
  const adjs = SIGNATURE_ADJECTIVES[idx % SIGNATURE_ADJECTIVES.length];
  const name = v.displayName;
  const typeSpecific = {
    club: {
      '목적': {
        '대화': `${name}의 바 카운터 근처 좌석이 대화에 적합합니다. 상대적으로 ${adjs[0]} 구역에서 음료와 함께 대화를 즐기세요.`,
        '댄스': `메인 플로어 중앙이 최적의 위치입니다. ${name}의 ${adjs[1]} DJ 사운드를 온몸으로 느끼세요.`,
        '단체': `테이블 예약을 추천합니다. ${name}의 보틀 서비스와 함께 그룹만의 ${adjs[2]} 시간을 만드세요.`,
        '첫방문': `일찍 도착하여 ${name}의 공간에 익숙해지세요. 바에서 한 잔 하며 분위기를 살피는 것이 좋습니다.`,
      },
      '시간대': {
        '이른 (21-23시)': `${name}의 여유로운 분위기를 경험할 수 있습니다. 공간 탐험에 최적인 시간입니다.`,
        '피크 (23-01시)': `가장 ${adjs[3]} 시간대입니다. 입장 줄이 길 수 있으니 일찍 도착하세요.`,
        '늦은 (01시 이후)': `분위기가 무르익은 시간입니다. ${name}의 진한 밤을 원한다면 이 시간이 적합합니다.`,
      },
    },
    night: {
      '목적': {
        '대화': `${name}의 무대에서 먼 테이블이 대화에 적합합니다. ${adjs[0]} 분위기에서 편안하게 이야기하세요.`,
        '댄스': `댄스 타임에 적극 참여하세요. ${name}의 무대 앞이 가장 ${adjs[1]} 자리입니다.`,
        '단체': `큰 테이블을 예약하고 ${name}에서 함께 즐기세요. ${adjs[2]} 단체 이벤트도 가능합니다.`,
        '첫방문': `부담 없이 ${name}의 음악과 분위기를 즐기세요. 웨이터에게 좋은 자리를 추천받으세요.`,
      },
      '시간대': {
        '이른 (20-22시)': `${name}에서 편안하게 식사와 음료를 즐길 수 있는 ${adjs[0]} 시간입니다.`,
        '피크 (22-00시)': `공연과 이벤트가 집중되는 시간입니다. ${name}의 ${adjs[1]} 무대를 기대하세요.`,
        '늦은 (00시 이후)': `가장 열정적인 시간대로, ${name}에서의 댄스와 교류가 ${adjs[2]} 방식으로 활발합니다.`,
      },
    },
    lounge: {
      '목적': {
        '대화': `${name}의 코너 소파석이 가장 적합합니다. ${adjs[0]} 프라이빗 공간을 요청하세요.`,
        '댄스': `${name}은 대화 중심의 라운지지만, 음악에 맞춰 가벼운 움직임은 자연스럽습니다.`,
        '단체': `${name}의 프라이빗룸이나 단체석을 예약하세요. ${adjs[1]} 맞춤 서비스도 가능합니다.`,
        '첫방문': `${name}의 시그니처 칵테일을 추천받아 보세요. 바텐더와의 대화가 ${adjs[2]} 경험이 됩니다.`,
      },
      '시간대': {
        '이른 (19-21시)': `${name}에서 여유로운 ${adjs[0]} 분위기를 즐기기 좋은 시간입니다.`,
        '피크 (21-23시)': `${name}의 분위기가 가장 ${adjs[1]} 시간대입니다.`,
        '늦은 (23시 이후)': `${name}에서 ${adjs[2]} 분위기로 밤을 차분하게 마무리하기 좋습니다.`,
      },
    },
  };
  return typeSpecific[v.type];
}

// ─── Image prompts ───
function generateImagePrompts(v, idx) {
  const adjs = SIGNATURE_ADJECTIVES[idx % SIGNATURE_ADJECTIVES.length];
  const typeEnglish = { club: 'nightclub', night: 'dance hall', lounge: 'lounge' };
  return [
    `Fictional illustration: Stylish Korean adults arriving at a ${adjs[0]} ${typeEnglish[v.type]} entrance in ${v.region}, street vibe with neon lights, fashion-forward silhouettes, no identifiable faces, no text or logos, dark moody atmosphere with warm accents`,
    `Fictional illustration: Elegant silhouettes of Korean adults enjoying ${adjs[1]} conversation at a VIP table, cocktail glasses, ambient lighting, fashionable outfits, no identifiable faces, no text or logos, sophisticated nightlife mood`,
    `Fictional illustration: Dynamic silhouettes of stylish Korean adults in a ${adjs[2]} ${typeEnglish[v.type]} setting with ${v.type === 'club' ? 'DJ booth and laser lights' : v.type === 'night' ? 'live stage and band energy' : 'premium bar and mixologist'}, vibrant lighting effects, no identifiable faces, no text or logos`,
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
    const timeline = generateTimeline(v, idx, rng);
    const checklist = generateChecklist(v, idx, rng);
    const faq = generateFAQs(v, idx);
    const plannerRules = generatePlannerRules(v, idx);
    const imagePrompts = generateImagePrompts(v, idx);
    const teaser = generateTeaser(v, idx);
    const keywords = generateKeywords(v, idx);

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
      storyFrame: STORY_FRAMES[idx % STORY_FRAMES.length],
      story,
      bodySections: { atmosphere, music, safety },
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
