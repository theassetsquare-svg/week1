import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const DIR = 'screenshots';
mkdirSync(DIR, { recursive: true });

const BASE = 'http://localhost:4321';

const pages = [
  { name: 'phone-cheongdam', path: '/venue/cheongdam-h2o/', hasPhone: true },
  { name: 'phone-sinlim', path: '/venue/sinlim-grandprix/', hasPhone: true },
  { name: 'phone-suwon', path: '/venue/suwon-chancedom/', hasPhone: true },
  { name: 'nophone-gangnam', path: '/venue/gangnam-club-face/', hasPhone: false },
];

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/nix/store/y8mp45940i2xb6238kiykz0k87q0k8gx-chromium-126.0.6478.126/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  for (const vp of [
    { name: 'mobile', width: 390, height: 844, isMobile: true },
    { name: 'pc', width: 1280, height: 900, isMobile: false },
  ]) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
    });
    const page = await context.newPage();

    for (const p of pages) {
      console.log(`\n📸 ${vp.name.toUpperCase()} — ${p.name}`);
      await page.goto(BASE + p.path, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1500);

      // Scroll down a bit to trigger sticky elements
      await page.evaluate(() => window.scrollTo(0, 600));
      await page.waitForTimeout(800);

      await page.screenshot({
        path: `${DIR}/${p.name}-${vp.name}.png`,
        fullPage: false,
      });
      console.log(`   Saved: ${DIR}/${p.name}-${vp.name}.png`);

      // Check phone bar visibility
      const phoneBar = await page.evaluate(() => {
        const bar = document.querySelector('.phone-bar');
        if (!bar) return { exists: false };
        const style = window.getComputedStyle(bar);
        return {
          exists: true,
          display: style.display,
          text: bar.textContent.trim(),
          hasPhoneClass: bar.classList.contains('has-phone'),
          noPhoneClass: bar.classList.contains('no-phone'),
          height: style.height,
          background: style.background.substring(0, 50),
        };
      });
      console.log(`   Phone bar:`, JSON.stringify(phoneBar));

      // Check PC float button
      if (!vp.isMobile) {
        const floatBtn = await page.evaluate(() => {
          const btn = document.querySelector('.phone-float-pc');
          if (!btn) return { exists: false };
          const style = window.getComputedStyle(btn);
          return { exists: true, display: style.display, text: btn.textContent.trim() };
        });
        console.log(`   Float btn:`, JSON.stringify(floatBtn));
      }
    }
    await context.close();
  }
  await browser.close();
  console.log('\n✅ Done!');
})();
