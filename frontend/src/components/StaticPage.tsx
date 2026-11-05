import { ReactNode, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Header from './Header';
import Footer from './Footer';
import SEOTitle from './SEOTitle';

interface StaticPageProps {
  title: string;
  eyebrow?: string;
  description?: string;
  children: ReactNode;
  heroImage?: string;
  heroTone?: 'dark' | 'light';
}

export default function StaticPage({
  title,
  eyebrow,
  description,
  children,
  heroImage,
  heroTone = 'light',
}: StaticPageProps) {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname]);

  const dark = heroTone === 'dark';

  return (
    <div className="min-h-screen bg-white font-sora text-[#101217] selection:bg-primary/15">
      <SEOTitle title={title} />
      <Header theme={dark ? 'dark' : 'light'} />

      {dark ? (
        <section className="relative overflow-hidden bg-[#101217] pt-28 text-white sm:pt-32">
          {heroImage && (
            <img
              src={heroImage}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover opacity-45"
            />
          )}
          <div aria-hidden className="absolute inset-0 bg-[#101217]/55" />
          <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8 sm:pb-24 lg:px-10">
            <Link
              to="/"
              className="group inline-flex items-center gap-2 text-[11px] font-bold text-white/55 transition-colors hover:text-white"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              Back to Selorah
            </Link>
            {eyebrow && (
              <p className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                {eyebrow}
              </p>
            )}
            <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            {description && (
              <p className="mt-5 max-w-2xl text-sm font-medium leading-relaxed text-white/65 sm:text-base">
                {description}
              </p>
            )}
          </div>
        </section>
      ) : (
        <section className="border-b border-gray-100 bg-[#F4F7FF] pt-28 sm:pt-32">
          <div className="mx-auto max-w-6xl px-5 pb-16 pt-10 sm:px-8 sm:pb-20 lg:px-10">
            <Link
              to="/"
              className="group inline-flex items-center gap-2 text-[11px] font-bold text-gray-400 transition-colors hover:text-primary"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              Back to Selorah
            </Link>
            {eyebrow && (
              <p className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                {eyebrow}
              </p>
            )}
            <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            {description && (
              <p className="mt-5 max-w-2xl text-sm font-medium leading-relaxed text-gray-500 sm:text-base">
                {description}
              </p>
            )}
          </div>
        </section>
      )}

      <main className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16 lg:px-10">{children}</main>

      <Footer />
    </div>
  );
}
