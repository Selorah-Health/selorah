import { useEffect, useMemo, useState } from 'react';
import { ArrowRightIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOTitle from '../components/SEOTitle';
import BlogCard from '../components/blog/BlogCard';
import WaitlistModal from '../components/WaitlistModal';
import MotionProvider from '../components/MotionProvider';
import Reveal from '../components/landing/Reveal';
import { createClient } from '../lib/supabase/client';
import {
  isBlogPreview,
  isMissingBlogTable,
  previewBlogPosts,
  type BlogPost,
} from '../lib/blog';

function BlogIndexContent() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      if (isBlogPreview()) {
        if (active) {
          setPosts(previewBlogPosts());
          setError(null);
          setLoading(false);
        }
        return;
      }

      try {
        const supabase = createClient();
        const { data, error: queryError } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('status', 'published')
          .not('published_at', 'is', null)
          .lte('published_at', new Date().toISOString())
          .order('published_at', { ascending: false });

        if (!active) return;
        if (queryError) {
          if (isMissingBlogTable(queryError)) {
            setPosts(previewBlogPosts());
            setError(null);
          } else {
            setError('We could not load the blog right now. Please try again.');
            setPosts([]);
          }
        } else {
          setPosts((data as BlogPost[]) || []);
        }
      } catch (error) {
        if (active) {
          if (isMissingBlogTable(error)) {
            setPosts(previewBlogPosts());
            setError(null);
          } else {
            setError('We could not load the blog right now. Please try again.');
            setPosts([]);
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const categories = useMemo(() => {
    const fromPosts = Array.from(new Set(posts.map((post) => post.category).filter(Boolean)));
    return ['All', ...fromPosts];
  }, [posts]);

  const filtered = category === 'All' ? posts : posts.filter((post) => post.category === category);
  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-[#101217]">
      <SEOTitle
        title="Blog"
        description="Announcements, product updates, and practical notes on portable health records from Selorah Health."
      />
      <Header theme="light" />

      <main>
        <section className="relative overflow-hidden bg-[#F6F9FC] px-5 pb-12 pt-28 sm:px-8 sm:pb-16 sm:pt-36 lg:px-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <div className="absolute left-1/2 top-[-260px] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(97,131,255,0.18),rgba(95,250,176,0.08),transparent)] blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-[#4B5563]">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Selorah blog
              </p>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-[#101217] sm:text-5xl md:text-6xl">
                News, notes, and the road to launch.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#4B5563] sm:text-lg">
                Announcements, product updates, and practical writing about health records that
                finally move with the person who owns them.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`min-h-[38px] rounded-none border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    category === item
                      ? 'border-primary bg-primary text-white'
                      : 'border-[#E5E7EB] bg-transparent text-[#4B5563] hover:border-[#D5DCE8] hover:text-primary'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
          <div className="mx-auto max-w-6xl">
            {loading ? (
              <div className="space-y-6">
                <div className="h-[360px] animate-pulse rounded-lg border border-[#E5E7EB] bg-white" />
                <div className="grid gap-6 md:grid-cols-3">
                  {[0, 1, 2].map((item) => (
                    <div
                      key={item}
                      className="h-[330px] animate-pulse rounded-lg border border-[#E5E7EB] bg-white"
                    />
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="mx-auto flex max-w-lg flex-col items-center rounded-lg border border-[#E5E7EB] bg-white px-6 py-12 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-md bg-[#FFF1F0] text-[#D92D20]">
                  <ExclamationCircleIcon className="h-6 w-6" strokeWidth={1.8} />
                </span>
                <h2 className="mt-4 text-lg font-semibold">The blog did not load.</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">{error}</p>
                <button
                  type="button"
                  onClick={() => setReloadKey((value) => value + 1)}
                  className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-none bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
                >
                  Try again
                  <ArrowRightIcon className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="mx-auto flex max-w-lg flex-col items-center rounded-lg border border-[#E5E7EB] bg-white px-6 py-12 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-md bg-[#EEF2FF] text-primary">
                  <span className="text-lg font-semibold">S</span>
                </span>
                <h2 className="mt-4 text-lg font-semibold">
                  {posts.length === 0 ? 'The first post is on the way.' : 'No posts in this category yet.'}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
                  {posts.length === 0
                    ? 'Join the waitlist and we will send launch news and product updates as they happen.'
                    : 'Try another category, or read everything we have published so far.'}
                </p>
                <button
                  type="button"
                  onClick={() => (posts.length === 0 ? setIsModalOpen(true) : setCategory('All'))}
                  className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-none bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
                >
                  {posts.length === 0 ? 'Join the waitlist' : 'Show all posts'}
                  <ArrowRightIcon className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {featured && (
                  <Reveal eager>
                    <BlogCard post={featured} featured />
                  </Reveal>
                )}

                {rest.length > 0 && (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {rest.map((post, index) => (
                      <Reveal key={post.id} delay={index * 60}>
                        <BlogCard post={post} />
                      </Reveal>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="px-5 pb-16 sm:px-8 sm:pb-20 lg:px-10">
          <div className="marketing-dark mx-auto max-w-6xl overflow-hidden rounded-xl px-6 py-10 sm:px-10 sm:py-14">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div className="max-w-xl">
                <p className="text-sm font-medium text-[var(--md-accent)]">Stay close to launch</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-[var(--md-fg)] sm:text-3xl">
                  Get the important updates first.
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--md-muted)]">
                  Join the waitlist for early access, city launches, and product announcements. No
                  spam.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-none bg-[var(--md-fg)] px-5 py-3 text-base font-semibold text-[var(--md-bg)] transition-opacity hover:opacity-90"
              >
                Join the waitlist
                <ArrowRightIcon
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={2}
                />
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <WaitlistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialRole="patient"
        source="blog-index"
      />
    </div>
  );
}

export default function BlogIndex() {
  return (
    <MotionProvider>
      <BlogIndexContent />
    </MotionProvider>
  );
}
