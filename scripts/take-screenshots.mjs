import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'https://week1-6m5.pages.dev';
const DIR = 'screenshots';
mkdirSync(DIR, { recursive: true });

const pages = [
  { name: '01-home', path: '/' },
  { name: '02-clubs', path: '/clubs/' },
  { name: '03-nights', path: '/nights/' },
  { name: '04-venue-detail', path: '/venue/gangnam-club-face/' },
  { name: '05-nolcool', path: '/nolcool/' },
  { name: '06-venue-hoppa', path: '/venue/busan-hoppa-aura/' },
  { name: '07-ranking', path: '/ranking/' },
  { name: '08-nolcool-night', path: '/nolcool/night/gangnam-juliana/' },
];

const viewports = [
  { name: 'mobile', width: 390, height: 844, isMobile: true },
  { name: 'pc', width: 1280, height: 800, isMobile: false },
];

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || '/nix/store/y8mp45940i2xb6238kiykz0k87q0k8gx-chromium-126.0.6478.126/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      userAgent: vp.isMobile
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
        : undefined,
    });

    const page = await context.newPage();
    const jsErrors = [];
    page.on('pageerror', err => jsErrors.push(err.message));
    page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });

    for (const p of pages) {
      const url = BASE + p.path;
      console.log(`\n📸 ${vp.name.toUpperCase()} — ${p.name} (${url})`);
      try {
        jsErrors.length = 0;
        await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(1500);

        const title = await page.title();
        console.log(`   Title: ${title}`);
        console.log(`   Status: ${title.includes('404') ? '❌ 404' : '✅ OK'}`);

        await page.screenshot({ path: `${DIR}/${p.name}-${vp.name}.png`, fullPage: false });
        console.log(`   Screenshot saved`);

        if (jsErrors.length > 0) {
          console.log(`   ⚠️  JS Errors (${jsErrors.length}):`);
          jsErrors.slice(0, 5).forEach(e => console.log(`      - ${e.substring(0, 150)}`));
        } else {
          console.log(`   ✅ No JS errors`);
        }

        const checks = await page.evaluate(() => {
          const results = {};
          const logo = document.querySelector('.site-logo');
          if (logo) {
            const s = window.getComputedStyle(logo);
            results.logo = { text: logo.textContent, weight: s.fontWeight, size: s.fontSize };
          }
          results.viewport = { width: window.innerWidth, height: window.innerHeight };
          const overflow = document.body.scrollWidth > window.innerWidth;
          results.horizontalOverflow = overflow;
          const smallFonts = [];
          document.querySelectorAll('p, span, a, div, li, td').forEach(el => {
            const fs = parseFloat(window.getComputedStyle(el).fontSize);
            if (fs < 12 && el.textContent.trim().length > 0 && el.offsetHeight > 0) {
              smallFonts.push({ tag: el.tagName, text: el.textContent.substring(0,30), size: fs });
            }
          });
          results.smallFonts = smallFonts.slice(0, 5);
          return results;
        });

        if (checks.logo) console.log(`   Logo: "${checks.logo.text}" weight=${checks.logo.weight}`);
        if (checks.horizontalOverflow) console.log(`   ❌ Horizontal overflow detected!`);
        else console.log(`   ✅ No horizontal overflow`);
        if (checks.smallFonts.length > 0) {
          console.log(`   ⚠️  Small fonts (<12px): ${checks.smallFonts.length}`);
          checks.smallFonts.forEach(f => console.log(`      - <${f.tag}> "${f.text}" ${f.size}px`));
        }
      } catch (err) {
        console.log(`   ❌ Error: ${err.message.substring(0, 120)}`);
      }
    }
    await context.close();
  }
  await browser.close();
  console.log('\n✅ All screenshots complete!');
})();
