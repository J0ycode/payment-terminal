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
  
  // Set viewport for good presentation screenshots
  await page.setViewport({ width: 1280, height: 900 });
  
  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Wait for DB status
  await page.waitForSelector('.status-label');
  const dbStatus = await page.$eval('.status-label', el => el.textContent);
  console.log('DB Status on load:', dbStatus);

  // 1. Initial Load
  await page.screenshot({ path: path.join(shotsDir, '01_initial_load.png') });
  console.log('Took screenshot: 01_initial_load.png');

  // 2. Credit Card Form
  console.log('Filling Credit Card...');
  await page.click('#tab-card');
  await page.click('#sample-card');
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(shotsDir, '02_credit_card_filled.png') });
  console.log('Took screenshot: 02_credit_card_filled.png');
  await page.click('#add-card');
  await new Promise(r => setTimeout(r, 500));

  // 3. PayPal Form
  console.log('Filling PayPal...');
  await page.click('#tab-paypal');
  await page.click('#sample-paypal');
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(shotsDir, '03_paypal_filled.png') });
  console.log('Took screenshot: 03_paypal_filled.png');
  await page.click('#add-paypal');
  await new Promise(r => setTimeout(r, 500));

  // 4. Bank Transfer Form
  console.log('Filling Bank Transfer...');
  await page.click('#tab-bank');
  await page.click('#sample-bank');
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(shotsDir, '04_bank_transfer_filled.png') });
  console.log('Took screenshot: 04_bank_transfer_filled.png');
  await page.click('#add-bank');
  await new Promise(r => setTimeout(r, 500));

  // 5. Queue Ready
  await page.screenshot({ path: path.join(shotsDir, '05_queue_ready.png') });
  console.log('Took screenshot: 05_queue_ready.png');

  // 6. Processed Ledger
  console.log('Processing all payments...');
  await page.click('#process-btn');
  
  // Wait for the receipts to show up
  await page.waitForSelector('.ticket', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000)); // allow animations to settle

  await page.screenshot({ path: path.join(shotsDir, '06_receipts_generated.png') });
  console.log('Took screenshot: 06_receipts_generated.png');

  const historyCount = await page.$eval('#history-count', el => el.textContent);
  const totalValue = await page.$eval('#total-value', el => el.textContent);
  console.log(`Processed ${historyCount} payments successfully. Total value: $${totalValue}`);

  await browser.close();
  console.log('Testing completed successfully!');
})().catch(err => {
  console.error('Error during testing:', err);
  process.exit(1);
});
