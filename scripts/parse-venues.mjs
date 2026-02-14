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

// ─── Parse raw file ───
function parseRaw(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let currentType = null;
  const venues = [];
  for (const line of lines) {
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
  '상봉': { slug: 'sangbong', display: '상봉' },
  '수유': { slug: 'suyu', display: '수유' },
  '노원': { slug: 'nowon', display: '노원' },
  '길동': { slug: 'gildong', display: '길동' },
  '신림': { slug: 'sinlim', display: '신림' },
  '독산동': { slug: 'doksan', display: '독산동' },
  '강서': { slug: 'gangseo', display: '강서' },
  '성남': { slug: 'seongnam', display: '성남' },
  '일산': { slug: 'ilsan', display: '일산' },
  '인천': { slug: 'incheon', display: '인천' },
  '수원': { slug: 'suwon', display: '수원' },
  '천안': { slug: 'cheonan', display: '천안' },
  '대구': { slug: 'daegu', display: '대구' },
  '부산': { slug: 'busan', display: '부산' },
};

const TYPE_LABELS = { club: '클럽', night: '나이트클럽', lounge: '라운지' };
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
    return sensoryDetails[idx % sensoryDetails.length];
  })();

  // Scene 5: Emotional reflection (250+ chars)
  scenes.scene5 = (() => {
    const reflections = [
      `${name}이 ${region}의 밤문화 지형에서 차지하는 위치는 단순한 업소 이상이다. 이곳은 하루의 무게를 내려놓고 자신만의 시간을 되찾는 ${adj1} 리셋 공간이다. 매 방문마다 조금씩 다른 경험을 안겨주는 것이 이곳의 진정한 가치이며, 그래서 사람들은 계속해서 이 문을 두드리게 된다.`,
      `돌이켜보면, ${name}에서의 시간은 단순한 유흥을 넘어 하나의 ${adj1} 이야기였다. ${region}이 품고 있는 밤의 서사 중 한 편을 직접 써내려간 느낌이다. 이곳에서 만든 기억은 시간이 지나도 ${adj3} 여운으로 남아, 일상 속에서 문득 미소를 짓게 만든다.`,
      `${name}을 떠나는 이들의 공통점이 있다. ${adj1} 만족감과 아련한 아쉬움의 공존. 이것이야말로 좋은 밤문화 공간의 조건이다. ${region}의 밤을 더 풍요롭게 만드는 ${name}의 존재는, 이 도시의 야간 경제와 문화 모두에 ${adj3} 기여를 하고 있다.`,
      `${name}이라는 공간에서 가져가는 것은 사진이나 영수증이 아니다. 그것은 ${adj1} 감정의 잔향이며, 다음 방문에 대한 기대이며, ${region}의 밤이 줄 수 있는 가장 인간적인 경험에 대한 확인이다. 이곳은 그런 ${adj3} 가치를 조용히 전하고 있다.`,
    ];
    return reflections[idx % reflections.length];
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

  return coreIdentity[idx % coreIdentity.length] + ' ' + spaceDesc[idx % spaceDesc.length] + ' ' + uniqueValue[idx % uniqueValue.length];
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
      `${name}의 라이브 무대는 ${region} 나이트클럽 중에서도 ${adjs[0]} 완성도를 보여준다. 숙련된 밴드의 연주력은 매일 밤 증명되며, 트로트부터 댄스 팝, 발라드까지 폭넓은 레퍼토리를 소화한다. 관객 참여형 코너에서는 신청곡이 연주되어 추억의 노래가 공간을 채우기도 한다. 댄스 타임이 시작되면 세대를 초월한 즐거움이 폭발하며, 무대와 객석의 경계가 허물어지는 ${adjs[1]} 순간이 찾아온다. 이것이 라이브 음악의 힘이며, ${name}이 오래도록 사랑받는 이유다.`,
      `${name}에서는 음악이 단순한 BGM이 아닌 주인공이다. ${adjs[0]} 밴드가 매일 밤 다른 셋리스트를 준비하며, 관객의 반응에 따라 실시간으로 분위기를 조절한다. ${region}의 밤을 책임지는 이 밴드의 역량은, 첫 곡이 연주되는 순간부터 확인할 수 있다. ${adjs[1]} 무대 연출과 함께 음악이 흘러나올 때, 이곳의 가치를 부정하기 어렵다. 댄스 타임의 에너지는 특히 인상적이며, 나이와 배경을 불문한 화합의 장이 펼쳐진다.`,
      `${name}의 음악 프로그램은 ${region}에서도 손꼽히는 ${adjs[0]} 구성을 자랑한다. 공연은 여러 파트로 나뉘어 진행되는데, 초반의 감미로운 발라드 세션에서 시작해 중반의 열정적인 댄스 파트, 후반의 클라이맥스로 이어지는 구조가 관객의 감정선을 ${adjs[1]} 방식으로 이끌어낸다. 밴드 멤버 각각의 개성이 무대 위에서 빛나며, 이들의 호흡이 만들어내는 합치의 순간은 감동적이기까지 하다.`,
    ],
    lounge: [
      `${name}에서 흘러나오는 음악은 공간의 향수와도 같다. ${adjs[0]} 큐레이팅이 저녁의 시작부터 밤의 마무리까지 자연스러운 흐름을 만들어낸다. 재즈, 소울, R&B를 기반으로 한 선곡은 대화를 방해하지 않으면서도 공간에 ${adjs[1]} 깊이를 더한다. 시간대별로 미묘하게 변하는 음악의 톤은, 이곳의 분위기가 정적인 것이 아니라 살아 숨 쉬는 것임을 알려준다. 바텐더가 음료를 만드는 소리와 음악이 어우러질 때, ${name}만의 고유한 사운드스케이프가 완성된다.`,
      `${name}의 음악 선곡은 ${adjs[0]} 세심함으로 정평이 나 있다. 이른 저녁에는 보사노바와 재즈가, 밤이 깊어지면 네오소울과 딥R&B가 공간을 채운다. 이 전환은 너무나 자연스러워서 의식하지 못할 정도다. ${region}의 라운지 중에서 음악에 이토록 ${adjs[1]} 철학을 담은 곳은 드물다. 간혹 진행되는 라이브 재즈 세션은 이곳의 음악적 정체성을 더욱 공고히 한다.`,
      `${name}에서 음악은 공간의 호흡 그 자체다. 볼륨은 대화를 나누기에 최적화되어 있지만, 귀를 기울이면 ${adjs[0]} 선곡의 품격이 느껴진다. 클래식한 재즈 스탠다드부터 현대적 일렉트로니카까지, ${adjs[1]} 스펙트럼의 음악이 시간대에 따라 흐른다. ${region} 라운지씬에서 음악적 완성도로 이곳을 따라올 곳을 찾기 쉽지 않다.`,
    ],
  };

  return musicPools[v.type][idx % musicPools[v.type].length];
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

  return safetyPools[idx % safetyPools.length];
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

  return timelineVariants[idx % timelineVariants.length];
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
  // Deterministic slice: start from idx offset
  const pool = allItems[v.type];
  const start = (idx * 3) % pool.length;
  const items = [];
  for (let i = 0; i < 7; i++) {
    items.push(pool[(start + i) % pool.length]);
  }
  return items;
}

// ─── FAQ (unique per venue) ───
function generateFAQs(v, idx) {
  const name = v.displayName;
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
        { q: `${region}에서 ${name}까지 대중교통으로 어떻게 가나요?`, a: `가장 가까운 지하철역에서 도보로 이동 가능하며, 늦은 시간에는 택시 이용을 추천합니다.` },
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
        { q: `${region}에서 ${name}까지 주차가 가능한가요?`, a: `인근 주차 시설을 이용하시거나 대중교통 이용을 권장합니다. 음주 후에는 반드시 대리운전을 이용하세요.` },
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
        { q: `${region}에서 ${name}까지 주차는 가능한가요?`, a: `발레파킹 또는 인근 주차장 이용이 가능합니다. 사전 확인을 추천드립니다.` },
        { q: `${name}에서 흡연이 가능한가요?`, a: `실내는 금연이며, 별도의 흡연 구역이나 테라스가 마련되어 있습니다.` },
        { q: `${name}의 음악이 대화에 방해되지 않나요?`, a: `대화를 나누기 좋은 볼륨으로 세팅되어 있습니다. ${adjs[0]} 분위기의 배경 음악이 자연스럽게 흐릅니다.` },
        { q: `${name}에서 2차로 오기 좋은가요?`, a: `${adjs[1]} 분위기에서 마무리하기 좋아 2차 장소로 많이 찾으십니다. 특히 늦은 시간대의 분위기가 좋습니다.` },
      ],
    ],
  };

  const pool = faqTemplates[v.type][0];
  // Pick 8 FAQs with index offset
  const start = (idx * 2) % pool.length;
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

// ─── Keywords ───
function generateKeywords(v) {
  return [
    '전국 나이트클럽', '한국 나이트클럽', '나이트클럽 추천', '클럽 추천',
    `${v.region} 나이트`, `${v.region} 나이트클럽`, `${v.region} 클럽`, `${v.region} 라운지`,
    `${v.displayName} 후기`, `${v.displayName} 가격`, `${v.displayName} 영업시간`, `${v.displayName} 드레스코드`,
  ];
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
    const keywords = generateKeywords(v);

    return {
      id: `venue-${idx + 1}`,
      type: rv.type,
      typePath: TYPE_PATH[rv.type],
      typeLabel: TYPE_LABELS[rv.type],
      name_input: rv.name_input,
      name_display: displayName,
      name_seo: `${region} ${displayName}`,
      region,
      regionSlug,
      venueSlug,
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
        { src: `/venues/${venueSlug}/model-fun-1.svg`, alt: `${region} ${displayName} 분위기 – 입구 패션 일러스트` },
        { src: `/venues/${venueSlug}/model-fun-2.svg`, alt: `${region} ${displayName} 분위기 – 테이블 무드 일러스트` },
        { src: `/venues/${venueSlug}/model-fun-3.svg`, alt: `${region} ${displayName} 분위기 – 댄스 에너지 일러스트` },
      ],
      imagePrompts,
      relatedVenueIds: { sameRegion: [], sameType: [], nearby: [], guides: ['first-visit', 'dress-code'] },
    };
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
