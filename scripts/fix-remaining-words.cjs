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

// For remaining over-3 words, use sentence-level dedup:
// Remove entire duplicate/redundant sentences that contain the over-used word
let totalSentencesRemoved = 0;
let totalWordsReplaced = 0;

for (const v of venues) {
  const fields = getAllTextFields(v);

  // Count all words across all fields
  const wordCounts = {};
  for (const f of fields) {
    const words = f.text.match(/[가-힣]{2,}/g) || [];
    for (const w of words) {
      wordCounts[w] = (wordCounts[w] || 0) + 1;
    }
  }

  // Find words still over 3
  const overWords = Object.entries(wordCounts).filter(([w, c]) => c > 3);
  if (overWords.length === 0) continue;

  for (const [word, count] of overWords) {
    let remaining = count;
    // Process fields in reverse priority order (less important fields first)
    // Priority: teaser(keep) > hookIntro(keep) > atmosphere(keep) > story scenes > faq > timeline > checklist > plannerRules > deepDive
    const priorityOrder = [
      'plannerRules', 'checklist', 'timeline', 'deepDive',
      'faq', 'story.scene8', 'story.scene7', 'story.scene6',
      'story.scene5', 'story.scene4', 'story.scene3', 'story.scene2',
      'story.scene1', 'bodySections.safety', 'bodySections.music',
      'bodySections.atmosphere', 'hookIntro', 'teaser'
    ];

    // Sort fields by priority (low priority first for removal)
    const sortedFields = [...fields].sort((a, b) => {
      const aIdx = priorityOrder.findIndex(p => a.key.startsWith(p));
      const bIdx = priorityOrder.findIndex(p => b.key.startsWith(p));
      return (aIdx === -1 ? 0 : aIdx) - (bIdx === -1 ? 0 : bIdx);
    });

    // Count occurrences per field
    let globalOccurrence = 0;
    for (const f of sortedFields) {
      const currentText = getNestedValue(v, f.key);
      if (typeof currentText !== 'string') continue;

      const regex = new RegExp(word, 'g');
      const matches = currentText.match(regex);
      if (!matches) continue;

      let newText = currentText;
      let fieldCount = 0;

      // Process sentence by sentence
      const sentences = newText.split(/(?<=[.!?。])\s*/);
      const keptSentences = [];

      for (const sentence of sentences) {
        const sentenceMatches = (sentence.match(regex) || []).length;
        if (sentenceMatches > 0) {
          globalOccurrence += sentenceMatches;
          if (globalOccurrence <= 3) {
            keptSentences.push(sentence);
          } else {
            // This sentence would push us over 3 - try to replace the word
            if (sentenceMatches === 1 && globalOccurrence > 3) {
              // Remove just this word occurrence from the sentence
              const replaced = sentence.replace(word, '');
              // Only keep if the sentence still makes sense (>5 chars)
              if (replaced.trim().length > 5) {
                keptSentences.push(replaced);
                totalWordsReplaced++;
              } else {
                totalSentencesRemoved++;
              }
            } else {
              // Multiple occurrences in one sentence - remove sentence
              totalSentencesRemoved++;
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

console.log(`추가 정리 완료: ${totalSentencesRemoved}개 문장 제거, ${totalWordsReplaced}개 단어 제거`);

// Verify all venues now have <= 3 occurrences of any word
let problemVenues = 0;
let problemWords = 0;
for (const v of venues) {
  const fields = getAllTextFields(v);
  const wordCounts = {};
  for (const f of fields) {
    const words = f.text.match(/[가-힣]{2,}/g) || [];
    for (const w of words) wordCounts[w] = (wordCounts[w] || 0) + 1;
  }
  const over = Object.entries(wordCounts).filter(([w, c]) => c > 3);
  if (over.length > 0) {
    problemVenues++;
    problemWords += over.length;
    if (problemVenues <= 5) {
      console.log(`[${v.name_display}] 여전히 3회 초과: ${over.map(([w,c]) => `${w}(${c})`).join(', ')}`);
    }
  }
}

if (problemVenues === 0) {
  console.log('\n모든 매장 본문 텍스트에서 3회 초과 단어 없음!');
} else {
  console.log(`\n아직 ${problemVenues}개 매장에 ${problemWords}개 초과 단어 남음`);
}

fs.writeFileSync('data/venues.json', JSON.stringify(venues, null, 2), 'utf-8');
console.log('venues.json 최종 저장 완료');
