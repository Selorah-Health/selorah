import { useRef, type KeyboardEvent } from 'react';

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
};

type FormatAction =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'h1'
  | 'h2'
  | 'quote'
  | 'ul'
  | 'ol'
  | 'link'
  | 'code';

type ToolbarItem = {
  action: FormatAction;
  label: string;
  title: string;
  className?: string;
  divider?: boolean;
};

const TOOLBAR: ToolbarItem[] = [
  { action: 'bold', label: 'B', title: 'Bold (Ctrl+B)', className: 'font-black' },
  { action: 'italic', label: 'I', title: 'Italic (Ctrl+I)', className: 'italic' },
  { action: 'underline', label: 'U', title: 'Underline (Ctrl+U)', className: 'underline' },
  { action: 'h1', label: 'H1', title: 'Heading 1', divider: true },
  { action: 'h2', label: 'H2', title: 'Heading 2' },
  { action: 'quote', label: 'Quote', title: 'Quote', divider: true },
  { action: 'ul', label: '•', title: 'Bullet list' },
  { action: 'ol', label: '1.', title: 'Numbered list' },
  { action: 'link', label: 'Link', title: 'Link (Ctrl+K)', divider: true },
  { action: 'code', label: 'Code', title: 'Inline code' },
];

function ToolButton({
  label,
  title,
  onClick,
  className = '',
  divider = false,
}: {
  label: string;
  title: string;
  onClick: () => void;
  className?: string;
  divider?: boolean;
}) {
  return (
    <>
      {divider && <span className="mx-1 h-4 w-px bg-[#EFF2F7]" aria-hidden="true" />}
      <button
        type="button"
        title={title}
        aria-label={title}
        onClick={onClick}
        className={`inline-flex h-7 min-w-7 items-center justify-center rounded-none px-1.5 text-[11px] font-bold text-[#4B5563] transition-colors hover:bg-[#EEF2FF] hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${className}`}
      >
        {label}
      </button>
    </>
  );
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 18,
  className = '',
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const focusSelection = (start: number, end: number) => {
    // A zero-delay timer runs after React has applied the controlled value.
    // requestAnimationFrame can be paused when the tab is in the background.
    window.setTimeout(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(start, end);
    }, 0);
  };

  const wrapSelection = (left: string, right: string, placeholderText: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const before = value.slice(0, start);
    const after = value.slice(end);

    // Clicking the same format again unwraps the selection.
    if (
      selected.length >= left.length + right.length &&
      selected.startsWith(left) &&
      selected.endsWith(right)
    ) {
      const inner = selected.slice(left.length, selected.length - right.length);
      onChange(`${before}${inner}${after}`);
      focusSelection(start, start + inner.length);
      return;
    }

    const inner = selected || placeholderText;
    onChange(`${before}${left}${inner}${right}${after}`);
    focusSelection(start + left.length, start + left.length + inner.length);
  };

  const prefixLines = (prefix: string, placeholderText: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const lineStart = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
    // Do not pull in the next line when the selection ends on a newline.
    const effectiveEnd = end > start && value[end - 1] === '\n' ? end - 1 : end;
    const lineEnd = value.indexOf('\n', effectiveEnd);
    const blockEnd = lineEnd === -1 ? value.length : lineEnd;
    const block = value.slice(lineStart, blockEnd);
    const lines = block.split('\n');
    const allPrefixed = lines.length > 0 && lines.every((line) => line.startsWith(prefix));
    const isEmptyLine = !selected && block.trim() === '';

    let nextBlock: string;
    if (isEmptyLine) {
      nextBlock = `${prefix}${placeholderText}`;
    } else {
      nextBlock = lines
        .map((line) => {
          if (allPrefixed) return line.slice(prefix.length);
          return line.startsWith(prefix) ? line : `${prefix}${line}`;
        })
        .join('\n');
    }

    onChange(`${value.slice(0, lineStart)}${nextBlock}${value.slice(blockEnd)}`);

    const cursorStart = lineStart + (allPrefixed && !isEmptyLine ? 0 : prefix.length);
    focusSelection(cursorStart, lineStart + nextBlock.length);
  };

  const applyFormat = (action: FormatAction) => {
    switch (action) {
      case 'bold':
        wrapSelection('**', '**', 'bold text');
        break;
      case 'italic':
        wrapSelection('*', '*', 'italic text');
        break;
      case 'underline':
        wrapSelection('<u>', '</u>', 'underlined text');
        break;
      case 'h1':
        prefixLines('# ', 'Heading 1');
        break;
      case 'h2':
        prefixLines('## ', 'Heading 2');
        break;
      case 'quote':
        prefixLines('> ', 'Quote');
        break;
      case 'ul':
        prefixLines('- ', 'List item');
        break;
      case 'ol':
        prefixLines('1. ', 'List item');
        break;
      case 'link':
        wrapSelection('[', '](https://)', 'link text');
        break;
      case 'code':
        wrapSelection('`', '`', 'code');
        break;
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(event.metaKey || event.ctrlKey)) return;

    const key = event.key.toLowerCase();
    if (key === 'b') {
      event.preventDefault();
      applyFormat('bold');
    } else if (key === 'i') {
      event.preventDefault();
      applyFormat('italic');
    } else if (key === 'u') {
      event.preventDefault();
      applyFormat('underline');
    } else if (key === 'k') {
      event.preventDefault();
      applyFormat('link');
    }
  };

  return (
    <div
      className={`mt-1.5 overflow-hidden rounded-none border border-[#E7EBF3] bg-[#FBFCFE] transition-colors focus-within:border-primary/40 focus-within:bg-white ${className}`}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[#EFF2F7] bg-white px-2 py-1.5">
        {TOOLBAR.map((item) => (
          <ToolButton
            key={item.action}
            label={item.label}
            title={item.title}
            divider={item.divider}
            className={item.className}
            onClick={() => applyFormat(item.action)}
          />
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={rows}
        placeholder={placeholder}
        spellCheck
        aria-label="Content"
        className="w-full resize-y border-0 bg-transparent px-3.5 py-3 font-mono text-[13px] leading-relaxed text-[#101217] outline-none placeholder:text-[#C4CBD6]"
      />
    </div>
  );
}
