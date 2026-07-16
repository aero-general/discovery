import puppeteer from 'puppeteer-core';

const executablePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const baseUrl = process.env.AERO_TEST_URL || 'http://127.0.0.1:4173/';
const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
page.on('console', message => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`);
});
page.on('requestfailed', request => errors.push(`request failed: ${request.url()} ${request.failure()?.errorText || ''}`));

try {
  const response = await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 30000 });
  if (!response?.ok()) throw new Error(`Page returned HTTP ${response?.status()}`);

  await page.waitForFunction(() => document.documentElement.dataset.aeroBootstrap === 'ready', { timeout: 20000 });
  await page.waitForFunction(() => window.AeroCGI?.diagnostics?.().rendered >= 2, { timeout: 20000 });

  let diagnostics = await page.evaluate(() => window.AeroCGI.diagnostics());
  console.log('Landing diagnostics', diagnostics);
  if (!diagnostics.image.width || !diagnostics.image.height) throw new Error(`Sprite did not decode: ${JSON.stringify(diagnostics)}`);
  if (diagnostics.error) throw new Error(diagnostics.error);

  const canvasHasPixels = await page.evaluate(() => {
    const canvas = document.querySelector('.aero-cgi canvas');
    if (!canvas) return false;
    const context = canvas.getContext('2d');
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let index = 3; index < data.length; index += 4) if (data[index] > 0) return true;
    return false;
  });
  if (!canvasHasPixels) throw new Error('Aero canvas rendered no visible pixels.');

  await page.click('[data-open-aero]');
  await page.waitForSelector('.aero-chat.open', { visible: true, timeout: 5000 });
  const chatState = await page.$eval('.aero-launcher', element => element.getAttribute('aria-expanded'));
  if (chatState !== 'true') throw new Error('Chat launcher did not expose the open state.');
  await page.waitForFunction(() => window.AeroCGI?.diagnostics?.().rendered >= 3, { timeout: 5000 });

  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.aero-chat')?.classList.contains('open'));

  await page.click('[data-start-assessment]');
  await page.waitForSelector('#assessmentApp:not([hidden])', { visible: true, timeout: 5000 });
  await page.waitForFunction(() => document.querySelector('.wizard-head .aero-cgi')?.dataset.renderStatus === 'ready', { timeout: 5000 });

  diagnostics = await page.evaluate(() => window.AeroCGI.diagnostics());
  console.log('Final diagnostics', diagnostics);
  if (errors.length) throw new Error(`Browser errors detected:\n${errors.join('\n')}`);
  console.log('Aero runtime smoke test passed');
} finally {
  await browser.close();
}
