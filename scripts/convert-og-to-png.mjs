/**
 * Post-build: Convert all OG SVG images in dist/og/ to PNG
 * So social media platforms can render thumbnails properly
 */
import sharp from 'sharp';
import { readdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

const ogDir = join(process.cwd(), 'dist', 'og');

if (!existsSync(ogDir)) {
  console.log('skip: convert-og-to-png.mjs (no dist/og/)');
  process.exit(0);
}

const svgs = readdirSync(ogDir).filter(f => f.endsWith('.svg'));
let converted = 0;
let failed = 0;

for (const svg of svgs) {
  const svgPath = join(ogDir, svg);
  const pngPath = svgPath.replace(/\.svg$/, '.png');
  try {
    const svgBuf = readFileSync(svgPath);
    await sharp(svgBuf).resize(1200, 630).png({ quality: 90 }).toFile(pngPath);
    converted++;
  } catch (e) {
    console.log(`  ✗ ${svg}: ${e.message}`);
    failed++;
  }
}

console.log(`OG images: ${converted} converted to PNG${failed ? `, ${failed} failed` : ''}`);
