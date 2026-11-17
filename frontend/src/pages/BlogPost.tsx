import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOTitle from '../components/SEOTitle';
import Markdown from '../components/blog/Markdown';
import BlogCard from '../components/blog/BlogCard';
import BlogCover from '../components/blog/BlogCover';
import WaitlistModal from '../components/WaitlistModal';
import MotionProvider from '../components/MotionProvider';
import Reveal from '../components/landing/Reveal';
import { createClient } from '../lib/supabase/client';
import {
  findPreviewBlogPost,
  formatBlogDate,
  isBlogPreview,
  isMissingBlogTable,
  previewBlogPosts,
  readingTime,
  type BlogPost,
} from '../lib/blog';

function BlogPostContent() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!slug) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      if (isBlogPreview()) {
        if (active) {
          const preview = findPreviewBlogPost(slug);
          setPost(preview);
          setRelated(
            previewBlogPosts()
              .filter((item) => item.slug !== slug)
              .slice(0, 3)
          );
          setLoading(false);
        }
        return;
      }

      try {
        const supabase = createClient();
        const { data, error: queryError } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .not('published_at', 'is', null)
          .lte('published_at', new Date().toISOString())
          .maybeSingle();

        if (!active) return;

        if (queryError) {
          const preview = isMissingBlogTable(queryError) ? findPreviewBlogPost(slug) : null;
          if (preview) {
            setPost(preview);
            setRelated(
              previewBlogPosts()
                .filter((item) => item.slug !== slug)
                .slice(0, 3)
            );
            setLoading(false);
            return;
          }
          setError('We could not load this post right now. Please try again.');
          setPost(null);
          setLoading(false);
          return;
        }

        if (!data) {
          setPost(null);
          setLoading(false);
          return;
        }

        setPost(data as BlogPost);

        const { data: more } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('status', 'published')
          .not('published_at', 'is', null)
          .lte('published_at', new Date().toISOString())
          .neq('id', (data as BlogPost).id)
          .order('published_at', { ascending: false })
          .limit(3);

        if (active) setRelated((more as BlogPost[]) || []);
      } catch (error) {
        if (active) {
          const preview = isMissingBlogTable(error) ? findPreviewBlogPost(slug) : null;
          if (preview) {
            setPost(preview);
            setRelated(
              previewBlogPosts()
                .filter((item) => item.slug !== slug)
                .slice(0, 3)
            );
            setError(null);
          } else {
            setError('We could not load this post right now. Please try again.');
            setPost(null);
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
  }, [slug]);

  const shareUrl = typeof window === 'undefined' ? '' : window.location.href;

  const handleShare = async () => {
    if (!post) return;
    const shareData = { title: post.title, text: post.excerpt || post.title, url: shareUrl };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // The user may have cancelled the native share sheet.
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] font-sans text-[#101217]">
        <SEOTitle title="Blog" />
        <Header theme="light" />
        <main className="px-5 pb-20 pt-28 sm:px-8 sm:pt-36 lg:px-10">
          <div className="mx-auto max-w-3xl animate-pulse space-y-5">
            <div className="h-5 w-32 rounded-md bg-[#E7EBF3]" />
            <div className="h-12 w-full rounded-lg bg-[#E7EBF3]" />
            <div className="h-6 w-2/3 rounded-md bg-[#E7EBF3]" />
            <div className="h-[320px] rounded-xl bg-[#E7EBF3]" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] font-sans text-[#101217]">
        <SEOTitle title="Blog" />
        <Header theme="light" />
        <main className="px-5 pb-20 pt-28 sm:px-8 sm:pt-36 lg:px-10">
          <div className="mx-auto flex max-w-lg flex-col items-center rounded-lg border border-[#E5E7EB] bg-white px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-[#FFF1F0] text-[#D92D20]">
              <ExclamationCircleIcon className="h-6 w-6" strokeWidth={1.8} />
            </span>
            <h1 className="mt-4 text-xl font-semibold">The post did not load.</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">{error}</p>
            <Link
              to="/blog"
              className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-none bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              <ArrowLeftIcon className="h-4 w-4" strokeWidth={2} />
              Back to the blog
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] font-sans text-[#101217]">
        <SEOTitle title="Post not found" />
        <Header theme="light" />
        <main className="px-5 pb-20 pt-28 sm:px-8 sm:pt-36 lg:px-10">
          <div className="mx-auto flex max-w-lg flex-col items-center rounded-lg border border-[#E5E7EB] bg-white px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-[#EEF2FF] text-lg font-semibold text-primary">
              S
            </span>
            <h1 className="mt-4 text-xl font-semibold">We could not find that post.</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
              It may have been moved, unpublished, or the link may be incomplete.
            </p>
            <Link
              to="/blog"
              className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-none bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              <ArrowLeftIcon className="h-4 w-4" strokeWidth={2} />
              Back to the blog
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const articleLines = post.content.replace(/\r\n/g, '\n').split('\n');
  if (
    articleLines[0]?.replace(/^#\s+/, '').trim().toLowerCase() === post.title.trim().toLowerCase()
  ) {
    articleLines.shift();
  }
  const articleContent = articleLines.join('\n').replace(/^\n+/, '');

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-[#101217]">
      <SEOTitle
        title={post.seo_title || post.title}
        description={post.seo_description || post.excerpt || undefined}
      />
      <Header theme="light" />

      <main>
        <section className="relative overflow-hidden bg-[#F6F9FC] px-5 pb-10 pt-28 sm:px-8 sm:pb-14 sm:pt-36 lg:px-10">
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-[-260px] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(97,131,255,0.16),rgba(95,250,176,0.08),transparent)] blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-4xl">
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6B7280] transition-colors hover:text-primary"
            >
              <ArrowLeftIcon className="h-4 w-4" strokeWidth={2} />
              All posts
            </Link>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-primary">{post.category}</span>
              <span className="text-[#A7B0C0]">·</span>
              <span className="text-[#8A94A6]">{formatBlogDate(post.published_at)}</span>
              <span className="flex items-center gap-1 text-[#8A94A6]">
                <ClockIcon className="h-3.5 w-3.5" strokeWidth={2} />
                {readingTime(post.content)}
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-[-0.04em] text-[#101217] sm:text-4xl md:text-5xl">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#4B5563] sm:text-lg">
                {post.excerpt}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#E5E7EB] pt-5">
              <div className="flex items-center gap-2.5">
                {post.author_avatar_url ? (
                  <img
                    src={post.author_avatar_url}
                    alt=""
                    className="h-9 w-9 rounded-none object-cover"
                  />
                ) : (
                  <img
                    src="/blog-author-logo.webp"
                    alt=""
                    className="h-9 w-9 rounded-none object-cover"
                  />
                )}
                <div>
                  <p className="text-sm font-medium text-[#101217]">{post.author_name}</p>
                  <p className="text-xs text-[#8A94A6]">Selorah Health</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-none border border-[#E5E7EB] bg-white px-3.5 py-1.5 text-sm font-medium text-[#4B5563] transition-colors hover:border-[#D5DCE8] hover:text-primary"
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-3.5 w-3.5 text-[#0F9F6E]" strokeWidth={2} />
                    Link copied
                  </>
                ) : (
                  <>
                    <ShareIcon className="h-3.5 w-3.5" strokeWidth={2} />
                    Share
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        <section className="px-5 pb-12 sm:px-8 sm:pb-16 lg:px-10">
          <div className="mx-auto max-w-4xl">
            <BlogCover
              title={post.title}
              category={post.category}
              src={post.cover_image_url}
              eager
              className="aspect-[16/9] w-full rounded-xl border border-[#E7EBF3] object-cover shadow-[0_24px_60px_-42px_rgba(2,9,36,0.4)]"
            />

            <article className="mt-8 rounded-xl border border-[#E7EBF3] bg-white px-5 py-7 sm:px-9 sm:py-10">
              <Markdown content={articleContent} />
            </article>

            <div className="marketing-dark mt-8 overflow-hidden rounded-xl px-6 py-8 sm:px-8 sm:py-10">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div className="max-w-xl">
                  <p className="text-sm font-medium text-[var(--md-accent)]">Own your record</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--md-fg)] sm:text-2xl">
                    Be first in line when Selorah opens in your city.
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--md-muted)]">
                    Join the waitlist for early access and launch updates. No spam.
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
          </div>
        </section>

        {related.length > 0 && (
          <section className="border-t border-[#E7EBF3] bg-white px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
            <div className="mx-auto max-w-6xl">
              <div className="mb-6 flex items-end justify-between gap-4">
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#101217] sm:text-3xl">
                  Keep reading
                </h2>
                <Link
                  to="/blog"
                  className="text-sm font-medium text-primary transition-colors hover:text-primary-hover"
                >
                  All posts
                </Link>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {related.map((item, index) => (
                  <Reveal key={item.id} delay={index * 60}>
                    <BlogCard post={item} />
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />

      <WaitlistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialRole="patient"
        source={`blog-${post.slug}`}
      />
    </div>
  );
}

export default function BlogPostPage() {
  return (
    <MotionProvider>
      <BlogPostContent />
    </MotionProvider>
  );
}
