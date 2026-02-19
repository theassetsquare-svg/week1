const fs = require('fs');
const venues = JSON.parse(fs.readFileSync('/home/user/week1/data/venues.json', 'utf8'));

venues.forEach(v => {
  // 가게이름 = name_display에서 공백 제거 (예: "수유 샴푸 나이트" → "수유샴푸나이트")
  const shopName = v.name_display.replace(/\s+/g, '');

  // 기존 pageTitle에서 가게이름 부분 제거 (이미 있으면 중복 방지)
  let clickPart = v.pageTitle || '';

  // 제목 = "가게이름 클릭유도제목"
  v.pageTitle = `${shopName} ${clickPart}`;
});

fs.writeFileSync('/home/user/week1/data/venues.json', JSON.stringify(venues, null, 2));

// 검증
console.log('=== 제목 샘플 (타입별) ===');
const night = venues.filter(v => v.type === 'night').slice(0, 5);
const club = venues.filter(v => v.type === 'club').slice(0, 5);
const lounge = venues.filter(v => v.type === 'lounge').slice(0, 5);

console.log('\n나이트:');
night.forEach(v => console.log(`  ${v.pageTitle}`));
console.log('\n클럽:');
club.forEach(v => console.log(`  ${v.pageTitle}`));
console.log('\n라운지:');
lounge.forEach(v => console.log(`  ${v.pageTitle}`));

// 전체 가게이름 포함 확인
let missing = 0;
venues.forEach(v => {
  const shopName = v.name_display.replace(/\s+/g, '');
  if (!v.pageTitle.startsWith(shopName)) {
    console.log(`  MISSING: ${v.pageTitle}`);
    missing++;
  }
});
console.log(`\n가게이름 누락: ${missing}/130`);
