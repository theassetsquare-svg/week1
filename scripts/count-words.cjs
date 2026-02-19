const fs = require('fs');
const html = fs.readFileSync('/home/user/week1/night/sangbong/한국관/index.html', 'utf8');

// Extract all Korean words (2+ chars)
const words = html.match(/[가-힣]{2,}/g) || [];
const freq = {};
words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });

// Show words with 3+ occurrences
const over = Object.entries(freq)
  .filter(([,c]) => c >= 3)
  .sort((a,b) => b[1] - a[1]);

console.log('=== Words appearing 3+ times ===');
over.forEach(([w,c]) => console.log(`  ${w}: ${c}`));
console.log(`\nTotal words 3+: ${over.length}`);

// Specifically check the key words
['상봉동', '한국관', '나이트', '클럽', '라운지'].forEach(w => {
  console.log(`${w}: ${freq[w] || 0}`);
});
