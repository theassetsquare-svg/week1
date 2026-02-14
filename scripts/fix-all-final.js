#!/usr/bin/env node
/**
 * 최종 수정: 화면 중복 지역명 완전 제거 + twitter meta 교체 + Geo SEO 최적화
 */
const fs = require('fs');
const path = require('path');

const venues = [
  {dir:'arju-lounge',city:'서울',region:'서울',name:'아르쥬라운지',lat:37.5270,lng:127.0390},
  {dir:'busan-asiad',city:'부산',region:'부산',name:'부산아시아드나이트',lat:35.0516,lng:129.0790},
  {dir:'busan-mul',city:'부산',region:'부산',name:'부산물나이트',lat:35.1812,lng:129.0780},
  {dir:'cheonan-stardom',city:'천안',region:'충남',name:'천안스타돔나이트',lat:36.8198,lng:127.1560},
  {dir:'cheongdam-h2o',city:'서울',region:'서울',name:'청담H2O나이트',lat:37.5247,lng:127.0470},
  {dir:'color-lounge',city:'서울',region:'서울',name:'컬러라운지',lat:37.5270,lng:127.0390},
  {dir:'daegu-babamba',city:'대구',region:'대구',name:'대구바밤바나이트',lat:35.8580,lng:128.5630},
  {dir:'doksan-kookbingwan',city:'서울',region:'서울',name:'독산동국빈관나이트',lat:37.4675,lng:126.8962},
  {dir:'gangnam-race',city:'서울',region:'서울',name:'강남레이스클럽',lat:37.5165,lng:127.0196},
  {dir:'gangnam-sound',city:'서울',region:'서울',name:'강남사운드클럽',lat:37.5170,lng:127.0230},
  {dir:'gangseo-hobak',city:'서울',region:'서울',name:'강서호박나이트',lat:37.5410,lng:126.8390},
  {dir:'gildong-chance',city:'서울',region:'서울',name:'길동찬스나이트',lat:37.5350,lng:127.1400},
  {dir:'hype-lounge',city:'서울',region:'서울',name:'하입라운지',lat:37.5270,lng:127.0390},
  {dir:'ilsan-shampoo',city:'고양',region:'경기',name:'일산샴푸나이트',lat:37.6533,lng:126.7716},
  {dir:'incheon-arabian',city:'인천',region:'인천',name:'인천아라비안나이트',lat:37.5379,lng:126.7312},
  {dir:'intro-lounge',city:'서울',region:'서울',name:'인트로라운지',lat:37.5270,lng:127.0390},
  {dir:'itaewon-waikiki',city:'서울',region:'서울',name:'이태원와이키키유토피아클럽',lat:37.5345,lng:126.9950},
  {dir:'nowon-hobak',city:'서울',region:'서울',name:'노원호박나이트',lat:37.6552,lng:127.0612},
  {dir:'nowon-star',city:'서울',region:'서울',name:'노원스타나이트',lat:37.6552,lng:127.0612},
  {dir:'paju-skydome',city:'파주',region:'경기',name:'파주야당스카이돔나이트',lat:37.7136,lng:126.7615},
  {dir:'sangbong-hankookgwan',city:'서울',region:'서울',name:'상봉동한국관나이트',lat:37.5966,lng:127.0855},
  {dir:'seongnam-shampoo',city:'성남',region:'경기',name:'성남샴푸나이트',lat:37.4380,lng:127.1380},
  {dir:'sinlim-grandprix',city:'서울',region:'서울',name:'신림그랑프리나이트',lat:37.4842,lng:126.9293},
  {dir:'suwon-chance-dome',city:'수원',region:'경기',name:'수원찬스돔나이트',lat:37.2576,lng:127.0286},
  {dir:'suwon-korea',city:'수원',region:'경기',name:'수원코리아나이트',lat:37.2636,lng:127.0286},
  {dir:'suyu-shampoo',city:'서울',region:'서울',name:'수유샴푸나이트',lat:37.6380,lng:127.0250},
  {dir:'ulsan-champion',city:'울산',region:'울산',name:'울산챔피언나이트',lat:35.5406,lng:129.3438},
];

// 고유 Title/Description (이전 SEO 작업에서 생성한 것 재사용)
const seoData = {
  "arju-lounge": { title: "아르쥬라운지 | 압구정 감성 라운지의 새로운 기준", desc: "아르쥬라운지는 서울 압구정로데오에 자리 잡은 프라이빗 감성 공간입니다. 고급 인테리어와 양주·칵테일 셀렉션이 돋보이며, 아르쥬라운지만의 절제된 무드가 특별한 밤을 선사합니다. 스마트캐주얼 드레스코드, 금·토 21시 오픈." },
  "busan-asiad": { title: "부산아시아드나이트 | 농심호텔 지하 대규모 부킹 명소", desc: "동래구 온천장 농심호텔 B1~B2에 걸친 부산아시아드나이트. 부산 최대급 플로어와 전문 웨이터 부킹 시스템으로 부산아시아드나이트는 부산 밤문화의 랜드마크로 자리매김했습니다. 주차 완비, 금·토 영업." },
  "busan-mul": { title: "부산물나이트 | 연산동 목화예시장 6~7층, 물 좋기로 소문난 곳", desc: "부산 연제구 목화예시장 6~7층, 부산물나이트는 두 개 층을 활용한 넉넉한 공간이 강점입니다. 트로트와 발라드가 흐르는 플로어에서 부산물나이트 특유의 활기찬 분위기를 직접 느껴보세요. 주차 가능." },
  "cheonan-stardom": { title: "천안스타돔나이트 | 충남 천안 No.1 나이트클럽 실전 리뷰", desc: "충남 천안시 서북구 성정공원1길, 천안스타돔나이트는 넓은 홀과 다양한 룸을 갖춘 천안 유일의 대형 나이트클럽입니다. EDM부터 트로트까지 폭넓은 선곡, 천안스타돔나이트 방문 전 필수 체크리스트를 확인하세요." },
  "cheongdam-h2o": { title: "청담H2O나이트 | 리베라호텔 지하 예약제 프리미엄 클럽", desc: "강남 청담동 리베라호텔 B1, 청담H2O나이트는 완전 예약제로 운영되는 고급 클러빙 공간입니다. 20~30대 직장인 중심의 세련된 문화, 엄격한 드레스코드. 청담H2O나이트 룸·부스 사전 예약 필수." },
  "color-lounge": { title: "컬러라운지 | 압구정로데오 트렌디 라운지 현장 탐방", desc: "압구정로데오 핵심 상권에 위치한 컬러라운지. 컬러풀한 인테리어가 시선을 사로잡으며, 합리적인 주대와 게스트 무료입장 이벤트로 컬러라운지는 2030 사이에서 빠르게 입소문을 타고 있습니다." },
  "daegu-babamba": { title: "대구바밤바나이트 | 달서구 달구벌대로 대구 대표 부킹 나이트", desc: "대구 달서구 달구벌대로 지하 1층, 대구바밤바나이트는 대구에서 가장 활발한 부킹 문화를 자랑합니다. 전문 웨이터 상주, 넓은 플로어에서 즐기는 EDM과 트로트. 대구바밤바나이트 주차 완비." },
  "doksan-kookbingwan": { title: "독산동국빈관나이트 | 금천구 전통 소셜댄스 명소 탐방기", desc: "서울 금천구 범안로 협진빌딩 4층에 자리한 독산동국빈관나이트. 오랜 역사와 단골 문화가 살아 있는 이곳에서 트로트·발라드 라이브와 소셜댄스를 즐겨보세요. 독산동국빈관나이트는 초보자도 환영합니다." },
  "gangnam-race": { title: "강남레이스클럽 | 신사역 대형 프리미엄 클럽 핵심 정보", desc: "신사역 4번출구 앞, 강남레이스클럽은 일렉존과 힙합존이 공존하는 강남 대표 메가클럽입니다. 국내외 유명 DJ 매주 출연, 목~일 오픈. 강남레이스클럽 부스·테이블 예약 가이드와 입장 팁을 정리했습니다." },
  "gangnam-sound": { title: "강남사운드클럽 | 도산대로 최신식 음향의 클럽씬 중심지", desc: "강남 도산대로 B1에 위치한 강남사운드클럽. 레이스클럽과 동일 운영진이 이끄는 이곳은 최첨단 음향 시스템과 세련된 공간 설계가 돋보입니다. 강남사운드클럽에서 매주 펼쳐지는 DJ 라인업을 확인하세요." },
  "gangseo-hobak": { title: "강서호박나이트 | 까치산역 칼튼호텔 B1 나이트클럽 현장", desc: "서울 강서구 화곡동 칼튼호텔 지하 1층, 강서호박나이트는 까치산역에서 도보 접근 가능한 편리한 입지를 갖추고 있습니다. 넓은 홀과 부스 완비. 강서호박나이트 방문 시 주차도 가능합니다." },
  "gildong-chance": { title: "길동찬스나이트 | 강동구 천호대로 프라이빗 부스·룸 완비", desc: "서울 강동구 천호대로 1135 지하 1층에 위치한 길동찬스나이트. 부스와 룸을 갖춘 프라이빗한 공간 구성이 특징이며, 길동찬스나이트만의 아늑한 분위기 속에서 소셜댄스와 트로트를 만끽할 수 있습니다." },
  "hype-lounge": { title: "하입라운지 | 압구정 핫플 감성 라운지 솔직 후기", desc: "압구정로데오 인근 하입라운지는 세련된 인테리어와 프리미엄 칵테일로 주목받는 공간입니다. 게스트 무료입장 가능, 사전 예약 시 혜택 제공. 하입라운지의 고급스러운 밤을 경험해 보세요." },
  "ilsan-shampoo": { title: "일산샴푸나이트 | 마두역 초대형 50룸·80테이블 올인원 클럽", desc: "고양시 마두역 8번출구 9층, 일산샴푸나이트는 50~60개 룸과 80여 개 테이블을 갖춘 경기 북부 최대 규모 나이트클럽입니다. 20~50대 폭넓은 연령층, 매주 테마 파티 진행. 일산샴푸나이트 주차·예약 안내." },
  "incheon-arabian": { title: "인천아라비안나이트 | 계양구 4개 층 인천 최대 규모 클럽", desc: "인천 계양구 맘모스빌딩 4~7층을 사용하는 인천아라비안나이트. 수십 개 BOX룸, VIP룸, 유리부스까지 갖춘 인천 최대 나이트클럽입니다. 여성 무료입장 이벤트 수시 진행, 인천아라비안나이트 예약 필수." },
  "intro-lounge": { title: "인트로라운지 | 신사동 지하 전설의 힙합 라운지 심층 분석", desc: "압구정로데오역 5번출구, 신사동 지하 1층의 인트로라운지는 힙합 음악 중심의 감성적 공간입니다. 4~6인 룸형 부스와 2인 테이블 등 다양한 좌석 구성. 인트로라운지 게스트 입장 및 드레스코드 안내." },
  "itaewon-waikiki": { title: "이태원와이키키유토피아클럽 | 이태원 글로벌 파티 문화의 중심", desc: "이태원로 173-7 지하 1층, 이태원와이키키유토피아클럽은 외국인과 한국인이 함께 즐기는 글로벌 파티 스팟입니다. 금·토·일 21시~08시 운영. 이태원와이키키유토피아클럽에서 다국적 음악과 에너지를 느껴보세요." },
  "nowon-hobak": { title: "노원호박나이트 | 상계동 여성 무료입장 대형 나이트클럽", desc: "서울 노원구 동방빌딩 B1~B2, 노원호박나이트는 여성 무료입장과 풍성한 주류 셋팅으로 인기가 높습니다. 룸·부스·테이블 완비, 단체 예약 시 특별 혜택. 노원호박나이트 피크타임 및 방문 팁 총정리." },
  "nowon-star": { title: "노원스타나이트 | 노원역 인근 부킹 전문 나이트 가이드", desc: "서울 노원구 노원역 인근에 위치한 노원스타나이트. 전문 웨이터의 부킹 서비스가 돋보이며, 편리한 교통 접근성이 장점입니다. 노원스타나이트 영업시간·드레스코드·방문 전 알아야 할 사항을 안내합니다." },
  "paju-skydome": { title: "파주야당스카이돔나이트 | 매일 영업 입장료 1만원 대형 돔 나이트", desc: "파주시 야당동 유은7차, 파주야당스카이돔나이트는 매일 21시부터 영업하며 입장료 1만원의 합리적 가격이 매력입니다. 스카이돔 구조의 넓은 홀과 분리된 라운지. 파주야당스카이돔나이트 주차·네비 검색 팁 안내." },
  "sangbong-hankookgwan": { title: "상봉동한국관나이트 | 상봉역 도보 3분 룸·부스 예약 안내", desc: "서울 중랑구 상봉역 2번출구 도보 3분, 상봉동한국관나이트는 테이블 5만원부터 이용 가능한 합리적 가격대를 제공합니다. 공휴일 전날 조기 마감 주의. 상봉동한국관나이트 룸 예약과 웨이터 안내." },
  "seongnam-shampoo": { title: "성남샴푸나이트 | 모란역 접근성 좋은 경기 남부 인기 나이트", desc: "경기도 성남시 중원구 모란역 인근의 성남샴푸나이트. 대중교통 접근성이 뛰어나고 합리적인 가격대로 즐길 수 있어 꾸준히 사랑받고 있습니다. 성남샴푸나이트 주차 가능, 금·토 영업." },
  "sinlim-grandprix": { title: "신림그랑프리나이트 | 신림역 평일·주말 매일 오픈 대형 클럽", desc: "관악구 신림로, 신림그랑프리나이트는 평일 18시부터 문을 여는 몇 안 되는 대형 클럽입니다. 50~60개 룸과 부스 보유, EDM·힙합·팝 선곡. 신림그랑프리나이트 인스타 팔로우 시 이벤트 혜택 확인." },
  "suwon-chance-dome": { title: "수원찬스돔나이트 | 권선동 VIP룸 완비 연중무휴 나이트클럽", desc: "수원시 권선구 권선로, 수원찬스돔나이트는 20~40대 폭넓은 연령층이 찾는 대형 나이트클럽입니다. 화려한 인테리어, VIP룸, 대형 플로어 완비. 수원찬스돔나이트 여성 고객 12시 전 입장 이벤트 진행." },
  "suwon-korea": { title: "수원코리아나이트 | 인계동 지하 소셜댄스 명소 상세 가이드", desc: "수원시 팔달구 인계동 지하 1층에 위치한 수원코리아나이트. 트로트와 발라드 중심의 소셜댄스 문화가 꾸준히 이어지고 있으며, 수원코리아나이트는 초보 방문객도 부담 없이 즐길 수 있는 분위기입니다." },
  "suyu-shampoo": { title: "수유샴푸나이트 | 수유역 부킹 맛집 룸·부스 가격 총정리", desc: "서울 강북구 수유역 인근 수유샴푸나이트는 부킹 잘 되기로 유명한 인기 나이트클럽입니다. 룸 평일 29만원부터, 단체 모임에도 적합. 수유샴푸나이트 전문 웨이터 상주, 금·토 영업." },
  "ulsan-champion": { title: "울산챔피언나이트 | 삼산동 DJ 공연과 부킹이 공존하는 울산 대표", desc: "울산 남구 삼산동 정동로 75 1층, 울산챔피언나이트는 국내외 유명 DJ 초청 이벤트와 전문 부킹 시스템을 함께 운영합니다. 주차 가능, 인스타 팔로우 시 혜택. 울산챔피언나이트 방문 전 영업일 확인 필수." },
};

const clubDir = path.join(__dirname, '..', 'club');
let totalFixed = 0;

for (const v of venues) {
  const htmlPath = path.join(clubDir, v.dir, 'index.html');
  if (!fs.existsSync(htmlPath)) continue;
  let html = fs.readFileSync(htmlPath, 'utf8');
  let fixes = 0;
  const c = v.city;
  const n = v.name;
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // ─── FIX 1: 화면 헤딩 span 분리 패턴 ───
  // <span class="gradient-text">부산</span> <span class="text-white">부산아시아드나이트</span>
  // → <span class="gradient-text">부산아시아드나이트</span>
  const headingOld = `gradient-text">${c}</span> <span class="text-white">${n}</span>`;
  const headingNew = `gradient-text">${n}</span>`;
  while (html.includes(headingOld)) {
    html = html.split(headingOld).join(headingNew);
    fixes++;
  }

  // ─── FIX 2: RSC JSON "city · city" (city===region) ───
  if (c === v.region) {
    // \"children\":[\"부산\",\" · \",\"부산\"]
    const rsc1 = `\\"children\\":[\\"${c}\\",\\" · \\",\\"${c}\\"]`;
    const rsc1fix = `\\"children\\":\\"${c}\\"`;
    while (html.includes(rsc1)) { html = html.split(rsc1).join(rsc1fix); fixes++; }

    // deeper escaped version
    const rsc1d = `\\\\\\"children\\\\\\":\[\\\\\\"${c}\\\\\\",\\\\\\" · \\\\\\",\\\\\\"${c}\\\\\\"\]`;
    // simpler approach: just find/replace the literal text
    const lit1 = `\\"${c}\\",\\" · \\",\\"${c}\\"`;
    while (html.includes(lit1)) { html = html.split(lit1).join(`\\"${c}\\"`); fixes++; }
  }

  // ─── FIX 3: RSC JSON "city nameKo" ───
  // \"children\":[\"부산\",\" \",\"부산아시아드나이트\"]
  const rsc2 = `\\"${c}\\",\\" \\",\\"${n}\\"`;
  const rsc2fix = `\\"${n}\\"`;
  while (html.includes(rsc2)) { html = html.split(rsc2).join(rsc2fix); fixes++; }

  // ─── FIX 4: RSC JSON "city nameKo" children array variant ───
  // "children":["부산"," ","부산아시아드나이트"]
  const rsc3 = `"${c}"," ","${n}"`;
  while (html.includes(rsc3)) { html = html.split(rsc3).join(`"${n}"`); fixes++; }

  // ─── FIX 5: RSC JSON city·city without array brackets ───
  if (c === v.region) {
    const rsc4 = `"${c}"," · ","${c}"`;
    while (html.includes(rsc4)) { html = html.split(rsc4).join(`"${c}"`); fixes++; }
  }

  // ─── FIX 6: twitter:title 교체 ───
  const seo = seoData[v.dir];
  if (seo) {
    html = html.replace(
      /(<meta\s+name="twitter:title"\s+content=")[^"]*(")/,
      `$1${seo.title}$2`
    );
    // twitter:description 교체
    html = html.replace(
      /(<meta\s+name="twitter:description"\s+content=")[^"]*(")/,
      `$1${seo.desc}$2`
    );
  }

  // ─── FIX 7: Geo SEO - JSON-LD에 GeoCoordinates 추가 ───
  // hasMap 추가 (이미 geo 있으면 스킵)
  if (!html.includes('"geo"') && html.includes('"@type":"NightClub"')) {
    const geoSnippet = `,"geo":{"@type":"GeoCoordinates","latitude":${v.lat},"longitude":${v.lng}},"hasMap":"https://map.naver.com/v5/search/${encodeURIComponent(n)}"`;
    html = html.replace(
      '"@type":"NightClub"',
      `"@type":"NightClub"${geoSnippet}`
    );
    fixes++;
  }

  // ─── FIX 8: 나머지 일반 텍스트 city+nameKo ───
  const plain = `${c} ${n}`;
  const plainCount = html.split(plain).length - 1;
  if (plainCount > 0) { html = html.split(plain).join(n); fixes += plainCount; }

  // ─── FIX 9: React comment 패턴 잔여 ───
  const react1 = `${c}<!-- -->${n}`;
  if (html.includes(react1)) { html = html.split(react1).join(n); fixes++; }
  const react2 = `${c}<!-- --> <!-- -->${n}`;
  if (html.includes(react2)) { html = html.split(react2).join(n); fixes++; }

  if (fixes > 0) {
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log(`[FIXED] ${v.dir}: ${fixes} fixes`);
    totalFixed += fixes;
  }
}

// ═══ FINAL VERIFICATION ═══
console.log('\n═══ FINAL VERIFICATION ═══');
let remaining = 0;
for (const v of venues) {
  const html = fs.readFileSync(path.join(clubDir, v.dir, 'index.html'), 'utf8');
  const c = v.city;
  const n = v.name;
  const checks = [
    `${c} ${n}`,
    `${c}<!-- -->${n}`,
    `${c}<!-- --> <!-- -->${n}`,
    `gradient-text">${c}</span> <span class="text-white">${n}`,
  ];
  if (c === v.region) {
    checks.push(`"${c}"," · ","${c}"`);
    checks.push(`${c} · ${c}`);
    checks.push(`${c}<!-- --> · <!-- -->${c}`);
  }
  for (const p of checks) {
    const cnt = html.split(p).length - 1;
    if (cnt > 0) { console.log(`  [X] ${v.dir}: "${p.substring(0,40)}" x${cnt}`); remaining += cnt; }
  }
}
console.log(remaining === 0 ? '  ✓ 27개 전체 중복 완전 제거!' : `  잔여: ${remaining}건`);
console.log(`\nTotal: ${totalFixed} fixes applied`);
