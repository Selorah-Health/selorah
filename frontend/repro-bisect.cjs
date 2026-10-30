const { webkit } = require('playwright');
const fs = require('fs');

const STATE = 'C:/Users/ASUS/AppData/Local/Temp/opencode/webkit-state.json';
const OUT = 'C:/Users/ASUS/AppData/Local/Temp/opencode/bisect';

const variants = [
  { name: '00-baseline', css: '' },
  { name: '01-hide-header', css: 'header{display:none !important}' },
  { name: '02-hide-scrollcontent', css: 'main > div.overflow-y-auto{display:none !important}' },
  { name: '03-hide-aside', css: 'aside{display:none !important}' },
  { name: '04-hide-fixed', css: 'nav.fixed, .fixed{display:none !important}' },
  { name: '05-hide-logo', css: 'header img, header button{display:none !important}' },
  { name: '06-no-overflow-hidden', css: 'main, #root > div{overflow:visible !important}' },
  { name: '07-root-isolate', css: '#root > div{isolation:isolate !important}' },
  { name: '08-root-transform', css: '#root > div{transform:translateZ(0) !important}' },
  { name: '09-main-transform', css: 'main{transform:translateZ(0) !important}' },
  { name: '10-scroller-transform', css: 'main > div.overflow-y-auto{transform:translateZ(0) !important}' },
  { name: '11-no-shadows', css: '*{box-shadow:none !important}' },
  { name: '12-header-bg', css: 'header{background-color:#0e1320 !important}' },
  { name: '13-scroller-bg', css: 'main > div.overflow-y-auto{background-color:#0e1320 !important}' },
  { name: '14-main-bg', css: 'main{background-color:#0e1320 !important}' },
  { name: '15-hide-root', css: '#root{display:none !important}' },
  { name: '16-no-animations', css: '*{animation:none !important;transition:none !important}' },
  { name: '17-no-radius', css: '*{border-radius:0 !important}' },
  { name: '18-no-pseudo', css: '*::before,*::after{display:none !important}' },
  { name: '19-no-fixed-pos', css: '*{position:static !important}' },
  { name: '20-html-bg', css: 'html,body,#root{background-color:#070a12 !important}' },
];

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  const browser = await webkit.launch({ headless: true });

  for (const variant of variants) {
    const context = await browser.newContext({
      viewport: { width: 414, height: 896 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      storageState: STATE,
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    });
    await context.addInitScript(() => {
      localStorage.setItem('selorah_theme', 'dark');
      localStorage.setItem('selorah_install_dismissed_v2', '1');
      localStorage.setItem('selorah_walkthrough_done', '1');
      localStorage.setItem(
        'selorah_privacy_v1',
        JSON.stringify({
          version: 1,
          essential: true,
          personalisation: true,
          searchHistory: true,
          decidedAt: new Date().toISOString(),
        })
      );
    });
    const page = await context.newPage();
    await page.goto('https://www.selorah.app/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(8000);
    if (variant.css) {
      await page.addStyleTag({ content: variant.css });
      await page.waitForTimeout(1200);
    }
    await page.screenshot({
      path: `${OUT}/${variant.name}.png`,
      clip: { x: 0, y: 0, width: 200, height: 200 },
    });
    console.log('done', variant.name);
    await context.close();
  }

  await browser.close();
})();
