import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRightOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  EyeIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import SEOTitle from '../../components/SEOTitle';
import Markdown from '../../components/blog/Markdown';
import MarkdownEditor from '../../components/blog/MarkdownEditor';
import BlogCover from '../../components/blog/BlogCover';
import { createClient } from '../../lib/supabase/client';
import { confirmDialog } from '../../lib/dialogs';
import {
  clearLocalSession,
  isSelorahStaffEmail,
  normalizeRole,
  readLocalSession,
} from '../../lib/auth/session';
import {
  BLOG_CATEGORIES,
  formatBlogDate,
  isBlogPreview,
  previewBlogPosts,
  readingTime,
  slugify,
  type BlogPost,
  type BlogStatus,
} from '../../lib/blog';

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  category: string;
  status: BlogStatus;
  seo_title: string;
  seo_description: string;
  author_name: string;
};

const EMPTY_FORM: FormState = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover_image_url: '',
  category: 'Announcement',
  status: 'draft',
  seo_title: '',
  seo_description: '',
  author_name: '',
};

type Profile = {
  id: string;
  email: string;
  name: string;
  role: 'writer' | 'admin';
  /** False when the auth user has no public.profiles row yet. */
  hasProfile: boolean;
  avatarUrl: string | null;
};

export default function BlogCms({ previewMode = false }: { previewMode?: boolean }) {
  const navigate = useNavigate();
  const isPreview = previewMode || isBlogPreview();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | BlogStatus>('all');
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedId) || null,
    [posts, selectedId]
  );

  const filteredPosts = useMemo(() => {
    if (statusFilter === 'all') return posts;
    return posts.filter((post) => post.status === statusFilter);
  }, [posts, statusFilter]);

  const applyPostToForm = (post: BlogPost) => {
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      cover_image_url: post.cover_image_url || '',
      category: post.category || 'Announcement',
      status: post.status,
      seo_title: post.seo_title || '',
      seo_description: post.seo_description || '',
      author_name: post.author_name || '',
    });
  };

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      if (isPreview) {
        const previewPosts = previewBlogPosts();
        if (!active) return;
        setProfile({
          id: 'preview-writer',
          email: 'writer@selorah.app',
          name: 'Preview Writer',
          role: 'writer',
          hasProfile: true,
          avatarUrl: null,
        });
        setPosts(previewPosts);
        if (previewPosts.length > 0) {
          setSelectedId(previewPosts[0].id);
          applyPostToForm(previewPosts[0]);
          setIsCreating(false);
        } else {
          setIsCreating(true);
          setForm({ ...EMPTY_FORM, author_name: 'Preview Writer' });
        }
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active) return;

        if (!user) {
          setError('You need to sign in before you can use the CMS.');
          setLoading(false);
          return;
        }

        const local = readLocalSession();
        let role: 'writer' | 'admin' | null = null;
        let name = local?.first_name
          ? [local.first_name, local.last_name].filter(Boolean).join(' ')
          : '';
        let email = user.email || local?.email || '';

        const { data: profileRow, error: profileError } = await supabase
          .from('profiles')
          .select('role, first_name, last_name, full_name, email, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (!active) return;

        const hasProfile = !profileError && Boolean(profileRow);
        if (hasProfile && profileRow) {
          const normalized = normalizeRole(profileRow.role);
          if (normalized === 'writer' || normalized === 'admin') {
            role = normalized;
          }
          const profileName = [profileRow.first_name, profileRow.last_name]
            .filter(Boolean)
            .join(' ');
          name = profileRow.full_name || profileName || name;
          if (profileRow.email) email = profileRow.email;
        }

        // Any @selorah.app account is staff, even when its portal role is patient or qa.
        const isDomainStaff =
          isSelorahStaffEmail(user.email) || isSelorahStaffEmail(email);
        if (isDomainStaff) {
          role = 'admin';
        } else if (!role) {
          const normalized = normalizeRole(local?.role);
          if (normalized === 'writer' || normalized === 'admin') {
            role = normalized;
          }
        }

        if (!role) {
          setError(
            'This account does not have CMS access. Sign in with a @selorah.app email or ask an admin to give you the writer or admin role.'
          );
          setLoading(false);
          return;
        }

        const finalName = name || email || 'Selorah Health';
        setProfile({
          id: user.id,
          email,
          name: finalName,
          role,
          hasProfile,
          avatarUrl: profileRow?.avatar_url || null,
        });

        const { data: postRows, error: postsError } = await supabase
          .from('blog_posts')
          .select('*')
          .order('updated_at', { ascending: false });

        if (!active) return;

        if (postsError) {
          setError(
            'We could not load posts. Apply the blog migrations in Supabase, then refresh this page.'
          );
          setLoading(false);
          return;
        }

        const loaded = (postRows as BlogPost[]) || [];
        setPosts(loaded);

        if (loaded.length > 0) {
          setSelectedId(loaded[0].id);
          applyPostToForm(loaded[0]);
          setIsCreating(false);
        } else {
          setIsCreating(true);
          setForm({ ...EMPTY_FORM, author_name: finalName });
        }
      } catch {
        if (active) {
          setError('We could not open the CMS. Please refresh and try again.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [isPreview]);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 3200);
  };

  const startCreate = () => {
    setSelectedId(null);
    setIsCreating(true);
    setPreview(false);
    setError(null);
    setForm({ ...EMPTY_FORM, author_name: profile?.name || '' });
    setMobileListOpen(false);
  };

  const selectPost = (post: BlogPost) => {
    setSelectedId(post.id);
    setIsCreating(false);
    setPreview(false);
    setError(null);
    applyPostToForm(post);
    setMobileListOpen(false);
  };

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleTitleChange = (value: string) => {
    setForm((current) => ({
      ...current,
      title: value,
      slug: isCreating && (!current.slug || current.slug === slugify(current.title))
        ? slugify(value)
        : current.slug,
    }));
  };

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (isPreview) {
      setCoverUploadError('Cover uploads are disabled in preview mode.');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!allowedTypes.includes(file.type)) {
      setCoverUploadError('Use a JPEG, PNG, WebP, or AVIF image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCoverUploadError('Keep the cover under 5 MB.');
      return;
    }

    setUploadingCover(true);
    setCoverUploadError(null);

    try {
      const supabase = createClient();
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const base = slugify(form.slug || form.title || 'cover') || 'cover';
      const path = `covers/${Date.now()}-${base}.${extension}`;
      const { error: uploadError } = await supabase.storage.from('blog').upload(path, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
      });

      if (uploadError) {
        const message = uploadError.message || '';
        setCoverUploadError(
          message.toLowerCase().includes('bucket')
            ? 'The blog storage bucket is missing. Apply the blog storage migration in Supabase, then try again.'
            : message || 'The image could not be uploaded.'
        );
        return;
      }

      const { data } = supabase.storage.from('blog').getPublicUrl(path);
      updateForm('cover_image_url', data.publicUrl);
      showNotice('Cover image uploaded.');
    } catch {
      setCoverUploadError('The image could not be uploaded. Check your connection and try again.');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!profile) {
      setError('Your writer profile is not ready. Refresh and try again.');
      return;
    }

    const title = form.title.trim();
    const slug = slugify(form.slug || form.title);
    const content = form.content.trim();
    const authorName = form.author_name.trim() || profile.name;

    if (title.length < 3) {
      setError('Add a title with at least 3 characters.');
      return;
    }
    if (!slug) {
      setError('Add a slug, or use a title that can generate one.');
      return;
    }
    if (content.length < 20) {
      setError('Write at least a short paragraph before saving.');
      return;
    }

    const excerpt =
      form.excerpt.trim() ||
      content
        .replace(/<[^>]+>/g, '')
        .replace(/[#*_>`[\]()]/g, '')
        .replace(/\s+/g, ' ')
        .slice(0, 180)
        .trim();

    const payload = {
      title,
      slug,
      excerpt: excerpt || null,
      content,
      cover_image_url: form.cover_image_url.trim() || null,
      category: form.category || 'Announcement',
      // Domain staff may not have a public.profiles row yet, so the FK is optional.
      author_id: profile.hasProfile ? profile.id : null,
      author_name: authorName,
      author_avatar_url: profile.avatarUrl,
      status: form.status,
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
      published_at:
        form.status === 'published'
          ? selectedPost?.published_at || new Date().toISOString()
          : null,
    };

    if (isPreview) {
      const now = new Date().toISOString();
      if (isCreating || !selectedPost) {
        const saved: BlogPost = {
          ...payload,
          id: `preview-${Date.now()}`,
          created_at: now,
          updated_at: now,
        };
        setPosts((current) => [saved, ...current]);
        setSelectedId(saved.id);
        setIsCreating(false);
        applyPostToForm(saved);
        showNotice(form.status === 'published' ? 'Post published in preview.' : 'Draft saved in preview.');
      } else {
        const saved: BlogPost = { ...selectedPost, ...payload, updated_at: now };
        setPosts((current) =>
          current
            .map((post) => (post.id === saved.id ? saved : post))
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        );
        applyPostToForm(saved);
        showNotice(form.status === 'published' ? 'Post updated in preview.' : 'Draft updated in preview.');
      }
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();

      if (isCreating || !selectedPost) {
        const { data, error: insertError } = await supabase
          .from('blog_posts')
          .insert(payload)
          .select('*')
          .single();

        if (insertError) {
          if (insertError.code === '23505') {
            setError('That slug is already in use. Choose another one.');
          } else if (insertError.code === '23503') {
            setError(
              'The blog author link is out of date. Apply the latest blog migration in Supabase, then try again.'
            );
          } else {
            setError(insertError.message || 'We could not save the post.');
          }
          return;
        }

        const saved = data as BlogPost;
        setPosts((current) => [saved, ...current]);
        setSelectedId(saved.id);
        setIsCreating(false);
        applyPostToForm(saved);
        showNotice(form.status === 'published' ? 'Post published.' : 'Draft saved.');
      } else {
        const { data, error: updateError } = await supabase
          .from('blog_posts')
          .update(payload)
          .eq('id', selectedPost.id)
          .select('*')
          .single();

        if (updateError) {
          if (updateError.code === '23505') {
            setError('That slug is already in use. Choose another one.');
          } else if (updateError.code === '23503') {
            setError(
              'The blog author link is out of date. Apply the latest blog migration in Supabase, then try again.'
            );
          } else {
            setError(updateError.message || 'We could not save the post.');
          }
          return;
        }

        const saved = data as BlogPost;
        setPosts((current) =>
          current
            .map((post) => (post.id === saved.id ? saved : post))
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        );
        applyPostToForm(saved);
        showNotice(form.status === 'published' ? 'Post updated and published.' : 'Draft updated.');
      }
    } catch {
      setError('We could not save the post. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPost) return;

    const confirmed = await confirmDialog({
      title: 'Delete this post?',
      message: `"${selectedPost.title}" will be removed permanently. Published links will stop working.`,
      confirmLabel: 'Delete post',
      tone: 'danger',
    });

    if (!confirmed) return;

    if (isPreview) {
      const remaining = posts.filter((post) => post.id !== selectedPost.id);
      setPosts(remaining);
      if (remaining.length > 0) {
        setSelectedId(remaining[0].id);
        setIsCreating(false);
        applyPostToForm(remaining[0]);
      } else {
        startCreate();
      }
      showNotice('Post deleted in preview.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', selectedPost.id);

      if (deleteError) {
        setError(deleteError.message || 'We could not delete the post.');
        return;
      }

      const remaining = posts.filter((post) => post.id !== selectedPost.id);
      setPosts(remaining);

      if (remaining.length > 0) {
        setSelectedId(remaining[0].id);
        setIsCreating(false);
        applyPostToForm(remaining[0]);
      } else {
        startCreate();
      }

      showNotice('Post deleted.');
    } catch {
      setError('We could not delete the post. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    if (isPreview) {
      navigate('/blog');
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    clearLocalSession();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F9FC]">
        <div className="text-center">
          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-3 text-sm font-semibold text-[#6B7280]">Opening the CMS...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F9FC] px-5">
        <div className="w-full max-w-md rounded-none border border-[#E7EBF3] bg-white p-7 text-center shadow-sm">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-none bg-[#FFF1F0] text-[#D92D20]">
            <ExclamationCircleIcon className="h-6 w-6" strokeWidth={1.8} />
          </span>
          <h1 className="mt-4 text-xl font-bold text-[#101217]">CMS access needed</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">{error}</p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              to="/"
              className="inline-flex min-h-[44px] items-center justify-center rounded-none bg-[#020924] px-4 py-2 text-sm font-bold text-white"
            >
              Back to the site
            </Link>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex min-h-[44px] items-center justify-center rounded-none border border-[#E7EBF3] bg-white px-4 py-2 text-sm font-bold text-[#101217]"
            >
              Sign in with another account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F9FC] font-sans text-[#101217]">
      <SEOTitle title="Writer CMS" description="Write and publish Selorah blog posts." />

      <header className="sticky top-0 z-40 border-b border-[#E7EBF3] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/" className="flex shrink-0 items-center gap-2">
              <img src="/blog-author-logo.webp" alt="" className="h-8 w-8 rounded-none" />
              <span className="hidden text-sm font-bold tracking-tight sm:block">Selorah</span>
            </Link>
            <span className="hidden h-5 w-px bg-[#E7EBF3] sm:block" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">Writer CMS</p>
              <p className="truncate text-[10px] text-[#8A94A6]">
                {profile?.name} · {profile?.role}
                {isPreview ? ' · preview' : ''}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileListOpen((value) => !value)}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-none border border-[#E7EBF3] bg-white px-3 text-xs font-bold text-[#4B5563] lg:hidden"
            >
              Posts
            </button>
            <Link
              to="/adb"
              className="hidden min-h-[38px] items-center gap-1.5 rounded-none border border-[#E7EBF3] bg-white px-3 text-xs font-bold text-[#4B5563] transition-colors hover:text-primary sm:inline-flex"
            >
              Website admin
            </Link>
            <Link
              to="/blog"
              className="hidden min-h-[38px] items-center gap-1.5 rounded-none border border-[#E7EBF3] bg-white px-3 text-xs font-bold text-[#4B5563] transition-colors hover:text-primary sm:inline-flex"
            >
              <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" strokeWidth={2} />
              View blog
            </Link>
            <button
              type="button"
              onClick={startCreate}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-none bg-[#020924] px-3.5 text-xs font-bold text-white transition-colors hover:bg-[#101217]"
            >
              <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
              New post
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-none border border-[#E7EBF3] bg-white text-[#8A94A6] transition-colors hover:text-[#D92D20]"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[300px_1fr] lg:gap-6 lg:py-7">
        <aside className={`${mobileListOpen ? 'block' : 'hidden'} lg:block`}>
          <div className="sticky top-[5.5rem] overflow-hidden rounded-none border border-[#E7EBF3] bg-white">
            <div className="border-b border-[#EFF2F7] p-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8A94A6]">
                  Posts
                </p>
                <span className="rounded-none bg-[#F4F6FA] px-2 py-0.5 text-[9px] font-bold text-[#8A94A6]">
                  {posts.length}
                </span>
              </div>
              <div className="mt-2.5 flex gap-1">
                {(['all', 'published', 'draft'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value)}
                    className={`flex-1 rounded-none px-2 py-1 text-[9px] font-bold capitalize transition-colors ${
                      statusFilter === value
                        ? 'bg-[#020924] text-white'
                        : 'bg-[#F4F6FA] text-[#8A94A6] hover:text-[#4B5563]'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[calc(100vh-14rem)] overflow-y-auto p-2">
              {filteredPosts.length === 0 ? (
                <div className="p-4 text-center">
                  <DocumentTextIcon className="mx-auto h-7 w-7 text-[#C4CBD6]" strokeWidth={1.5} />
                  <p className="mt-2 text-xs font-semibold text-[#8A94A6]">No posts here yet.</p>
                </div>
              ) : (
                filteredPosts.map((post) => {
                  const active = !isCreating && post.id === selectedId;
                  return (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => selectPost(post)}
                      className={`mb-1 w-full rounded-none border p-2.5 text-left transition-colors ${
                        active
                          ? 'border-primary/25 bg-[#EEF2FF]'
                          : 'border-transparent hover:border-[#E7EBF3] hover:bg-[#FBFCFE]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-xs font-bold leading-snug text-[#101217]">
                          {post.title}
                        </p>
                        <span
                          className={`shrink-0 rounded-none px-1.5 py-0.5 text-[8px] font-black uppercase ${
                            post.status === 'published'
                              ? 'bg-[#E9FBF3] text-[#0F9F6E]'
                              : 'bg-[#FFF5E8] text-[#B86A12]'
                          }`}
                        >
                          {post.status}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-[9px] text-[#8A94A6]">
                        {post.category} · {formatBlogDate(post.updated_at)}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <form
            onSubmit={handleSave}
            className="overflow-hidden rounded-none border border-[#E7EBF3] bg-white"
          >
            <div className="flex flex-col justify-between gap-3 border-b border-[#EFF2F7] px-4 py-3.5 sm:flex-row sm:items-center sm:px-6">
              <div className="min-w-0">
                <p className="text-sm font-bold">
                  {isCreating ? 'New post' : selectedPost?.title || 'Post'}
                </p>
                <p className="mt-0.5 text-[10px] text-[#8A94A6]">
                  {isCreating
                    ? 'Draft a new announcement or update.'
                    : selectedPost
                      ? `Last updated ${formatBlogDate(selectedPost.updated_at)}`
                      : 'Select a post to edit.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!isCreating && selectedPost && (
                  <>
                    {selectedPost.status === 'published' && (
                      <Link
                        to={`/blog/${selectedPost.slug}`}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-none border border-[#E7EBF3] bg-white px-3 text-xs font-bold text-[#4B5563] transition-colors hover:text-primary"
                      >
                        <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" strokeWidth={2} />
                        View live
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={saving}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-none border border-[#FFD5D2] bg-[#FFF8F7] px-3 text-xs font-bold text-[#D92D20] transition-colors hover:bg-[#FFF1F0] disabled:opacity-50"
                    >
                      <TrashIcon className="h-3.5 w-3.5" strokeWidth={2} />
                      Delete
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setPreview((value) => !value)}
                  className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-none border px-3 text-xs font-bold transition-colors ${
                    preview
                      ? 'border-primary/30 bg-[#EEF2FF] text-primary'
                      : 'border-[#E7EBF3] bg-white text-[#4B5563] hover:text-primary'
                  }`}
                >
                  {preview ? (
                    <>
                      <PencilSquareIcon className="h-3.5 w-3.5" strokeWidth={2} />
                      Write
                    </>
                  ) : (
                    <>
                      <EyeIcon className="h-3.5 w-3.5" strokeWidth={2} />
                      Preview
                    </>
                  )}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-none bg-primary px-4 text-xs font-bold text-white shadow-sm shadow-primary/20 transition-colors hover:bg-primary-hover disabled:opacity-60"
                >
                  {saving ? 'Saving...' : form.status === 'published' ? 'Save and publish' : 'Save draft'}
                </button>
              </div>
            </div>

            {error && (
              <div className="mx-4 mt-4 flex items-start gap-2 rounded-none border border-[#FFD5D2] bg-[#FFF8F7] px-3 py-2.5 text-xs font-semibold text-[#B42318] sm:mx-6">
                <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
                {error}
              </div>
            )}

            {notice && (
              <div className="mx-4 mt-4 flex items-start gap-2 rounded-none border border-[#B7F0D8] bg-[#F3FCF8] px-3 py-2.5 text-xs font-semibold text-[#0F7A55] sm:mx-6">
                <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
                {notice}
              </div>
            )}

            {preview ? (
              <div className="p-4 sm:p-6">
                <div className="mx-auto max-w-3xl rounded-none border border-[#EFF2F7] bg-[#FBFCFE] p-5 sm:p-8">
                  <div className="flex flex-wrap items-center gap-2 text-[9px] font-bold uppercase tracking-[0.12em]">
                    <span className="rounded-none bg-[#EEF2FF] px-2 py-0.5 text-primary">
                      {form.category}
                    </span>
                    <span className="text-[#8A94A6]">
                      {form.status === 'published' ? 'Published' : 'Draft preview'}
                    </span>
                    <span className="text-[#8A94A6]">{readingTime(form.content)}</span>
                  </div>
                  <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-[#101217] sm:text-3xl">
                    {form.title || 'Untitled post'}
                  </h1>
                  {form.excerpt && (
                    <p className="mt-3 text-sm leading-relaxed text-[#6B7280]">{form.excerpt}</p>
                  )}
                  <BlogCover
                    title={form.title || 'Untitled post'}
                    category={form.category}
                    src={form.cover_image_url}
                    className="mt-5 aspect-[16/9] w-full rounded-none object-cover"
                  />
                  <div className="mt-5 border-t border-[#EFF2F7] pt-4">
                    {form.content.trim() ? (
                      <Markdown content={form.content} />
                    ) : (
                      <p className="text-sm italic text-[#A7B0C0]">Nothing to preview yet.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-0 lg:grid-cols-[1fr_280px]">
                <div className="min-w-0 p-4 sm:p-6">
                  <label className="block">
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8A94A6]">
                      Title
                    </span>
                    <input
                      value={form.title}
                      onChange={(event) => handleTitleChange(event.target.value)}
                      placeholder="A clear, useful headline"
                      className="mt-1.5 w-full rounded-none border border-[#E7EBF3] bg-[#FBFCFE] px-3.5 py-3 text-xl font-bold tracking-tight text-[#101217] outline-none transition-colors placeholder:text-[#C4CBD6] focus:border-primary/40 focus:bg-white sm:text-2xl"
                    />
                  </label>

                  <label className="mt-4 block">
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8A94A6]">
                      Slug
                    </span>
                    <div className="mt-1.5 flex items-center rounded-none border border-[#E7EBF3] bg-[#FBFCFE] focus-within:border-primary/40 focus-within:bg-white">
                      <span className="pl-3 text-xs font-semibold text-[#A7B0C0]">/blog/</span>
                      <input
                        value={form.slug}
                        onChange={(event) => updateForm('slug', slugify(event.target.value))}
                        placeholder="post-slug"
                        className="min-w-0 flex-1 bg-transparent px-1.5 py-2.5 text-xs font-semibold text-[#101217] outline-none placeholder:text-[#C4CBD6]"
                      />
                      <button
                        type="button"
                        onClick={() => updateForm('slug', slugify(form.title))}
                        className="mr-2 rounded-none bg-white px-2.5 py-1 text-[9px] font-bold text-primary ring-1 ring-[#E7EBF3] transition-colors hover:bg-[#EEF2FF]"
                      >
                        Generate
                      </button>
                    </div>
                  </label>

                  <label className="mt-4 block">
                    <span className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.14em] text-[#8A94A6]">
                      Excerpt
                      <span className="font-semibold normal-case tracking-normal text-[#A7B0C0]">
                        {form.excerpt.length}/180
                      </span>
                    </span>
                    <textarea
                      value={form.excerpt}
                      onChange={(event) => updateForm('excerpt', event.target.value.slice(0, 180))}
                      rows={3}
                      placeholder="One or two sentences for the blog card and search results."
                      className="mt-1.5 w-full resize-none rounded-none border border-[#E7EBF3] bg-[#FBFCFE] px-3.5 py-2.5 text-sm leading-relaxed text-[#101217] outline-none transition-colors placeholder:text-[#C4CBD6] focus:border-primary/40 focus:bg-white"
                    />
                  </label>

                  <div className="mt-4 block">
                    <span className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.14em] text-[#8A94A6]">
                      Content
                      <span className="font-semibold normal-case tracking-normal text-[#A7B0C0]">
                        Select text, then format
                      </span>
                    </span>
                    <MarkdownEditor
                      value={form.content}
                      onChange={(value) => updateForm('content', value)}
                      rows={18}
                      placeholder={'# Start writing\n\nAdd paragraphs, lists, links, quotes, and images with Markdown.'}
                    />
                  </div>
                </div>

                <aside className="border-t border-[#EFF2F7] bg-[#FBFCFE] p-4 sm:p-6 lg:border-l lg:border-t-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8A94A6]">
                    Post settings
                  </p>

                  <label className="mt-4 block">
                    <span className="text-[10px] font-bold text-[#6B7280]">Status</span>
                    <select
                      value={form.status}
                      onChange={(event) => updateForm('status', event.target.value as BlogStatus)}
                      className="mt-1.5 w-full rounded-none border border-[#E7EBF3] bg-white px-3 py-2.5 text-xs font-semibold text-[#101217] outline-none focus:border-primary/40"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </label>

                  <label className="mt-3 block">
                    <span className="text-[10px] font-bold text-[#6B7280]">Category</span>
                    <select
                      value={form.category}
                      onChange={(event) => updateForm('category', event.target.value)}
                      className="mt-1.5 w-full rounded-none border border-[#E7EBF3] bg-white px-3 py-2.5 text-xs font-semibold text-[#101217] outline-none focus:border-primary/40"
                    >
                      {BLOG_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="mt-3 block">
                    <span className="text-[10px] font-bold text-[#6B7280]">Author name</span>
                    <input
                      value={form.author_name}
                      onChange={(event) => updateForm('author_name', event.target.value)}
                      placeholder="Selorah Health"
                      className="mt-1.5 w-full rounded-none border border-[#E7EBF3] bg-white px-3 py-2.5 text-xs font-semibold text-[#101217] outline-none placeholder:text-[#C4CBD6] focus:border-primary/40"
                    />
                  </label>

                  <div className="mt-3">
                    <span className="text-[10px] font-bold text-[#6B7280]">Cover image</span>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        disabled={uploadingCover || isPreview}
                        className="inline-flex min-h-[36px] items-center justify-center rounded-none border border-[#E7EBF3] bg-white px-3 text-[10px] font-bold text-[#101217] transition-colors hover:bg-[#F6F8FA] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {uploadingCover ? 'Uploading...' : 'Upload image'}
                      </button>
                      {form.cover_image_url && (
                        <button
                          type="button"
                          onClick={() => {
                            updateForm('cover_image_url', '');
                            setCoverUploadError(null);
                          }}
                          className="inline-flex min-h-[36px] items-center justify-center rounded-none border border-[#FFD5D2] bg-[#FFF8F7] px-3 text-[10px] font-bold text-[#D92D20] transition-colors hover:bg-[#FFF1F0]"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={handleCoverUpload}
                      className="hidden"
                    />
                    {coverUploadError && (
                      <p className="mt-1.5 text-[10px] font-semibold text-[#D92D20]">
                        {coverUploadError}
                      </p>
                    )}
                    {isPreview && (
                      <p className="mt-1.5 text-[10px] font-medium text-[#8A94A6]">
                        Uploads are disabled in preview mode.
                      </p>
                    )}
                    <label className="mt-2 block">
                      <span className="text-[10px] font-bold text-[#6B7280]">
                        Or paste an image URL
                      </span>
                      <input
                        value={form.cover_image_url}
                        onChange={(event) => updateForm('cover_image_url', event.target.value)}
                        placeholder="https://..."
                        className="mt-1.5 w-full rounded-none border border-[#E7EBF3] bg-white px-3 py-2.5 text-xs font-semibold text-[#101217] outline-none placeholder:text-[#C4CBD6] focus:border-primary/40"
                      />
                    </label>
                    <span className="mt-1 block text-[10px] font-medium text-[#8A94A6]">
                      16:9 recommended. 1600 x 900 or larger. JPEG, PNG, WebP, or AVIF up to 5 MB.
                      If no image is uploaded, the standard #6183FF cover with the post title is
                      used.
                    </span>
                    <BlogCover
                      title={form.title || 'Untitled post'}
                      category={form.category}
                      src={form.cover_image_url}
                      className="mt-2 aspect-[16/9] w-full rounded-none border border-[#E7EBF3] object-cover"
                    />
                  </div>

                  <div className="mt-5 border-t border-[#EFF2F7] pt-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8A94A6]">
                      Search preview
                    </p>
                    <label className="mt-3 block">
                      <span className="text-[10px] font-bold text-[#6B7280]">SEO title</span>
                      <input
                        value={form.seo_title}
                        onChange={(event) => updateForm('seo_title', event.target.value)}
                        placeholder={form.title || 'Optional'}
                        className="mt-1.5 w-full rounded-none border border-[#E7EBF3] bg-white px-3 py-2.5 text-xs font-semibold text-[#101217] outline-none placeholder:text-[#C4CBD6] focus:border-primary/40"
                      />
                    </label>
                    <label className="mt-3 block">
                      <span className="text-[10px] font-bold text-[#6B7280]">SEO description</span>
                      <textarea
                        value={form.seo_description}
                        onChange={(event) => updateForm('seo_description', event.target.value)}
                        rows={3}
                        placeholder={form.excerpt || 'Optional'}
                        className="mt-1.5 w-full resize-none rounded-none border border-[#E7EBF3] bg-white px-3 py-2.5 text-xs font-semibold leading-relaxed text-[#101217] outline-none placeholder:text-[#C4CBD6] focus:border-primary/40"
                      />
                    </label>
                  </div>

                  <div className="mt-5 rounded-none border border-[#E7EBF3] bg-white p-3">
                    <p className="text-[10px] font-bold text-[#4B5563]">Publishing checklist</p>
                    <ul className="mt-2 space-y-1.5 text-[10px] text-[#8A94A6]">
                      <li className="flex items-center gap-1.5">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            form.title.trim().length >= 3 ? 'bg-[#0F9F6E]' : 'bg-[#E7EBF3]'
                          }`}
                        />
                        Title
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            form.slug.trim() ? 'bg-[#0F9F6E]' : 'bg-[#E7EBF3]'
                          }`}
                        />
                        Slug
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            form.content.trim().length >= 20 ? 'bg-[#0F9F6E]' : 'bg-[#E7EBF3]'
                          }`}
                        />
                        Content
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            form.status === 'published' ? 'bg-[#0F9F6E]' : 'bg-[#E7EBF3]'
                          }`}
                        />
                        Published
                      </li>
                    </ul>
                  </div>
                </aside>
              </div>
            )}
          </form>
        </main>
      </div>
    </div>
  );
}
