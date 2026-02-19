const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data', 'venues.json');
let content = fs.readFileSync(filePath, 'utf8');

// Strategy: parse JSON, walk all string values, remove sentences containing banned words
const bannedWords = ['예산', '가격', '입장료', '만원', '만 원'];
const bannedRegex = /예산|가격|입장료|만원|만 원/;

function cleanText(text) {
  if (!text || typeof text !== 'string') return text;
  if (!bannedRegex.test(text)) return text;

  // Split by sentence boundaries (。or . followed by space, or end)
  // Korean text uses . as sentence delimiter
  const sentences = text.split(/(?<=[\.\!])\s+/);
  const cleaned = sentences.filter(s => !bannedRegex.test(s));
  let result = cleaned.join(' ');

  // Clean up any remaining fragments
  result = result.replace(/\s{2,}/g, ' ').trim();
  // Remove orphan leading/trailing punctuation
  result = result.replace(/^\s*[,\.\-—]\s*/, '').replace(/\s*[,]\s*$/, '');

  return result;
}

const venues = JSON.parse(fs.readFileSync(filePath, 'utf8'));

function walkAndClean(obj) {
  if (typeof obj === 'string') {
    return cleanText(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(item => walkAndClean(item)).filter(item => {
      // Remove FAQ items where q contains banned words
      if (item && typeof item === 'object' && item.q && bannedRegex.test(item.q)) {
        return false;
      }
      return true;
    });
  }
  if (obj && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = walkAndClean(value);
    }
    return result;
  }
  return obj;
}

const cleaned = walkAndClean(venues);

fs.writeFileSync(filePath, JSON.stringify(cleaned, null, 2), 'utf8');

// Verify
const newContent = fs.readFileSync(filePath, 'utf8');
const remaining = [];
bannedWords.forEach(w => {
  const count = (newContent.match(new RegExp(w, 'g')) || []).length;
  if (count > 0) remaining.push(`${w}: ${count}`);
});

if (remaining.length === 0) {
  console.log('All price/budget words removed from venues.json');
} else {
  console.log('Remaining:', remaining.join(', '));
}
