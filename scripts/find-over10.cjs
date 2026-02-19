const fs = require('fs');
const path = require('path');
const venues = JSON.parse(fs.readFileSync('/home/user/week1/data/venues.json', 'utf8'));

function getVenueUrl(v) {
  const slug = v.urlSlug || v.venueSlug;
  return `/${v.type}/${v.regionSlug}/${slug}/`;
}

let totalFail = 0;
const allIssues = [];

venues.forEach(v => {
  const url = getVenueUrl(v);
  const htmlPath = path.join('/home/user/week1/dist', url, 'index.html');
  if (!fs.existsSync(htmlPath)) return;

  const html = fs.readFileSync(htmlPath, 'utf8');
  const text = html.replace(/<[^>]+>/g, ' ');
  const words = text.match(/[가-힣]{2,}/g) || [];
  const freq = {};
  words.forEach(w => freq[w] = (freq[w] || 0) + 1);

  const over10 = Object.entries(freq).filter(([w, c]) => c >= 10).sort((a, b) => b[1] - a[1]);
  if (over10.length > 0) {
    totalFail++;
    allIssues.push({ url, name: v.name_display, words: over10 });
  }
});

console.log(`10개 이상 중복 단어가 있는 페이지: ${totalFail}/130\n`);

allIssues.forEach(issue => {
  console.log(`${issue.url} (${issue.name})`);
  issue.words.forEach(([w, c]) => console.log(`  ${w}: ${c}회`));
});
