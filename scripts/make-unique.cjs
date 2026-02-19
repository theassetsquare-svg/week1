const fs = require('fs');
const venues = JSON.parse(fs.readFileSync('/home/user/week1/data/venues.json', 'utf8'));

// ============== HELPERS ==============
function hasBatchim(str) {
  const last = str.charAt(str.length - 1);
  const code = last.charCodeAt(0);
  if (code < 0xAC00 || code > 0xD7A3) return false;
  return (code - 0xAC00) % 28 !== 0;
}
function P(name, type) {
  const b = hasBatchim(name);
  if (type === '은는') return b ? '은' : '는';
  if (type === '이가') return b ? '이' : '가';
  if (type === '을를') return b ? '을' : '를';
  if (type === '으로') return b ? '으로' : '로';
  return '';
}
function typeKo(t) { return t === 'night' ? '나이트' : t === 'club' ? '클럽' : '라운지'; }
function sn(v) {
  const tl = typeKo(v.type);
  let s = v.name_display.replace(v.region + ' ', '').replace(new RegExp('\\s*' + tl + '\\s*$'), '').trim();
  return s || v.urlSlug || v.venueSlug;
}
function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}
function pick(arr, seed) { return arr[seed % arr.length]; }

// ============== PART 1: CLEAN OLD TEMPLATE SENTENCES ==============
venues.forEach(v => {
  const name = v.name_display;
  const tl = typeKo(v.type);
  const esc = escRe(name);

  if (v.hookIntro) {
    v.hookIntro = v.hookIntro
      .replace(new RegExp(esc + '[은는]\\s+' + escRe(v.region) + '[을를]\\s+대표하는\\s+' + escRe(tl) + '입니다\\.\\s*'), '')
      .replace(new RegExp(esc + '[이가]\\s+갖는\\s+'), '')
      .replace(new RegExp('\\s*' + esc + '[을를]\\s+직접 경험해보세요\\.?'), '')
      .trim();
  }
  if (v.bodySections?.atmosphere) {
    v.bodySections.atmosphere = v.bodySections.atmosphere.replace(new RegExp(esc + '[은는]\\s+독특한 매력을 가진 곳입니다\\.\\s*'), '').trim();
  }
  if (v.story?.scene1) {
    v.story.scene1 = v.story.scene1.replace(new RegExp(esc + '에\\s+도착하는 순간,\\s*'), '').trim();
  }
  if (v.bodySections?.music) {
    v.bodySections.music = v.bodySections.music.replace(new RegExp('^' + esc + '의\\s+'), '').trim();
  }
  if (v.bodySections?.safety) {
    v.bodySections.safety = v.bodySections.safety.replace(new RegExp(esc + '[을를]\\s+방문하기 전 꼭 읽어야 할 매너 가이드입니다\\.\\s*'), '').trim();
  }
});

// ============== PART 2: UNIQUE TITLES ==============
const titleTemplates = [
  (v, s, r, tl) => `${s}, ${r} 현지인이 매주 찾는 그곳의 비밀`,
  (v, s, r, tl) => `${r}에서 ${s}${P(s,'을를')} 가야 하는 진짜 이유`,
  (v, s, r, tl) => `첫 방문에 반하는 곳 ${s} | ${r} ${tl} 솔직 후기`,
  (v, s, r, tl) => `${s} 완벽 가이드: 입장부터 새벽 귀가까지`,
  (v, s, r, tl) => `${r} 밤문화의 핵심 ${s}, 이렇게 즐겨라`,
  (v, s, r, tl) => `오늘 밤 ${r}에서 갈 곳 고민? ${s}${P(s,'으로')} 오세요`,
  (v, s, r, tl) => `${s}에서 보낸 하룻밤이 잊히지 않는 이유`,
  (v, s, r, tl) => `단골들만 아는 ${s} 즐기는 법 7가지`,
  (v, s, r, tl) => `${r} ${tl} 랭킹 1위 ${s}의 모든 것`,
  (v, s, r, tl) => `${s} 방문 전 반드시 알아야 할 핵심 정보`,
  (v, s, r, tl) => `${r}의 밤을 바꿔놓은 ${s}의 이야기`,
  (v, s, r, tl) => `${s}${P(s,'이가')} 특별한 5가지 이유 | ${r} ${tl}`,
  (v, s, r, tl) => `주말 밤 ${r}${P(r,'이가')} 뜨거워지는 이유, ${s}`,
  (v, s, r, tl) => `${s} 리얼 탐방기: 기대 이상이었다`,
  (v, s, r, tl) => `${r}에서 가장 핫한 ${tl} ${s} 체험기`,
  (v, s, r, tl) => `${s}: 알고 가면 두 배로 즐기는 ${r} ${tl}`,
  (v, s, r, tl) => `처음 ${s}에 간 날, 인생 ${tl}${P(tl,'을를')} 만났다`,
  (v, s, r, tl) => `${r} 밤 문화 입문자를 위한 ${s} 공략법`,
  (v, s, r, tl) => `${s}${P(s,'이가')} ${r} 최고의 ${tl}인 이유`,
  (v, s, r, tl) => `새벽까지 놀고 싶다면? ${r} ${s} 올가이드`,
  (v, s, r, tl) => `${s} 탐험: ${r}의 숨겨진 밤을 발견하다`,
  (v, s, r, tl) => `${r} 토박이가 추천하는 ${s}의 황금 시간대`,
  (v, s, r, tl) => `${s}에서의 첫 새벽, 왜 다시 가고 싶을까`,
  (v, s, r, tl) => `${r} ${tl} 씬의 중심, ${s} 심층 리뷰`,
  (v, s, r, tl) => `${s}${P(s,'을를')} 제대로 즐기는 완벽한 하룻밤 코스`,
  (v, s, r, tl) => `${r}의 밤은 ${s}에서 시작된다`,
  (v, s, r, tl) => `퇴근 후 ${s}에서 보내는 완벽한 저녁`,
  (v, s, r, tl) => `${s}: ${r} 밤의 분위기를 정의하는 곳`,
  (v, s, r, tl) => `${r} ${tl} 베스트, ${s}의 매력 분석`,
  (v, s, r, tl) => `${s}${P(s,'이가')} 당신의 다음 행선지여야 하는 이유`,
  (v, s, r, tl) => `${r}에서 특별한 밤을 원한다면 ${s}${P(s,'으로')}`,
  (v, s, r, tl) => `${s} 가이드: ${r} 밤을 200% 즐기는 비법`,
  (v, s, r, tl) => `${r} ${tl} 마니아가 선택한 ${s}의 진짜 매력`,
];

// Assign unique titles - ensure no duplicates
const usedTitles = new Set();
venues.forEach((v, idx) => {
  const s = sn(v);
  const r = v.region;
  const tl = typeKo(v.type);
  const h = hash(v.name_display + v.venueSlug);

  let titleIdx = (h + idx) % titleTemplates.length;
  let attempts = 0;
  let title;
  do {
    title = titleTemplates[titleIdx](v, s, r, tl);
    titleIdx = (titleIdx + 1) % titleTemplates.length;
    attempts++;
  } while (usedTitles.has(title) && attempts < titleTemplates.length);

  usedTitles.add(title);
  v.pageTitle = title;
});

// ============== PART 3: EXPAND HOOKINTRO (300+ chars, 1min) ==============
const introOpenings = [
  (v, s, r) => `${r}의 밤은 깊고, 그 깊이 속에서 ${s}${P(s,'은는')} 독보적인 존재감을 드러낸다.`,
  (v, s, r) => `${s}${P(s,'을를')} 처음 찾았을 때의 감각은 오래 기억에 남는다.`,
  (v, s, r) => `${r}에서 밤을 보내는 방법은 여러 가지지만, ${s}만의 방식은 단연 특별하다.`,
  (v, s, r) => `누군가에게 ${r}의 밤을 설명한다면, ${s}${P(s,'을를')} 빼놓을 수 없다.`,
  (v, s, r) => `${s}의 문을 열기 전과 후, ${r}의 밤에 대한 기준이 달라진다.`,
  (v, s, r) => `${r} 밤문화를 논할 때 ${s}${P(s,'은는')} 반드시 언급되는 이름이다.`,
  (v, s, r) => `밤이 깊어질수록 빛나는 곳이 있다. ${r}의 ${s}${P(s,'이가')} 바로 그런 곳이다.`,
  (v, s, r) => `${s}${P(s,'을를')} 아는 사람과 모르는 사람의 ${r} 밤은 완전히 다르다.`,
  (v, s, r) => `${r}에 수많은 선택지가 있지만, ${s}${P(s,'은는')} 그 자체로 하나의 장르다.`,
  (v, s, r) => `좋은 밤은 좋은 장소에서 시작된다. ${r}에서 그 시작점은 ${s}이다.`,
];

const introMiddles = [
  (v, s, r) => `이곳의 진가는 직접 경험해봐야 알 수 있다. 분위기, 음악, 서비스 모든 요소가 하나로 어우러진다.`,
  (v, s, r) => `공간 구성부터 조명, 사운드까지 세심하게 설계된 디테일이 방문자의 감각을 자극한다.`,
  (v, s, r) => `처음 온 사람도 편하게, 자주 온 사람은 더 깊게 즐길 수 있는 구조가 이곳의 강점이다.`,
  (v, s, r) => `단순히 놀러 가는 곳이 아니라, 하나의 경험을 설계하는 공간이라는 표현이 어울린다.`,
  (v, s, r) => `현지인들 사이에서 입소문으로 퍼진 곳답게, 한번 방문하면 다시 찾게 되는 중독성이 있다.`,
  (v, s, r) => `밤의 온도가 달라지는 순간이 있다. 그 전환점에서 이곳의 진짜 매력이 드러난다.`,
  (v, s, r) => `소문으로만 듣던 곳을 직접 찾았을 때, 기대와 현실의 차이가 긍정적으로 뒤집힌다.`,
  (v, s, r) => `음악이 공간을 채우고, 조명이 분위기를 만들고, 사람들이 에너지를 완성한다.`,
  (v, s, r) => `매 순간이 다른 표정을 보여주는 곳. 시간대별로 전혀 다른 경험을 할 수 있다.`,
  (v, s, r) => `좋은 밤의 조건은 까다롭지만, 이곳은 그 조건을 빠짐없이 갖추고 있다.`,
];

const introClosings = [
  (v, s, r) => `이 가이드와 함께라면 ${s}에서의 시간을 최대한 알차게 보낼 수 있다.`,
  (v, s, r) => `${s}${P(s,'을를')} 제대로 즐기기 위한 모든 정보를 이 가이드에 담았다.`,
  (v, s, r) => `가격, 분위기, 팁까지 — ${s} 방문에 필요한 모든 것이 여기 있다.`,
  (v, s, r) => `입장 전 이 가이드를 한 번만 읽어두면, 현장에서의 경험이 완전히 달라진다.`,
  (v, s, r) => `다음 ${r}의 밤을 계획하고 있다면, 이 가이드가 최고의 나침반이 될 것이다.`,
  (v, s, r) => `${s} 방문을 고민하고 있다면, 이 글이 결정에 확신을 줄 것이다.`,
  (v, s, r) => `아래에서 상세한 정보와 팁을 확인하고, 완벽한 밤을 준비하자.`,
  (v, s, r) => `첫 방문이든 재방문이든, 이 가이드가 ${s}에서의 시간을 특별하게 만들어줄 것이다.`,
  (v, s, r) => `이 글을 끝까지 읽으면, ${s}에서의 최적의 루트가 그려질 것이다.`,
  (v, s, r) => `준비된 사람만이 밤을 온전히 즐긴다. ${s} 공략, 지금 시작하자.`,
];

venues.forEach((v, idx) => {
  const s = sn(v);
  const r = v.region;
  const h = hash(v.name_display);

  const opening = pick(introOpenings, h + idx * 3)(v, s, r);
  const middle = pick(introMiddles, h + idx * 7)(v, s, r);
  const closing = pick(introClosings, h + idx * 11)(v, s, r);

  // Keep existing hookIntro as the middle part
  const existingHook = v.hookIntro || '';
  v.hookIntro = `${opening} ${existingHook} ${middle} ${closing}`;
});

// ============== PART 4: EXPAND BODY (3000+ chars, storytelling) ==============

// Atmosphere expansion
const atmosExpand = [
  (v, s, r) => ` ${s}${P(s,'은는')} 단순한 장소가 아니라 하나의 무드를 제안하는 공간이다. 입구를 지나 안쪽으로 들어갈수록 일상과의 거리가 멀어지는 느낌을 받게 된다. 조명의 톤, 음악의 볼륨, 공기의 온도까지 — 모든 것이 계산된 연출이다.`,
  (v, s, r) => ` 이곳의 분위기는 시간대에 따라 극적으로 변화한다. 초저녁의 차분함에서 자정 무렵의 에너지 넘치는 공간으로의 전환은 마치 하나의 공연을 보는 것 같다. ${s}만의 이 리듬을 한번 경험하면 잊기 어렵다.`,
  (v, s, r) => ` 공간의 질감이 다르다는 것은 이런 곳을 두고 하는 말이다. 벽면의 소재부터 좌석 배치, 바 카운터의 높이까지 세심한 설계가 느껴진다. ${s}${P(s,'이가')} ${r}에서 독보적인 위치를 차지하는 이유가 여기에 있다.`,
  (v, s, r) => ` 감각적인 인테리어와 사운드 시스템이 조화를 이루며 방문자를 압도한다. 특히 메인 홀의 음향은 전문가들도 인정하는 수준이다. ${s}에서의 경험은 다른 곳에서는 쉽게 재현할 수 없는 독자적인 것이다.`,
  (v, s, r) => ` ${r}의 다른 곳들과 비교하면 이곳의 차별점은 명확하다. 화려함보다는 완성도, 규모보다는 밀도에 집중한 공간이다. 한 번의 방문으로 ${s}의 팬이 되는 사람들이 많은 이유이기도 하다.`,
  (v, s, r) => ` 첫 발을 들여놓는 순간 느껴지는 에너지가 있다. 음악과 조명, 사람들의 움직임이 만들어내는 생동감은 글로는 다 전달하기 어렵다. ${s}${P(s,'은는')} 직접 와서 느껴야 하는 공간이다.`,
  (v, s, r) => ` 바의 동선부터 무대 근처의 사운드 밸런스까지, 어디에 서 있든 최적의 경험을 제공하도록 설계되어 있다. ${s}의 이런 세밀한 배려는 단골들이 계속 찾는 핵심 이유다.`,
  (v, s, r) => ` 새벽 2시의 이곳은 낮과는 완전히 다른 세계다. 에너지가 최고조에 달하는 순간, 모든 감각이 깨어나는 경험을 하게 된다. ${s}에서만 느낄 수 있는 이 전율이 ${r}의 밤을 정의한다.`,
  (v, s, r) => ` 혼자 와도 어색하지 않고, 단체로 와도 충분히 즐길 수 있는 유연한 공간 구성이 인상적이다. ${s}${P(s,'은는')} 방문자의 목적에 따라 다른 얼굴을 보여주는 다면적인 공간이다.`,
  (v, s, r) => ` 사소한 디테일에서 차이가 난다. 잔의 온도, 얼음의 크기, 서빙 타이밍까지 — ${s}의 서비스 철학은 매 순간 일관되게 적용된다. ${r}에서 이 정도의 완성도를 보여주는 곳은 드물다.`,
];

// Story scene expansion
const storyExpand = [
  (v, s, r) => ` 걸음을 옮길 때마다 새로운 디테일이 눈에 들어온다. 벽에 걸린 아트워크, 천장의 조명 각도, 바텐더의 능숙한 손놀림. ${s}${P(s,'은는')} 하나의 세계관을 가진 곳이다.`,
  (v, s, r) => ` 시간이 얼마나 흘렀는지 모르게 만드는 곳이 있다. 음악의 흐름에 몸을 맡기다 보면 어느새 한 시간이 훌쩍 지나간다. ${s}의 시간은 현실과 다른 속도로 흐른다.`,
  (v, s, r) => ` 주변을 둘러보면 각자의 방식으로 이 공간을 즐기는 사람들이 보인다. 누군가는 대화에 빠져 있고, 누군가는 음악에 흔들리고, 누군가는 조용히 분위기를 음미한다.`,
  (v, s, r) => ` 이 순간을 오래 기억하게 될 것이라는 예감이 든다. 감각의 모든 채널이 열려 있는 상태에서, ${s}${P(s,'이가')} 선사하는 경험은 기억의 깊은 곳에 각인된다.`,
  (v, s, r) => ` 바텐더에게 추천을 부탁했다. 이곳만의 시그니처 음료는 맛뿐 아니라 프레젠테이션까지 인상적이다. 한 잔의 음료가 이곳의 철학을 담고 있다는 느낌을 받는다.`,
  (v, s, r) => ` ${r}의 밤공기가 창문 너머로 느껴진다. 안과 밖의 온도차가 만들어내는 묘한 대비 속에서, ${s}라는 공간의 의미를 다시 생각하게 된다.`,
  (v, s, r) => ` 음악이 잠시 조용해지는 틈에 주변의 대화 소리가 들린다. 웃음소리, 건배하는 소리, 감탄사. 이 모든 소리가 모여 ${s}만의 사운드스케이프를 형성한다.`,
  (v, s, r) => ` DJ가 선곡한 트랙이 공간 전체의 에너지를 한 단계 끌어올린다. 조명이 동시에 변하며 분위기가 전환되는 그 순간, 모든 이의 시선이 하나로 모인다.`,
  (v, s, r) => ` 늦은 시간 도착한 팀이 있다. 그들이 자리를 잡고 적응하는 모습을 보며, 처음 이곳에 왔던 자신의 모습이 떠오른다. ${s}${P(s,'은는')} 언제나 새로운 이야기를 품는다.`,
  (v, s, r) => ` 화장실을 다녀오는 길에 복도의 포토존을 발견했다. 이런 숨겨진 공간까지 신경 쓴 센스가 인상적이다. SNS에 올릴 사진 한 장이 이곳의 홍보대사가 된다.`,
];

// Music expansion
const musicExpand = [
  (v, s, r) => ` ${s}의 음악 프로그램은 단순한 BGM이 아니다. 시간대별로 정교하게 큐레이션된 플레이리스트가 방문자의 감정 곡선을 설계한다. 입장 시의 편안함에서 절정의 흥분까지, 음악이 모든 것을 이끈다.`,
  (v, s, r) => ` ${s}의 사운드 시스템은 ${r}에서 손꼽히는 수준이다. 저음의 풍부함과 고음의 선명함이 균형을 이루며, 어느 위치에서든 최적의 음질을 경험할 수 있다. 음악 마니아라면 이 점만으로도 방문 가치가 충분하다.`,
  (v, s, r) => ` 라이브 공연이 있는 날의 ${s}${P(s,'은는')} 한층 더 특별하다. 무대와 객석의 거리가 가까워 아티스트의 에너지를 직접 느낄 수 있고, 관객과 공연자 사이의 교감이 공간 전체에 퍼진다.`,
  (v, s, r) => ` ${s}에서의 음악 경험은 귀로만 듣는 것이 아니다. 바닥을 타고 올라오는 베이스의 진동, 가슴을 울리는 보컬의 파동까지 — 온몸으로 음악을 느끼는 경험이다.`,
  (v, s, r) => ` 장르의 경계를 넘나드는 ${s}의 음악 셀렉션은 다양한 취향의 방문자를 만족시킨다. K-POP부터 힙합, EDM, R&B까지 시간대에 따라 자연스러운 전환이 이루어진다.`,
];

// Safety expansion
const safetyExpand = [
  (v, s, r) => ` ${s}${P(s,'을를')} 안전하게 즐기기 위해 몇 가지 기본 원칙을 기억하자. 동행인과 미리 만남 장소를 정해두고, 휴대폰 배터리를 충분히 충전해두는 것이 좋다. 귀가 교통편은 반드시 사전에 확인하고, 대리운전 번호를 미리 저장해두자.`,
  (v, s, r) => ` ${s} 방문 시 예산 계획도 중요하다. 입장료, 음료비, 교통비를 포함해 전체 예산을 미리 산정하고, 현금과 카드를 모두 준비하자. 흥에 겨워 과소비하지 않도록 한도를 정해두는 것이 현명한 방법이다.`,
  (v, s, r) => ` 처음 ${s}${P(s,'을를')} 방문한다면, 주중보다는 주말을, 너무 이른 시간보다는 피크 타임을 추천한다. 이곳의 진가는 에너지가 최고조에 달할 때 드러나기 때문이다. 단, 주말은 대기가 있을 수 있으니 일찍 도착하는 것도 방법이다.`,
  (v, s, r) => ` ${r}에서 ${s}까지의 이동은 택시나 대중교통을 추천한다. 음주 후 운전은 절대 금물이며, 대리운전 서비스를 적극 활용하자. 인근 숙소를 예약해두면 더 여유 있게 밤을 즐길 수 있다.`,
  (v, s, r) => ` ${s}의 매너 코드는 간단하다. 다른 손님에게 먼저 말을 걸 때는 정중하게, 거절당했을 때는 깔끔하게. 소지품은 항상 가까이 두고, 방치된 음료는 마시지 않는다. 이 기본만 지키면 안전하고 즐거운 밤이 보장된다.`,
];

venues.forEach((v, idx) => {
  const s = sn(v);
  const r = v.region;
  const h = hash(v.name_display + idx);

  // Expand atmosphere
  if (v.bodySections?.atmosphere) {
    const exp = pick(atmosExpand, h + idx * 13)(v, s, r);
    v.bodySections.atmosphere += exp;
  }

  // Expand two story scenes (different for each venue)
  const sceneKeys = ['scene2', 'scene3', 'scene4', 'scene5'];
  const expandScene1 = pick(sceneKeys, h + idx * 5);
  const expandScene2 = pick(sceneKeys, h + idx * 17);

  if (v.story?.[expandScene1]) {
    const exp = pick(storyExpand, h + idx * 19)(v, s, r);
    v.story[expandScene1] += exp;
  }
  if (v.story?.[expandScene2] && expandScene2 !== expandScene1) {
    const exp = pick(storyExpand, h + idx * 23)(v, s, r);
    v.story[expandScene2] += exp;
  }

  // Expand music
  if (v.bodySections?.music) {
    const exp = pick(musicExpand, h + idx * 29)(v, s, r);
    v.bodySections.music += exp;
  }

  // Expand safety
  if (v.bodySections?.safety) {
    const exp = pick(safetyExpand, h + idx * 31)(v, s, r);
    v.bodySections.safety += exp;
  }
});

// ============== PART 5: VENUE NAME AT VARIED POSITIONS ==============
// Insert name_display naturally at different positions per venue
// Each venue gets a different "profile" of where names appear

const nameInsertions = {
  hookStart: (text, name) => `${name}. ${text}`,
  hookMid: (text, name) => {
    const sents = text.split('. ');
    if (sents.length >= 4) {
      const mid = Math.floor(sents.length / 2);
      sents[mid] = `${name}${P(name, '은는')} ${sents[mid]}`;
      return sents.join('. ');
    }
    return text;
  },
  hookEnd: (text, name) => `${text} ${name}의 밤은 특별하다.`,
  atmosMid: (text, name) => {
    const sents = text.split('. ');
    if (sents.length >= 3) {
      const pos = Math.floor(sents.length * 0.3);
      sents[pos] = `${name}${P(name,'이가')} 보여주는 ${sents[pos]}`;
      return sents.join('. ');
    }
    return text;
  },
  atmosEnd: (text, name) => `${text} 이것이 ${name}의 본질이다.`,
  scene1Start: (text, name) => `${name}의 입구에 서면, ${text}`,
  scene3End: (text, name) => `${text} ${name}에서의 이 순간이 하이라이트다.`,
  musicStart: (text, name) => `${name}에서 음악은 핵심이다. ${text}`,
  safetyEnd: (text, name) => `${text} ${name}에서의 안전한 밤을 위해 기억하자.`,
  faqInsert: (v, name) => {
    if (v.faq && v.faq.length > 2) {
      const pos = Math.floor(v.faq.length / 2);
      v.faq[pos].a = `${name}에서는 ` + v.faq[pos].a.charAt(0).toLowerCase() + v.faq[pos].a.slice(1);
    }
  },
};

// Create different profiles
const profiles = [
  ['hookStart', 'atmosEnd', 'scene3End', 'safetyEnd'],
  ['hookMid', 'atmosMid', 'scene1Start', 'musicStart'],
  ['hookEnd', 'atmosMid', 'scene3End', 'safetyEnd'],
  ['hookStart', 'atmosEnd', 'musicStart', 'faqInsert'],
  ['hookMid', 'atmosEnd', 'scene1Start', 'safetyEnd'],
  ['hookEnd', 'atmosMid', 'musicStart', 'scene3End'],
  ['hookStart', 'atmosMid', 'safetyEnd', 'faqInsert'],
  ['hookMid', 'atmosEnd', 'scene1Start', 'faqInsert'],
  ['hookEnd', 'scene1Start', 'musicStart', 'safetyEnd'],
  ['hookStart', 'scene3End', 'musicStart', 'atmosMid'],
  ['hookMid', 'scene3End', 'atmosEnd', 'faqInsert'],
  ['hookEnd', 'atmosEnd', 'scene1Start', 'faqInsert'],
  ['hookStart', 'musicStart', 'scene3End', 'faqInsert'],
];

venues.forEach((v, idx) => {
  const name = v.name_display;
  const h = hash(name);
  const profile = profiles[(h + idx) % profiles.length];

  profile.forEach(action => {
    if (action === 'hookStart' && v.hookIntro) v.hookIntro = nameInsertions.hookStart(v.hookIntro, name);
    else if (action === 'hookMid' && v.hookIntro) v.hookIntro = nameInsertions.hookMid(v.hookIntro, name);
    else if (action === 'hookEnd' && v.hookIntro) v.hookIntro = nameInsertions.hookEnd(v.hookIntro, name);
    else if (action === 'atmosMid' && v.bodySections?.atmosphere) v.bodySections.atmosphere = nameInsertions.atmosMid(v.bodySections.atmosphere, name);
    else if (action === 'atmosEnd' && v.bodySections?.atmosphere) v.bodySections.atmosphere = nameInsertions.atmosEnd(v.bodySections.atmosphere, name);
    else if (action === 'scene1Start' && v.story?.scene1) v.story.scene1 = nameInsertions.scene1Start(v.story.scene1, name);
    else if (action === 'scene3End' && v.story?.scene3) v.story.scene3 = nameInsertions.scene3End(v.story.scene3, name);
    else if (action === 'musicStart' && v.bodySections?.music) v.bodySections.music = nameInsertions.musicStart(v.bodySections.music, name);
    else if (action === 'safetyEnd' && v.bodySections?.safety) v.bodySections.safety = nameInsertions.safetyEnd(v.bodySections.safety, name);
    else if (action === 'faqInsert') nameInsertions.faqInsert(v, name);
  });
});

// ============== SAVE ==============
fs.writeFileSync('/home/user/week1/data/venues.json', JSON.stringify(venues, null, 2));
console.log('Done! Updated ' + venues.length + ' venues');

// ============== VERIFY ==============
let hookShort = 0, bodyShort = 0;
venues.forEach(v => {
  const hookLen = (v.hookIntro || '').length;
  if (hookLen < 300) hookShort++;

  const bodyLen = (v.bodySections?.atmosphere || '').length +
    (v.story?.scene1 || '').length + (v.story?.scene2 || '').length +
    (v.story?.scene3 || '').length + (v.story?.scene4 || '').length +
    (v.story?.scene5 || '').length + (v.story?.scene6 || '').length +
    (v.story?.scene7 || '').length + (v.story?.scene8 || '').length +
    (v.bodySections?.music || '').length + (v.bodySections?.safety || '').length +
    (v.faq || []).reduce((s, f) => s + f.q.length + f.a.length, 0) +
    (v.timeline || []).reduce((s, t) => s + t.label.length + t.desc.length, 0) +
    (v.checklist || []).reduce((s, c) => s + c.length, 0);
  if (bodyLen < 3000) bodyShort++;
});

console.log(`hookIntro < 300 chars: ${hookShort}/130`);
console.log(`body < 3000 chars: ${bodyShort}/130`);

// Check title uniqueness
const titles = venues.map(v => v.pageTitle);
const uniqueTitles = new Set(titles);
console.log(`Unique titles: ${uniqueTitles.size}/130`);

// Sample
const sample = venues[0];
console.log(`\nSample title: ${sample.pageTitle}`);
console.log(`Sample hookIntro length: ${sample.hookIntro.length} chars`);
