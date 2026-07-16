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
  if (message.type() === 'error' && !message.text().includes('Unable to load Aero CGI sprite')) errors.push(`console: ${message.text()}`);
});
page.on('requestfailed', request => {
  if (!request.url().includes('aero-cgi-sprite.webp')) errors.push(`request failed: ${request.url()} ${request.failure()?.errorText || ''}`);
});

const renderedCount = () => page.evaluate(() => {
  const diagnostics = window.AeroCGI?.diagnostics?.();
  return diagnostics ? (diagnostics.rendered || 0) + (diagnostics.vectorFallback || 0) : 0;
});

try {
  const response = await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 30000 });
  if (!response?.ok()) throw new Error(`Page returned HTTP ${response?.status()}`);

  await page.waitForFunction(() => document.documentElement.dataset.aeroBootstrap === 'ready', { timeout: 20000 });
  await page.waitForFunction(() => {
    const d = window.AeroCGI?.diagnostics?.();
    return d && ((d.rendered || 0) + (d.vectorFallback || 0)) >= 2;
  }, { timeout: 20000 });

  let diagnostics = await page.evaluate(() => window.AeroCGI.diagnostics());
  console.log('Landing diagnostics', diagnostics);

  const visibleGraphic = await page.evaluate(() => {
    const canvas = document.querySelector('.aero-cgi canvas');
    if (canvas && canvas.offsetParent !== null) {
      const context = canvas.getContext('2d');
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let index = 3; index < data.length; index += 4) if (data[index] > 0) return true;
    }
    return [...document.querySelectorAll('.aero-cgi-vector-fallback')].some(image => !image.hidden && image.complete && image.naturalWidth > 0 && image.getClientRects().length > 0);
  });
  if (!visibleGraphic) throw new Error('Aero displayed neither a CGI canvas nor the vector fallback.');

  await page.click('[data-open-aero]');
  await page.waitForSelector('.aero-chat.open', { visible: true, timeout: 5000 });
  const chatState = await page.$eval('.aero-launcher', element => element.getAttribute('aria-expanded'));
  if (chatState !== 'true') throw new Error('Chat launcher did not expose the open state.');
  await page.waitForFunction(() => {
    const d = window.AeroCGI?.diagnostics?.();
    return d && ((d.rendered || 0) + (d.vectorFallback || 0)) >= 3;
  }, { timeout: 5000 });

  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.aero-chat')?.classList.contains('open'));

  await page.click('[data-start-assessment]');
  await page.waitForSelector('#assessmentApp:not([hidden])', { visible: true, timeout: 5000 });
  await page.waitForFunction(() => {
    const instance = document.querySelector('.wizard-head .aero-cgi');
    if (!instance) return false;
    if (instance.dataset.renderStatus === 'ready') return true;
    const fallback = instance.querySelector('.aero-cgi-vector-fallback');
    return fallback && !fallback.hidden && fallback.complete && fallback.naturalWidth > 0;
  }, { timeout: 5000 });

  diagnostics = await page.evaluate(() => window.AeroCGI.diagnostics());
  console.log('Final diagnostics', diagnostics, 'visible total', await renderedCount());
  if (errors.length) throw new Error(`Browser errors detected:\n${errors.join('\n')}`);
  console.log('Aero runtime smoke test passed');
} finally {
  await browser.close();
}
