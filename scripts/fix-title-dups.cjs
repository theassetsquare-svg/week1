const fs = require('fs');
const venues = JSON.parse(fs.readFileSync('/home/user/week1/data/venues.json', 'utf8'));

function hasBatchim(str) {
  const last = str.charAt(str.length - 1);
  const code = last.charCodeAt(0);
  if (code < 0xAC00 || code > 0xD7A3) return false;
  return (code - 0xAC00) % 28 !== 0;
}
function hash(str) { let h = 0; for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; } return Math.abs(h); }

// 중복 없는 클릭 제목 템플릿 (가게이름/지역/타입 단어를 포함하지 않음)
const clickTemplates = [
  '첫 방문 전 꼭 읽어야 할 실전 가이드',
  '현지인만 아는 숨겨진 즐기는 법',
  '입장부터 귀가까지 완벽 코스 정리',
  '분위기 음악 서비스 솔직 비교 분석',
  '이번 주말 여기 가야 하는 진짜 이유',
  '방문 후기로 알아보는 리얼 매력 포인트',
  '초보자도 프로처럼 즐기는 꿀팁 모음',
  '단골들이 절대 알려주지 않는 비밀 공략',
  '가기 전에 이것만 알면 200% 즐긴다',
  '새벽까지 놀아본 사람의 솔직 체험기',
  '올해 꼭 가봐야 할 핫플 심층 리뷰',
  '가성비 vs 가심비 어디가 더 좋을까',
  '퇴근 후 완벽한 밤을 만드는 실전 루트',
  '인생 최고의 밤을 만들어줄 장소 탐방',
  '몰라서 못 간 사람들을 위한 올가이드',
  '평일 vs 주말 언제 가야 제맛일까',
  '혼자 가도 200% 즐길 수 있는 방법',
  '첫 방문에 단골이 되는 마법의 비결',
  '분위기 끝판왕 여기 안 가면 후회한다',
  '최적의 시간대와 좌석 선택 완벽 공략',
  '인스타 감성 터지는 밤의 성지 탐방기',
  '데이트 코스로 완벽한 곳 솔직 평가',
  '혼술부터 단체 모임까지 만능 장소 리뷰',
  '프리미엄 서비스의 진수를 경험하다',
  '음악 좋고 분위기 좋은 곳의 모든 것',
  '친구들과 함께라면 더 즐거운 곳 추천',
  '밤 문화 고수가 알려주는 핵심 포인트',
  '예약 없이 가면 후회하는 이유 총정리',
  '처음 간 날 인생 장소를 발견한 이야기',
  '매주 가고 싶어지는 곳의 진짜 매력 분석',
  '숨은 맛집처럼 아는 사람만 아는 장소',
  '여기가 왜 핫한지 직접 가서 알아봤다',
  '밤을 200% 즐기는 사람들의 공통점',
  '안 가본 사람은 있어도 한 번만 간 사람은 없다',
  '오늘 밤 특별한 시간을 보내고 싶다면',
  '방문 전 체크리스트와 꿀팁 총정리',
  '여기서만 가능한 특별한 경험 5가지',
  '솔직 후기와 함께하는 완벽 방문 계획',
  '이번 달 가장 핫한 장소 심층 분석',
  '기대 이상이었던 곳의 리얼 탐방 후기',
  '입소문 난 곳의 진짜 실력을 검증하다',
  '주말 밤 최고의 선택이 될 곳 소개',
  '밤의 분위기를 바꿔놓을 특별한 장소',
  '가보면 반하는 곳 솔직 방문 리포트',
  '기분 전환이 필요할 때 딱 좋은 곳',
  '놀 줄 아는 사람들의 비밀 아지트 공개',
  '완벽한 밤을 위한 최적의 선택 가이드',
  '여기서 보낸 하룻밤이 특별한 이유',
  '한 번 가면 계속 생각나는 곳의 비밀',
  '진짜 잘 노는 사람들이 찾는 그곳',
  '예상과 달랐던 곳 솔직 방문 후기',
  '밤이 길어질수록 빛나는 숨은 명소',
  '갈수록 빠져드는 매력의 정체를 파헤치다',
  '소문대로인지 직접 확인한 리얼 리뷰',
  '입문자부터 고수까지 만족하는 곳 소개',
  '직접 가봤더니 소문 이상이었던 장소',
  '주변 사람들이 다 추천하는 이유 분석',
  '한 달에 한 번은 꼭 가게 되는 곳',
  '오래 기억에 남는 밤을 원한다면 여기',
  '매번 새로운 재미를 주는 곳의 비결',
  '다음 모임 장소로 딱 좋은 곳 발견',
  '분위기 맛집으로 소문난 곳 직접 체험',
  '이곳의 특별한 서비스에 반하다',
  '밤마다 다른 매력을 보여주는 장소 탐방',
  '기대를 뛰어넘은 곳 리얼 체험 후기',
  '아는 만큼 즐길 수 있는 곳 완벽 정리',
  '평소와 다른 밤을 보내고 싶을 때 추천',
  '다시 가고 싶어지는 곳의 매력 해부',
  '방문 횟수만큼 새로움을 주는 신기한 곳',
  '지인 추천으로 찾아간 곳의 솔직 후기',
  '기분 좋은 밤의 공식을 완성하는 장소',
  '처음이라면 이 글부터 읽고 가세요',
  '일상을 리셋하는 완벽한 밤 시간 설계',
  '여기를 모르면 밤 문화를 모르는 것',
  '진짜 즐길 줄 아는 사람들의 선택',
  '한 번은 꼭 경험해봐야 할 밤의 풍경',
  '밤의 온도를 바꿔주는 특별한 경험',
  '기억에 남는 하룻밤을 만드는 완벽 가이드',
  '여기서 보낸 시간은 절대 아깝지 않다',
  '놀라운 분위기에 감탄한 솔직 체험 기록',
  '가보지 않으면 모를 숨겨진 매력 발견기',
  '매 순간이 특별해지는 장소의 비밀 공개',
  '진정한 밤 문화의 정수를 만나다',
  '설레는 밤을 약속하는 곳 방문 후기',
  '새로운 경험을 찾는 사람을 위한 추천',
  '밤의 하이라이트를 장식할 최적의 장소',
  '여기 아니면 경험할 수 없는 것들',
  '완벽한 밤의 조건을 모두 갖춘 곳',
  '분위기에 취하는 밤을 원한다면 필독',
  '소중한 사람과 함께하기 좋은 곳 리뷰',
  '감각적인 공간이 선사하는 특별한 밤',
  '올해 가장 화제가 된 장소 솔직 평가',
  '다른 곳과 확실히 다른 차별화 포인트',
  '방문 전후로 삶의 질이 달라지는 경험',
  '한 번의 방문으로 팬이 되는 마법의 장소',
  '나만 알고 싶은 장소를 공개합니다',
  '오감이 만족하는 밤의 이상향을 찾았다',
  '스트레스 해소에 최적화된 곳 발견기',
  '모든 조건을 충족하는 완벽한 밤 장소',
  '감동적인 밤의 시작점이 될 곳 소개',
  '꼭 한 번은 가봐야 할 곳 총정리',
  '놀 줄 아는 사람에게 물어보면 여기',
  '밤이 아까운 사람들을 위한 최적 장소',
  '진짜 좋은 곳은 입소문으로 퍼진다',
  '기대보다 만족이 큰 곳 리얼 후기',
  '반복 방문하게 되는 이유가 있는 곳',
  '음악과 분위기가 완벽한 밤의 안식처',
  '다음에 또 오겠다고 약속하게 되는 장소',
  '경험자가 말하는 최고의 즐기는 법',
  '모임의 품격을 높여줄 프리미엄 장소',
  '새벽이 아쉬워지는 장소의 매력 탐구',
  '방문할 때마다 감탄하는 공간의 비밀',
  '특별한 날에 딱 맞는 완벽한 장소 가이드',
  '일상에서 벗어나는 최고의 밤 체험기',
  '추천받고 가서 대만족한 곳 솔직 리뷰',
  '즐거운 밤을 보장하는 장소 완전 분석',
  '기분 전환의 마스터키가 될 곳 소개',
  '매력 넘치는 밤의 무대를 경험하다',
  '후회 없는 선택이 될 곳 심층 가이드',
  '감성 충전이 필요한 날 찾아가는 곳',
  '밤이 짧게 느껴지는 곳에서 보낸 시간',
  '이 정도면 인생 장소라 불러도 될까',
  '내 취향을 정확히 저격한 곳 발견기',
  '소중한 시간을 보내기에 완벽한 장소',
  '한 마디로 정의할 수 없는 매력의 장소',
  '가장 만족스러운 밤을 보낸 곳 후기',
  '밤의 풍경을 바꿔준 특별한 장소 이야기',
];

// Assign unique titles to each venue
const usedIdx = new Set();
venues.forEach((v, i) => {
  const shopName = v.name_display.replace(/\s+/g, '');
  const h = hash(v.name_display + v.venueSlug + i);

  let idx = h % clickTemplates.length;
  let attempts = 0;
  while (usedIdx.has(idx) && attempts < clickTemplates.length) {
    idx = (idx + 1) % clickTemplates.length;
    attempts++;
  }
  usedIdx.add(idx);

  const clickPart = clickTemplates[idx];

  // Verify no duplicate words
  const nameParts = v.name_display.split(/\s+/).filter(p => p.length >= 2);
  const hasDup = nameParts.some(p => clickPart.includes(p));
  if (hasDup) {
    console.log('WARNING DUP:', shopName, clickPart);
  }

  v.pageTitle = `${shopName} ${clickPart}`;
});

fs.writeFileSync('/home/user/week1/data/venues.json', JSON.stringify(venues, null, 2));

// Verify
const titles = venues.map(v => v.pageTitle);
const unique = new Set(titles);
console.log('Unique titles:', unique.size + '/130');

// Check duplicates
let dupCount = 0;
venues.forEach(v => {
  const shopName = v.name_display.replace(/\s+/g, '');
  const clickPart = v.pageTitle.replace(shopName + ' ', '');
  const nameParts = v.name_display.split(/\s+/).filter(p => p.length >= 2);
  const dups = nameParts.filter(p => clickPart.includes(p));
  if (dups.length > 0) dupCount++;
});
console.log('중복 단어 있는 제목:', dupCount + '/130');

// Show samples
console.log('\n=== 나이트 ===');
venues.filter(v => v.type === 'night').slice(0, 8).forEach(v => console.log('  ' + v.pageTitle));
console.log('\n=== 클럽 ===');
venues.filter(v => v.type === 'club').slice(0, 8).forEach(v => console.log('  ' + v.pageTitle));
console.log('\n=== 라운지 ===');
venues.filter(v => v.type === 'lounge').slice(0, 8).forEach(v => console.log('  ' + v.pageTitle));

// Check click part similarity
const clickParts = venues.map(v => {
  const shopName = v.name_display.replace(/\s+/g, '');
  return v.pageTitle.replace(shopName + ' ', '');
});
const uniqueClicks = new Set(clickParts);
console.log('\n유니크 클릭 문구:', uniqueClicks.size + '/130');
