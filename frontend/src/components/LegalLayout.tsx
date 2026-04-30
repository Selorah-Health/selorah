import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface LegalLayoutProps {
  children: ReactNode;
  title: string;
  lastUpdated?: string;
}

export default function LegalLayout({ children, title, lastUpdated }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-white text-[#101217] font-sora selection:bg-[#4262FF]/10">
      {/* Header */}
      <header className="w-full h-[70px] border-b border-gray-100 flex items-center justify-between px-12 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity group">
          <img src="/logo.svg" alt="Selorah Logo" className="w-8 h-8 object-contain group-hover:scale-110 transition-transform" />
          <span className="text-xl font-bold tracking-tight text-[#4262FF]">Selorah</span>
        </Link>
        <Link to="/" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#4262FF] transition-all group">
          <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
      </header>

      <main className="max-w-full mx-auto px-12 py-16 lg:py-24">
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
      <footer className="border-t border-gray-100 py-12 text-center bg-gray-50/50 px-12">
        <p className="text-sm text-gray-400 font-medium">© 2026 Selorah Health Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
