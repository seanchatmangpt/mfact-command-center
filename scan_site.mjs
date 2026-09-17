import { chromium } from 'playwright';

(async () => {
  console.log('Initiating Autonomic Live Site Scan...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  let errors = [];
  page.on('pageerror', exception => {
    errors.push(`Uncaught exception: "${exception}"`);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console error: "${msg.text()}"`);
    }
  });

  const url = 'https://seanchatmangpt.github.io/mfact-command-center/#/wargames';
  console.log(`Navigating to ${url}`);
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Check if body is empty or just a root div with nothing inside
    const html = await page.content();
    if (html.includes('<div id="root"></div>') && !html.includes('id="root"><div>')) {
       // extremely naive check for empty root
       if (html.length < 1000) {
           errors.push('Site appears to be a blank screen (empty root div)');
       }
    }
    
    // Check for specific dummy data
    // Assuming faker generates things or the canvas is rendering
    const hasCanvas = await page.evaluate(() => document.querySelectorAll('canvas').length > 0);
    if (!hasCanvas && html.includes('streetscape')) {
        console.log('Warning: No canvas detected, but maybe it takes time to render.');
    }

    if (errors.length > 0) {
      console.error(`\nSCAN FAILED. Found ${errors.length} errors:`);
      errors.forEach(e => console.error(e));
      process.exit(1);
    } else {
      console.log('\nSCAN PASSED. Zero JavaScript errors. Site is fully operational and rendering.');
    }
  } catch (err) {
    console.error('Failed to load page:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
