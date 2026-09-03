import { chromium } from 'playwright';
import fs from 'fs';

const RESUME_PATH = 'C:\\Users\\knith\\Downloads\\Nithin Software Resume.pdf';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Intercept network requests and responses to find out what's breaking
  page.on('response', async (response) => {
    if (response.url().includes('_server')) {
      console.log(`\n=== SERVER RESPONSE: ${response.status()} to ${response.url()} ===`);
      try {
        const text = await response.text();
        console.log("RESPONSE BODY:", text);
      } catch (e) {
        console.log('Failed to read response body', e);
      }
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`BROWSER ERROR: ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    console.log(`PAGE EXCEPTION: ${err.message}`);
  });

  console.log('Navigating to https://careerupdates.co.in/ats-checker...');
  await page.goto('https://careerupdates.co.in/ats-checker', { waitUntil: 'networkidle' });

  console.log('Uploading file...');
  // Force file upload on the hidden input
  await page.setInputFiles('input[type="file"]', RESUME_PATH);

  console.log('Waiting for extraction or error...');
  try {
    // Wait for either the error message or the extraction text area to populate
    await Promise.race([
      page.waitForSelector('text=Could not extract text from this document', { timeout: 15000 }),
      page.waitForFunction(() => {
        const textarea = document.querySelector('textarea#resume-text');
        return textarea && textarea.value.length > 50;
      }, { timeout: 15000 })
    ]);
  } catch (err) {
    console.log("Timeout waiting for result.", err);
  }

  // Let's print what is actually on the page
  const pageText = await page.evaluate(() => {
    const errorEl = document.querySelector('.bg-red-50');
    if (errorEl) return `ERROR SHOWN IN UI: ${errorEl.textContent}`;
    
    const textarea = document.querySelector('textarea#resume-text');
    if (textarea && textarea.value) return `TEXTAREA VALUE LENGTH: ${textarea.value.length}`;
    
    return "NO RESULT DETECTED";
  });
  console.log(pageText);

  await browser.close();
})();
