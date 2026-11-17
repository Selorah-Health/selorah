import { useEffect, useState } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { createClient } from '../../lib/supabase/client';
import {
  isBlogPreview,
  previewBlogPosts,
  type BlogPost,
} from '../../lib/blog';
import BlogCard from '../blog/BlogCard';
import Reveal from './Reveal';

const TEASER_MIN = 3;
const TEASER_LIMIT = 9;

function fallbackPosts(limit = TEASER_MIN) {
  return previewBlogPosts().slice(0, limit);
}

function ensureMinimumPosts(posts: BlogPost[]) {
  const base = posts.slice(0, TEASER_LIMIT);
  if (base.length >= TEASER_MIN) return base;

  const seen = new Set(base.map((post) => post.slug));
  const filler = previewBlogPosts().filter((post) => !seen.has(post.slug));
  return [...base, ...filler].slice(0, TEASER_MIN);
}

export default function BlogTeaserSection() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      if (isBlogPreview()) {
        if (active) {
          setPosts(previewBlogPosts().slice(0, TEASER_LIMIT));
          setLoading(false);
        }
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('status', 'published')
          .lte('published_at', new Date().toISOString())
          .order('published_at', { ascending: false })
          .limit(TEASER_LIMIT);

        if (!active) return;
        if (error) {
          setPosts(fallbackPosts());
        } else {
          setPosts(ensureMinimumPosts((data as BlogPost[]) || []));
        }
      } catch {
        if (active) {
          setPosts(fallbackPosts());
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="bg-white px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mb-10 flex flex-col justify-between gap-4 sm:mb-12 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-primary">From the blog</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#101217] sm:text-4xl">
                Notes from the build.
              </h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-[#4B5563]">
                Product updates, launch news, and practical notes on portable health records.
              </p>
            </div>
            <Link
              to="/blog"
              className="group inline-flex shrink-0 items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
            >
              Read the blog
              <ArrowRightIcon
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </Link>
          </div>
        </Reveal>

        {loading ? (
          <div className="grid gap-8 md:grid-cols-3">
            {Array.from({ length: TEASER_MIN }, (_, item) => (
              <div
                key={item}
                className="h-[340px] animate-pulse rounded-lg border border-[#E5E7EB] bg-[#F6F9FC]"
              />
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-3">
            {posts.map((post, index) => (
              <Reveal key={post.id} delay={index * 70}>
                <BlogCard post={post} />
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal>
            <div className="flex flex-col items-start justify-between gap-5 rounded-lg border border-[#E5E7EB] bg-[#F6F9FC] p-6 sm:flex-row sm:items-center sm:p-8">
              <div>
                <h3 className="text-lg font-semibold text-[#101217]">
                  The first post is on the way.
                </h3>
                <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-[#6B7280]">
                  We will use the blog for launch announcements, product changes, and important
                  updates for waitlist members.
                </p>
              </div>
              <Link
                to="/blog"
                className="group inline-flex shrink-0 items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
              >
                Visit the blog
                <ArrowRightIcon
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={2}
                />
              </Link>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
