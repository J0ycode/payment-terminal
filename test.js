const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const shotsDir = path.join(__dirname, 'shots');
  if (!fs.existsSync(shotsDir)) {
    fs.mkdirSync(shotsDir);
  }

  console.log('Launching browser...');
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  
  // Set viewport for good screenshots
  await page.setViewport({ width: 1280, height: 900 });
  
  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Wait for DB status
  await page.waitForSelector('.status-label');
  const dbStatus = await page.$eval('.status-label', el => el.textContent);
  console.log('DB Status on load:', dbStatus);

  // Take screenshot of empty state
  await page.screenshot({ path: path.join(shotsDir, '01_initial_load.png') });
  console.log('Took screenshot: 01_initial_load.png');

  // Test Credit Card
  console.log('Adding Credit Card payment...');
  await page.click('#tab-card');
  await page.click('#sample-card');
  await page.click('#add-card');
  await new Promise(r => setTimeout(r, 500));

  // Test PayPal
  console.log('Adding PayPal payment...');
  await page.click('#tab-paypal');
  await page.click('#sample-paypal');
  await page.click('#add-paypal');
  await new Promise(r => setTimeout(r, 500));

  // Test Bank Transfer
  console.log('Adding Bank Transfer payment...');
  await page.click('#tab-bank');
  await page.click('#sample-bank');
  await page.click('#add-bank');
  await new Promise(r => setTimeout(r, 500));

  // Take screenshot of queue
  await page.screenshot({ path: path.join(shotsDir, '02_queue_populated.png') });
  console.log('Took screenshot: 02_queue_populated.png');

  // Process all
  console.log('Processing all payments...');
  await page.click('#process-btn');
  
  // Wait for the receipts to show up (the fetch request takes some time)
  await page.waitForSelector('.ticket', { timeout: 10000 });
  // Wait a bit more for animations/DOM updates if any
  await new Promise(r => setTimeout(r, 1000));

  // Take screenshot of processed ledger
  await page.screenshot({ path: path.join(shotsDir, '03_ledger_processed.png') });
  console.log('Took screenshot: 03_ledger_processed.png');

  const historyCount = await page.$eval('#history-count', el => el.textContent);
  const totalValue = await page.$eval('#total-value', el => el.textContent);
  console.log(`Processed ${historyCount} payments successfully. Total value: $${totalValue}`);

  await browser.close();
  console.log('Testing completed successfully!');
})().catch(err => {
  console.error('Error during testing:', err);
  process.exit(1);
});
