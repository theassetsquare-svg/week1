const fs = require('fs');
const venues = JSON.parse(fs.readFileSync('/home/user/week1/data/venues.json','utf8'));

// Rename planner time slot keys to be shorter (remove Korean adjectives)
venues.forEach(v => {
  if (!v.plannerRules || !v.plannerRules['t']) return;
  const oldT = v.plannerRules['t'];
  const newT = {};
  Object.entries(oldT).forEach(([key, val]) => {
    // "이른 (20-22시)" → "20-22"
    // "피크 (22-00시)" → "22-00"
    // "늦은 (00시 이후)" → "00+"
    let newKey = key;
    if (key.includes('20-22')) newKey = '20-22';
    else if (key.includes('22-00') || key.includes('22-0')) newKey = '22-00';
    else if (key.includes('00시 이후') || key.includes('이후')) newKey = '00+';
    else if (key.includes('피크')) newKey = key.replace(/피크\s*/, '').replace(/[()]/g, '').trim() || 'peak';
    newT[newKey] = val;
  });
  v.plannerRules['t'] = newT;
});

fs.writeFileSync('/home/user/week1/data/venues.json', JSON.stringify(venues, null, 2));
console.log('Fixed planner time keys for ' + venues.length + ' venues');
