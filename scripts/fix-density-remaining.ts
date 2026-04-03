import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { venues } from '../src/data/venues';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../src/data');

const dataFiles = [
  'nights-seoul.ts',
  'nights-gyeonggi.ts',
  'nights-other.ts',
  'clubs-data.ts',
  'lounges-data.ts',
  'others-data.ts',
];

function calcDensity(v: typeof venues[0]): { chars: number; count: number; density: number } {
  let content = '';
  content += v.description || '';
  content += v.atmosphere || '';
  content += v.music || '';
  content += (v.highlights || []).join(' ');
  content += (v.faq || []).map(f => f.q + ' ' + f.a).join(' ');
  content += (v.timeline || []).map(t => t.time + ' ' + t.event).join(' ');
  content += v.shortDesc || '';
  content += v.h1Title || '';
  content += v.seoTitle || '';
  content += v.seoDescription || '';

  const chars = content.length;
  let count = 0;
  let idx = 0;
  while (true) {
    idx = content.indexOf(v.name, idx);
    if (idx === -1) break;
    count++;
    idx += v.name.length;
  }
  return { chars, count, density: (count * v.name.length) / chars * 100 };
}

// For venues still too high, we need to replace one name mention in the description
// with a pronoun ("이 곳", "여기", "이 집" etc.)
// Strategy: find the last occurrence of name in description and replace it

const targetSlugs = [
  'incheon-arabian', 'ansan-dontellmama', 'daejeon-hankukgwan', 'daegu-hankukgwan',
  'busan-yeonsan-mul', 'gangnam-club-laputa', 'apgujeong-club-dbridge', 'apgujeong-club-candyman',
  'itaewon-club-maid', 'itaewon-club-prism', 'hongdae-club-dokkaebi', 'bucheon-club-paragon',
  'incheon-paradise-city', 'cheongju-club-supermoon'
];

for (const fileName of dataFiles) {
  const filePath = path.join(dataDir, fileName);
  let fileContent = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  for (const v of venues) {
    if (!targetSlugs.includes(v.slug)) continue;
    if (!fileContent.includes(`slug:'${v.slug}'`)) continue;

    const { density, count } = calcDensity(v);
    if (density <= 2.5) continue;

    // Find occurrences of venue name in description
    const desc = v.description;
    const name = v.name;
    const positions: number[] = [];
    let idx = 0;
    while (true) {
      idx = desc.indexOf(name, idx);
      if (idx === -1) break;
      positions.push(idx);
      idx += name.length;
    }

    if (positions.length < 2) continue;

    // Replace the LAST occurrence with a contextual pronoun
    // Check what comes after the name to determine the right replacement
    const lastPos = positions[positions.length - 1];
    const afterName = desc.substring(lastPos + name.length, lastPos + name.length + 5);

    let replacement = '이 곳';
    if (afterName.startsWith('은') || afterName.startsWith('이')) {
      replacement = '여기';
    } else if (afterName.startsWith('의')) {
      replacement = '이 곳';
    } else if (afterName.startsWith('에')) {
      replacement = '여기';
    } else if (afterName.startsWith('을') || afterName.startsWith('를')) {
      replacement = '이 곳';
    }

    // Build new description with replacement
    const newDesc = desc.substring(0, lastPos) + replacement + desc.substring(lastPos + name.length);

    // Apply to file
    const oldDescEscaped = desc.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const newDescEscaped = newDesc.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    const oldPattern = `description:'${oldDescEscaped}'`;
    if (fileContent.includes(oldPattern)) {
      fileContent = fileContent.replace(oldPattern, `description:'${newDescEscaped}'`);
      modified = true;

      // Verify new density
      const tempV = { ...v, description: newDesc };
      // Quick recalc
      let content = newDesc + (v.atmosphere || '') + (v.music || '') + (v.highlights || []).join(' ');
      content += (v.faq || []).map(f => f.q + ' ' + f.a).join(' ');
      content += (v.timeline || []).map(t => t.time + ' ' + t.event).join(' ');
      content += v.shortDesc + v.h1Title + v.seoTitle + v.seoDescription;
      let newCount = 0;
      let nidx = 0;
      while (true) {
        nidx = content.indexOf(name, nidx);
        if (nidx === -1) break;
        newCount++;
        nidx += name.length;
      }
      const newDensity = (newCount * name.length) / content.length * 100;
      console.log(`${v.slug}: ${density.toFixed(2)}% -> ${newDensity.toFixed(2)}% (${count} -> ${newCount} mentions)`);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, fileContent, 'utf-8');
  }
}
