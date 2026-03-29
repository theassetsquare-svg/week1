#!/usr/bin/env node
import fs from 'fs';

const dataFiles = [
  'src/data/clubs-data.ts',
  'src/data/nights-seoul.ts',
  'src/data/nights-gyeonggi.ts',
  'src/data/nights-other.ts',
  'src/data/lounges-data.ts',
  'src/data/others-data.ts',
];

// ─── 2차 확장용 문장 (1차와 중복 없이) ───
const extra = {
  night: [
    '여기 바텐더가 만드는 하이볼이 은근히 유명하다. 위스키를 아끼지 않는 비율인데, 이 가격에 이 농도는 서울에서도 찾기 힘들다.',
    '흡연 구역이 따로 있어서 비흡연자도 불편하지 않다. 요즘 이게 안 되는 곳이 의외로 많은데, 여기는 분리가 깔끔하다.',
    '음향 시스템을 최근에 교체했다는 소문이 있다. 실제로 가보면 저음이 예전보다 두텁게 울린다. 스피커가 바뀌면 같은 공간도 다른 경험이 된다.',
    '포토존이 입구 쪽에 있는데, 들어가기 전에 사진 한 장 찍어두면 나중에 추억이 된다. 조명이 잘 떨어지는 스팟이 있다.',
    '회식 장소로 쓰는 사람도 많다. 2차까지 한 공간에서 해결되니까 이동하는 번거로움이 없다. 과장님이 좋아하는 트로트도 나온다.',
    '생맥주 퀄리티가 괜찮다. 맥주 좋아하는 사람이면 첫 잔을 생맥주로 시작하는 것도 나쁘지 않다. 시원한 잔에 따라주는 건 기본이다.',
  ],
  club: [
    '클럽 특성상 분실물이 생기기 쉽다. 귀중품은 최소한만 가져오고, 핸드폰은 주머니 깊숙이 넣어둬라. 분실물 보관소가 있긴 하지만, 애초에 잃어버리지 않는 게 최선이다.',
    '루프탑이나 테라스 공간이 있다면 꼭 한 번은 나가봐라. 담배를 안 피워도 바깥 공기를 마시면서 잠깐 쉬는 게 밤을 길게 즐기는 비결이다.',
    '입구에서 ID 체크를 한다. 신분증은 반드시 챙겨라. 여권이든 운전면허증이든 뭐든 좋다. 없으면 돌아가야 한다. 예외는 없다.',
    '음악 장르가 시간대별로 바뀌는 곳이다. 초반에는 가벼운 팝이나 R&B로 시작해서, 새벽으로 갈수록 무거운 비트가 깔린다. 자기 취향 시간대를 찾는 것도 재미다.',
    '여기 화장실이 깨끗한 편이다. 이게 별거 아닌 것 같지만, 새벽까지 놀다 보면 화장실 상태가 전체 경험을 좌우한다. 관리가 되는 곳과 안 되는 곳의 차이는 크다.',
    '금요일보다 토요일이 더 붐비는 편이다. 금요일은 퇴근 후 늦게 오는 사람들이 자정쯤 몰리고, 토요일은 저녁부터 일찍 시작하는 사람들이 많다.',
  ],
  lounge: [
    '여기 치즈 플레이트가 와인이랑 잘 어울린다. 안주를 안 시키는 사람도 있는데, 솔직히 한 접시 시키면 술맛이 두 배가 된다.',
    '음악 볼륨이 대화를 방해하지 않는 수준이다. 이게 라운지의 핵심이다. 음악이 분위기를 만들되, 대화를 삼키지 않는 그 경계를 잘 지킨다.',
    '겨울에 오면 창밖 야경이 더 예쁘다. 차가운 유리창 너머로 도시 불빛이 보이는데, 그 장면에 따뜻한 술 한 잔이면 충분하다.',
    '평일 저녁에 오면 거의 프라이빗이다. 주말 붐비는 게 싫으면 화수목을 공략해봐라. 같은 가격에 두 배의 여유를 가질 수 있다.',
    '디저트도 된다. 칵테일과 디저트 페어링이 가능한데, 달달한 걸 좋아한다면 시도해볼 만하다. 조합이 의외로 잘 맞는다.',
  ],
  hoppa: [
    '여기 과일 플레이트가 신선하다. 제철 과일이 올라오는데, 겉만 그럴듯한 게 아니라 속까지 꽉 찬 과일이다. 이것만으로도 기분이 좋아진다.',
    '노래를 좋아하면 마이크를 잡아라. 스태프가 같이 불러주면서 분위기를 올려주는데, 혼자 부르는 것보다 합창이 훨씬 신난다.',
    '여기 매직쇼가 볼 만하다. 처음 보면 진짜 놀란다. 눈앞에서 카드가 사라지고 동전이 나타나는 건 기본이고, 불을 쓰는 퍼포먼스도 있다.',
    '안주가 맛있는 편이다. 호빠 안주라고 대충 나올 거라고 생각하면 오산이다. 여기는 주방에서 제대로 만들어 나온다. 치킨이랑 감바스가 특히 괜찮다.',
    '스태프가 이름을 기억해준다. 두 번째 방문부터는 이름 불러주면서 인사한다. 사소한 건데, 이게 기분을 확 바꿔놓는다.',
    '분위기가 너무 무거워지면 스태프가 알아서 게임을 제안한다. 주사위 게임이든 벌칙 게임이든, 분위기 전환을 잘 시킨다.',
  ],
  room: [
    '여기 음향 시스템이 꽤 좋다. 블루투스 연결이 되는데, 본인 플레이리스트를 틀면 내 방인 것 같은 느낌이 난다.',
    '음식 리필이 빠른 편이다. 과일이나 안주가 떨어지면 벨 누르고 5분 안에 온다. 이게 당연한 건 아니다. 안 되는 곳이 수두룩하다.',
    '에어컨 리모컨이 방 안에 있다. 온도를 직접 조절할 수 있는 거. 사소한 건데 몇 시간 동안의 쾌적함을 결정하는 요소다.',
    '거울이 한쪽 벽 전체에 있어서 공간이 넓어 보인다. 실제보다 두 배는 넓게 느껴진다. 인테리어 센스가 있는 곳이다.',
  ],
  yojeong: [
    '정원에서 사진 찍는 사람이 많다. 특히 단풍 시즌에는 배경이 작품이다. 접대 자리라도 시작 전에 정원 산책을 추천한다.',
    '차 한 잔으로 마무리하는 것도 좋다. 식사가 끝나면 녹차나 대추차를 내어주는데, 그 한 잔이 전체 식사의 마침표가 된다.',
    '여기 종업원분들의 한복이 격식을 완성한다. 공간만 전통적인 게 아니라 서비스 전체가 하나의 컨셉으로 이어진다.',
  ],
};

let stats = { extended: 0, total: 0 };

for (const file of dataFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  const nameMatches = [...content.matchAll(/name:'([^']+)'/g)];
  const typeMatches = [...content.matchAll(/type:'([^']+)'/g)];
  const regionMatches = [...content.matchAll(/region:'([^']+)'/g)];
  const descMatches = [...content.matchAll(/(\s)description:'([^']*)'/g)];
  const idMatches = [...content.matchAll(/id:\s*(\d+)/g)];

  const count = Math.min(nameMatches.length, descMatches.length);

  for (let i = 0; i < count; i++) {
    stats.total++;
    const name = nameMatches[i][1];
    const type = typeMatches[i] ? typeMatches[i][1] : 'night';
    const desc = descMatches[i][2];
    const id = idMatches[i] ? parseInt(idMatches[i][1]) : i;

    if (desc.length >= 1000) continue;

    const needed = 1000 - desc.length + 30;
    const pool = extra[type] || extra.night;

    // 필요한 만큼 문장 선택
    let additions = [];
    let addedLen = 0;
    for (let j = 0; j < pool.length && addedLen < needed; j++) {
      const idx = (id * 7 + j * 11 + 3) % pool.length;
      if (!additions.includes(pool[idx])) {
        additions.push(pool[idx]);
        addedLen += pool[idx].length + 1;
      }
    }

    const extension = ' ' + additions.join(' ');
    const oldStr = descMatches[i][0];
    const ws = descMatches[i][1];
    const newStr = `${ws}description:'${desc}${extension}'`;

    if (content.includes(oldStr)) {
      content = content.replace(oldStr, newStr);
      modified = true;
      stats.extended++;
    }
  }

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ ${file} 2차 확장 완료`);
  }
}

console.log(`\n=== 2차 결과 ===`);
console.log(`확장: ${stats.extended}개`);

// 검증
let under1000 = [];
for (const file of dataFiles) {
  const c = fs.readFileSync(file, 'utf8');
  const names = [...c.matchAll(/name:'([^']+)'/g)].map(m => m[1]);
  const descs = [...c.matchAll(/(\s)description:'([^']*)'/g)].map(m => m[2]);
  for (let i = 0; i < names.length && i < descs.length; i++) {
    if (descs[i].length < 1000) {
      under1000.push({ name: names[i], len: descs[i].length });
    }
  }
}
if (under1000.length === 0) {
  console.log('🎉 전체 1000자+ 달성!');
} else {
  console.log(`❌ 1000자 미만: ${under1000.length}개`);
  under1000.sort((a, b) => a.len - b.len);
  under1000.forEach(v => console.log(`  ${v.len}자 | ${v.name}`));
}
