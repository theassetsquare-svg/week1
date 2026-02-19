const fs = require('fs');
const venues = JSON.parse(fs.readFileSync('/home/user/week1/data/venues.json','utf8'));

venues.forEach(v => {
  // Remove seoTitle and seoDescription - template now creates its own
  delete v.seoTitle;
  delete v.seoDescription;

  // Clean imagePrompts - remove Korean words
  if (v.imagePrompts) {
    v.imagePrompts = v.imagePrompts.map(p => {
      if (!p) return p;
      return p.replace(/[가-힣]+/g, '').replace(/\s{2,}/g, ' ').trim();
    });
  }

  // Clean image alt texts - make generic
  if (v.images) {
    v.images.forEach((img, i) => {
      img.alt = '매장 분위기 ' + (i + 1);
    });
  }
});

fs.writeFileSync('/home/user/week1/data/venues.json', JSON.stringify(venues, null, 2));
console.log('Cleaned ' + venues.length + ' venues');
