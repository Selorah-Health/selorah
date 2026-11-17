import { useMemo } from 'react';

type BlogCoverProps = {
  title: string;
  category?: string | null;
  src?: string | null;
  alt?: string;
  className?: string;
  eager?: boolean;
};

const COVER_WIDTH = 1200;
const COVER_HEIGHT = 675;
const COVER_COLOR = '#6183FF';

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapTitle(title: string, maxChars = 26, maxLines = 4) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
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

/**
 * Creates the standard Selorah blog cover when an admin has not uploaded one.
 * The same visual is written to /public/blog/covers by scripts/generate-blog-covers.mjs
 * so seeded posts and fallback posts stay consistent.
 */
export function generatedBlogCover(title: string, category?: string | null) {
  const lines = wrapTitle(title || 'Selorah Health');
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
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${COVER_WIDTH}" height="${COVER_HEIGHT}" viewBox="0 0 ${COVER_WIDTH} ${COVER_HEIGHT}" role="img" aria-label="${escapeXml(title)}">
<rect width="${COVER_WIDTH}" height="${COVER_HEIGHT}" fill="${COVER_COLOR}"/>
<circle cx="1070" cy="60" r="250" fill="#FFFFFF" fill-opacity="0.08"/>
<circle cx="120" cy="640" r="190" fill="#FFFFFF" fill-opacity="0.06"/>
<path d="M0 540 C 260 470, 520 620, 760 540 S 1090 470, 1200 520 L 1200 675 L 0 675 Z" fill="#FFFFFF" fill-opacity="0.05"/>
<text x="80" y="104" fill="#FFFFFF" fill-opacity="0.9" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="700" letter-spacing="5">SELORAH HEALTH</text>
${titleLines}
${categoryLabel}
<text x="1120" y="626" text-anchor="end" fill="#FFFFFF" fill-opacity="0.8" font-family="Inter, system-ui, sans-serif" font-size="22">selorah.app</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function BlogCover({
  title,
  category,
  src,
  alt,
  className = '',
  eager = false,
}: BlogCoverProps) {
  const fallback = useMemo(() => generatedBlogCover(title, category), [title, category]);

  return (
    <img
      src={src || fallback}
      alt={alt ?? ''}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={className}
    />
  );
}
