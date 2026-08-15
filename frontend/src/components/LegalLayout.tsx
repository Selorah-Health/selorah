import { ReactNode, useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

interface LegalLayoutProps {
  children: ReactNode;
  title: string;
  lastUpdated?: string;
}

export default function LegalLayout({ children, title, lastUpdated }: LegalLayoutProps) {
  const location = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname, title]);

  useEffect(() => {
    // Second pass after paint (fonts / lazy content)
    const t = window.setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);
    return () => window.clearTimeout(t);
  }, [location.pathname, title]);

  return (
    <div className="min-h-screen bg-white text-[#101217] font-sora selection:bg-[#4262FF]/10">
      <Header theme="light" />

      <main className="max-w-full mx-auto px-4 sm:px-8 lg:px-12 pt-28 sm:pt-32 pb-16 lg:pt-40 lg:pb-24">
        <div className="max-w-4xl">
          <div className="mb-10 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#101217] mb-4 tracking-tight">
              {title}
            </h1>
            {lastUpdated && (
              <p className="text-sm font-bold text-[#4262FF] uppercase tracking-widest">
                Last Updated: {lastUpdated}
              </p>
            )}
          </div>

          <div className="prose prose-slate prose-lg max-w-none prose-headings:text-[#101217] prose-headings:font-black prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600 prose-a:text-[#4262FF]">
            {children}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
