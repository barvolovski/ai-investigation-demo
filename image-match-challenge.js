/**
 * Image Match Challenge - Nightmare Mode
 * Script to automate the challenge at https://nightmare-image-match.base44.app/
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, 'challenge-captures');
const URL = 'https://nightmare-image-match.base44.app/';

async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  try {
    console.log('Navigating to challenge...');
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Take initial snapshot
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01-initial.png') });
    console.log('Saved initial page screenshot');

    // Fill in the form - try multiple selector strategies
    const inputs = await page.$$('input');
    if (inputs.length >= 3) {
      await inputs[0].fill('Test');
      await inputs[1].fill('User');
      await inputs[2].fill('test@example.com');
    }
    await page.waitForTimeout(500);

    // Click Start Challenge
    await page.click('button:has-text("Start Challenge"), [type="submit"], button');
    await page.waitForTimeout(3000);

    // Take screenshot of challenge page
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02-challenge-page.png') });
    console.log('Saved challenge page screenshot');

    // Try to find images and descriptions - adapt selectors based on actual page structure
    const images = await page.$$('img');
    console.log(`Found ${images.length} images`);
    
    for (let i = 0; i < images.length; i++) {
      try {
        await images[i].screenshot({ path: path.join(OUTPUT_DIR, `image-${i}.png`) });
        console.log(`Saved image ${i}`);
      } catch (e) {
        console.log(`Could not capture image ${i}:`, e.message);
      }
    }

    // Get all text content for descriptions
    const pageContent = await page.content();
    fs.writeFileSync(path.join(OUTPUT_DIR, 'page-content.html'), pageContent);
    console.log('Saved page HTML');

    // Wait for user to see results
    await page.waitForTimeout(5000);
  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'error.png') });
  } finally {
    await browser.close();
  }
}

main();
