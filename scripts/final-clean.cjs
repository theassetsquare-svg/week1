const fs = require('fs');
const venues = JSON.parse(fs.readFileSync('/home/user/week1/data/venues.json','utf8'));

// For each venue, count all Korean words that will appear on the page
// and reduce any that exceed 3 occurrences

// Words that come from the template (not from data):
// "분위기" x4 (hero alt, gallery alt x3) - actually "매장 분위기" so 분위기 x4 and 매장 x4
// "번째" - from timeline time fields in data
// "댄스" - from planner buttons (data) and planner rules (data)
// "매장" - from image alts "매장 분위기" x4 in template
// "보기" - from layout "모바일 보기"/"PC 보기"

// Template adds: 매장(4 from "매장 분위기" alts), 분위기(4 from alts)
// So data can have max 0 for 매장, 0 for 분위기

// Common words to limit across ALL venues
const globalMax = {
  '분위기': 0,  // template adds 4
  '매장': 0,    // template adds 4
};

venues.forEach(v => {
  const allTextFields = [];

  // Collect all mutable text field references
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
      if (t.label) fields.push({ obj: t, key: 'label' });
      if (t.desc) fields.push({ obj: t, key: 'desc' });
      if (t.time) fields.push({ obj: t, key: 'time' });
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

  // Count all words across all fields
  const allText = fields.map(f => String(f.obj[f.key])).join(' ');
  const words = allText.match(/[가-힣]{2,}/g) || [];
  const freq = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });

  // Find words over limit (accounting for template additions)
  const overWords = {};
  Object.entries(freq).forEach(([word, count]) => {
    const templateAdds = globalMax[word] !== undefined ? (4 - globalMax[word]) : 0;
    const maxInData = Math.max(0, 3 - templateAdds);
    if (count > maxInData) {
      overWords[word] = { count, maxInData, excess: count - maxInData };
    }
  });

  // For each over-limit word, remove excess occurrences from fields
  Object.entries(overWords).forEach(([word, info]) => {
    let remaining = info.maxInData;
    fields.forEach(f => {
      const text = String(f.obj[f.key]);
      if (!text.includes(word)) return;

      // Replace occurrences, keeping only 'remaining' count
      let newText = text;
      const matches = text.match(new RegExp(word, 'g'));
      if (!matches) return;

      if (remaining <= 0) {
        // Remove all occurrences in this field
        newText = text.replace(new RegExp(word, 'g'), '');
      } else if (matches.length <= remaining) {
        remaining -= matches.length;
        return; // Keep all in this field
      } else {
        // Keep only 'remaining' occurrences
        let kept = 0;
        newText = text.replace(new RegExp(word, 'g'), (match) => {
          if (kept < remaining) {
            kept++;
            return match;
          }
          return '';
        });
        remaining = 0;
      }

      f.obj[f.key] = newText.replace(/\s{2,}/g, ' ').trim();
    });
  });
});

fs.writeFileSync('/home/user/week1/data/venues.json', JSON.stringify(venues, null, 2));
console.log('Final cleanup done for ' + venues.length + ' venues');
