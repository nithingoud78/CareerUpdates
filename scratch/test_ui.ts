import { chromium } from "playwright";

async function testCheckout() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto("http://localhost:8081/checkout/clean-professional-resume");
  await page.waitForSelector("form");
  
  await page.fill("#email", "test@example.com");
  await page.fill("#name", "Test User");
  await page.fill("#phone", "9876543210");
  
  await page.click("button[type='submit']");
  
  await page.waitForTimeout(5000);
  
  const errors = await page.locator(".bg-red-50").allTextContents();
  if (errors.length > 0) {
    console.log("ERRORS ON PAGE:", errors);
  } else {
    console.log("No visible red error boxes.");
  }
  
  await browser.close();
}

testCheckout().catch(console.error);
