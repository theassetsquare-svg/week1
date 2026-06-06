#!/usr/bin/env node
// Stage2 A1: context-preserving risk-word cleanup (NOLCOOL rule). No deletion — meaning-preserving substitution.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const RULES = [
  [/룸살롱|룸싸롱/g, '프라이빗룸'],
  [/노래방/g, '가라오케'],
  [/초이스/g, '셀렉션'],
  [/밤문화/g, '나이트라이프'],
  // 유흥 — context first
  [/유흥가/g, '번화가'],
  [/1종\s*유흥업소\s*등록/g, '정식 영업 등록'],
  [/유흥업소/g, '영업장'],
  [/유흥\s*시설/g, '위락 시설'],
  [/유흥\s*문화/g, '나이트라이프 문화'],
  [/유흥/g, '번화가'],
  // 2차 — "1차 끝나고 2차" = after-party. Preserve penalty tiers (2차 위반/경고/정지).
  [/2차\s*3차/g, '다음 자리'],
  [/2차\s*장소/g, '뒤풀이 장소'],
  [/2차\s*코스/g, '뒤풀이 코스'],
  [/2차까지/g, '뒤풀이까지'],
  [/2차로/g, '다음 자리로'],
  [/2차(?!\s*(위반|경고|정지))/g, '뒤풀이'],
];

// dirs to process (served + source). scripts/ excluded (gate references the words).
const ROOTS = ['src', 'public'];
const EXT = new Set(['.ts', '.astro', '.html', '.txt', '.json', '.js', '.mjs', '.css']);
const SKIP_DIR = new Set(['node_modules', 'dist', '_astro']);

function walk(d, out = []) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (SKIP_DIR.has(e)) continue;
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (EXT.has(extname(e))) out.push(p);
  }
  return out;
}

let totalFiles = 0, totalRepl = 0;
const report = [];
for (const root of ROOTS) {
  let files;
  try { files = walk(root); } catch { continue; }
  for (const f of files) {
    const orig = readFileSync(f, 'utf8');
    let out = orig, n = 0;
    for (const [re, rep] of RULES) {
      out = out.replace(re, (m) => { n++; return rep; });
    }
    if (n > 0 && out !== orig) {
      writeFileSync(f, out);
      totalFiles++; totalRepl += n;
      report.push(`${n}\t${f}`);
    }
  }
}
report.sort((a, b) => parseInt(b) - parseInt(a));
console.log(report.join('\n'));
console.log(`\n--- ${totalRepl} replacements across ${totalFiles} files ---`);
