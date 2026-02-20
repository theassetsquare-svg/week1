#!/usr/bin/env node
/**
 * qa_similarity.mjs
 * Page content similarity check for venue detail pages in dist/
 *
 * Checks:
 *   - Extract text content from each HTML (strip tags, scripts, styles)
 *   - For venue detail pages only: compute TF-IDF vectors
 *   - Compare all venue page pairs using cosine similarity
 *   - Flag pairs with similarity > 0.85 (too similar)
 *   - Each venue page must mention its store name (from title or H1) at least 8 times
 *
 * Report: total venue pages, pairs checked, similar pairs, store name density min/avg/max
 *
 * Exit 0 = PASS, Exit 1 = FAIL
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');

const COSINE_THRESHOLD = 0.85;
const MIN_STORE_NAME_COUNT = 8;

// ── helpers ──────────────────────────────────────────────

function walkHtml(dir, list = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walkHtml(full, list);
    } else if (entry.endsWith('.html')) {
      list.push(full);
    }
  }
  return list;
}

function isVenuePage(relPath) {
  return /^(club|night|lounge)\/[^/]+\/[^/]+/.test(relPath);
}

/**
 * Strip HTML tags, scripts, styles, and JSON-LD blocks to get plain text.
 */
function extractText(html) {
  let text = html;
  // remove script blocks (including JSON-LD)
  text = text.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  // remove style blocks
  text = text.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  // remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  // decode common HTML entities
  text = text.replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, ' ');
  // collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

/**
 * Extract store name from HTML content.
 * All venue names follow the pattern: "지역 이름 유형" (e.g., "강남 레이스 클럽").
 * Extract from title/h1 by finding everything up to and including the type word.
 */
function extractStoreName(html, relPath) {
  // Type words that end the store name
  const typePattern = /(클럽|나이트|라운지)/;

  // Sources to try, in order of reliability
  const sources = [];

  const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)
    || html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i);
  if (ogTitleMatch) sources.push(ogTitleMatch[1].trim());

  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) sources.push(titleMatch[1].trim());

  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) sources.push(h1Match[1].trim());

  for (const src of sources) {
    const typeIdx = src.search(typePattern);
    if (typeIdx >= 0) {
      const typeMatch = src.match(typePattern);
      const storeName = src.substring(0, typeIdx + typeMatch[0].length).trim();
      if (storeName.length >= 2 && storeName.length <= 30) {
        return storeName;
      }
    }
  }

  // Fallback: use URL path to construct name from breadcrumb
  const breadcrumbMatch = html.match(/<div class="breadcrumb">[^]*?<span>([^<]+)<\/span>\s*<\/div>/);
  if (breadcrumbMatch) {
    const shortName = breadcrumbMatch[1].trim();
    // Get type from URL
    const typeFromPath = relPath.startsWith('club') ? '클럽' : relPath.startsWith('night') ? '나이트' : '라운지';
    return shortName.includes(typeFromPath) ? shortName : `${shortName} ${typeFromPath}`;
  }

  // Final fallback: URL path segment
  const parts = relPath.split('/');
  if (parts.length >= 3) {
    const nameFromPath = decodeURIComponent(parts[2]);
    if (nameFromPath && nameFromPath !== 'index.html') {
      return nameFromPath;
    }
  }

  return null;
}

/**
 * Tokenize Korean+English text into words for TF-IDF.
 */
function tokenize(text) {
  // Split on whitespace, then also split Korean character sequences as individual tokens
  const raw = text.split(/\s+/);
  const tokens = [];
  for (const word of raw) {
    if (word.length < 2) continue;
    tokens.push(word);
  }
  return tokens;
}

/**
 * Compute TF-IDF vectors for an array of documents (each a string).
 */
function computeTfIdf(docs) {
  const N = docs.length;
  const allTerms = new Set();
  const termFreqs = docs.map(doc => {
    const words = tokenize(doc);
    const freq = {};
    for (const w of words) {
      freq[w] = (freq[w] || 0) + 1;
      allTerms.add(w);
    }
    const total = Object.values(freq).reduce((a, b) => a + b, 0) || 1;
    for (const k in freq) freq[k] /= total;
    return freq;
  });

  // document frequency
  const df = {};
  for (const term of allTerms) {
    df[term] = termFreqs.filter(tf => tf[term]).length;
  }

  // compute TF-IDF vectors
  return termFreqs.map(tf => {
    const vec = {};
    for (const term of allTerms) {
      if (tf[term]) {
        vec[term] = tf[term] * Math.log(N / (df[term] || 1));
      }
    }
    return vec;
  });
}

/**
 * Cosine similarity between two sparse vectors.
 */
function cosineSim(a, b) {
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0, magA = 0, magB = 0;
  for (const k of allKeys) {
    const va = a[k] || 0;
    const vb = b[k] || 0;
    dot += va * vb;
    magA += va * va;
    magB += vb * vb;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// ── main ─────────────────────────────────────────────────

function main() {
  console.log('=== qa_similarity — Page Content Similarity Check ===\n');

  const htmlFiles = walkHtml(DIST);
  const venuePages = [];

  // Collect venue pages
  for (const filePath of htmlFiles) {
    const relPath = relative(DIST, filePath);
    if (isVenuePage(relPath)) {
      const html = readFileSync(filePath, 'utf-8');
      const text = extractText(html);
      const storeName = extractStoreName(html, relPath);
      venuePages.push({ relPath, html, text, storeName });
    }
  }

  console.log(`Total venue pages: ${venuePages.length}`);

  let failCount = 0;
  const failures = [];

  // ── Store name density check ───────────────────────────
  const densities = [];
  for (const page of venuePages) {
    if (!page.storeName) {
      failCount++;
      failures.push(`${page.relPath}: could not extract store name`);
      densities.push(0);
      continue;
    }

    // Count occurrences of the store name in the full text
    const nameRegex = new RegExp(page.storeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = page.text.match(nameRegex);
    const count = matches ? matches.length : 0;
    densities.push(count);

    if (count < MIN_STORE_NAME_COUNT) {
      failCount++;
      failures.push(`${page.relPath}: store name "${page.storeName}" appears ${count} times (need >= ${MIN_STORE_NAME_COUNT})`);
    }
  }

  const densityMin = densities.length > 0 ? Math.min(...densities) : 0;
  const densityMax = densities.length > 0 ? Math.max(...densities) : 0;
  const densityAvg = densities.length > 0
    ? (densities.reduce((a, b) => a + b, 0) / densities.length).toFixed(1)
    : 0;

  // ── TF-IDF cosine similarity ───────────────────────────
  console.log('Computing TF-IDF vectors...');
  const texts = venuePages.map(p => p.text);
  const tfidfVecs = computeTfIdf(texts);

  let pairsChecked = 0;
  let similarPairs = 0;
  const similarPairsList = [];

  for (let i = 0; i < tfidfVecs.length; i++) {
    for (let j = i + 1; j < tfidfVecs.length; j++) {
      pairsChecked++;
      const sim = cosineSim(tfidfVecs[i], tfidfVecs[j]);
      if (sim > COSINE_THRESHOLD) {
        similarPairs++;
        failCount++;
        const msg = `similarity ${sim.toFixed(4)}: ${venuePages[i].relPath} vs ${venuePages[j].relPath}`;
        similarPairsList.push(msg);
        failures.push(msg);
      }
    }
  }

  // ── report ───────────────────────────────────────────
  console.log('');
  console.log(`Total venue pages: ${venuePages.length}`);
  console.log(`Pairs checked: ${pairsChecked}`);
  console.log(`Similar pairs (> ${COSINE_THRESHOLD}): ${similarPairs}`);
  console.log(`Store name density — min: ${densityMin}, avg: ${densityAvg}, max: ${densityMax}`);

  if (similarPairsList.length > 0) {
    console.log(`\nSimilar pairs (showing up to 10):`);
    for (const sp of similarPairsList.slice(0, 10)) {
      console.log(`  - ${sp}`);
    }
  }

  if (failures.length > 0) {
    console.log(`\nAll failures (${failures.length} total, showing up to 10):`);
    for (const f of failures.slice(0, 10)) {
      console.log(`  - ${f}`);
    }
    if (failures.length > 10) {
      console.log(`  ... and ${failures.length - 10} more`);
    }
  }

  console.log('');
  if (failCount > 0) {
    console.error(`FAIL: qa_similarity — ${failCount} issue(s) found`);
    process.exit(1);
  } else {
    console.log('PASS: qa_similarity — all venue pages OK');
    process.exit(0);
  }
}

main();
