/**
 * Capture all 50 images from the challenge for analysis
 * Images are rendered in canvas elements inside buttons
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const URL = 'https://nightmare-image-match.base44.app/';
const OUTPUT_DIR = path.join(__dirname, 'challenge-captures', 'images');

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Fill form and start
    const inputs = await page.$$('input');
    if (inputs.length >= 3) {
      await inputs[0].fill('Test');
      await inputs[1].fill('User');
      await inputs[2].fill('test@example.com');
    }
    await page.click('button:has-text("Start Challenge"), [type="submit"], button');
    await page.waitForTimeout(3000);

    // Capture each image button (contains canvas with the actual image)
    for (let n = 1; n <= 50; n++) {
      const imgId = `IMG-${String(n).padStart(3, '0')}`;
      try {
        const btn = page.locator(`button:has-text("${imgId}")`).first();
        await btn.waitFor({ state: 'visible', timeout: 3000 });
        await btn.screenshot({ path: path.join(OUTPUT_DIR, `${imgId}.png`) });
        console.log(`Captured ${imgId}`);
      } catch (e) {
        console.log(`Failed ${imgId}:`, e.message);
      }
    }
  } finally {
    await browser.close();
  }
}

main();
