const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console Error: ${msg.text()}`);
    }
  });
  page.on('pageerror', error => {
    errors.push(`Page Error: ${error.message}`);
  });
  
  console.log('Navigating to site...');
  await page.goto('https://seanchatmangpt.github.io/mfact-command-center/', { waitUntil: 'networkidle' });
  
  console.log('Waiting for network requests to settle...');
  await page.waitForTimeout(5000);
  
  if (errors.length > 0) {
    console.log('Found errors:');
    errors.forEach(e => console.log(e));
  } else {
    console.log('Zero JavaScript errors detected!');
  }
  
  // Check if main element is visible
  const content = await page.textContent('body');
  if (!content || content.trim().length === 0) {
    console.log('Error: Blank screen detected!');
  } else {
    console.log('Content rendered successfully. Body length:', content.length);
  }
  
  await browser.close();
})();
