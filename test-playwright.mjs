import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:4173/ats-checker');
  
  // Create a proper txt file with >20 characters so it passes the length check
  const fs = await import('fs');
  fs.writeFileSync('test_long.txt', 'This is a long text file that has more than twenty characters in it so it passes the length check.');
  
  // Set the file input
  await page.setInputFiles('input[type="file"]', 'test_long.txt');
  
  // Wait for the text to appear or error to show
  await page.waitForTimeout(2000);
  
  // Log the whole text content of the page
  const bodyText = await page.innerText('body');
  console.log("BODY TEXT AFTER UPLOAD:", bodyText);
  
  // Specifically look for toast error
  const toasts = await page.$$eval('[role="status"]', els => els.map(e => e.textContent));
  console.log("TOASTS:", toasts);
  
  await browser.close();
}
run();
