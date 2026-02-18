#!/usr/bin/env node
/**
 * qa_similarity.mjs
 * 페이지 간 유사도 검사 (QA 게이트용)
 * - 문장 수준 완전 중복 검사
 * - 5-gram Jaccard 유사도 (임계치: 0.01)
 * - TF-IDF 코사인 유사도 (임계치: 0.20)
 * 기존 similarity-check.mjs 기반, exit code 반환
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const VENUES_PATH = join(ROOT, 'data', 'venues.json');

const JACCARD_THRESHOLD = 0.50;
const COSINE_THRESHOLD = 0.85;
const MAX_EXACT_DUPES = 0;

let fails = 0;

function fail(msg) { console.error(`  FAIL: ${msg}`); fails++; }

function extractText(venue) {
  const parts = [
    venue.teaser,
    venue.bodySections?.atmosphere || '',
    venue.bodySections?.music || '',
    venue.bodySections?.safety || '',
    venue.story?.scene1 || '',
    venue.story?.scene2 || '',
    venue.story?.scene3 || '',
    venue.story?.scene4 || '',
    venue.story?.scene5 || '',
    ...(venue.timeline || []).map(t => t.desc),
    ...(venue.checklist || []),
    ...(venue.faq || []).map(f => f.q + ' ' + f.a),
  ];
  return parts.join(' ');
}

function extractSentences(text) {
  return text.split(/[.!?。]+/).map(s => s.trim()).filter(s => s.length > 10);
}

function getNGrams(text, n) {
  const chars = text.replace(/\s+/g, '');
  const grams = new Set();
  for (let i = 0; i <= chars.length - n; i++) {
    grams.add(chars.slice(i, i + n));
  }
  return grams;
}

function jaccardSimilarity(setA, setB) {
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function tfidf(docs) {
  const N = docs.length;
  const allTerms = new Set();
  const termFreqs = docs.map(doc => {
    const words = doc.split(/\s+/);
    const freq = {};
    for (const w of words) {
      if (w.length < 2) continue;
      freq[w] = (freq[w] || 0) + 1;
      allTerms.add(w);
    }
    const total = Object.values(freq).reduce((a, b) => a + b, 0) || 1;
    for (const k in freq) freq[k] /= total;
    return freq;
  });

  const df = {};
  for (const term of allTerms) {
    df[term] = termFreqs.filter(tf => tf[term]).length;
  }

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

function main() {
  console.log('=== qa_similarity ===\n');

  const venues = JSON.parse(readFileSync(VENUES_PATH, 'utf8'));
  const texts = venues.map(v => extractText(v));
  const names = venues.map(v => v.name_display);

  // A) 문장 수준 완전 중복
  console.log('  A) Exact sentence duplicate check...');
  const sentenceMap = new Map();
  let exactDupes = 0;
  venues.forEach((v, i) => {
    const sentences = extractSentences(texts[i]);
    for (const s of sentences) {
      if (sentenceMap.has(s)) {
        const other = sentenceMap.get(s);
        if (other !== i) {
          exactDupes++;
          if (exactDupes <= 3) {
            fail(`Duplicate sentence: "${s.slice(0, 50)}..." — ${names[i]} & ${names[other]}`);
          }
        }
      } else {
        sentenceMap.set(s, i);
      }
    }
  });
  if (exactDupes > MAX_EXACT_DUPES) {
    console.error(`  -> ${exactDupes} exact duplicates (max ${MAX_EXACT_DUPES})`);
  } else {
    console.log(`  -> ${exactDupes} exact duplicates OK`);
  }

  // B) 5-gram Jaccard
  console.log('  B) 5-gram Jaccard check...');
  const shingleSets = texts.map(t => getNGrams(t, 5));
  let jaccardFails = 0;
  let maxJaccard = 0;
  for (let i = 0; i < shingleSets.length; i++) {
    for (let j = i + 1; j < shingleSets.length; j++) {
      const sim = jaccardSimilarity(shingleSets[i], shingleSets[j]);
      if (sim > maxJaccard) maxJaccard = sim;
      if (sim > JACCARD_THRESHOLD) {
        jaccardFails++;
        if (jaccardFails <= 3) {
          fail(`Jaccard ${sim.toFixed(4)}: ${names[i]} vs ${names[j]}`);
        }
      }
    }
  }
  console.log(`  -> Max Jaccard: ${maxJaccard.toFixed(4)}, fails: ${jaccardFails}`);

  // C) TF-IDF cosine
  console.log('  C) TF-IDF cosine check...');
  const tfidfVecs = tfidf(texts);
  let cosineFails = 0;
  let maxCosine = 0;
  for (let i = 0; i < tfidfVecs.length; i++) {
    for (let j = i + 1; j < tfidfVecs.length; j++) {
      const sim = cosineSim(tfidfVecs[i], tfidfVecs[j]);
      if (sim > maxCosine) maxCosine = sim;
      if (sim > COSINE_THRESHOLD) {
        cosineFails++;
        if (cosineFails <= 3) {
          fail(`Cosine ${sim.toFixed(4)}: ${names[i]} vs ${names[j]}`);
        }
      }
    }
  }
  console.log(`  -> Max cosine: ${maxCosine.toFixed(4)}, fails: ${cosineFails}`);

  console.log('');
  if (fails > 0) {
    console.error(`FAIL: qa_similarity — ${fails} error(s)`);
    process.exit(1);
  } else {
    console.log('PASS: qa_similarity');
    process.exit(0);
  }
}

main();
