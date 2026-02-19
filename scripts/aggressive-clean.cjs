const fs = require('fs');
const venues = JSON.parse(fs.readFileSync('/home/user/week1/data/venues.json','utf8'));

// For each venue, build a list of words to strip from ALL text fields
venues.forEach(v => {
  const region = v.region || '';
  const typeWord = v.type === 'night' ? '나이트' : v.type === 'club' ? '클럽' : '라운지';

  // Extract the core venue name (without region and type)
  const coreName = v.name_display
    .replace(region + ' ', '')
    .replace(new RegExp(' ' + typeWord + '$'), '');

  // Words to completely remove from body text
  // (they already appear enough times in template: title, breadcrumb, h1)
  const wordsToRemove = [region, coreName, typeWord, v.name_display].filter(w => w.length >= 2);

  // Text fields to clean
  const textFields = ['hookIntro', 'teaser'];
  const bodyFields = ['atmosphere', 'music', 'safety'];
  const storyFields = ['scene1','scene2','scene3','scene4','scene5','scene6','scene7','scene8'];

  function cleanText(text) {
    if (!text || typeof text !== 'string') return text;
    let cleaned = text;
    wordsToRemove.forEach(word => {
      // Replace the word with empty string, clean up whitespace
      const regex = new RegExp(word, 'g');
      cleaned = cleaned.replace(regex, '');
    });
    // Clean up double spaces and leading/trailing
    cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
    return cleaned;
  }

  // Clean simple text fields
  textFields.forEach(f => {
    if (v[f]) v[f] = cleanText(v[f]);
  });

  // Clean bodySections
  if (v.bodySections) {
    bodyFields.forEach(f => {
      if (v.bodySections[f]) v.bodySections[f] = cleanText(v.bodySections[f]);
    });
  }

  // Clean story
  if (v.story) {
    storyFields.forEach(f => {
      if (v.story[f]) v.story[f] = cleanText(v.story[f]);
    });
  }

  // Clean FAQ
  if (v.faq) {
    v.faq.forEach(f => {
      if (f.q) f.q = cleanText(f.q);
      if (f.a) f.a = cleanText(f.a);
    });
  }

  // Clean timeline
  if (v.timeline) {
    v.timeline.forEach(t => {
      if (t.label) t.label = cleanText(t.label);
      if (t.desc) t.desc = cleanText(t.desc);
    });
  }

  // Clean checklist
  if (v.checklist) {
    v.checklist = v.checklist.map(item => cleanText(item));
  }

  // Clean plannerRules
  if (v.plannerRules) {
    Object.keys(v.plannerRules).forEach(category => {
      if (typeof v.plannerRules[category] === 'object') {
        Object.keys(v.plannerRules[category]).forEach(key => {
          if (typeof v.plannerRules[category][key] === 'string') {
            v.plannerRules[category][key] = cleanText(v.plannerRules[category][key]);
          }
        });
      }
    });
  }
});

fs.writeFileSync('/home/user/week1/data/venues.json', JSON.stringify(venues, null, 2));
console.log('Aggressively cleaned ' + venues.length + ' venues');

// Quick test: check 한국관 venue
const hg = venues.find(v => v.name_display.includes('한국관'));
if (hg) {
  const allText = JSON.stringify(hg);
  const matches = allText.match(/한국관/g);
  console.log('한국관 occurrences in data: ' + (matches ? matches.length : 0));
  const nightMatches = allText.match(/나이트/g);
  console.log('나이트 occurrences in data: ' + (nightMatches ? nightMatches.length : 0));
  const sbMatches = allText.match(/상봉동/g);
  console.log('상봉동 occurrences in data: ' + (sbMatches ? sbMatches.length : 0));
}
