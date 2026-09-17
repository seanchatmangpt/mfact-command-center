const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newContext().then(c => c.newPage());
  
  const errors = [];
  
  page.on('pageerror', err => {
    errors.push(`BROWSER_CRASH on ${page.url()}: ${err.message}`);
  });
  
  const baseUrl = 'https://seanchatmangpt.github.io/mfact-command-center/';
  
  console.log('Navigating to live site...');
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  
  // Also checking initial page for crash
  const rootText = await page.evaluate(() => document.body.innerText.trim());
  if (rootText.length < 10) {
    errors.push(`BLANK_SCREEN on ${baseUrl}: Page content too short or empty.`);
  }
  
  const hrefs = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a'));
    return anchors.map(a => a.href).filter(href => href && href.startsWith('https://seanchatmangpt.github.io/mfact-command-center/'));
  });
  
  const uniqueUrls = [...new Set(hrefs)];
  console.log(`Found ${uniqueUrls.length} internal routes to crawl:`, uniqueUrls);
  
  for (const url of uniqueUrls) {
    if (url === baseUrl || url === baseUrl + '#/') {
      // already crawled base above but okay
    }
    console.log(`Crawling: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Check if body is mostly empty (blank screen)
    const bodyText = await page.evaluate(() => document.body.innerText.trim());
    if (bodyText.length < 10) {
      errors.push(`BLANK_SCREEN on ${url}: Page content too short or empty.`);
    }
  }
  
  await browser.close();
  
  if (errors.length > 0) {
    console.log('Crawl completed with errors:');
    errors.forEach(e => console.error(e));
    process.exit(1);
  } else {
    console.log('Crawl completed successfully! No JS errors or blank screens detected on any routes.');
    process.exit(0);
  }
})();
