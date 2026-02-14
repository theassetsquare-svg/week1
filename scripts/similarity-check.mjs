#!/usr/bin/env node
/**
 * similarity-check.mjs
 * Build-time similarity guard:
 * A) Exact sentence duplicate check
 * B) 5-gram shingle Jaccard guard (≤0.01)
 * C) TF-IDF cosine guard (≤0.20)
 * Also generates QA report.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const VENUES_PATH = join(ROOT, 'data', 'venues.json');

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

  const tfidfVecs = termFreqs.map(tf => {
    const vec = {};
    for (const term of allTerms) {
      if (tf[term]) {
        vec[term] = tf[term] * Math.log(N / (df[term] || 1));
      }
    }
    return vec;
  });

  return tfidfVecs;
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
  const venues = JSON.parse(readFileSync(VENUES_PATH, 'utf8'));
  const texts = venues.map(v => extractText(v));
  const names = venues.map(v => v.name_display);

  console.log('═══════════════════════════════════════════');
  console.log('  SIMILARITY CHECK & QA REPORT');
  console.log('═══════════════════════════════════════════\n');

  // A) Exact sentence duplicate guard
  console.log('📋 A) Exact sentence duplicate check...');
  const sentenceMap = new Map();
  let exactDupes = 0;
  venues.forEach((v, i) => {
    const sentences = extractSentences(texts[i]);
    for (const s of sentences) {
      if (sentenceMap.has(s)) {
        const other = sentenceMap.get(s);
        if (other !== i) {
          exactDupes++;
          if (exactDupes <= 5) {
            console.log(`  ⚠️ Duplicate: "${s.slice(0, 50)}..." in ${names[i]} & ${names[other]}`);
          }
        }
      } else {
        sentenceMap.set(s, i);
      }
    }
  });
  console.log(`  → ${exactDupes} exact sentence duplicates found ${exactDupes === 0 ? '✅' : '⚠️'}\n`);

  // B) 5-gram shingle Jaccard guard
  console.log('📋 B) 5-gram shingle Jaccard check (threshold ≤ 0.01)...');
  const shingleSets = texts.map(t => getNGrams(t, 5));
  let jaccardFails = 0;
  let maxJaccard = 0;
  for (let i = 0; i < shingleSets.length; i++) {
    for (let j = i + 1; j < shingleSets.length; j++) {
      const sim = jaccardSimilarity(shingleSets[i], shingleSets[j]);
      if (sim > maxJaccard) maxJaccard = sim;
      if (sim > 0.01) {
        jaccardFails++;
        if (jaccardFails <= 3) {
          console.log(`  ⚠️ Jaccard ${sim.toFixed(4)}: ${names[i]} vs ${names[j]}`);
        }
      }
    }
  }
  console.log(`  → Max Jaccard: ${maxJaccard.toFixed(4)}, Fails: ${jaccardFails} ${jaccardFails === 0 ? '✅' : '⚠️'}\n`);

  // C) TF-IDF cosine guard
  console.log('📋 C) TF-IDF cosine check (threshold ≤ 0.20)...');
  const tfidfVecs = tfidf(texts);
  let cosineFails = 0;
  let maxCosine = 0;
  for (let i = 0; i < tfidfVecs.length; i++) {
    for (let j = i + 1; j < tfidfVecs.length; j++) {
      const sim = cosineSim(tfidfVecs[i], tfidfVecs[j]);
      if (sim > maxCosine) maxCosine = sim;
      if (sim > 0.20) {
        cosineFails++;
        if (cosineFails <= 3) {
          console.log(`  ⚠️ Cosine ${sim.toFixed(4)}: ${names[i]} vs ${names[j]}`);
        }
      }
    }
  }
  console.log(`  → Max cosine: ${maxCosine.toFixed(4)}, Fails: ${cosineFails} ${cosineFails === 0 ? '✅' : '⚠️'}\n`);

  // QA Report
  console.log('═══════════════════════════════════════════');
  console.log('  CONTENT QA REPORT');
  console.log('═══════════════════════════════════════════\n');

  // Reading time per venue
  const KR_CHARS_PER_MIN = 500;
  venues.forEach((v, i) => {
    const charCount = texts[i].replace(/\s/g, '').length;
    const readMin = Math.ceil(charCount / KR_CHARS_PER_MIN);
    const geoStatus = v.geo.precision === 'none' ? '❌' : v.geo.precision === 'region-fallback' ? '⚠️' : '✅';
    const sameRegion = v.relatedVenueIds.sameRegion.length;
    const sameType = v.relatedVenueIds.sameType.length;
    const nearby = v.relatedVenueIds.nearby.length;

    console.log(`  ${v.name_display.padEnd(20)} | ${charCount}자 ~${readMin}분 | Geo:${geoStatus} | Links: 지역${sameRegion} 유형${sameType} 근처${nearby}`);
  });

  console.log('\n═══════════════════════════════════════════');

  // Final verdict
  const totalFails = exactDupes + jaccardFails + cosineFails;
  if (totalFails > 0) {
    console.log(`⚠️  ${totalFails} similarity issues found. Review recommended.`);
  } else {
    console.log('✅ All similarity checks PASSED!');
  }
  console.log('═══════════════════════════════════════════\n');
}

main();
