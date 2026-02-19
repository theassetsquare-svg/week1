const fs = require('fs');

const venues = JSON.parse(fs.readFileSync('data/venues.json', 'utf-8'));

// Generic keywords to remove (appear on 90%+ of pages)
const genericKeywords = new Set([
  '추천', '놀거리', '핫플', '영업시간', '위치', '주차', '가격',
  '드레스코드', '예약', '후기', '입장료', '밤문화', '순위', '성인',
]);

// For each venue, also remove keywords that duplicate words already in the venue name/region/type
function getVenueNameWords(v) {
  const words = new Set();
  // Extract Korean words from name_display
  const nameWords = v.name_display.match(/[가-힣]{2,}/g) || [];
  nameWords.forEach(w => words.add(w));
  // region
  const regionWords = v.region.match(/[가-힣]{2,}/g) || [];
  regionWords.forEach(w => words.add(w));
  // typeLabel
  if (v.typeLabel) words.add(v.typeLabel);
  return words;
}

let totalKeywordsRemoved = 0;

for (const v of venues) {
  const nameWords = getVenueNameWords(v);
  const oldLen = v.keywords.length;

  // Remove generic keywords
  v.keywords = v.keywords.filter(kw => !genericKeywords.has(kw));

  // Remove keywords that are just the venue type
  v.keywords = v.keywords.filter(kw => {
    if (kw === '나이트' || kw === '클럽' || kw === '라운지') return false;
    return true;
  });

  // Remove keywords that exactly match name words
  v.keywords = v.keywords.filter(kw => !nameWords.has(kw));

  // Keep max 5 keywords
  v.keywords = v.keywords.slice(0, 5);

  totalKeywordsRemoved += (oldLen - v.keywords.length);
}

console.log(`키워드 정리 완료: 총 ${totalKeywordsRemoved}개 키워드 삭제`);

// ─── Phase 3: Reduce word repetition in body text ───

// Collect all text fields for each venue, count word frequency, and replace excess
function getAllTextFields(v) {
  const fields = [];

  // hookIntro
  if (v.hookIntro) fields.push({ key: 'hookIntro', text: v.hookIntro });

  // bodySections
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

  // story
  if (v.story) {
    for (const [k, val] of Object.entries(v.story)) {
      if (typeof val === 'string') {
        fields.push({ key: `story.${k}`, text: val });
      }
    }
  }

  // faq
  if (v.faq) {
    v.faq.forEach((f, i) => {
      fields.push({ key: `faq.${i}.q`, text: f.q });
      fields.push({ key: `faq.${i}.a`, text: f.a });
    });
  }

  // timeline
  if (v.timeline) {
    v.timeline.forEach((t, i) => {
      if (t.label) fields.push({ key: `timeline.${i}.label`, text: t.label });
      if (t.desc) fields.push({ key: `timeline.${i}.desc`, text: t.desc });
    });
  }

  // checklist
  if (v.checklist) {
    v.checklist.forEach((c, i) => {
      fields.push({ key: `checklist.${i}`, text: c });
    });
  }

  // plannerRules
  if (v.plannerRules) {
    for (const [cat, rules] of Object.entries(v.plannerRules)) {
      if (typeof rules === 'object' && rules !== null) {
        for (const [k, val] of Object.entries(rules)) {
          if (typeof val === 'string') {
            fields.push({ key: `plannerRules.${cat}.${k}`, text: val });
          }
        }
      }
    }
  }

  // teaser
  if (v.teaser) fields.push({ key: 'teaser', text: v.teaser });

  return fields;
}

function countWordsInFields(fields) {
  const counts = {};
  for (const f of fields) {
    const words = f.text.match(/[가-힣]{2,}/g) || [];
    for (const w of words) {
      if (!counts[w]) counts[w] = { total: 0, occurrences: [] };
      counts[w].total++;
      counts[w].occurrences.push(f.key);
    }
  }
  return counts;
}

// Alternative words for replacement
const venueAlts = ['이곳', '해당 매장', '여기', '이 공간'];
const regionAlts = ['이 지역', '해당 지역', '인근', '현지'];
const typeAlts = {
  'night': ['이곳', '해당 매장', '여기'],
  'club': ['이곳', '해당 매장', '여기'],
  'lounge': ['이곳', '해당 매장', '여기'],
};

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

let totalTextReplacements = 0;

for (const v of venues) {
  const fields = getAllTextFields(v);
  const wordCounts = countWordsInFields(fields);

  // Get venue-specific words to watch
  const venueName = v.name_display;
  const nameWords = (venueName.match(/[가-힣]{2,}/g) || []);
  const regionWord = v.region;
  const typeWord = v.typeLabel;

  // For each word that appears > 3 times across all text
  for (const [word, info] of Object.entries(wordCounts)) {
    if (info.total <= 3) continue;

    // Determine replacement based on what kind of word it is
    let replacements;
    if (nameWords.includes(word)) {
      replacements = venueAlts;
    } else if (word === regionWord || regionWord.includes(word)) {
      replacements = regionAlts;
    } else if (word === typeWord || word === '나이트' || word === '클럽' || word === '라운지') {
      replacements = typeAlts[v.type] || venueAlts;
    } else {
      // For other repeated words, just skip the 4th+ occurrence
      replacements = null;
    }

    // Now process each field to replace excess occurrences
    let globalCount = 0;
    for (const f of fields) {
      const currentText = getNestedValue(v, f.key);
      if (typeof currentText !== 'string') continue;

      // Find all occurrences of the word in this field
      const regex = new RegExp(word, 'g');
      let match;
      const positions = [];
      while ((match = regex.exec(currentText)) !== null) {
        positions.push(match.index);
      }

      if (positions.length === 0) continue;

      let newText = currentText;
      let offset = 0;

      for (const pos of positions) {
        globalCount++;
        if (globalCount <= 3) continue; // Keep first 3

        // Replace this occurrence
        const adjustedPos = pos + offset;
        let replacement = '';
        if (replacements) {
          replacement = replacements[(globalCount - 4) % replacements.length];
        } else {
          // For generic words, just remove or keep empty
          replacement = '';
        }

        const before = newText.substring(0, adjustedPos);
        const after = newText.substring(adjustedPos + word.length);

        // Check context - don't create broken sentences
        // If the word is part of a compound (attached to other Korean chars), use replacement
        const charBefore = before.length > 0 ? before[before.length - 1] : '';
        const charAfter = after.length > 0 ? after[0] : '';
        const isStandalone = !/[가-힣]/.test(charBefore) || !replacement;

        if (replacement && isStandalone) {
          newText = before + replacement + after;
          offset += (replacement.length - word.length);
          totalTextReplacements++;
        } else if (!replacement) {
          // For generic words with no replacement, skip (don't break text)
          continue;
        }
      }

      if (newText !== currentText) {
        setNestedValue(v, f.key, newText);
      }
    }
  }
}

console.log(`본문 텍스트 정리 완료: 총 ${totalTextReplacements}개 단어 대체`);

// Write updated venues.json
fs.writeFileSync('data/venues.json', JSON.stringify(venues, null, 2), 'utf-8');
console.log('venues.json 저장 완료');

// Print sample: check sangbong/한국관
const sangbong = venues.find(v => v.name_display.includes('한국관') && v.region === '상봉동');
if (sangbong) {
  console.log('\n=== 상봉동 한국관 수정 결과 ===');
  console.log('키워드:', sangbong.keywords);
  const fields = getAllTextFields(sangbong);
  const counts = countWordsInFields(fields);
  const over3 = Object.entries(counts).filter(([w, c]) => c.total > 3).sort((a, b) => b[1].total - a[1].total);
  if (over3.length > 0) {
    console.log('아직 3회 초과 단어:', over3.map(([w, c]) => `${w}(${c.total})`).join(', '));
  } else {
    console.log('모든 단어 3회 이하 달성!');
  }
}
