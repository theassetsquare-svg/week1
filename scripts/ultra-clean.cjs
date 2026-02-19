const fs = require('fs');
const venues = JSON.parse(fs.readFileSync('/home/user/week1/data/venues.json','utf8'));

// Words that appear in the template structure (headings, labels, planner text, etc.)
// These get added to EVERY page regardless of data content
const templateWords = new Set([
  '소개', '감성', '요약', '스토리텔링', '타임라인', '커스텀', '코스',
  '체크리스트', '음악', '정보', '위치', '교통', '자주', '묻는', '질문',
  '매너', '안전', '예산', '안내', '추천', '갤러리',
  '목적', '선택하세요', '시간대를', '선택하면', '맞춤', '플랜이', '표시됩니다',
  '이미지', '대표', '도착', '경험', '절정', '마무리', '감각', '디테일',
  '감성의', '여운', '사람들', '비하인드', '재방문',
  '나이트', '클럽', '라운지', '가이드', '모바일', '보기',
  '시간대', '피크', '이른', '늦은', '이후',
  '첫방문', '대화', '단체', '댄스',
  '분위기', '매장', '번째', '밤의',
]);

// For template words, allow max 1 in data (template already provides 2+)
// For all other words, allow max 2 in data
venues.forEach(v => {
  const fields = [];
  if (v.hookIntro) fields.push({ obj: v, key: 'hookIntro' });
  if (v.teaser) fields.push({ obj: v, key: 'teaser' });
  if (v.bodySections) {
    ['atmosphere', 'music', 'safety'].forEach(k => {
      if (v.bodySections[k]) fields.push({ obj: v.bodySections, key: k });
    });
  }
  if (v.story) {
    ['scene1','scene2','scene3','scene4','scene5','scene6','scene7','scene8'].forEach(k => {
      if (v.story[k]) fields.push({ obj: v.story, key: k });
    });
  }
  if (v.faq) {
    v.faq.forEach(f => {
      if (f.q) fields.push({ obj: f, key: 'q' });
      if (f.a) fields.push({ obj: f, key: 'a' });
    });
  }
  if (v.timeline) {
    v.timeline.forEach(t => {
      if (t.time) fields.push({ obj: t, key: 'time' });
      if (t.label) fields.push({ obj: t, key: 'label' });
      if (t.desc) fields.push({ obj: t, key: 'desc' });
    });
  }
  if (v.checklist) {
    v.checklist.forEach((item, i) => {
      fields.push({ obj: v.checklist, key: i });
    });
  }
  if (v.plannerRules) {
    Object.keys(v.plannerRules).forEach(cat => {
      if (typeof v.plannerRules[cat] === 'object') {
        Object.keys(v.plannerRules[cat]).forEach(k => {
          if (typeof v.plannerRules[cat][k] === 'string') {
            fields.push({ obj: v.plannerRules[cat], key: k });
          }
        });
      }
    });
  }

  // Count words
  const allText = fields.map(f => String(f.obj[f.key])).join(' ');
  const words = allText.match(/[가-힣]{2,}/g) || [];
  const freq = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });

  // For each word over limit, remove excess
  Object.entries(freq).forEach(([word, count]) => {
    const maxInData = templateWords.has(word) ? 1 : 2;
    if (count <= maxInData) return;

    let remaining = maxInData;
    fields.forEach(f => {
      const text = String(f.obj[f.key]);
      if (!text.includes(word)) return;
      const matches = text.match(new RegExp(word, 'g'));
      if (!matches) return;

      if (remaining <= 0) {
        f.obj[f.key] = text.replace(new RegExp(word, 'g'), '').replace(/\s{2,}/g, ' ').trim();
      } else if (matches.length <= remaining) {
        remaining -= matches.length;
      } else {
        let kept = 0;
        f.obj[f.key] = text.replace(new RegExp(word, 'g'), (m) => {
          if (kept < remaining) { kept++; return m; }
          return '';
        }).replace(/\s{2,}/g, ' ').trim();
        remaining = 0;
      }
    });
  });
});

fs.writeFileSync('/home/user/week1/data/venues.json', JSON.stringify(venues, null, 2));
console.log('Ultra cleanup done for ' + venues.length + ' venues');
