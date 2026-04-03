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

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function calcDensity(content: string, name: string): { chars: number; count: number; density: number } {
  const chars = content.length;
  let count = 0;
  let idx = 0;
  while (true) {
    idx = content.indexOf(name, idx);
    if (idx === -1) break;
    count++;
    idx += name.length;
  }
  const density = chars > 0 ? (count * name.length) / chars * 100 : 0;
  return { chars, count, density };
}

function getFullContent(v: typeof venues[0]): string {
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
  return content;
}

// Shared filler patterns to remove from descriptions (these are shared content pools)
// Each pattern is a function that takes venue name and returns the filler sentence to remove
function getFillerPatterns(name: string): string[] {
  const eName = escapeRegex(name);
  return [
    // Pattern: "결국 돌고 돌아 {name}이다. 다른 데 가봐도 여기랑 비교하게 된다."
    `결국 돌고 돌아 ${name}이다. 다른 데 가봐도 여기랑 비교하게 된다.`,
    // Pattern: "{name} 예약할 때 한 가지만 기억해라. 주말은 미리 잡아야 한다."
    `${name} 예약할 때 한 가지만 기억해라. 주말은 미리 잡아야 한다.`,
    // Pattern: "{name}을 찾고 있다면 이 글을 끝까지 읽어라."
    `${name}을 찾고 있다면 이 글을 끝까지 읽어라.`,
    // Pattern: "{name}이 이 동네에서 자리를 잡은 건 이유가 있다."
    `${name}이 이 동네에서 자리를 잡은 건 이유가 있다.`,
    // Pattern: "{name}의 분위기를 한마디로 정의하긴 어렵다. 직접 가봐야 안다."
    `${name}의 분위기를 한마디로 정의하긴 어렵다. 직접 가봐야 안다.`,
    // Pattern: "{name}은 그런 곳이다. 한 번으로 끝나지 않는다."
    `${name}은 그런 곳이다. 한 번으로 끝나지 않는다.`,
    // Pattern: "다음에 또 오게 될 거다. {name}, 한 번은 가봐야 할 곳이다."
    `다음에 또 오게 될 거다. ${name}, 한 번은 가봐야 할 곳이다.`,
    // Pattern: "한번 와본 사람은 안다. 문 나설 때 아쉬운 곳, {name}이 그런 곳이다."
    `한번 와본 사람은 안다. 문 나설 때 아쉬운 곳, ${name}이 그런 곳이다.`,
    // Pattern with 한 번: "다음에 또 오게 될 거다."
    `다음에 또 오게 될 거다.`,
    // Pattern: "{name}에 대해 할 말이 더 있다."
    `${name}에 대해 할 말이 더 있다.`,
    // Pattern: "{name}, 직접 확인해봐라."
    `${name}, 직접 확인해봐라.`,
    // Remove trailing fillers that contain name
    `${name}의 진짜 매력은 두 번째 방문에서 드러난다.`,
  ];
}

// Also remove shared atmosphere fillers that add name mentions
function getAtmosphereFillers(name: string): string[] {
  return [
    `${name}을 찾는 이유가 사람마다 다르지만, 나가면서 표정은 다 비슷하다. 만족스러운 얼굴.`,
    `${name} 내부 조명은 시간대에 따라 자동으로 톤이 바뀐다.`,
    `${name}에서만 느낄 수 있는 감성이다.`,
  ];
}

let totalFillerRemoved = 0;
let totalDescFixed = 0;

for (const fileName of dataFiles) {
  const filePath = path.join(dataDir, fileName);
  let fileContent = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  for (const v of venues) {
    if (!fileContent.includes(`slug:'${v.slug}'`)) continue;

    // Check current density
    const fullContent = getFullContent(v);
    const { density, count } = calcDensity(fullContent, v.name);

    if (density <= 2.5) continue;

    // How many name mentions to remove to get to ~2.0%?
    const targetCount = Math.floor(0.020 * fullContent.length / v.name.length);
    const toRemove = count - targetCount;
    if (toRemove <= 0) continue;

    // Try removing filler patterns from description
    let desc = v.description;
    let removed = 0;
    const fillers = getFillerPatterns(v.name);

    for (const filler of fillers) {
      if (removed >= toRemove) break;
      if (desc.includes(filler)) {
        // Count name mentions in this filler
        let fillerNameCount = 0;
        let fidx = 0;
        while (true) {
          fidx = filler.indexOf(v.name, fidx);
          if (fidx === -1) break;
          fillerNameCount++;
          fidx += v.name.length;
        }

        desc = desc.replace(filler, '').replace(/\s{2,}/g, ' ').trim();
        removed += fillerNameCount;
        totalFillerRemoved++;
      }
    }

    // Also check atmosphere for shared fillers
    let atm = v.atmosphere;
    if (removed < toRemove) {
      const atmFillers = getAtmosphereFillers(v.name);
      for (const filler of atmFillers) {
        if (removed >= toRemove) break;
        if (atm.includes(filler)) {
          let fillerNameCount = 0;
          let fidx = 0;
          while (true) {
            fidx = filler.indexOf(v.name, fidx);
            if (fidx === -1) break;
            fillerNameCount++;
            fidx += v.name.length;
          }
          atm = atm.replace(filler, '').replace(/\s{2,}/g, ' ').trim();
          removed += fillerNameCount;
          totalFillerRemoved++;
        }
      }
    }

    // Apply description fix to file
    if (desc !== v.description) {
      const oldDescEscaped = v.description.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      const newDescEscaped = desc.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

      const oldPattern = `description:'${oldDescEscaped}'`;
      const newPattern = `description:'${newDescEscaped}'`;

      if (fileContent.includes(oldPattern)) {
        fileContent = fileContent.replace(oldPattern, newPattern);
        modified = true;
        totalDescFixed++;
      }
    }

    // Apply atmosphere fix to file
    if (atm !== v.atmosphere) {
      const oldAtmEscaped = v.atmosphere.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      const newAtmEscaped = atm.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

      const oldPattern = `atmosphere:'${oldAtmEscaped}'`;
      const newPattern = `atmosphere:'${newAtmEscaped}'`;

      if (fileContent.includes(oldPattern)) {
        fileContent = fileContent.replace(oldPattern, newPattern);
        modified = true;
      }
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, fileContent, 'utf-8');
    console.log(`✅ Updated ${fileName}`);
  }
}

console.log(`\nFiller sentences removed: ${totalFillerRemoved}`);
console.log(`Descriptions modified: ${totalDescFixed}`);
