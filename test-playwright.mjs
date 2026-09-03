import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => logs.push(`[CONSOLE] ${msg.type()}: ${msg.text()}`));
  
  const requests = [];
  page.on('request', request => {
    if (request.url().includes('supabase.co')) {
      requests.push(`[REQUEST] ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', async response => {
    if (response.url().includes('supabase.co')) {
      requests.push(`[RESPONSE] ${response.status()} ${response.url()}`);
    }
  });

  console.log('Navigating to Home...');
  await page.goto('http://localhost:8080/');
  await page.waitForTimeout(2000); // let things settle
  
  console.log('Clicking "Latest Jobs"...');
  await page.click('text="Latest Jobs"');
  
  console.log('Waiting up to 10s for jobs to load...');
  await page.waitForTimeout(10000);
  
  const searchContent = await page.locator('main').innerText();
  console.log('--- Search Page Content ---');
  console.log(searchContent.slice(0, 500));
  
  console.log('--- Logs ---');
  console.log(logs.join('\n'));
  
  console.log('--- Requests ---');
  console.log(requests.join('\n'));
  
  await browser.close();
})();
