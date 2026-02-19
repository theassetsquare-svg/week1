const fs = require('fs');
const venues = JSON.parse(fs.readFileSync('/home/user/week1/data/venues.json', 'utf8'));

// Korean particle helper: check if last char has batchim (final consonant)
function hasBatchim(str) {
  const last = str.charAt(str.length - 1);
  const code = last.charCodeAt(0);
  if (code < 0xAC00 || code > 0xD7A3) return false;
  return (code - 0xAC00) % 28 !== 0;
}

function particle(name, type) {
  const b = hasBatchim(name);
  switch (type) {
    case '은는': return b ? '은' : '는';
    case '이가': return b ? '이' : '가';
    case '을를': return b ? '을' : '를';
    case '으로': return b ? '으로' : '로';
    default: return '';
  }
}

// Get the type label in Korean
function typeLabel(type) {
  if (type === 'night') return '나이트';
  if (type === 'club') return '클럽';
  if (type === 'lounge') return '라운지';
  return '';
}

venues.forEach(v => {
  const name = v.name_display; // e.g. "상봉동 한국관 나이트"
  const tl = typeLabel(v.type);

  // 1. hookIntro: insert name 2 times
  if (v.hookIntro) {
    // Prepend first sentence with venue name
    const intro1 = `${name}${particle(name, '은는')} ${v.region}${particle(v.region, '을를')} 대표하는 ${tl}입니다.`;
    // Find midpoint and insert second mention
    const sentences = v.hookIntro.split('. ');
    if (sentences.length >= 3) {
      const mid = Math.floor(sentences.length / 2);
      sentences[mid] = `${name}${particle(name, '이가')} 갖는 ` + sentences[mid];
      v.hookIntro = intro1 + ' ' + sentences.join('. ');
    } else {
      v.hookIntro = intro1 + ' ' + v.hookIntro + ` ${name}${particle(name, '을를')} 직접 경험해보세요.`;
    }
  }

  // 2. atmosphere: insert name 1 time at start
  if (v.bodySections && v.bodySections.atmosphere) {
    v.bodySections.atmosphere = `${name}${particle(name, '은는')} 독특한 매력을 가진 곳입니다. ` + v.bodySections.atmosphere;
  }

  // 3. story.scene1: insert name 1 time at start
  if (v.story && v.story.scene1) {
    v.story.scene1 = `${name}에 도착하는 순간, ` + v.story.scene1;
  }

  // 4. music: insert name 1 time at start
  if (v.bodySections && v.bodySections.music) {
    v.bodySections.music = `${name}의 ` + v.bodySections.music;
  }

  // 5. safety: insert name 1 time at start
  if (v.bodySections && v.bodySections.safety) {
    v.bodySections.safety = `${name}${particle(name, '을를')} 방문하기 전 꼭 읽어야 할 매너 가이드입니다. ` + v.bodySections.safety;
  }
});

fs.writeFileSync('/home/user/week1/data/venues.json', JSON.stringify(venues, null, 2));
console.log('Inserted venue names into content for ' + venues.length + ' venues');

// Verify a sample
const sample = venues.find(v => v.venueSlug === '한국관' && v.regionSlug === 'sangbong');
if (sample) {
  console.log('\nSample (상봉동 한국관):');
  console.log('hookIntro:', sample.hookIntro.substring(0, 150) + '...');
  console.log('atmosphere:', sample.bodySections.atmosphere.substring(0, 100) + '...');
  console.log('scene1:', sample.story.scene1.substring(0, 100) + '...');
  console.log('music:', sample.bodySections.music.substring(0, 100) + '...');
  console.log('safety:', sample.bodySections.safety.substring(0, 100) + '...');
}
