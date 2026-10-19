import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const browser = await chromium.launch();
const report = [];
await mkdir('artifacts', { recursive: true });
try {
  for (const width of [1440, 1024, 768, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: width < 768 ? 844 : 900 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001', { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      document.querySelectorAll('img').forEach(image => { image.loading = 'eager'; });
      await Promise.all([...document.images].map(image => image.complete ? Promise.resolve() : new Promise(resolve => { image.onload = resolve; image.onerror = resolve; setTimeout(resolve, 12000); })));
      await document.fonts.ready;
    });
    const metrics = await page.evaluate(() => ({
      width: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      sections: [...document.querySelectorAll('main section[id]')].map(section => section.id),
      brokenImages: [...document.images].filter(img => !img.complete || !img.naturalWidth).map(img => img.getAttribute('src')),
    }));
    await page.screenshot({ path: `artifacts/portfolio-${width}-full.png`, fullPage: true });
    if (width === 1440) await sharp('artifacts/portfolio-1440-full.png').resize({ width: 720 }).toFile('artifacts/portfolio-desktop-overview.png');
    report.push({ ...metrics, errors });
    await page.close();
  }
  await writeFile('artifacts/responsive-audit.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (report.some(item => item.documentWidth > item.width || item.errors.length || item.brokenImages.length)) process.exitCode = 1;
} finally {
  await browser.close();
}
