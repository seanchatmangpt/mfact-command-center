const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`BROWSER_LOG [${msg.type()}]:`, msg.text()));
  page.on('pageerror', error => console.log('BROWSER_CRASH:', error.message));
  
  console.log("Navigating to live site...");
  await page.goto('https://seanchatmangpt.github.io/mfact-command-center/', { waitUntil: 'networkidle' });
  
  console.log("Navigation complete. Checking for rendering...");
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);
  if (bodyHTML.includes('id="root"></div>')) {
      console.log("UI_STATE: Blank screen (Root div is empty)");
  } else {
      console.log("UI_STATE: Rendered successfully");
  }
  
  await browser.close();
})();
