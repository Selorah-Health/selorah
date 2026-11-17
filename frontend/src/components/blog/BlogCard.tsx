import { ArrowRightIcon, ClockIcon } from '@heroicons/react/24/outline';
import { m } from 'framer-motion';
import { Link } from 'react-router-dom';
import { blogPostPath, formatBlogDate, readingTime, type BlogPost } from '../../lib/blog';
import BlogCover from './BlogCover';

export default function BlogCard({ post, featured = false }: { post: BlogPost; featured?: boolean }) {
  return (
    <m.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="h-full"
    >
      <Link
        to={blogPostPath(post.slug)}
        className={`group flex h-full flex-col overflow-hidden rounded-lg border border-[#E5E7EB] bg-white transition-colors hover:border-[#D5DCE8] ${
          featured ? 'lg:flex-row' : ''
        }`}
      >
      <div
        className={`relative overflow-hidden bg-[#F6F9FC] ${
          featured ? 'aspect-[16/9] lg:aspect-auto lg:w-[52%]' : 'aspect-[16/9]'
        }`}
      >
        <BlogCover
          title={post.title}
          category={post.category}
          src={post.cover_image_url}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </div>

      <div className={`flex flex-1 flex-col p-5 sm:p-6 ${featured ? 'lg:justify-center lg:p-8' : ''}`}>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-primary">{post.category}</span>
          <span className="text-[#A7B0C0]">·</span>
          <span className="text-[#8A94A6]">{formatBlogDate(post.published_at)}</span>
        </div>

        <h3
          className={`mt-3 font-semibold leading-snug tracking-[-0.02em] text-[#101217] transition-colors group-hover:text-primary ${
            featured ? 'text-2xl sm:text-3xl' : 'text-lg'
          }`}
        >
          {post.title}
        </h3>

        {post.excerpt && (
          <p
            className={`mt-2.5 leading-relaxed text-[#6B7280] ${
              featured ? 'text-sm sm:text-base' : 'text-sm'
            }`}
          >
            {post.excerpt}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <div className="flex items-center gap-2 text-xs text-[#8A94A6]">
            <img
              src={post.author_avatar_url || '/blog-author-logo.webp'}
              alt=""
              className="h-6 w-6 rounded-none object-cover"
            />
            <span className="font-medium text-[#4B5563]">{post.author_name}</span>
            <span className="flex items-center gap-1">
              <ClockIcon className="h-3 w-3" strokeWidth={2} />
              {readingTime(post.content)}
            </span>
          </div>
          <ArrowRightIcon
            className="h-4 w-4 shrink-0 text-primary transition-transform duration-200 group-hover:translate-x-0.5"
            strokeWidth={2}
          />
        </div>
      </div>
      </Link>
    </m.div>
  );
}
