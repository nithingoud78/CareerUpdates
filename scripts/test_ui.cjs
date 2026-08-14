const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.error('BROWSER ERROR:', error.message));

  console.log('Testing /admin ...');
  const adminRes = await page.goto('http://localhost:8081/admin', { waitUntil: 'networkidle' });
  console.log('Status:', adminRes.status());
  console.log('Final URL:', page.url());
  let content = await page.content();
  console.log('Contains "404"?', content.includes('404'));
  console.log('Contains "Admin"?', content.includes('Admin') || content.includes('admin'));
  await page.screenshot({ path: 'admin_screenshot.png' });

  console.log('\nTesting /search/admin ...');
  const searchAdminRes = await page.goto('http://localhost:8081/search/admin', { waitUntil: 'networkidle' });
  console.log('Status:', searchAdminRes.status());
  console.log('Final URL:', page.url());
  content = await page.content();
  console.log('Contains "404"?', content.includes('404'));
  await page.screenshot({ path: 'search_admin_screenshot.png' });

  await browser.close();
})();
