#!/usr/bin/env node
/**
 * geocode.mjs - Geocodes venues using OpenStreetMap Nominatim
 * Respects 1 req/sec rate limit, caches results
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const VENUES_PATH = join(ROOT, 'data', 'venues.json');
const CACHE_PATH = join(ROOT, 'data', 'geocache.json');

const USER_AGENT = 'NightlifeKorea/1.0 (nightlife-seo-site)';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function geocodeQuery(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=kr&limit=1&addressdetails=1`;
  const resp = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT }
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  if (data.length === 0) return null;
  const r = data[0];
  const addr = r.address || {};
  return {
    formatted_address: r.display_name || '',
    lat: parseFloat(r.lat),
    lon: parseFloat(r.lon),
    city: addr.city || addr.county || addr.state || '',
    district: addr.suburb || addr.city_district || addr.borough || '',
    neighborhood: addr.neighbourhood || addr.quarter || '',
    precision: 'nominatim',
  };
}

// Region center fallbacks (approximate)
const REGION_FALLBACKS = {
  gangnam: { lat: 37.4979, lon: 127.0276, city: '서울특별시', district: '강남구' },
  cheongdam: { lat: 37.5199, lon: 127.0474, city: '서울특별시', district: '강남구' },
  itaewon: { lat: 37.5340, lon: 126.9948, city: '서울특별시', district: '용산구' },
  sangbong: { lat: 37.5967, lon: 127.0856, city: '서울특별시', district: '중랑구' },
  suyu: { lat: 37.6380, lon: 127.0257, city: '서울특별시', district: '강북구' },
  nowon: { lat: 37.6542, lon: 127.0568, city: '서울특별시', district: '노원구' },
  gildong: { lat: 37.5347, lon: 127.1401, city: '서울특별시', district: '강동구' },
  sinlim: { lat: 37.4842, lon: 126.9293, city: '서울특별시', district: '관악구' },
  doksan: { lat: 37.4684, lon: 126.8953, city: '서울특별시', district: '금천구' },
  gangseo: { lat: 37.5509, lon: 126.8496, city: '서울특별시', district: '강서구' },
  seongnam: { lat: 37.4200, lon: 127.1267, city: '성남시', district: '' },
  ilsan: { lat: 37.6580, lon: 126.7700, city: '고양시', district: '일산' },
  incheon: { lat: 37.4563, lon: 126.7052, city: '인천광역시', district: '' },
  suwon: { lat: 37.2636, lon: 127.0286, city: '수원시', district: '' },
  cheonan: { lat: 36.8151, lon: 127.1139, city: '천안시', district: '' },
  daegu: { lat: 35.8714, lon: 128.6014, city: '대구광역시', district: '' },
  busan: { lat: 35.1796, lon: 129.0756, city: '부산광역시', district: '' },
};

async function main() {
  const venues = JSON.parse(readFileSync(VENUES_PATH, 'utf8'));
  let cache = {};
  if (existsSync(CACHE_PATH)) {
    cache = JSON.parse(readFileSync(CACHE_PATH, 'utf8'));
  }

  let geocoded = 0;
  let cached = 0;
  let fallback = 0;

  for (const venue of venues) {
    const cacheKey = venue.name_input;

    if (cache[cacheKey]) {
      Object.assign(venue.geo, cache[cacheKey]);
      cached++;
      continue;
    }

    // Try geocoding with venue name + region
    const query = `${venue.name_input}, ${venue.region}, 대한민국`;
    let result = await geocodeQuery(query);
    await sleep(1100);

    if (!result) {
      // Try region only
      const regionQuery = `${venue.region}, 대한민국`;
      result = await geocodeQuery(regionQuery);
      await sleep(1100);
    }

    if (result) {
      venue.geo = result;
      cache[cacheKey] = result;
      geocoded++;
      console.log(`  ✅ Geocoded: ${venue.name_input} → ${result.formatted_address.slice(0, 60)}`);
    } else {
      // Use fallback
      const fb = REGION_FALLBACKS[venue.regionSlug];
      if (fb) {
        venue.geo = {
          formatted_address: '확인 필요',
          lat: fb.lat,
          lon: fb.lon,
          city: fb.city,
          district: fb.district,
          neighborhood: '',
          precision: 'region-fallback',
        };
        cache[cacheKey] = venue.geo;
        fallback++;
        console.log(`  ⚠️ Fallback: ${venue.name_input} → ${fb.city} ${fb.district}`);
      } else {
        venue.geo.precision = 'none';
        console.log(`  ❌ Failed: ${venue.name_input}`);
      }
    }
  }

  // Compute nearby venues (within 3km)
  venues.forEach((v, i) => {
    if (v.geo.lat && v.geo.lon) {
      const nearby = venues
        .filter((o, j) => j !== i && o.geo.lat && o.geo.lon)
        .map(o => ({
          id: o.id,
          dist: haversine(v.geo.lat, v.geo.lon, o.geo.lat, o.geo.lon),
        }))
        .filter(o => o.dist <= 3)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 6)
        .map(o => o.id);
      v.relatedVenueIds.nearby = nearby;
    }
  });

  writeFileSync(VENUES_PATH, JSON.stringify(venues, null, 2), 'utf8');
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8');
  console.log(`\n📍 Geocoding complete: ${geocoded} geocoded, ${cached} cached, ${fallback} fallback`);
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

main().catch(e => { console.error(e); process.exit(1); });
