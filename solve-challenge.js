/**
 * Solve Image Match Challenge - Match IMG-N to DESC-N
 * The challenge pairs images with descriptions by ID number
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const URL = 'https://nightmare-image-match.base44.app/';
const OUTPUT_DIR = path.join(__dirname, 'challenge-captures');

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  try {
    console.log('Navigating to challenge...');
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

    // Match IMG-N to DESC-N for each pair
    const matches = [];
    for (let n = 1; n <= 50; n++) {
      const imgId = `IMG-${String(n).padStart(3, '0')}`;
      const descId = `DESC-${String(n).padStart(3, '0')}`;
      
      try {
        // Click the image button
        const imgButton = page.locator(`button:has-text("${imgId}")`).first();
        await imgButton.waitFor({ state: 'visible', timeout: 5000 });
        await imgButton.click();
        await page.waitForTimeout(150);

        // Click the matching description button
        const descButton = page.locator(`button:has-text("${descId}")`).first();
        await descButton.waitFor({ state: 'visible', timeout: 5000 });
        await descButton.click();
        
        matches.push({ imgId, descId, success: true });
        console.log(`Matched ${imgId} -> ${descId}`);
        await page.waitForTimeout(100);
      } catch (e) {
        console.log(`Failed ${imgId} -> ${descId}:`, e.message);
        matches.push({ imgId, descId, success: false });
      }
    }

    // Take final screenshot
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'final-result.png') });
    console.log('Saved final result screenshot');
    
    // Wait to see result
    await page.waitForTimeout(5000);
  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'error.png') });
  } finally {
    await browser.close();
  }
}

main();
