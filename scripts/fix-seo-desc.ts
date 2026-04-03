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

function escapeForTS(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function generateLongSeoDesc(v: typeof venues[0]): string {
  const name = v.name;
  const region = v.region;
  const typeName = v.typeName;

  // Extract compelling phrases from description
  const desc = v.description;
  const sentences = desc.split(/(?<=[.!?。])/).map(s => s.trim()).filter(s => s.length > 15);

  // Find sentences that don't start with the venue name (more interesting)
  const interestingSentences = sentences.filter(s =>
    !s.startsWith(name) &&
    s.length > 20 &&
    s.length < 80 &&
    !s.includes('말하려다') &&
    !s.includes('덧붙이') &&
    !s.includes('알아두면') &&
    !s.includes('추천한다') &&
    !s.includes('기억해라') &&
    !s.includes('한 번으로') &&
    !s.includes('직접 가봐야')
  );

  // Extract atmosphere hook
  const atmParts = v.atmosphere.split(/(?<=[.!?。])/).map(s => s.trim()).filter(s => s.length > 15 && s.length < 70);

  // Extract highlights
  const hlStr = v.highlights.slice(0, 3).join(', ');

  // Build a rich description
  let parts: string[] = [];

  // Start with name
  parts.push(name);

  // Add hook from shortDesc or first interesting sentence
  if (v.shortDesc.length < 50 && v.shortDesc.length > 10) {
    parts.push(v.shortDesc);
  } else if (interestingSentences.length > 0) {
    // Pick a sentence that's compelling
    const picked = interestingSentences.find(s => s.length > 25 && s.length < 60) || interestingSentences[0];
    parts.push(picked.replace(/\.$/, ''));
  }

  // Add atmosphere detail
  if (atmParts.length > 0) {
    parts.push(atmParts[0].replace(/\.$/, ''));
  }

  // Add highlights if still short
  if (parts.join(' — ').length < 120) {
    parts.push(hlStr);
  }

  // Add region context
  if (parts.join(' — ').length < 120) {
    parts.push(`${region} ${typeName} 현장 체험 가이드`);
  }

  // Join with various separators
  let result = parts[0];
  for (let i = 1; i < parts.length; i++) {
    const sep = i === 1 ? ' — ' : '. ';
    const candidate = result + sep + parts[i];
    if (candidate.length <= 155) {
      result = candidate;
    } else {
      break;
    }
  }

  // If still too short, expand with more description content
  if (result.length < 100) {
    for (const s of interestingSentences) {
      const candidate = result + '. ' + s.replace(/\.$/, '');
      if (candidate.length <= 155) {
        result = candidate;
      } else {
        // Trim sentence to fit
        const remaining = 153 - result.length - 2; // ". " + content
        if (remaining > 20) {
          const trimmed = s.substring(0, remaining);
          const lastSpace = trimmed.lastIndexOf(' ');
          if (lastSpace > remaining * 0.5) {
            result = result + '. ' + trimmed.substring(0, lastSpace);
          }
        }
        break;
      }
    }
  }

  // If STILL too short, add from music description
  if (result.length < 100) {
    const musicParts = v.music.split(/(?<=[.!?。])/).map(s => s.trim()).filter(s => s.length > 15 && s.length < 60);
    for (const mp of musicParts) {
      const candidate = result + '. ' + mp.replace(/\.$/, '');
      if (candidate.length <= 155) {
        result = candidate;
      } else {
        break;
      }
    }
  }

  // Final safety: ensure name is included
  if (!result.includes(name)) {
    result = `${name} — ${result}`;
  }

  // Trim if over 155
  if (result.length > 155) {
    result = result.substring(0, 152);
    const lastDot = result.lastIndexOf('.');
    const lastSpace = result.lastIndexOf(' ');
    if (lastDot > 110) {
      result = result.substring(0, lastDot + 1);
    } else if (lastSpace > 120) {
      result = result.substring(0, lastSpace);
    }
  }

  return result;
}

// Process each file
let totalFixed = 0;

for (const fileName of dataFiles) {
  const filePath = path.join(dataDir, fileName);
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  for (const v of venues) {
    // Only fix venues whose seoDescription is too short
    if (v.seoDescription.length >= 100) continue;

    // Check if this venue's slug exists in the file
    if (!content.includes(`slug:'${v.slug}'`)) continue;

    const newDesc = generateLongSeoDesc(v);
    if (newDesc.length < 100) {
      console.log(`⚠️  Still short for ${v.slug}: ${newDesc.length} chars`);
      continue;
    }

    const oldDescEscaped = escapeForTS(v.seoDescription);
    const newDescEscaped = escapeForTS(newDesc);

    const pattern = `seoDescription:'${oldDescEscaped}'`;
    if (content.includes(pattern)) {
      content = content.replace(pattern, `seoDescription:'${newDescEscaped}'`);
      modified = true;
      totalFixed++;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Updated ${fileName}`);
  }
}

console.log(`\nTotal seoDescription fixed: ${totalFixed}`);
