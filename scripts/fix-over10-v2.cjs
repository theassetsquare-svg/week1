const fs = require('fs');
const venues = JSON.parse(fs.readFileSync('/home/user/week1/data/venues.json', 'utf8'));

const v = venues.find(v => v.urlSlug === '플러스82');
console.log('Venue:', v.name_display);

// Template automatically adds ~4 mentions (title, description, h1, breadcrumb)
// So content can have at most 5 to stay under 10 total
const MAX_IN_CONTENT = 5;

// Count all "플러스82" in content fields
const contentFields = [];

function addField(obj, key, parent) {
  if (obj && obj[key] && typeof obj[key] === 'string') {
    const count = (obj[key].match(/플러스82/g) || []).length;
    if (count > 0) contentFields.push({ obj, key, parent, count });
  }
}

addField(v, 'hookIntro', 'root');
addField(v, 'teaser', 'root');
if (v.bodySections) {
  addField(v.bodySections, 'atmosphere', 'bodySections');
  addField(v.bodySections, 'music', 'bodySections');
  addField(v.bodySections, 'safety', 'bodySections');
}
if (v.story) {
  ['scene1','scene2','scene3','scene4','scene5','scene6','scene7','scene8'].forEach(s => {
    addField(v.story, s, 'story');
  });
}
if (v.faq) {
  v.faq.forEach((f, i) => {
    addField(f, 'q', `faq[${i}]`);
    addField(f, 'a', `faq[${i}]`);
  });
}
if (v.timeline) {
  v.timeline.forEach((t, i) => {
    addField(t, 'label', `timeline[${i}]`);
    addField(t, 'desc', `timeline[${i}]`);
  });
}
if (v.checklist) {
  v.checklist.forEach((c, i) => {
    // checklist items are strings in an array
    const count = (c.match(/플러스82/g) || []).length;
    if (count > 0) contentFields.push({ obj: v.checklist, key: i, parent: 'checklist', count });
  });
}

const totalInContent = contentFields.reduce((s, f) => s + f.count, 0);
console.log(`\n수정 전 - 콘텐츠 내 "플러스82": ${totalInContent}회`);
contentFields.forEach(f => console.log(`  ${f.parent}.${f.key}: ${f.count}회`));

// Keep first occurrence in hookIntro, and a few in key sections
// Remove from the rest
let kept = 0;

// Priority: keep in hookIntro (1), atmosphere (1), scene1 (1), scene3 (1), safety (1) = 5
const keepOrder = [
  { parent: 'root', key: 'hookIntro' },
  { parent: 'bodySections', key: 'atmosphere' },
  { parent: 'story', key: 'scene1' },
  { parent: 'story', key: 'scene3' },
  { parent: 'bodySections', key: 'safety' },
];

const keepSet = new Set();
keepOrder.forEach(k => keepSet.add(`${k.parent}.${k.key}`));

// For fields in keepSet: keep only 1 occurrence, remove rest
// For fields NOT in keepSet: remove all occurrences
contentFields.forEach(field => {
  const fieldId = `${field.parent}.${field.key}`;
  const text = field.obj[field.key];
  const inKeepSet = keepSet.has(fieldId);

  if (inKeepSet && kept < MAX_IN_CONTENT) {
    // Keep first occurrence only
    let count = 0;
    field.obj[field.key] = text.replace(/청담 플러스82 클럽/g, (match) => {
      count++;
      if (count === 1) { kept++; return match; }
      return '이곳';
    });
    // Also handle just "플러스82" without full name
    let text2 = field.obj[field.key];
    let count2 = 0;
    const alreadyKept = (text2.match(/청담 플러스82 클럽/g) || []).length;
    field.obj[field.key] = text2.replace(/플러스82(?! 클럽)/g, (match) => {
      count2++;
      if (count2 === 1 && alreadyKept === 0) { return match; }
      return '이곳';
    });
  } else {
    // Remove all occurrences
    field.obj[field.key] = text.replace(/청담 플러스82 클럽/g, '이곳')
                                .replace(/플러스82/g, '이곳');
  }
});

// Recount
let newTotal = 0;
function countInField(obj, key) {
  if (obj && obj[key] && typeof obj[key] === 'string') {
    return (obj[key].match(/플러스/g) || []).length;
  }
  return 0;
}

newTotal += countInField(v, 'hookIntro');
newTotal += countInField(v, 'teaser');
if (v.bodySections) {
  newTotal += countInField(v.bodySections, 'atmosphere');
  newTotal += countInField(v.bodySections, 'music');
  newTotal += countInField(v.bodySections, 'safety');
}
if (v.story) {
  ['scene1','scene2','scene3','scene4','scene5','scene6','scene7','scene8'].forEach(s => {
    newTotal += countInField(v.story, s);
  });
}
if (v.faq) v.faq.forEach(f => { newTotal += countInField(f, 'q') + countInField(f, 'a'); });
if (v.timeline) v.timeline.forEach(t => { newTotal += countInField(t, 'label') + countInField(t, 'desc'); });

console.log(`\n수정 후 - 콘텐츠 내 "플러스": ${newTotal}회`);
console.log(`템플릿 자동생성: ~4회`);
console.log(`예상 합계: ${newTotal + 4}회`);

fs.writeFileSync('/home/user/week1/data/venues.json', JSON.stringify(venues, null, 2));
console.log('\nvenues.json 저장 완료');
