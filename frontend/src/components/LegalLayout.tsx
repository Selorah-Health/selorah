import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

interface LegalLayoutProps {
  children: ReactNode;
  title: string;
  lastUpdated?: string;
}

export default function LegalLayout({ children, title, lastUpdated }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-white text-[#101217] font-sora selection:bg-[#4262FF]/10">
      {/* Header */}
      <Header theme="light" />

      <main className="max-w-full mx-auto px-12 pt-32 pb-16 lg:pt-40 lg:pb-24">
        <div className="max-w-4xl">
          <div className="mb-12">
            <h1 className="text-4xl lg:text-5xl font-black text-[#101217] mb-4 tracking-tight">{title}</h1>
            {lastUpdated && (
              <p className="text-sm font-bold text-[#4262FF] uppercase tracking-widest">Last Updated: {lastUpdated}</p>
            )}
          </div>

          <div className="prose prose-slate prose-lg max-w-none prose-headings:text-[#101217] prose-headings:font-black prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
