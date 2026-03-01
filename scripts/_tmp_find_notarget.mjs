#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const DIST = 'dist';

function walkHtml(dir, list = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walkHtml(p, list);
    else if (f.endsWith('.html')) list.push(p);
  }
  return list;
}

const htmlFiles = walkHtml(DIST);
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf-8');
  const links = html.match(/<a\s[^>]*href="[^"]*"[^>]*>/g) || [];
  const noTarget = links.filter(l =>
    !l.includes('target=') &&
    !l.includes('href="#') &&
    !l.includes('href="javascript')
  );
  if (noTarget.length > 0) {
    const relPath = file.replace(DIST + '/', '');
    console.log(`${relPath}: ${noTarget.length} links without target`);
    noTarget.forEach(l => console.log(`  ${l}`));
  }
}
