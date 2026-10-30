const { webkit } = require('playwright');
const fs = require('fs');

const STATE_PATH = 'C:/Users/ASUS/AppData/Local/Temp/opencode/webkit-state.json';

const variants = [
  { name: 'baseline', css: '' },
  {
    name: 'no-nav-backdrop',
    css: `nav[class*="backdrop-blur"] { -webkit-backdrop-filter: none !important; backdrop-filter: none !important; background-color: #111624 !important; }`,
  },
  {
    name: 'no-any-backdrop',
    css: `* { -webkit-backdrop-filter: none !important; backdrop-filter: none !important; }`,
  },
  {
    name: 'no-html-smooth',
    css: `html { scroll-behavior: auto !important; }`,
  },
  {
    name: 'main-overflow-visible',
    css: `main { overflow: visible !important; }`,
  },
  {
    name: 'scroll-root-translate',
    css: `main > div[class*="overflow-y-auto"] { transform: translateZ(0); }`,
  },
];

(async () => {
  const browser = await webkit.launch({ headless: true });
  const baseContext = await browser.newContext({
    viewport: { width: 414, height: 896 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  });
  await baseContext.addInitScript(() => {
    localStorage.setItem('selorah_theme', 'dark');
    localStorage.setItem('selorah_install_dismissed_v2', '1');
    localStorage.setItem('selorah_walkthrough_done', '1');
    localStorage.setItem('selorah_privacy_v1', JSON.stringify({
      version: 1, essential: true, personalisation: true, searchHistory: true, decidedAt: new Date().toISOString(),
    }));
  });

  if (fs.existsSync(STATE_PATH)) {
    console.log('reusing saved state');
  } else {
    const page = await baseContext.newPage();
    await page.goto('https://www.selorah.app/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.fill('input[type="email"]', 'selorahealth@gmail.com');
    await page.fill('input[type="password"]', '@Ju$tAdmin');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(6000);
    await baseContext.storageState({ path: STATE_PATH });
    console.log('saved state, url', page.url());
  }
  await baseContext.close();

  for (const variant of variants) {
    const context = await browser.newContext({
      viewport: { width: 414, height: 896 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      storageState: STATE_PATH,
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    });
    await context.addInitScript((css) => {
      localStorage.setItem('selorah_theme', 'dark');
      localStorage.setItem('selorah_install_dismissed_v2', '1');
      localStorage.setItem('selorah_walkthrough_done', '1');
      if (css) {
        const style = document.createElement('style');
        style.textContent = css;
        document.documentElement.appendChild(style);
      }
    }, variant.css);

    const page = await context.newPage();
    await page.goto('https://www.selorah.app/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(10000);
    const topLeft = await page.evaluate(() => {
      const el = document.elementFromPoint(60, 60);
      return {
        url: location.href,
        el: el ? `${el.tagName}.${typeof el.className === 'string' ? el.className.slice(0, 80) : ''}` : null,
        hasNavBlur: !!document.querySelector('nav[class*="backdrop-blur"]'),
        navFilter: document.querySelector('nav') ? getComputedStyle(document.querySelector('nav')).backdropFilter : null,
        navWebkitFilter: document.querySelector('nav') ? getComputedStyle(document.querySelector('nav')).webkitBackdropFilter : null,
        bodyBg: getComputedStyle(document.body).backgroundColor,
      };
    });
    console.log(variant.name, JSON.stringify(topLeft));
    await page.screenshot({ path: `C:/Users/ASUS/AppData/Local/Temp/opencode/variant-${variant.name}.png` });
    await context.close();
  }

  await browser.close();
})();
