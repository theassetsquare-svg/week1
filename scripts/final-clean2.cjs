const fs = require('fs');
const venues = JSON.parse(fs.readFileSync('/home/user/week1/data/venues.json','utf8'));

// Template now adds very few words from data.
// Layout adds: 보기(3: "모바일 보기" button + 2 in JS), 나이트(1: nav), 클럽(1: nav), 라운지(1: nav), 소개(1: footer link)
// Template adds per page: shortName in title+breadcrumb+h1 (3 uses of core name)
// All other words come from data fields.

// For any word appearing in data fields, max should be 3 minus what template/layout adds.
// For most data words, limit is 3.
// For words the layout/template use: subtract those.

const layoutWords = {
  '보기': 3,  // layout adds 3 (button text, 2 JS strings)
  '소개': 1,  // footer "소개" link
  '모바일': 2, // button text + JS
};

venues.forEach(v => {
  const fields = [];

  // Collect all mutable text field references
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

  // Count words across all data fields
  const allText = fields.map(f => String(f.obj[f.key])).join(' ');
  const words = allText.match(/[가-힣]{2,}/g) || [];
  const freq = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });

  // Also count planner button labels (keys)
  if (v.plannerRules) {
    Object.keys(v.plannerRules).forEach(cat => {
      // The category name appears as a label
      if (typeof v.plannerRules[cat] === 'object') {
        Object.keys(v.plannerRules[cat]).forEach(k => {
          // Each key appears as button text AND as data-key attribute text
          const btnWords = k.match(/[가-힣]{2,}/g) || [];
          btnWords.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
        });
      }
    });
  }

  // Determine which words are over limit
  Object.entries(freq).forEach(([word, count]) => {
    const layoutUse = layoutWords[word] || 0;
    const maxInData = Math.max(0, 3 - layoutUse);

    if (count > maxInData) {
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
    }
  });
});

fs.writeFileSync('/home/user/week1/data/venues.json', JSON.stringify(venues, null, 2));
console.log('Final cleanup v2 done');
