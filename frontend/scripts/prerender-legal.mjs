import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

const root = process.cwd();
const distIndexPath = path.join(root, 'dist', 'index.html');

const pages = [
  {
    route: '/privacy',
    component: 'Privacy',
    output: 'privacy.html',
    title: 'Privacy Policy | Selorah Health',
    description:
      'How Selorah Health collects, uses, stores, shares, and protects personal data across its websites, apps, and portals.',
  },
  {
    route: '/terms',
    component: 'Terms',
    output: 'terms.html',
    title: 'Terms of Use | Selorah Health',
    description:
      'The terms that govern access to and use of Selorah Health websites, apps, portals, and related services.',
  },
  {
    route: '/cookie-policy',
    component: 'CookiePolicy',
    output: 'cookie-policy.html',
    title: 'Cookie Policy | Selorah Health',
    description:
      'How Selorah Health uses cookies and similar technologies across its websites, apps, and portals.',
  },
  {
    route: '/dpa',
    component: 'DataProcessing',
    output: 'dpa.html',
    title: 'Data Processing Agreement | Selorah Health',
    description:
      'The data processing terms that apply when Selorah Health processes personal data for institutional customers.',
  },
];

function escapeAttribute(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function injectPage(template, page, body) {
  const canonical = `https://www.selorah.app${page.route}`;
  const safeTitle = escapeAttribute(page.title);
  const safeDescription = escapeAttribute(page.description);

  let html = template
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${safeTitle}</title>`)
    .replace(
      /<meta name="description" content="[^"]*" \/>/,
      `<meta name="description" content="${safeDescription}" />`,
    )
    .replace(
      /<meta property="og:title" content="[^"]*" \/>/,
      `<meta property="og:title" content="${safeTitle}" />`,
    )
    .replace(
      /<meta property="og:description" content="[^"]*" \/>/,
      `<meta property="og:description" content="${safeDescription}" />`,
    )
    .replace(
      /<meta property="og:url" content="[^"]*" \/>/,
      `<meta property="og:url" content="${canonical}" />`,
    )
    .replace(
      /<meta name="twitter:title" content="[^"]*" \/>/,
      `<meta name="twitter:title" content="${safeTitle}" />`,
    )
    .replace(
      /<meta name="twitter:description" content="[^"]*" \/>/,
      `<meta name="twitter:description" content="${safeDescription}" />`,
    )
    .replace(
      '</head>',
      `    <style>#selorah-splash{display:none!important}</style>\n    <link rel="canonical" href="${canonical}" />\n  </head>`,
    );

  html = html.replaceAll(
    'https://selorah.vercel.app/',
    'https://www.selorah.app/',
  );

  return html;
}

const template = await readFile(distIndexPath, 'utf8');
const vite = await createServer({
  root,
  configFile: path.join(root, 'vite.config.ts'),
  appType: 'custom',
  logLevel: 'warn',
  server: { middlewareMode: true },
});

try {
  for (const page of pages) {
    const module = await vite.ssrLoadModule(`/src/pages/${page.component}.tsx`);
    const body = renderToString(
      React.createElement(
        MemoryRouter,
        { initialEntries: [page.route] },
        React.createElement(module.default),
      ),
    );
    const html = injectPage(template, page, body);

    if (!html.includes('Privacy Policy') && page.route === '/privacy') {
      throw new Error('Privacy page prerender did not contain the policy text.');
    }

    await writeFile(path.join(root, 'dist', page.output), html, 'utf8');
    console.log(`prerendered ${page.route} -> dist/${page.output}`);
  }
} finally {
  await vite.close();
}
