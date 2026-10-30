const { webkit } = require('playwright');

(async () => {
  const browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 414, height: 896 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  });
  await context.addInitScript(() => {
    localStorage.setItem('selorah_theme', 'dark');
    localStorage.setItem('selorah_install_dismissed_v2', '1');
    localStorage.setItem('selorah_walkthrough_done', '1');
    localStorage.setItem('selorah_privacy_v1', JSON.stringify({
      version: 1,
      essential: true,
      personalisation: true,
      searchHistory: true,
      decidedAt: new Date().toISOString(),
    }));
  });
  const page = await context.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('console error:', msg.text());
  });

  await page.goto('https://www.selorah.app/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
  await page.fill('input[type="email"]', 'selorahealth@gmail.com');
  await page.fill('input[type="password"]', '@Ju$tAdmin');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(6000);
  console.log('after login url:', page.url());

  await page.goto('https://www.selorah.app/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(12000);
  console.log('dashboard url:', page.url());

  const info = await page.evaluate(() => {
    const root = document.querySelector('[data-scroll-root]') || document.querySelector('main');
    const h2 = [...document.querySelectorAll('h2')].find((el) => /welcome|morning|afternoon|evening|today|thrive/i.test(el.textContent || ''));
    const btn = [...document.querySelectorAll('button')].find((el) => /add a record/i.test(el.textContent || ''));
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return {
        text: (el.textContent || '').trim().slice(0, 60),
        x: r.x, y: r.y, w: r.width, h: r.height,
        bg: s.backgroundColor,
        color: s.color,
        overflowX: s.overflowX,
        borderRadius: s.borderRadius,
        boxShadow: s.boxShadow,
        cls: typeof el.className === 'string' ? el.className : '',
      };
    };
    return {
      innerWidth: window.innerWidth,
      docWidth: document.documentElement.scrollWidth,
      root: rect(root),
      rootScrollLeft: root ? root.scrollLeft : null,
      rootScrollWidth: root ? root.scrollWidth : null,
      rootClientWidth: root ? root.clientWidth : null,
      h2: rect(h2),
      btn: rect(btn),
      dark: document.documentElement.classList.contains('dark'),
      bodyBg: getComputedStyle(document.body).backgroundColor,
    };
  });
  console.log(JSON.stringify(info, null, 2));

  await page.screenshot({ path: 'C:/Users/ASUS/AppData/Local/Temp/opencode/home-ios-webkit.png', fullPage: false });
  await browser.close();
})();
