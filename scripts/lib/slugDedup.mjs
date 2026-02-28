/**
 * slugDedup.mjs — URL slug normalization utility
 * Removes duplicate path segments, preserving first occurrence.
 *
 * Usage:
 *   import { dedupSlug, normalizeVenuePath } from './slugDedup.mjs';
 *
 *   dedupSlug('gangnam-gangnam-레이스')  → 'gangnam-레이스'
 *   normalizeVenuePath('/club/gangnam/gangnam-클럽/')  → '/club/gangnam/클럽/'
 */

/**
 * Remove duplicate hyphen-separated tokens within a slug.
 * First occurrence wins; subsequent duplicates are dropped.
 */
export function dedupSlug(slug) {
  const parts = slug.split('-');
  const seen = new Set();
  const deduped = parts.filter(p => {
    if (seen.has(p)) return false;
    seen.add(p);
    return true;
  });
  return deduped.join('-');
}

/**
 * Normalize a full venue path by:
 *  1. Removing category/region tokens from the slug segment
 *  2. Deduplicating within the slug
 * Expects format: /{category}/{region}/{slug}/
 */
export function normalizeVenuePath(path) {
  // Strip trailing/leading slashes for processing
  const trimmed = path.replace(/^\/|\/$/g, '');
  const segments = trimmed.split('/');
  if (segments.length < 3) return path; // not a venue path

  const [category, region, slugRaw] = segments;
  if (!category || !region || !slugRaw) return path;

  // Remove category and region tokens from slug
  const catKr = { club: '클럽', night: '나이트', lounge: '라운지' };
  let slug = slugRaw;

  // Remove Korean category token
  const catToken = catKr[category];
  if (catToken) {
    const c = slug.split('-').filter(p => p !== catToken).join('-');
    if (c.length > 0) slug = c;
  }

  // Remove region slug token
  const rCleaned = slug.split('-').filter(p => p !== region).join('-');
  if (rCleaned.length > 0) slug = rCleaned;

  // Dedup remaining tokens
  slug = dedupSlug(slug);

  return `/${category}/${region}/${slug}/`;
}

/**
 * Build canonical URL from base + venue path with dedup applied.
 */
export function buildCanonicalUrl(siteBase, venuePath) {
  const normalized = normalizeVenuePath(venuePath);
  return siteBase.replace(/\/$/, '') + normalized;
}

// ── Self-test (run: node scripts/lib/slugDedup.mjs) ──────────────────────────
if (process.argv[1] && process.argv[1].endsWith('slugDedup.mjs')) {
  let passed = 0;
  let failed = 0;

  function assert(label, actual, expected) {
    if (actual === expected) {
      console.log(`  ✓ ${label}`);
      passed++;
    } else {
      console.error(`  ✗ ${label}\n    expected: ${expected}\n    actual:   ${actual}`);
      failed++;
    }
  }

  console.log('\n── slugDedup tests ──');

  // dedupSlug
  assert('no dups', dedupSlug('레이스'), '레이스');
  assert('adjacent dup', dedupSlug('gangnam-gangnam'), 'gangnam');
  assert('non-adjacent dup', dedupSlug('레이스-클럽-레이스'), '레이스-클럽');
  assert('three tokens same', dedupSlug('a-a-a'), 'a');
  assert('mixed', dedupSlug('강남-레이스-강남-나이트'), '강남-레이스-나이트');

  // normalizeVenuePath
  assert('club path remove cat', normalizeVenuePath('/club/gangnam/레이스-클럽/'), '/club/gangnam/레이스/');
  assert('night path remove cat', normalizeVenuePath('/night/hongdae/홍대-나이트/'), '/night/hongdae/홍대/');
  assert('lounge path remove region', normalizeVenuePath('/lounge/itaewon/itaewon-스카이/'), '/lounge/itaewon/스카이/');
  assert('already clean', normalizeVenuePath('/club/gangnam/레이스/'), '/club/gangnam/레이스/');
  assert('short path passthrough', normalizeVenuePath('/clubs/'), '/clubs/');

  // buildCanonicalUrl
  assert('canonical build', buildCanonicalUrl('https://week1-6m5.pages.dev', '/club/gangnam/레이스-클럽/'), 'https://week1-6m5.pages.dev/club/gangnam/레이스/');

  console.log(`\n  ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}
