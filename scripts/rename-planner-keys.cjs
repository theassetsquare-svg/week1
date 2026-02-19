const fs = require('fs');
const venues = JSON.parse(fs.readFileSync('/home/user/week1/data/venues.json','utf8'));

venues.forEach(v => {
  if (!v.plannerRules) return;
  const newRules = {};
  if (v.plannerRules['목적']) newRules['p'] = v.plannerRules['목적'];
  if (v.plannerRules['시간대']) newRules['t'] = v.plannerRules['시간대'];
  v.plannerRules = newRules;
});

fs.writeFileSync('/home/user/week1/data/venues.json', JSON.stringify(venues, null, 2));
console.log('Renamed planner keys for ' + venues.length + ' venues');
