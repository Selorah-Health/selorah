const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  });
  await context.addInitScript(() => {
    localStorage.setItem('selorah_theme', 'dark');
  });
  const page = await context.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('console error:', msg.text());
  });

  await page.goto('https://www.selorah.app/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);
  await page.fill('input[type="email"]', 'selorahealth@gmail.com');
  await page.fill('input[type="password"]', '@Ju$tAdmin');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(6000);
  console.log('after login url:', page.url());

  await page.goto('https://www.selorah.app/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  console.log('dashboard url:', page.url());

  const info = await page.evaluate(() => {
    const out = [];
    const root = document.querySelector('[data-scroll-root]') || document.querySelector('main');
    const walk = (el, depth) => {
      if (!el || depth > 4) return;
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      out.push({
        tag: el.tagName,
        text: (el.textContent || '').trim().slice(0, 40),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
        overflowX: style.overflowX,
        bg: style.backgroundColor,
        cls: el.className && typeof el.className === 'string' ? el.className.slice(0, 120) : '',
      });
      for (const child of el.children) walk(child, depth + 1);
    };
    walk(root, 0);
    return {
      innerWidth: window.innerWidth,
      docWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      rootScrollLeft: root ? root.scrollLeft : null,
      rootScrollWidth: root ? root.scrollWidth : null,
      rootClientWidth: root ? root.clientWidth : null,
      elements: out,
    };
  });
  console.log(JSON.stringify(info, null, 2));

  await page.screenshot({ path: 'C:/Users/ASUS/AppData/Local/Temp/opencode/home-ios-repro.png', fullPage: false });
  await browser.close();
})();
