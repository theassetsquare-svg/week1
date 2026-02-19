const fs = require('fs');
const venues = JSON.parse(fs.readFileSync('/home/user/week1/data/venues.json','utf8'));
const hg = venues.find(v => v.name_display.includes('한국관'));

function findInObj(obj, word, path = '') {
  if (!obj) return;
  if (typeof obj === 'string' && obj.includes(word)) {
    console.log(`  ${path}: "${obj.substring(0, 80)}..."`);
  } else if (Array.isArray(obj)) {
    obj.forEach((item, i) => findInObj(item, word, `${path}[${i}]`));
  } else if (typeof obj === 'object') {
    Object.entries(obj).forEach(([k, v]) => findInObj(v, word, `${path}.${k}`));
  }
}

console.log('=== 한국관 in data ===');
findInObj(hg, '한국관');
console.log('\n=== 나이트 in data ===');
findInObj(hg, '나이트');
console.log('\n=== 상봉동 in data ===');
findInObj(hg, '상봉동');
