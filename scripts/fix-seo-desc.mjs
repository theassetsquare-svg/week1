import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'src/data');
const files = ['nights-seoul.ts', 'nights-gyeonggi.ts', 'nights-other.ts', 'clubs-data.ts', 'lounges-data.ts', 'others-data.ts'];

let totalFixed = 0;

for (const file of files) {
  const filePath = path.join(dataDir, file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Find all seoDescription values and replace with truncated version
  // Pattern: seoDescription: '...',
  const regex = /seoDescription:\s*'([^']{151,})'/g;
  let match;
  let newContent = content;
  
  while ((match = regex.exec(content)) !== null) {
    const fullDesc = match[1];
    // Extract only Korean characters and basic punctuation from first 140 chars
    const cleanChars = [];
    let charCount = 0;
    for (const ch of fullDesc) {
      const code = ch.charCodeAt(0);
      // Korean (Hangul), basic punctuation, numbers, spaces
      if ((code >= 0xAC00 && code <= 0xD7AF) || // Hangul syllables
          (code >= 0x3131 && code <= 0x318E) || // Hangul compatibility jamo
          (code >= 0x30 && code <= 0x39) ||      // Numbers
          ch === ' ' || ch === ',' || ch === '.' || ch === '!' || ch === '?' ||
          ch === '·' || ch === '-' || ch === '~') {
        cleanChars.push(ch);
        charCount++;
        if (charCount >= 130) break;
      }
    }
    
    let cleanDesc = cleanChars.join('').trim();
    // Ensure it doesn't end mid-word awkwardly
    if (cleanDesc.length > 120) {
      // Find last natural break point
      const lastPeriod = cleanDesc.lastIndexOf('.');
      const lastComma = cleanDesc.lastIndexOf(',');
      const lastSpace = cleanDesc.lastIndexOf(' ');
      const breakPoint = Math.max(lastPeriod, lastComma, lastSpace);
      if (breakPoint > 80) {
        cleanDesc = cleanDesc.substring(0, breakPoint + 1).trim();
      }
    }
    
    if (cleanDesc.length < 30) {
      // Too short after cleaning, skip
      continue;
    }
    
    newContent = newContent.replace(match[0], `seoDescription: '${cleanDesc}'`);
    totalFixed++;
  }
  
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`Fixed: ${file}`);
  }
}

console.log(`Total seoDescription fields fixed: ${totalFixed}`);
