const fs = require('fs');
const venues = JSON.parse(fs.readFileSync('/home/user/week1/data/venues.json','utf8'));

// The plannerRules keys appear as both button text AND JS keys.
// Each key word appears 2x from structure alone.
// The values should NOT repeat the key words.

venues.forEach(v => {
  if (!v.plannerRules) return;

  Object.keys(v.plannerRules).forEach(cat => {
    if (typeof v.plannerRules[cat] !== 'object') return;

    Object.keys(v.plannerRules[cat]).forEach(key => {
      const val = v.plannerRules[cat][key];
      if (typeof val !== 'string') return;

      // Extract Korean words from the key
      const keyWords = key.match(/[가-힣]{2,}/g) || [];

      // Remove key words from value
      let cleaned = val;
      keyWords.forEach(w => {
        cleaned = cleaned.replace(new RegExp(w, 'g'), '');
      });

      v.plannerRules[cat][key] = cleaned.replace(/\s{2,}/g, ' ').trim();
    });
  });
});

fs.writeFileSync('/home/user/week1/data/venues.json', JSON.stringify(venues, null, 2));
console.log('Cleaned planner rules for ' + venues.length + ' venues');
