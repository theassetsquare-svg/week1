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
  const browser = await chromium.launch({ headless: true });

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      userAgent: vp.isMobile
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
        : undefined,
    });

    const page = await context.newPage();

    const jsErrors = [];
    page.on('pageerror', err => jsErrors.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') jsErrors.push(msg.text());
    });

    for (const p of pages) {
      const url = BASE + p.path;
      console.log(`\n📸 ${vp.name.toUpperCase()} — ${p.name} (${url})`);

      try {
        jsErrors.length = 0;
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(1000);

        const title = await page.title();
        console.log(`   Title: ${title}`);

        const status = title.includes('404') ? '❌ 404' : '✅ OK';
        console.log(`   Status: ${status}`);

        await page.screenshot({
          path: `${DIR}/${p.name}-${vp.name}.png`,
          fullPage: false,
        });
        console.log(`   Screenshot: ${DIR}/${p.name}-${vp.name}.png`);

        await page.screenshot({
          path: `${DIR}/${p.name}-${vp.name}-full.png`,
          fullPage: true,
        });
        console.log(`   Full page: ${DIR}/${p.name}-${vp.name}-full.png`);

        if (jsErrors.length > 0) {
          console.log(`   ⚠️  JS Errors (${jsErrors.length}):`);
          jsErrors.slice(0, 3).forEach(e => console.log(`      - ${e.substring(0, 120)}`));
        } else {
          console.log(`   ✅ No JS errors`);
        }

        const fontCheck = await page.evaluate(() => {
          const logo = document.querySelector('.site-logo');
          if (logo) {
            const style = window.getComputedStyle(logo);
            return { fontWeight: style.fontWeight, fontSize: style.fontSize, text: logo.textContent };
          }
          return null;
        });
        if (fontCheck) {
          console.log(`   Logo: "${fontCheck.text}" weight=${fontCheck.fontWeight} size=${fontCheck.fontSize}`);
        }

      } catch (err) {
        console.log(`   ❌ Error: ${err.message.substring(0, 100)}`);
      }
    }

    await context.close();
  }

  await browser.close();
  console.log('\n✅ All screenshots complete!');
})();
