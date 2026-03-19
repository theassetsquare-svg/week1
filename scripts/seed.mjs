#!/usr/bin/env node
/**
 * Seed script — reads static venue data and inserts into Supabase.
 *
 * Usage:
 *   PUBLIC_SUPABASE_URL=... PUBLIC_SUPABASE_ANON_KEY=... node scripts/seed.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { nightsSeoul } from '../src/data/nights-seoul.ts';
import { nightsGyeonggi } from '../src/data/nights-gyeonggi.ts';
import { nightsOther } from '../src/data/nights-other.ts';
import { clubVenues } from '../src/data/clubs-data.ts';
import { loungeVenues } from '../src/data/lounges-data.ts';
import { otherVenues } from '../src/data/others-data.ts';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY env vars.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const allVenues = [
  ...nightsSeoul,
  ...nightsGyeonggi,
  ...nightsOther,
  ...clubVenues,
  ...loungeVenues,
  ...otherVenues,
];

function toSnake(venue) {
  return {
    id: venue.id,
    slug: venue.slug,
    name: venue.name,
    type: venue.type,
    type_name: venue.typeName,
    nickname: venue.nickname || null,
    phone: venue.phone || null,
    region: venue.region,
    region_slug: venue.regionSlug,
    address: venue.address,
    short_desc: venue.shortDesc,
    description: venue.description,
    atmosphere: venue.atmosphere,
    music: venue.music,
    highlights: venue.highlights,
    timeline: venue.timeline,
    faq: venue.faq,
    tags: venue.tags,
    seo_title: venue.seoTitle,
    seo_description: venue.seoDescription,
    h1_title: venue.h1Title,
  };
}

async function seed() {
  console.log(`Seeding ${allVenues.length} venues...`);

  // Batch insert in chunks of 50
  const chunkSize = 50;
  for (let i = 0; i < allVenues.length; i += chunkSize) {
    const chunk = allVenues.slice(i, i + chunkSize).map(toSnake);
    const { error } = await supabase.from('venues').upsert(chunk, { onConflict: 'slug' });
    if (error) {
      console.error(`Error inserting chunk ${i / chunkSize + 1}:`, error.message);
    } else {
      console.log(`Inserted chunk ${i / chunkSize + 1} (${chunk.length} venues)`);
    }
  }

  console.log('Done.');
}

seed();
