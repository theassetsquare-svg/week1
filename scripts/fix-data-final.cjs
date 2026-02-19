const fs = require('fs');

const venues = JSON.parse(fs.readFileSync('data/venues.json', 'utf-8'));

function getAllTextFields(v) {
  const fields = [];
  if (v.hookIntro) fields.push({ key: 'hookIntro', text: v.hookIntro });
  if (v.bodySections) {
    for (const [k, val] of Object.entries(v.bodySections)) {
      if (typeof val === 'string') {
        fields.push({ key: `bodySections.${k}`, text: val });
      } else if (typeof val === 'object' && val !== null) {
        for (const [k2, val2] of Object.entries(val)) {
          if (typeof val2 === 'string') {
            fields.push({ key: `bodySections.${k}.${k2}`, text: val2 });
          }
        }
      }
    }
  }
  if (v.story) {
    for (const [k, val] of Object.entries(v.story)) {
      if (typeof val === 'string') fields.push({ key: `story.${k}`, text: val });
    }
  }
  if (v.faq) {
    v.faq.forEach((f, i) => {
      fields.push({ key: `faq.${i}.q`, text: f.q });
      fields.push({ key: `faq.${i}.a`, text: f.a });
    });
  }
  if (v.timeline) {
    v.timeline.forEach((t, i) => {
      if (t.label) fields.push({ key: `timeline.${i}.label`, text: t.label });
      if (t.desc) fields.push({ key: `timeline.${i}.desc`, text: t.desc });
    });
  }
  if (v.checklist) {
    v.checklist.forEach((c, i) => fields.push({ key: `checklist.${i}`, text: c }));
  }
  if (v.plannerRules) {
    for (const [cat, rules] of Object.entries(v.plannerRules)) {
      if (typeof rules === 'object' && rules !== null) {
        for (const [k, val] of Object.entries(rules)) {
          if (typeof val === 'string') fields.push({ key: `plannerRules.${cat}.${k}`, text: val });
        }
      }
    }
  }
  if (v.teaser) fields.push({ key: 'teaser', text: v.teaser });
  return fields;
}

function setNestedValue(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = isNaN(parts[i]) ? parts[i] : parseInt(parts[i]);
    current = current[key];
  }
  const lastKey = isNaN(parts[parts.length - 1]) ? parts[parts.length - 1] : parseInt(parts[parts.length - 1]);
  current[lastKey] = value;
}

function getNestedValue(obj, keyPath) {
  const parts = keyPath.split('.');
  let current = obj;
  for (const p of parts) {
    const key = isNaN(p) ? p : parseInt(p);
    current = current[key];
    if (current === undefined) return undefined;
  }
  return current;
}

// Template adds these words structurally (from header nav, breadcrumb, fact-box, h1, footer):
// - venue type word (나이트/클럽/라운지): ~3 times from template (nav + breadcrumb + possibly in name)
// - region: ~2 times from template (breadcrumb + fact-box)
// - venue name words: ~2 times from template (breadcrumb + h1)
// So data text should have at most 1 occurrence of these key words

// For ALL words: limit to max 2 occurrences in data text (template will add 1-3 more)
const MAX_IN_DATA = 2;

let totalRemoved = 0;

for (const v of venues) {
  const fields = getAllTextFields(v);

  // Count all words
  const wordCounts = {};
  for (const f of fields) {
    const words = f.text.match(/[가-힣]{2,}/g) || [];
    for (const w of words) wordCounts[w] = (wordCounts[w] || 0) + 1;
  }

  const overWords = Object.entries(wordCounts).filter(([w, c]) => c > MAX_IN_DATA);
  if (overWords.length === 0) continue;

  for (const [word, count] of overWords) {
    let globalOccurrence = 0;

    // Process lower-priority fields first
    const priorityOrder = [
      'plannerRules', 'checklist', 'timeline',
      'faq', 'story.scene8', 'story.scene7', 'story.scene6',
      'story.scene5', 'story.scene4', 'story.scene3', 'story.scene2',
      'story.scene1', 'bodySections.safety', 'bodySections.music',
      'bodySections.atmosphere', 'hookIntro', 'teaser'
    ];

    const sortedFields = [...fields].sort((a, b) => {
      const aIdx = priorityOrder.findIndex(p => a.key.startsWith(p));
      const bIdx = priorityOrder.findIndex(p => b.key.startsWith(p));
      return (aIdx === -1 ? 0 : aIdx) - (bIdx === -1 ? 0 : bIdx);
    });

    // First pass: count occurrences to know total
    for (const f of sortedFields) {
      const currentText = getNestedValue(v, f.key);
      if (typeof currentText !== 'string') continue;

      const regex = new RegExp(word, 'g');
      const sentences = currentText.split(/(?<=[.!?。])\s*/);
      const keptSentences = [];

      for (const sentence of sentences) {
        const sentenceMatches = (sentence.match(regex) || []).length;
        if (sentenceMatches > 0) {
          globalOccurrence += sentenceMatches;
          if (globalOccurrence <= MAX_IN_DATA) {
            keptSentences.push(sentence);
          } else {
            // Remove word from sentence
            let cleaned = sentence;
            let removals = globalOccurrence - MAX_IN_DATA;
            for (let i = 0; i < removals && i < sentenceMatches; i++) {
              cleaned = cleaned.replace(word, '');
              totalRemoved++;
            }
            cleaned = cleaned.replace(/\s+/g, ' ').trim();
            if (cleaned.length > 3) {
              keptSentences.push(cleaned);
            } else {
              totalRemoved++;
            }
          }
        } else {
          keptSentences.push(sentence);
        }
      }

      const result = keptSentences.join(' ').replace(/\s+/g, ' ').trim();
      if (result !== currentText) {
        setNestedValue(v, f.key, result);
      }
    }
  }
}

console.log(`데이터 텍스트 최종 정리: ${totalRemoved}개 제거/대체`);

// Run second pass for anything still over
let pass2Removed = 0;
for (const v of venues) {
  const fields = getAllTextFields(v);
  const wordCounts = {};
  for (const f of fields) {
    const words = f.text.match(/[가-힣]{2,}/g) || [];
    for (const w of words) wordCounts[w] = (wordCounts[w] || 0) + 1;
  }
  const overWords = Object.entries(wordCounts).filter(([w, c]) => c > MAX_IN_DATA);

  for (const [word, count] of overWords) {
    // Brute force: remove from last fields
    let remaining = count;
    for (let fi = fields.length - 1; fi >= 0 && remaining > MAX_IN_DATA; fi--) {
      const f = fields[fi];
      const currentText = getNestedValue(v, f.key);
      if (typeof currentText !== 'string') continue;

      while (remaining > MAX_IN_DATA && currentText.includes && getNestedValue(v, f.key).includes(word)) {
        const txt = getNestedValue(v, f.key);
        const newTxt = txt.replace(word, '').replace(/\s+/g, ' ').trim();
        setNestedValue(v, f.key, newTxt);
        remaining--;
        pass2Removed++;
      }
    }
  }
}
if (pass2Removed > 0) console.log(`2차 정리: ${pass2Removed}개 추가 제거`);

// Final verify
let problemCount = 0;
for (const v of venues) {
  const fields = getAllTextFields(v);
  const wordCounts = {};
  for (const f of fields) {
    const words = f.text.match(/[가-힣]{2,}/g) || [];
    for (const w of words) wordCounts[w] = (wordCounts[w] || 0) + 1;
  }
  const over = Object.entries(wordCounts).filter(([w, c]) => c > MAX_IN_DATA);
  if (over.length > 0) {
    problemCount++;
    if (problemCount <= 3) {
      console.log(`[${v.name_display}] 여전히 ${MAX_IN_DATA}회 초과: ${over.map(([w,c]) => `${w}(${c})`).join(', ')}`);
    }
  }
}

if (problemCount === 0) {
  console.log(`\n모든 매장 데이터에서 단어 최대 ${MAX_IN_DATA}회 이하 달성!`);
} else {
  console.log(`\n${problemCount}개 매장 아직 초과`);
}

fs.writeFileSync('data/venues.json', JSON.stringify(venues, null, 2), 'utf-8');
console.log('venues.json 저장 완료');
