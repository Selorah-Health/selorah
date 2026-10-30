const { webkit } = require('playwright');

(async () => {
  const browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 414, height: 896 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    storageState: 'C:/Users/ASUS/AppData/Local/Temp/opencode/webkit-state.json',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  });
  await context.addInitScript(() => {
    localStorage.setItem('selorah_theme', 'dark');
    localStorage.setItem('selorah_install_dismissed_v2', '1');
    localStorage.setItem('selorah_walkthrough_done', '1');
  });
  const page = await context.newPage();
  await page.goto('https://www.selorah.app/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(10000);

  const stack = await page.evaluate(() => {
    return document.elementsFromPoint(100, 100).map((el) => {
      const s = getComputedStyle(el);
      return {
        tag: el.tagName,
        cls: typeof el.className === 'string' ? el.className.slice(0, 100) : '',
        bg: s.backgroundColor,
        bgImage: s.backgroundImage,
        pos: s.position,
        z: s.zIndex,
        rect: (() => { const r = el.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; })(),
      };
    });
  });
  console.log('STACK', JSON.stringify(stack, null, 2));

  await page.evaluate(() => {
    document.documentElement.style.backgroundColor = 'red';
    document.body.style.backgroundColor = 'red';
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'C:/Users/ASUS/AppData/Local/Temp/opencode/hole-red-root.png' });

  await page.evaluate(() => {
    document.documentElement.style.backgroundColor = '';
    document.body.style.backgroundColor = '';
    const main = document.querySelector('main');
    if (main) main.style.backgroundColor = 'red';
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'C:/Users/ASUS/AppData/Local/Temp/opencode/hole-red-main.png' });

  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main) main.style.backgroundColor = '';
    const root = document.querySelector('#root > div');
    if (root) root.style.backgroundColor = 'red';
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'C:/Users/ASUS/AppData/Local/Temp/opencode/hole-red-dashboard-root.png' });

  await browser.close();
})();
