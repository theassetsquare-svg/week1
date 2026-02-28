/**
 * PHASE 7 Content Engine
 * - Adds aiSummary (6-10 factual bullets)
 * - Adds quickPlan (decision table + 3 scenarios + cost note)
 * - Expands faq to 12 questions per venue with diverse openers
 * - Fixes conclusionText to be meaningful
 * - Removes all banned words from ALL text fields recursively
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VENUES_PATH = join(__dirname, '../data/venues.json');

const BANNED = ['해당', '이곳', '공간', '매장', '감도', '기준'];

/* ─── Banned-word auto-fix (single string) ─── */
function fixBanned(text, vtype) {
  if (!text || typeof text !== 'string') return text;
  const tw = vtype === 'club' ? '클럽' : vtype === 'night' ? '나이트' : '라운지';

  // ── 공간 ──
  const spaceMap = [
    ['이 공간', `이 ${tw}`], ['그 공간', `그 ${tw}`], ['한 공간', `한 ${tw}`],
    ['이런 공간', `이런 ${tw}`], ['좋은 공간', `좋은 ${tw}`],
    ['공간 무드', '인테리어 무드'], ['공간감', '분위기'], ['공간이다', `${tw}이다`],
    ['공간입니다', `${tw}입니다`], ['공간이었다', `${tw}이었다`],
    ['공간이에요', `${tw}이에요`], [`공간이 있`, `${tw}이 있`],
    [`공간이 없`, `${tw}이 없`], ['공간이', `${tw}이`], ['공간은', `${tw}은`],
    ['공간을', `${tw}을`], ['공간의', `${tw}의`], ['공간에서', `${tw}에서`],
    ['공간에', `${tw}에`], ['공간으로', `${tw}으로`], ['공간과', `${tw}과`],
    ['공간도', `${tw}도`], ['공간만', `${tw}만`], ['공간', tw],
  ];
  for (const [from, to] of spaceMap) text = text.split(from).join(to);

  // ── 기준 ──
  const stdMap = [
    ['기준일:', '확인일:'], ['기준일', '확인일'],
    ['정보 기준으로', '정보를 바탕으로'], ['기준으로', '기준을 바탕으로'],
    ['기준이', '수준이'], ['기준은', '수준은'], ['기준을', '수준을'],
    ['기준의', '수준의'], ['기준에서', '수준에서'], ['기준이다', '수준이다'],
    ['기준입니다', '수준입니다'], ['기준 갱신', '정보 갱신'],
    ['갱신 기준', '정보 갱신'], ['현장 기준', '현장 확인'],
    ['2시간 기준', '2시간 예상'], ['기준 예산', '예상 예산'],
    ['안주 기준', '안주 예상'], ['1인 기준', '1인 예상'],
    ['입장 기준', '입장 규정'], ['기준 현장', '현장'],
  ];
  for (const [from, to] of stdMap) text = text.split(from).join(to);
  // compound words with 기준
  text = text.split('기준점').join('이정표');
  text = text.split('기준선').join('경계선');
  // remaining 기준 → 수준 (before Korean or space or end)
  text = text.replace(/기준([은이을의에도만])/g, '수준$1');
  text = text.replace(/기준([ .,]|$)/g, '수준$1');
  text = text.replace(/기준$/g, '수준');

  // ── 이곳 ──
  text = text.split('이곳만의').join('여기만의');
  text = text.split('이곳에서').join('여기에서');
  text = text.split('이곳의').join('여기의');
  text = text.split('이곳은').join('여기는');
  text = text.split('이곳이').join('여기가');
  text = text.split('이곳을').join('여기를');
  text = text.split('이곳에').join('여기에');
  text = text.split('이곳').join('여기');

  // ── 해당 ──
  text = text.split('해당 ').join('');
  text = text.replace(/해당([이은을의])/g, '이$1');
  text = text.split('해당').join('');

  // ── 매장 ──
  text = text.split('매장에 직접 문의').join('직접 문의');
  text = text.split('매장에').join(`${tw}에`);
  text = text.split('매장을').join(`${tw}을`);
  text = text.split('매장의').join(`${tw}의`);
  text = text.split('매장이').join(`${tw}이`);
  text = text.split('매장').join(tw);

  // ── 감도 ──
  text = text.split('감도').join('분위기');

  return text;
}

/* ─── Recursive object fixer ─── */
function fixObj(obj, vtype) {
  if (!obj) return obj;
  if (typeof obj === 'string') return fixBanned(obj, vtype);
  if (Array.isArray(obj)) return obj.map(item => fixObj(item, vtype));
  if (typeof obj === 'object') {
    const out = {};
    for (const k of Object.keys(obj)) {
      out[k] = fixObj(obj[k], vtype);
    }
    return out;
  }
  return obj;
}

/* ─── AI Summary ─── */
function genAiSummary(v) {
  const addr = v.geo.formatted_address !== '확인 필요'
    ? v.geo.formatted_address
    : `${v.region} 소재 — 방문 전 직접 확인 권장`;
  const atm = (v.bodySections?.atmosphere || '').split('.')[0].trim().slice(0, 50);
  const mus = (v.bodySections?.music || '').split('.')[0].trim().slice(0, 50);
  const peak = v.timeline?.[0] ? `${v.timeline[0].time} — ${v.timeline[0].label}` : '시간대 확인 권장';
  const chk0 = v.checklist?.[0] || '';

  const bullets = [
    `유형: ${v.region} ${v.typeLabel}`,
    `위치: ${addr}`,
  ];
  if (atm) bullets.push(`분위기: ${atm}`);
  if (mus) bullets.push(`사운드: ${mus}`);
  bullets.push(`피크타임: ${peak}`);
  if (chk0) bullets.push(`준비 체크: ${fixBanned(chk0, v.type)}`);
  bullets.push(`FAQ: ${(v.faq?.length || 0) + 4}개 답변 수록`);
  bullets.push(`체크리스트: ${v.checklist?.length || 0}개 항목`);
  bullets.push(`정보 확인일: 2026-02-18 — 변경 가능, 방문 전 재확인 권장`);
  return bullets.filter(b => !BANNED.some(bw => b.includes(bw))).slice(0, 10);
}

/* ─── Quick Plan ─── */
function genQuickPlan(v) {
  const tw = v.type === 'club' ? '클럽' : v.type === 'night' ? '나이트' : '라운지';
  const n = v.name_display;
  const r = v.region;
  const peakTime = v.timeline?.[0]?.time || '밤 11시';

  if (v.type === 'club') {
    return {
      table: [
        { condition: '처음 방문이라면', tip: '21–22시 이른 입장으로 분위기 파악 후 결정' },
        { condition: '혼자라면', tip: '바 카운터에 자리 잡고 음악부터 느끼기' },
        { condition: '그룹이라면', tip: '사전 테이블 예약 또는 보틀 서비스 문의' },
        { condition: '특별한 날이라면', tip: '생일·기념일 이벤트 사전 연락 권장' },
      ],
      scenarios: [
        {
          title: '가볍게 입문',
          desc: `잔 단위 음료 주문 후 ${n}의 분위기를 탐색. 2시간 예상 예산 3–5만 원대. 이른 시간이 편하다.`,
        },
        {
          title: '제대로 즐기기',
          desc: `${r} 특유의 에너지가 살아나는 ${peakTime}에 맞춰 도착. 그룹이라면 보틀 서비스 고려.`,
        },
        {
          title: '특별한 날 플랜',
          desc: `생일·기념일이라면 ${n}에 사전 연락 후 이벤트 서비스 여부 확인. 예약 당일 SNS 이벤트도 체크.`,
        },
      ],
      costNote: `${n} 입장료·음료 가격은 요일·이벤트에 따라 달라집니다. 최신 정보는 공식 SNS에서 확인하세요.`,
    };
  } else if (v.type === 'night') {
    return {
      table: [
        { condition: '처음 방문이라면', tip: `이른 시간 도착 후 ${n} 홀 분위기 적응` },
        { condition: '파트너 댄스 미숙자라면', tip: '바 좌석 착석 후 관람 먼저, 자연스럽게 합류' },
        { condition: '그룹이라면', tip: '테이블 예약 또는 넓은 좌석 구역 사전 확인' },
        { condition: '라이브 공연 목적이라면', tip: '공연 시작 시간 사전 확인 필수' },
      ],
      scenarios: [
        {
          title: '여유로운 저녁',
          desc: `${n} 오픈 직후 도착. 음료 한 잔과 함께 무대와 홀 분위기 탐색. 2시간 예상 예산 2–4만 원.`,
        },
        {
          title: '골든타임 공략',
          desc: `${peakTime} 집중 방문. ${r} 나이트 특유의 에너지를 제대로 경험. 인원이 많으면 테이블 예약 권장.`,
        },
        {
          title: '특별한 날 코스',
          desc: `생일·기념일 방문 시 ${n}에 사전 연락. 케이크·샴페인 서비스 여부 확인 후 결정.`,
        },
      ],
      costNote: `${n} 입장료·음료 가격은 요일·이벤트마다 다릅니다. 방문 전 공식 SNS를 확인하세요.`,
    };
  } else {
    return {
      table: [
        { condition: '혼자라면', tip: '바 카운터 착석, 바텐더에게 취향 설명' },
        { condition: '데이트라면', tip: '조용한 테이블 자리 예약 권장' },
        { condition: '그룹이라면', tip: '최소 주문 금액 사전 확인 후 예약' },
        { condition: '첫 방문이라면', tip: '시그니처 메뉴 한 가지로 시작' },
      ],
      scenarios: [
        {
          title: '혼술·가볍게',
          desc: `${n} 바 카운터에서 시그니처 칵테일 한 잔. 1시간 예상 예산 2–3만 원. 평일 이른 저녁이 여유롭다.`,
        },
        {
          title: '분위기 있는 저녁',
          desc: `${r}의 밤을 배경으로 테이블 자리에서 2–3시간. 음료 2–3잔 안주 포함 5–10만 원 예상.`,
        },
        {
          title: '특별한 날 코스',
          desc: `기념일이라면 ${n}에 사전 예약 후 케이크·샴페인 서비스 여부 확인. 분위기 있는 하루 마무리.`,
        },
      ],
      costNote: `${n} 가격은 메뉴·요일에 따라 다릅니다. 최소 주문 금액 여부를 방문 전 확인하세요.`,
    };
  }
}

/* ─── FAQ expansion ─── */
const CLUB_FAQ_EXTRA = () => [
  {
    q: `재입장 규정은 어떻게 되나요?`,
    a: `팔찌나 스탬프로 재입장이 가능한 경우가 많습니다. 입장 시 현장에서 확인하세요.`,
  },
  {
    q: `음료 최소 주문량이 따로 있나요?`,
    a: `테이블 이용 시 최소 주문 금액이 적용될 수 있습니다. 사전 문의 후 방문하세요.`,
  },
  {
    q: `생일 파티나 기념일로 방문하려면 사전 문의가 필요할까요?`,
    a: `케이크·샴페인 서비스 등 이벤트 준비를 원한다면 방문 전 연락 주시면 안내해 드립니다.`,
  },
  {
    q: `보틀 서비스와 잔 주문 중 어느 쪽이 나을까요?`,
    a: `그룹 방문이라면 보틀이 경제적입니다. 혼자이거나 2인이라면 잔 단위 주문을 권장합니다.`,
  },
];

const NIGHT_FAQ_EXTRA = () => [
  {
    q: `혼자 가도 즐길 수 있나요?`,
    a: `혼자서도 바 좌석이나 홀에서 충분히 즐길 수 있습니다. 스태프가 친절하게 안내합니다.`,
  },
  {
    q: `단체 방문 시 테이블 예약이 꼭 필요한가요?`,
    a: `5인 이상은 사전 예약을 권장합니다. 주말·공휴일 전날은 자리가 빨리 차는 편입니다.`,
  },
  {
    q: `음식이나 안주도 판매하나요?`,
    a: `안주류를 판매하는 경우가 많습니다. 메뉴 구성은 방문 전 직접 확인하시기 바랍니다.`,
  },
  {
    q: `영업 마감 시간이 보통 언제쯤인가요?`,
    a: `보통 새벽 4–5시까지 운영하며, 요일과 이벤트에 따라 달라질 수 있습니다.`,
  },
];

const LOUNGE_FAQ_EXTRA = () => [
  {
    q: `복장 제한이 따로 있나요?`,
    a: `드레스코드가 엄격하지 않은 편이지만 슬리퍼·반바지 등 지나치게 캐주얼한 복장은 피하는 것이 좋습니다.`,
  },
  {
    q: `와인이나 맥주도 다양하게 판매하나요?`,
    a: `와인·맥주·칵테일 등 다양한 주류를 갖추고 있습니다. 상세 메뉴는 방문 전 확인을 권장합니다.`,
  },
  {
    q: `영업 마감 시간은 보통 언제쯤인가요?`,
    a: `주중 자정~새벽 2시, 주말 새벽 3시 안팎이 일반적입니다. 변동이 있을 수 있으니 방문 전 확인하세요.`,
  },
  {
    q: `생일이나 기념일을 보내기에 어떤가요?`,
    a: `분위기 있는 자리에서 특별한 날을 보내기 좋습니다. 사전 예약 시 케이크 반입 가능 여부도 문의하세요.`,
  },
];

function genFaqForVenue(v) {
  const type = v.type;
  // Fix existing FAQ + remove banned
  const existing = (v.faq || []).map(f => ({
    q: fixBanned(f.q, type),
    a: fixBanned(f.a, type),
  }));
  // Fix known "기준이 궁금합니다" → "수준이 궁금합니다"
  existing.forEach(f => {
    if (f.q.includes('기준이 궁금합니다')) f.q = f.q.replace('기준이 궁금합니다', '수준이 궁금합니다');
    if (f.q.includes('주차 공간이')) f.q = f.q.replace('주차 공간이', '주차할 곳이');
  });

  let extra = [];
  if (type === 'club') extra = CLUB_FAQ_EXTRA();
  else if (type === 'night') extra = NIGHT_FAQ_EXTRA();
  else extra = LOUNGE_FAQ_EXTRA();

  return [...existing, ...extra];
}

/* ─── Conclusion ─── */
const CONCLUSION_TEMPLATES = {
  club: (n, r) =>
    `${n}은 ${r}의 밤을 제대로 경험하고 싶은 이들에게 어울리는 선택이다. 타이밍과 복장을 미리 점검했다면, ${n}에서의 밤은 훨씬 만족스러울 것이다. 이 페이지의 정보는 현장 상황에 따라 달라질 수 있으니, 방문 전 재확인을 권장한다. ${n}에서 즐거운 밤 되시길.`,
  night: (n, r) =>
    `${n}의 밤은 준비가 된 만큼 더 풍성해진다. 처음이든 재방문이든, ${n}은 ${r}에서 잊기 어려운 하룻밤을 선사한다. 이 페이지의 정보는 변동될 수 있으니 방문 전 한 번 더 확인하는 것을 권장한다. 좋은 밤 되시길.`,
  lounge: (n, r) =>
    `${n}은 ${r}에서 어른들을 위한 시간을 선사하는 술집이다. 바 한 잔이든 긴 대화든, ${n}은 그 시간을 특별하게 만들어준다. 방문 전 정보 변동 여부를 재확인하고, ${n}에서 여유로운 저녁을 즐기시길.`,
};

/* ─── MAIN ─── */
const venues = JSON.parse(readFileSync(VENUES_PATH, 'utf-8'));
let changed = 0;

for (const v of venues) {
  const type = v.type;
  const n = v.name_display;
  const r = v.region;

  // ── 1. Recursively fix ALL text-bearing fields ──
  const TOP_FIX = [
    'hookIntro', 'teaser', 'description_short', 'conclusionText',
    'metaDescription', 'h1Title', 'seoTitle', 'seoDescription', 'pageTitle',
  ];
  for (const f of TOP_FIX) {
    if (typeof v[f] === 'string') v[f] = fixBanned(v[f], type);
  }

  // Recursively fix nested objects/arrays
  const NESTED_FIX = ['bodySections', 'story', 'intro', 'sectionIntros', 'plannerRules'];
  for (const f of NESTED_FIX) {
    if (v[f]) v[f] = fixObj(v[f], type);
  }

  // Fix checklist (array of strings)
  if (v.checklist) v.checklist = v.checklist.map(c => fixBanned(c, type));

  // Fix timeline
  if (v.timeline) {
    v.timeline = v.timeline.map(t => ({
      ...t,
      label: fixBanned(t.label, type),
      desc: fixBanned(t.desc, type),
    }));
  }

  // Fix storyFrame
  if (v.storyFrame) {
    v.storyFrame = {
      ...v.storyFrame,
      style: fixBanned(v.storyFrame.style, type),
    };
  }

  // ── 2. Regenerate conclusionText ──
  v.conclusionText = CONCLUSION_TEMPLATES[type](n, r);

  // ── 3. Add aiSummary ──
  v.aiSummary = genAiSummary(v);

  // ── 4. Add quickPlan ──
  v.quickPlan = genQuickPlan(v);

  // ── 5. Expand FAQ ──
  v.faq = genFaqForVenue(v);

  // ── 6. Update aiSummary FAQ count ──
  const faqIdx = v.aiSummary.findIndex(b => b.startsWith('FAQ:'));
  if (faqIdx >= 0) v.aiSummary[faqIdx] = `FAQ: ${v.faq.length}개 답변 수록`;

  changed++;
}

writeFileSync(VENUES_PATH, JSON.stringify(venues, null, 2), 'utf-8');
console.log(`venues.json 업데이트 완료 (${changed}개 venue 처리)`);

// ── Final banned-word scan ──
const raw = JSON.stringify(venues);
let anyBanned = false;
for (const bw of BANNED) {
  const m = (raw.match(new RegExp(bw, 'g')) || []).length;
  if (m > 0) {
    // Check how many are from venue names themselves
    const nameHits = venues.filter(v => v.name_display.includes(bw)).length;
    const contentHits = m - nameHits * 5; // rough estimate for name appearing in content
    console.log(`  "${bw}": 전체 ${m}회 (가게명 포함), 콘텐츠 추정: ${Math.max(0, contentHits)}회`);
    anyBanned = true;
  }
}
if (!anyBanned) console.log('금지어 검사: 이상 없음');
