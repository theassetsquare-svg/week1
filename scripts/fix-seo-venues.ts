import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// All data files to process
const dataDir = path.resolve(__dirname, '../src/data');
const dataFiles = [
  'nights-seoul.ts',
  'nights-gyeonggi.ts',
  'nights-other.ts',
  'clubs-data.ts',
  'lounges-data.ts',
  'others-data.ts',
];

// Import all venues for reference
import { venues } from '../src/data/venues';

// Build a set of all venue names for detection
const allNames = venues.map(v => v.name);

function generateH1Title(v: typeof venues[0]): string {
  // Must be: "{name} — {hook}" and under 60 chars total
  // Use shortDesc to extract a compelling hook
  const name = v.name;
  const maxHook = 58 - name.length - 3; // " — " = 3 chars

  // Extract hook from shortDesc or create from description keywords
  let hook = v.shortDesc;

  // Trim hook to fit
  if (hook.length > maxHook) {
    // Try to find a natural break point
    const truncated = hook.substring(0, maxHook);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastComma = truncated.lastIndexOf(',');
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastPeriod > maxHook * 0.5) {
      hook = truncated.substring(0, lastPeriod);
    } else if (lastComma > maxHook * 0.5) {
      hook = truncated.substring(0, lastComma);
    } else if (lastSpace > maxHook * 0.5) {
      hook = truncated.substring(0, lastSpace);
    } else {
      hook = truncated;
    }
  }

  // Remove venue name from hook if it appears there
  hook = hook.replace(new RegExp(escapeRegex(name), 'g'), '').trim();
  // Clean up leading/trailing punctuation
  hook = hook.replace(/^[.,\-—\s]+/, '').replace(/[.,\s]+$/, '');

  const result = `${name} — ${hook}`;
  if (result.length > 60) {
    // Further trim
    const trimHook = hook.substring(0, 58 - name.length - 3);
    const lastSp = trimHook.lastIndexOf(' ');
    return `${name} — ${lastSp > 10 ? trimHook.substring(0, lastSp) : trimHook}`;
  }
  return result;
}

function generateSeoDescription(v: typeof venues[0]): string {
  // Must be ~150 chars, include venue name, be compelling
  const name = v.name;
  const desc = v.description;
  const atm = v.atmosphere;
  const music = v.music;
  const region = v.region;
  const typeName = v.typeName;

  // Strategy: name + key feature + benefit + call to action
  // Extract first compelling sentence from description (after the name intro)
  const sentences = desc.split(/[.!?。]/).filter(s => s.trim().length > 10);
  let keyFeature = '';
  for (const s of sentences) {
    const trimmed = s.trim();
    if (trimmed.length > 20 && trimmed.length < 80 && !trimmed.startsWith(name)) {
      keyFeature = trimmed;
      break;
    }
  }
  if (!keyFeature && sentences.length > 1) {
    keyFeature = sentences[1].trim();
  }

  // Extract atmosphere hook
  const atmSentences = atm.split(/[.!?。]/).filter(s => s.trim().length > 10);
  const atmHook = atmSentences[0]?.trim() || '';

  // Build description
  let result = `${name} — ${keyFeature}`;
  if (result.length < 100 && atmHook) {
    result += `. ${atmHook}`;
  }

  // Add region/type context if still short
  if (result.length < 120) {
    result += `. ${region} ${typeName} 현장 체험 가이드.`;
  }

  // Trim to ~155 chars
  if (result.length > 155) {
    result = result.substring(0, 152);
    const lastSp = result.lastIndexOf(' ');
    const lastPeriod = result.lastIndexOf('.');
    if (lastPeriod > 120) {
      result = result.substring(0, lastPeriod + 1);
    } else if (lastSp > 120) {
      result = result.substring(0, lastSp);
    }
  }

  // Ensure name is in the description
  if (!result.includes(name)) {
    result = `${name} — ${result}`;
    if (result.length > 155) {
      result = result.substring(0, 152) + '...';
    }
  }

  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeForTS(str: string): string {
  return str.replace(/'/g, "\\'").replace(/\\/g, '\\\\');
}

// Process each data file
let totalFixed = { h1: 0, seo: 0, density: 0 };

for (const fileName of dataFiles) {
  const filePath = path.join(dataDir, fileName);
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // Get venues from this file
  const fileVenues = venues.filter(v => {
    // Determine which file each venue belongs to
    if (fileName === 'nights-seoul.ts') return v.type === 'night' && v.id >= 1 && v.id <= 12;
    if (fileName === 'nights-gyeonggi.ts') return v.type === 'night' && v.id >= 13 && v.id <= 28;
    if (fileName === 'nights-other.ts') return v.type === 'night' && v.id >= 29;
    if (fileName === 'clubs-data.ts') return v.type === 'club';
    if (fileName === 'lounges-data.ts') return v.type === 'lounge';
    if (fileName === 'others-data.ts') return v.type === 'room' || v.type === 'yojeong' || v.type === 'hoppa';
    return false;
  });

  for (const v of fileVenues) {
    // Fix h1Title if it doesn't contain venue name
    if (!v.h1Title.includes(v.name)) {
      const newH1 = generateH1Title(v);
      const oldH1Escaped = escapeForTS(v.h1Title);
      const newH1Escaped = escapeForTS(newH1);

      // Replace in file content
      const h1Pattern = `h1Title:'${oldH1Escaped}'`;
      const h1PatternAlt = `h1Title: '${oldH1Escaped}'`;
      if (content.includes(h1Pattern)) {
        content = content.replace(h1Pattern, `h1Title:'${newH1Escaped}'`);
        modified = true;
        totalFixed.h1++;
      } else if (content.includes(h1PatternAlt)) {
        content = content.replace(h1PatternAlt, `h1Title:'${newH1Escaped}'`);
        modified = true;
        totalFixed.h1++;
      }
    }

    // Fix seoDescription if it doesn't contain venue name or is too short
    const needsDescFix = !v.seoDescription.includes(v.name) || v.seoDescription.length < 100;
    if (needsDescFix) {
      const newDesc = generateSeoDescription(v);
      const oldDescEscaped = escapeForTS(v.seoDescription);
      const newDescEscaped = escapeForTS(newDesc);

      const descPattern = `seoDescription:'${oldDescEscaped}'`;
      const descPatternAlt = `seoDescription: '${oldDescEscaped}'`;
      if (content.includes(descPattern)) {
        content = content.replace(descPattern, `seoDescription:'${newDescEscaped}'`);
        modified = true;
        totalFixed.seo++;
      } else if (content.includes(descPatternAlt)) {
        content = content.replace(descPatternAlt, `seoDescription:'${newDescEscaped}'`);
        modified = true;
        totalFixed.seo++;
      }
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Updated ${fileName}`);
  } else {
    console.log(`⏭️  No changes needed in ${fileName}`);
  }
}

console.log(`\nTotal fixed: h1Title=${totalFixed.h1}, seoDescription=${totalFixed.seo}`);
