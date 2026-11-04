import { ReactNode, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeftIcon, ArrowUpRightIcon, ClockIcon } from '@heroicons/react/24/outline';
import Header from './Header';
import Footer from './Footer';

interface LegalLayoutProps {
  children: ReactNode;
  title: string;
  lastUpdated?: string;
  eyebrow?: string;
}

type TocItem = { id: string; label: string };

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export default function LegalLayout({
  children,
  title,
  lastUpdated,
  eyebrow = 'Legal',
}: LegalLayoutProps) {
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    const timer = window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [location.pathname, title]);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    const timer = window.setTimeout(() => {
      const headings = Array.from(root.querySelectorAll<HTMLHeadingElement>('h2'));
      const used = new Set<string>();
      const items = headings.map((heading, index) => {
        const label = heading.textContent?.trim() || `Section ${index + 1}`;
        let id = heading.id || slugify(label) || `section-${index + 1}`;
        while (used.has(id)) id = `${id}-${index + 1}`;
        used.add(id);
        heading.id = id;
        return { id, label };
      });
      setToc(items);
      setActiveId(items[0]?.id || '');
    }, 0);

    return () => window.clearTimeout(timer);
  }, [children, location.pathname, title]);

  useEffect(() => {
    if (toc.length === 0) return;

    const onScroll = () => {
      let current = toc[0]?.id || '';
      for (const item of toc) {
        const heading = document.getElementById(item.id);
        if (!heading) continue;
        if (heading.getBoundingClientRect().top <= 170) current = item.id;
      }
      setActiveId(current);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [toc]);

  return (
    <div className="min-h-screen bg-white font-sora text-[#101217] selection:bg-[#6183FF]/15">
      <Header theme="light" />

      <main className="mx-auto max-w-6xl px-5 pb-20 pt-28 sm:px-8 sm:pt-32 lg:px-10 lg:pt-36">
        <div className="mb-10 border-b border-gray-100 pb-9 sm:mb-12">
          <Link
            to="/"
            className="group inline-flex items-center gap-2 text-[11px] font-bold text-gray-400 transition-colors hover:text-[#6183FF]"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            Back to Selorah
          </Link>

          <p className="mt-7 text-[10px] font-black uppercase tracking-[0.2em] text-[#6183FF]">
            {eyebrow}
          </p>
          <h1 className="mt-2 max-w-4xl text-3xl font-black leading-[1.08] tracking-tight sm:text-4xl lg:text-5xl">
            {title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {lastUpdated && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-white px-3 py-1.5 text-[10px] font-bold text-gray-500 shadow-sm">
                <ClockIcon className="h-3.5 w-3.5 text-[#6183FF]" />
                Last updated {lastUpdated}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#6183FF]/15 bg-[#F4F7FF] px-3 py-1.5 text-[10px] font-bold text-[#4D6ED6]">
              Written in plain language
            </span>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
          <aside className="hidden lg:block">
            <nav
              aria-label="On this page"
              className="sticky top-28 rounded-[24px] border border-gray-100 bg-[#FAFBFF] p-4"
            >
              <p className="px-2 text-[9px] font-black uppercase tracking-[0.18em] text-gray-400">
                On this page
              </p>
              <ul className="mt-3 space-y-0.5">
                {toc.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() =>
                        document
                          .getElementById(item.id)
                          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                      className={`w-full rounded-xl px-2.5 py-2 text-left text-[11px] font-semibold leading-snug transition-colors ${
                        activeId === item.id
                          ? 'bg-white text-[#101217] shadow-sm ring-1 ring-[#6183FF]/15'
                          : 'text-gray-500 hover:bg-white/70 hover:text-[#101217]'
                      }`}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>

              <Link
                to="/contact"
                className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-[11px] font-bold text-[#6183FF] transition-colors hover:border-[#6183FF]/30"
              >
                Questions? Contact us
                <ArrowUpRightIcon className="h-3.5 w-3.5" />
              </Link>
            </nav>
          </aside>

          <article ref={contentRef} className="min-w-0">
            <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.35)] sm:p-8 lg:p-10">
              <div className="[&_h2]:scroll-mt-28 [&_p]:leading-relaxed">{children}</div>
            </div>

            <div className="mt-6 flex flex-col gap-3 rounded-[24px] border border-[#6183FF]/15 bg-[#F4F7FF] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-[#101217]">Still have a question?</p>
                <p className="mt-0.5 text-[11px] font-medium text-gray-500">
                  Our team replies within two business days.
                </p>
              </div>
              <Link
                to="/contact"
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full bg-[#6183FF] px-5 text-[11px] font-bold text-white shadow-lg shadow-[#6183FF]/20 transition-colors hover:bg-[#4D6ED6]"
              >
                Contact Selorah
                <ArrowUpRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
