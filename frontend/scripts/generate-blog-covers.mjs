import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = join(__dirname, '..', 'public', 'blog', 'covers');

const COVER_WIDTH = 1200;
const COVER_HEIGHT = 675;
const COVER_COLOR = '#6183FF';

const posts = [
  { slug: 'welcome-to-selorah', title: 'Welcome to the Selorah blog', category: 'Announcement' },
  {
    slug: 'know-your-numbers-on-world-diabetes-day',
    title: 'Know your numbers on World Diabetes Day',
    category: 'Health records',
  },
  { slug: 'built-for-people-who-move', title: 'Built for people who move', category: 'Product' },
  {
    slug: 'the-first-60-seconds-of-an-emergency',
    title: 'The first 60 seconds of an emergency',
    category: 'Health records',
  },
  {
    slug: 'one-patient-one-record-more-control',
    title: 'One patient. One record. More control.',
    category: 'Company',
  },
  {
    slug: 'progress-report-moving-access-control-to-monad',
    title: 'Progress report: moving access control to Monad',
    category: 'Product',
  },
  { slug: 'why-we-started-selorah-health', title: 'Why we started Selorah Health', category: 'Company' },
  {
    slug: 'what-we-are-building-and-why-it-matters',
    title: 'What we are building and why it matters',
    category: 'Announcement',
  },
];

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapTitle(title, maxChars = 26, maxLines = 4) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';

  for (const word of words) {
    if (!line) {
      line = word;
      continue;
    }

    if (`${line} ${word}`.length <= maxChars) {
      line = `${line} ${word}`;
    } else {
      lines.push(line);
      line = word;
    }
  }

  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;

  const clipped = lines.slice(0, maxLines);
  const last = clipped[maxLines - 1];
  clipped[maxLines - 1] = `${last.slice(0, Math.max(0, maxChars - 3)).trim()}...`;
  return clipped;
}

function coverSvg({ title, category }) {
  const lines = wrapTitle(title);
  const fontSize = lines.length > 3 ? 56 : 62;
  const lineHeight = lines.length > 3 ? 70 : 78;
  const startY = COVER_HEIGHT / 2 - ((lines.length - 1) * lineHeight) / 2 + fontSize / 3;
  const titleLines = lines
    .map(
      (line, index) =>
        `<text x="80" y="${startY + index * lineHeight}" fill="#FFFFFF" font-family="Sora, Inter, system-ui, sans-serif" font-size="${fontSize}" font-weight="700" letter-spacing="-1.5">${escapeXml(line)}</text>`
    )
    .join('');
  const categoryLabel = category
    ? `<text x="80" y="596" fill="#FFFFFF" fill-opacity="0.86" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="600" letter-spacing="3">${escapeXml(category.toUpperCase())}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${COVER_WIDTH}" height="${COVER_HEIGHT}" viewBox="0 0 ${COVER_WIDTH} ${COVER_HEIGHT}" role="img" aria-label="${escapeXml(title)}">
<rect width="${COVER_WIDTH}" height="${COVER_HEIGHT}" fill="${COVER_COLOR}"/>
<circle cx="1070" cy="60" r="250" fill="#FFFFFF" fill-opacity="0.08"/>
<circle cx="120" cy="640" r="190" fill="#FFFFFF" fill-opacity="0.06"/>
<path d="M0 540 C 260 470, 520 620, 760 540 S 1090 470, 1200 520 L 1200 675 L 0 675 Z" fill="#FFFFFF" fill-opacity="0.05"/>
<text x="80" y="104" fill="#FFFFFF" fill-opacity="0.9" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="700" letter-spacing="5">SELORAH HEALTH</text>
${titleLines}
${categoryLabel}
<text x="1120" y="626" text-anchor="end" fill="#FFFFFF" fill-opacity="0.8" font-family="Inter, system-ui, sans-serif" font-size="22">selorah.app</text>
</svg>
`;
}

await mkdir(outputDir, { recursive: true });

for (const post of posts) {
  await writeFile(join(outputDir, `${post.slug}.svg`), coverSvg(post), 'utf8');
  console.log(`wrote ${post.slug}.svg`);
}
