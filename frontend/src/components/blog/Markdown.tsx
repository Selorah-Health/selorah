import { Fragment, type ReactNode } from 'react';

function safeHref(value: string) {
  const href = value.trim();
  if (/^(https?:\/\/|mailto:|\/|#)/i.test(href)) return href;
  return '#';
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const tokens = text.split(
    /(<u>[\s\S]*?<\/u>|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g
  );

  return tokens.map((token, index) => {
    if (!token) return null;
    const key = `${keyPrefix}-${index}`;

    if (token.startsWith('<u>') && token.endsWith('</u>')) {
      return (
        <u key={key} className="underline decoration-primary/40 underline-offset-2">
          {renderInline(token.slice(3, -4), `${key}-u`)}
        </u>
      );
    }

    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code
          key={key}
          className="rounded-md border border-[#E7EBF3] bg-[#F4F6FA] px-1.5 py-0.5 text-[0.9em] font-semibold text-[#101217]"
        >
          {token.slice(1, -1)}
        </code>
      );
    }

    if (token.startsWith('**') && token.endsWith('**')) {
      return (
        <strong key={key} className="font-bold text-[#101217]">
          {renderInline(token.slice(2, -2), `${key}-strong`)}
        </strong>
      );
    }

    if (token.startsWith('*') && token.endsWith('*')) {
      return (
        <em key={key} className="italic">
          {renderInline(token.slice(1, -1), `${key}-em`)}
        </em>
      );
    }

    const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const href = safeHref(link[2]);
      const external = /^https?:\/\//i.test(href);
      return (
        <a
          key={key}
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          className="font-semibold text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:text-primary-hover"
        >
          {renderInline(link[1], `${key}-link`)}
        </a>
      );
    }

    return <Fragment key={key}>{token}</Fragment>;
  });
}

function isBlockStart(line: string) {
  return (
    /^```/.test(line) ||
    /^#{1,4}\s+/.test(line) ||
    /^>\s?/.test(line) ||
    /^\s*[-*+]\s+/.test(line) ||
    /^\s*\d+\.\s+/.test(line) ||
    /^---+$/.test(line) ||
    /^\*\*\*+$/.test(line) ||
    /^!\[[^\]]*\]\([^)]+\)$/.test(line)
  );
}

export default function Markdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (/^```/.test(line)) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(
        <pre
          key={`code-${index}`}
          className="my-6 overflow-x-auto rounded-lg bg-[#071021] p-5 text-sm leading-relaxed text-white/85"
        >
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2];
      const className =
        level === 1
          ? 'mt-10 text-3xl font-semibold tracking-[-0.03em] text-[#101217] sm:text-4xl'
          : level === 2
            ? 'mt-9 text-2xl font-semibold tracking-[-0.03em] text-[#101217] sm:text-3xl'
            : level === 3
              ? 'mt-7 text-xl font-semibold tracking-[-0.02em] text-[#101217]'
              : 'mt-6 text-base font-semibold tracking-[-0.01em] text-[#101217]';
      blocks.push(
        level === 1 ? (
          <h1 key={`h-${index}`} className={className}>
            {renderInline(text, `h-${index}`)}
          </h1>
        ) : level === 2 ? (
          <h2 key={`h-${index}`} className={className}>
            {renderInline(text, `h-${index}`)}
          </h2>
        ) : level === 3 ? (
          <h3 key={`h-${index}`} className={className}>
            {renderInline(text, `h-${index}`)}
          </h3>
        ) : (
          <h4 key={`h-${index}`} className={className}>
            {renderInline(text, `h-${index}`)}
          </h4>
        )
      );
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^>\s?/, ''));
        index += 1;
      }
      blocks.push(
        <blockquote
          key={`quote-${index}`}
          className="my-6 rounded-r-lg border-l-4 border-primary bg-[#F6F9FC] px-5 py-4 text-base italic leading-relaxed text-[#4B5563]"
        >
          {renderInline(quoteLines.join(' '), `quote-${index}`)}
        </blockquote>
      );
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*+]\s+/, ''));
        index += 1;
      }
      blocks.push(
        <ul key={`ul-${index}`} className="my-5 space-y-2.5 pl-5">
          {items.map((item, itemIndex) => (
            <li
              key={`${item}-${itemIndex}`}
              className="list-disc text-base leading-relaxed text-[#4B5563] marker:text-primary"
            >
              {renderInline(item, `ul-${index}-${itemIndex}`)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+\.\s+/, ''));
        index += 1;
      }
      blocks.push(
        <ol key={`ol-${index}`} className="my-5 space-y-2.5 pl-5">
          {items.map((item, itemIndex) => (
            <li
              key={`${item}-${itemIndex}`}
              className="list-decimal text-base leading-relaxed text-[#4B5563] marker:font-bold marker:text-primary"
            >
              {renderInline(item, `ol-${index}-${itemIndex}`)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    if (/^---+$/.test(line) || /^\*\*\*+$/.test(line)) {
      blocks.push(<hr key={`hr-${index}`} className="my-8 border-[#E7EBF3]" />);
      index += 1;
      continue;
    }

    const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) {
      blocks.push(
        <figure key={`img-${index}`} className="my-7">
          <img
            src={safeHref(image[2])}
            alt={image[1]}
            loading="lazy"
            decoding="async"
            className="w-full rounded-lg border border-[#E7EBF3] object-cover"
          />
          {image[1] && (
            <figcaption className="mt-2 text-center text-xs text-[#8A94A6]">{image[1]}</figcaption>
          )}
        </figure>
      );
      index += 1;
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      (paragraphLines.length === 0 || !isBlockStart(lines[index]))
    ) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }

    blocks.push(
      <p key={`p-${index}`} className="my-4 text-base leading-relaxed text-[#4B5563]">
        {renderInline(paragraphLines.join(' '), `p-${index}`)}
      </p>
    );
  }

  return <div className="blog-content">{blocks}</div>;
}
