import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRightOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  ExclamationCircleIcon,
  GlobeAltIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import SEOTitle from '../../components/SEOTitle';
import { AdMedia } from '../../components/landing/AdSections';
import { useSiteContent } from '../../contexts/SiteContentContext';
import { confirmDialog } from '../../lib/dialogs';
import {
  clearLocalSession,
  isSelorahSiteAdminEmail,
  normalizeRole,
  readLocalSession,
} from '../../lib/auth/session';
import { createClient } from '../../lib/supabase/client';
import {
  AD_ASPECT_RATIOS,
  DEFAULT_AD_SLOTS,
  DEFAULT_SITE_CONTENT,
  adSlotToRow,
  aspectRatioLabel,
  mergeAdSlots,
  mergeSiteContent,
  writeCachedAdSlots,
  writeCachedSiteContent,
  type AdSlotContent,
  type AdSlotId,
  type SiteContent,
} from '../../lib/siteContent';

type Profile = {
  id: string;
  email: string;
  name: string;
  role: 'writer' | 'admin';
  hasProfile: boolean;
};

type Tab = 'home' | 'faq' | 'founder' | 'contact' | 'ads' | 'advanced';

function buildUploadPath(adId: AdSlotId, fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase() || 'png';
  return `ads/${adId}-${Date.now()}.${extension}`;
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'home', label: 'Home page' },
  { id: 'faq', label: 'FAQ' },
  { id: 'founder', label: 'Founder' },
  { id: 'contact', label: 'Contact' },
  { id: 'ads', label: 'Ad slots' },
  { id: 'advanced', label: 'Advanced JSON' },
];

function setAtPath<T>(source: T, path: (string | number)[], value: unknown): T {
  if (path.length === 0) return value as T;
  const [head, ...rest] = path;

  if (Array.isArray(source)) {
    const copy = [...source];
    const index = head as number;
    copy[index] = setAtPath(copy[index], rest, value);
    return copy as T;
  }

  if (source && typeof source === 'object') {
    const copy = { ...(source as Record<string, unknown>) };
    const key = String(head);
    copy[key] = setAtPath(copy[key], rest, value);
    return copy as T;
  }

  return source;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  type?: 'text' | 'email' | 'url';
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.14em] text-[#8A94A6]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-[42px] w-full rounded-none border border-[#E7EBF3] bg-[#FAFBFF] px-3 text-xs font-semibold text-[#101217] outline-none transition-colors placeholder:text-gray-300 focus:border-primary focus:bg-white"
      />
      {hint && <span className="mt-1 block text-[10px] font-medium text-[#8A94A6]">{hint}</span>}
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.14em] text-[#8A94A6]">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-y rounded-none border border-[#E7EBF3] bg-[#FAFBFF] px-3 py-2.5 text-xs font-medium leading-relaxed text-[#101217] outline-none transition-colors placeholder:text-gray-300 focus:border-primary focus:bg-white"
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border border-[#E7EBF3] bg-[#FAFBFF] px-3 py-2.5">
      <div>
        <p className="text-xs font-bold text-[#101217]">{label}</p>
        {hint && <p className="mt-0.5 text-[10px] font-medium text-[#8A94A6]">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-[#D5DCE8]'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

function Panel({
  title,
  description,
  children,
  className = '',
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`border border-[#E7EBF3] bg-white p-4 sm:p-5 ${className}`}>
      <div className="mb-4">
        <h2 className="text-sm font-black tracking-tight text-[#101217]">{title}</h2>
        {description && (
          <p className="mt-1 text-[10px] font-medium leading-relaxed text-[#8A94A6]">
            {description}
          </p>
        )}
      </div>
      <div className="space-y-3.5">{children}</div>
    </section>
  );
}

function AdEditor({
  ad,
  onChange,
  onUpload,
  uploading,
  uploadError,
}: {
  ad: AdSlotContent;
  onChange: (patch: Partial<AdSlotContent>) => void;
  onUpload: (file: File) => void;
  uploading: boolean;
  uploadError: string | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Panel
      title={`${ad.label || ad.id} (${ad.id})`}
      description="Upload a banner or leave the placeholder in place. The aspect ratio is applied to both the image and the placeholder."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-3.5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Label" value={ad.label} onChange={(value) => onChange({ label: value })} />
            <label className="block">
              <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.14em] text-[#8A94A6]">
                Aspect ratio
              </span>
              <select
                value={ad.aspectRatio}
                onChange={(event) => onChange({ aspectRatio: event.target.value })}
                className="min-h-[42px] w-full rounded-none border border-[#E7EBF3] bg-[#FAFBFF] px-3 text-xs font-semibold text-[#101217] outline-none focus:border-primary focus:bg-white"
              >
                {AD_ASPECT_RATIOS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <Field
            label="Headline"
            value={ad.headline}
            onChange={(value) => onChange({ headline: value })}
          />
          <TextArea label="Body" value={ad.body} onChange={(value) => onChange({ body: value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="CTA label"
              value={ad.ctaLabel}
              onChange={(value) => onChange({ ctaLabel: value })}
            />
            <Field
              label="CTA URL"
              value={ad.ctaUrl}
              onChange={(value) => onChange({ ctaUrl: value })}
              placeholder="/contact"
            />
          </div>
          <Field
            label="Image alt text"
            value={ad.imageAlt}
            onChange={(value) => onChange({ imageAlt: value })}
            placeholder="Describe the partner image for screen readers"
          />

          <Toggle
            label="Show this slot on the website"
            checked={ad.isActive}
            onChange={(checked) => onChange({ isActive: checked })}
            hint="Inactive slots are hidden from public pages."
          />

          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUpload(file);
                event.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex min-h-[38px] items-center justify-center gap-1.5 border border-[#E7EBF3] bg-white px-3 text-[10px] font-bold text-[#101217] transition-colors hover:bg-[#F6F8FA] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CloudArrowUpIcon className="h-3.5 w-3.5" />
              {uploading ? 'Uploading...' : 'Upload image'}
            </button>
            {ad.imageUrl && (
              <button
                type="button"
                onClick={() => onChange({ imageUrl: '' })}
                className="inline-flex min-h-[38px] items-center justify-center gap-1.5 border border-[#E7EBF3] bg-white px-3 text-[10px] font-bold text-[#D92D20] transition-colors hover:bg-red-50"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                Remove image
              </button>
            )}
          </div>

          {uploadError && (
            <p className="flex items-start gap-2 border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-semibold leading-relaxed text-red-600">
              <ExclamationCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {uploadError}
            </p>
          )}
        </div>

        <div>
          <p className="mb-2 text-[9px] font-black uppercase tracking-[0.14em] text-[#8A94A6]">
            Live preview
          </p>
          <AdMedia slot={ad} showPlaceholder />
          <p className="mt-2 text-[10px] font-medium leading-relaxed text-[#8A94A6]">
            {ad.imageUrl
              ? 'Image loaded. Save to publish the new image.'
              : `Placeholder active at ${aspectRatioLabel(ad.aspectRatio)}.`}
          </p>
          <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-[#4B5563]">
            <PhotoIcon className="h-3.5 w-3.5" />
            {ad.imageUrl ? 'Image' : 'Placeholder'} state
          </p>
        </div>
      </div>
    </Panel>
  );
}

export default function SiteCms() {
  const navigate = useNavigate();
  const { refresh } = useSiteContent();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [content, setContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [ads, setAds] = useState<AdSlotContent[]>(DEFAULT_AD_SLOTS);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<AdSlotId | null>(null);
  const [uploadError, setUploadError] = useState<{ adId: AdSlotId; message: string } | null>(null);
  const [advancedJson, setAdvancedJson] = useState('');

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 3600);
  };

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active) return;

        if (!user) {
          setError('You need to sign in before you can use the website admin.');
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
          .select('role, first_name, last_name, full_name, email')
          .eq('id', user.id)
          .maybeSingle();

        if (!active) return;

        const hasProfile = !profileError && Boolean(profileRow);
        if (hasProfile && profileRow) {
          const normalized = normalizeRole(profileRow.role);
          if (normalized === 'writer' || normalized === 'admin') role = normalized;
          const profileName = [profileRow.first_name, profileRow.last_name]
            .filter(Boolean)
            .join(' ');
          name = profileRow.full_name || profileName || name;
          if (profileRow.email) email = profileRow.email;
        }

        const isSiteAdmin =
          isSelorahSiteAdminEmail(user.email) || isSelorahSiteAdminEmail(email);
        if (isSiteAdmin) {
          role = 'admin';
        } else if (!role) {
          const normalized = normalizeRole(local?.role);
          if (normalized === 'writer' || normalized === 'admin') role = normalized;
        }

        if (!role) {
          setError(
            'This account does not have website admin access. Sign in with a @selorah.app email or ask an admin to give you the writer or admin role.'
          );
          setLoading(false);
          return;
        }

        setProfile({
          id: user.id,
          email,
          name: name || email || 'Selorah Health',
          role,
          hasProfile,
        });

        const [contentResult, adsResult] = await Promise.all([
          supabase.from('site_content').select('value').eq('key', 'site').maybeSingle(),
          supabase.from('ad_slots').select('*').order('sort_order', { ascending: true }),
        ]);

        if (!active) return;

        if (contentResult.error) {
          setError(
            'The website content table is not ready. Apply supabase/migrations/20261115000002_site_cms.sql in Supabase, then refresh.'
          );
        } else if (contentResult.data?.value) {
          setContent(mergeSiteContent(contentResult.data.value));
        }

        if (adsResult.error) {
          setError(
            'The ad slot table is not ready. Apply supabase/migrations/20261115000002_site_cms.sql in Supabase, then refresh.'
          );
        } else {
          setAds(mergeAdSlots((adsResult.data || []) as Parameters<typeof mergeAdSlots>[0]));
        }
      } catch {
        if (active) {
          setError('We could not open the website admin. Refresh the page and try again.');
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

  const updateContent = (path: (string | number)[], value: unknown) => {
    setContent((previous) => setAtPath(previous, path, value));
  };

  const updateAd = (id: AdSlotId, patch: Partial<AdSlotContent>) => {
    setAds((previous) =>
      previous.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot))
    );
  };

  const saveError = (message: string | undefined) => {
    if (!message) return 'Could not save the website content.';
    if (/could not find the table|relation .* does not exist|schema cache/i.test(message)) {
      return 'The website CMS tables are missing. Apply supabase/migrations/20261115000002_site_cms.sql in Supabase, then try again.';
    }
    return message;
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const updatedBy = profile.hasProfile ? profile.id : null;
      const { error: contentError } = await supabase.from('site_content').upsert(
        {
          key: 'site',
          value: content,
          is_published: true,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy,
        },
        { onConflict: 'key' }
      );

      if (contentError) {
        setError(saveError(contentError.message));
        return;
      }

      const { error: adsError } = await supabase
        .from('ad_slots')
        .upsert(ads.map((slot) => adSlotToRow(slot, updatedBy)), { onConflict: 'id' });

      if (adsError) {
        setError(saveError(adsError.message));
        return;
      }

      // Publish the saved snapshot immediately. The storage event updates any
      // other open tab, and refresh reconciles with the server.
      writeCachedSiteContent(content);
      writeCachedAdSlots(ads);
      await refresh();
      showNotice('Website content saved and published.');
    } catch (saveFailure) {
      setError(
        saveFailure instanceof Error
          ? saveError(saveFailure.message)
          : 'Could not save the website content.'
      );
    } finally {
      setSaving(false);
    }
  };

  const uploadAdImage = async (adId: AdSlotId, file: File) => {
    setUploadError(null);

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) {
      setUploadError({
        adId,
        message: 'Use a JPEG, PNG, WebP, or AVIF image.',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError({ adId, message: 'Keep the image under 5 MB.' });
      return;
    }

    setUploadingId(adId);

    try {
      const supabase = createClient();
      const path = buildUploadPath(adId, file.name);
      const { error: uploadFailure } = await supabase.storage.from('site').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

      if (uploadFailure) {
        throw uploadFailure;
      }

      const { data } = supabase.storage.from('site').getPublicUrl(path);
      updateAd(adId, { imageUrl: data.publicUrl });
      showNotice('Image uploaded. Save changes to publish it.');
    } catch (uploadFailure) {
      const message =
        uploadFailure instanceof Error ? uploadFailure.message : 'The upload did not finish.';
      setUploadError({
        adId,
        message: /bucket|not found|does not exist/i.test(message)
          ? 'The public site storage bucket is missing. Apply the site CMS migration, then try again.'
          : message,
      });
    } finally {
      setUploadingId(null);
    }
  };

  const handleReset = async () => {
    const confirmed = await confirmDialog({
      title: 'Reset website content?',
      message:
        'This restores the local form to the built-in defaults. It does not change the live site until you save.',
      confirmLabel: 'Reset form',
      tone: 'danger',
    });

    if (!confirmed) return;
    setContent(DEFAULT_SITE_CONTENT);
    setAds(DEFAULT_AD_SLOTS);
    setError(null);
    showNotice('Defaults restored in the form. Save to publish them.');
  };

  const handleSignOut = async () => {
    try {
      await createClient().auth.signOut();
    } catch {
      // Sign out is best effort.
    }
    clearLocalSession();
    navigate('/login');
  };

  const applyAdvancedJson = () => {
    try {
      const parsed = JSON.parse(advancedJson) as unknown;
      setContent(mergeSiteContent(parsed));
      setError(null);
      showNotice('JSON applied to the form. Save to publish it.');
    } catch {
      setError('That JSON is not valid. Check the brackets and try again.');
    }
  };

  const bioText = useMemo(() => content.founder.bio.join('\n\n'), [content.founder.bio]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F9FC] font-sans">
        <div className="text-center">
          <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm font-semibold text-[#6B7280]">Opening the website admin...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F9FC] px-5 font-sans">
        <div className="w-full max-w-md border border-[#E7EBF3] bg-white p-6 text-center">
          <img src="/blog-author-logo.webp" alt="" className="mx-auto h-12 w-12" />
          <h1 className="mt-4 text-xl font-bold text-[#101217]">Website admin access needed</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
            {error || 'Sign in with a Selorah staff account to edit the website.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-5 min-h-[44px] w-full bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F9FC] font-sans text-[#101217]">
      <SEOTitle title="Website admin" description="Edit the Selorah website content and ad slots." />

      <header className="sticky top-0 z-40 border-b border-[#E7EBF3] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/" className="flex shrink-0 items-center gap-2">
              <img src="/blog-author-logo.webp" alt="" className="h-8 w-8 rounded-none" />
              <span className="hidden text-sm font-bold tracking-tight sm:block">Selorah</span>
            </Link>
            <span className="hidden h-5 w-px bg-[#E7EBF3] sm:block" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">Website admin</p>
              <p className="truncate text-[10px] text-[#8A94A6]">
                {profile.name} · {profile.role}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/"
              className="inline-flex min-h-[38px] items-center gap-1.5 border border-[#E7EBF3] bg-white px-3 text-xs font-bold text-[#4B5563] transition-colors hover:text-primary"
            >
              <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" strokeWidth={2} />
              View site
            </Link>
            <Link
              to="/cms"
              className="inline-flex min-h-[38px] items-center gap-1.5 border border-[#E7EBF3] bg-white px-3 text-xs font-bold text-[#4B5563] transition-colors hover:text-primary"
            >
              <GlobeAltIcon className="h-3.5 w-3.5" strokeWidth={2} />
              Blog CMS
            </Link>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex min-h-[38px] items-center gap-1.5 border border-[#E7EBF3] bg-white px-3 text-xs font-bold text-[#4B5563] transition-colors hover:text-primary"
            >
              Reset form
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="inline-flex min-h-[38px] items-center gap-1.5 bg-[#020924] px-3.5 text-xs font-bold text-white transition-colors hover:bg-[#101217] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircleIcon className="h-3.5 w-3.5" strokeWidth={2} />
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              aria-label="Sign out"
              className="inline-flex h-[38px] w-[38px] items-center justify-center border border-[#E7EBF3] bg-white text-[#8A94A6] transition-colors hover:text-[#D92D20]"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:py-7">
        {(error || notice) && (
          <div className="mb-4 space-y-2">
            {error && (
              <p className="flex items-start gap-2 border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold leading-relaxed text-red-600">
                <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </p>
            )}
            {notice && (
              <p
                aria-live="polite"
                className="flex items-start gap-2 border border-green-100 bg-green-50 px-4 py-3 text-xs font-semibold leading-relaxed text-green-700"
              >
                <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                {notice}
              </p>
            )}
          </div>
        )}

        <div className="mb-5 flex gap-1 overflow-x-auto border-b border-[#E7EBF3] pb-px">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'advanced') {
                  setAdvancedJson(JSON.stringify(content, null, 2));
                }
              }}
              className={`shrink-0 border-b-2 px-3 py-2 text-xs font-bold transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-[#8A94A6] hover:text-[#101217]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'home' && (
          <div className="grid gap-4 xl:grid-cols-2">
            <Panel title="Announcement bar" description="The slim strip above the header.">
              <Field
                label="Text"
                value={content.announcement.text}
                onChange={(value) => updateContent(['announcement', 'text'], value)}
              />
              <Field
                label="Link label"
                value={content.announcement.linkLabel}
                onChange={(value) => updateContent(['announcement', 'linkLabel'], value)}
              />
            </Panel>

            <Panel title="Hero" description="The first screen on the home page.">
              <Field
                label="Eyebrow"
                value={content.hero.eyebrow}
                onChange={(value) => updateContent(['hero', 'eyebrow'], value)}
              />
              <Field
                label="Title"
                value={content.hero.title}
                onChange={(value) => updateContent(['hero', 'title'], value)}
              />
              <TextArea
                label="Subtitle"
                value={content.hero.subtitle}
                onChange={(value) => updateContent(['hero', 'subtitle'], value)}
              />
              <Field
                label="Button label"
                value={content.hero.ctaLabel}
                onChange={(value) => updateContent(['hero', 'ctaLabel'], value)}
              />
            </Panel>

            <Panel title="Product preview">
              <Toggle
                label="Show product preview"
                checked={content.productPreview.enabled}
                onChange={(checked) => updateContent(['productPreview', 'enabled'], checked)}
              />
              <Field
                label="Eyebrow"
                value={content.productPreview.eyebrow}
                onChange={(value) => updateContent(['productPreview', 'eyebrow'], value)}
              />
              <Field
                label="Title"
                value={content.productPreview.title}
                onChange={(value) => updateContent(['productPreview', 'title'], value)}
              />
              <TextArea
                label="Body"
                value={content.productPreview.body}
                onChange={(value) => updateContent(['productPreview', 'body'], value)}
              />
            </Panel>

            <Panel title="For hospitals and doctors">
              <Toggle
                label="Show care teams section"
                checked={content.careTeams.enabled}
                onChange={(checked) => updateContent(['careTeams', 'enabled'], checked)}
              />
              <Field
                label="Eyebrow"
                value={content.careTeams.eyebrow}
                onChange={(value) => updateContent(['careTeams', 'eyebrow'], value)}
              />
              <Field
                label="Title"
                value={content.careTeams.title}
                onChange={(value) => updateContent(['careTeams', 'title'], value)}
              />
              <TextArea
                label="Body"
                value={content.careTeams.body}
                onChange={(value) => updateContent(['careTeams', 'body'], value)}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Doctor card title"
                  value={content.careTeams.doctorTitle}
                  onChange={(value) => updateContent(['careTeams', 'doctorTitle'], value)}
                />
                <Field
                  label="Hospital card title"
                  value={content.careTeams.hospitalTitle}
                  onChange={(value) => updateContent(['careTeams', 'hospitalTitle'], value)}
                />
              </div>
              <TextArea
                label="Doctor card body"
                value={content.careTeams.doctorBody}
                onChange={(value) => updateContent(['careTeams', 'doctorBody'], value)}
              />
              <TextArea
                label="Hospital card body"
                value={content.careTeams.hospitalBody}
                onChange={(value) => updateContent(['careTeams', 'hospitalBody'], value)}
              />
            </Panel>

            <Panel title="Ownership">
              <Toggle
                label="Show ownership section"
                checked={content.ownership.enabled}
                onChange={(checked) => updateContent(['ownership', 'enabled'], checked)}
              />
              <Field
                label="Eyebrow"
                value={content.ownership.eyebrow}
                onChange={(value) => updateContent(['ownership', 'eyebrow'], value)}
              />
              <Field
                label="Title"
                value={content.ownership.title}
                onChange={(value) => updateContent(['ownership', 'title'], value)}
              />
              <TextArea
                label="Body"
                value={content.ownership.body}
                onChange={(value) => updateContent(['ownership', 'body'], value)}
              />
            </Panel>

            <Panel title="Trust and security">
              <Toggle
                label="Show trust section"
                checked={content.trust.enabled}
                onChange={(checked) => updateContent(['trust', 'enabled'], checked)}
              />
              <Field
                label="Eyebrow"
                value={content.trust.eyebrow}
                onChange={(value) => updateContent(['trust', 'eyebrow'], value)}
              />
              <Field
                label="Title"
                value={content.trust.title}
                onChange={(value) => updateContent(['trust', 'title'], value)}
              />
              <TextArea
                label="Body"
                value={content.trust.body}
                onChange={(value) => updateContent(['trust', 'body'], value)}
              />
            </Panel>

            <Panel
              title="What happens next"
              description="The small three-step strip before the FAQ."
              className="xl:col-span-2"
            >
              <Toggle
                label="Show the next-steps strip"
                checked={content.next.enabled}
                onChange={(checked) => updateContent(['next', 'enabled'], checked)}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Eyebrow"
                  value={content.next.eyebrow}
                  onChange={(value) => updateContent(['next', 'eyebrow'], value)}
                />
                <Field
                  label="Title"
                  value={content.next.title}
                  onChange={(value) => updateContent(['next', 'title'], value)}
                />
              </div>

              <div className="space-y-3">
                {content.next.steps.map((step, index) => (
                  <div key={`next-${index}`} className="border border-[#EFF2F7] bg-[#FAFBFF] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8A94A6]">
                        Step {index + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          updateContent(
                            ['next', 'steps'],
                            content.next.steps.filter((_, stepIndex) => stepIndex !== index)
                          )
                        }
                        className="inline-flex h-7 w-7 items-center justify-center text-[#8A94A6] transition-colors hover:text-[#D92D20]"
                        aria-label={`Remove step ${index + 1}`}
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="space-y-2.5">
                      <Field
                        label="Title"
                        value={step.title}
                        onChange={(value) =>
                          updateContent(['next', 'steps', index, 'title'], value)
                        }
                      />
                      <TextArea
                        label="Body"
                        rows={2}
                        value={step.body}
                        onChange={(value) => updateContent(['next', 'steps', index, 'body'], value)}
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    updateContent(['next', 'steps'], [...content.next.steps, { title: '', body: '' }])
                  }
                  className="inline-flex min-h-[38px] items-center gap-1.5 border border-[#E7EBF3] bg-white px-3 text-[10px] font-bold text-[#101217] transition-colors hover:bg-[#F6F8FA]"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Add step
                </button>
              </div>
            </Panel>

            <Panel title="Final CTA" className="xl:col-span-2">
              <Toggle
                label="Show final CTA"
                checked={content.finalCta.enabled}
                onChange={(checked) => updateContent(['finalCta', 'enabled'], checked)}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Eyebrow"
                  value={content.finalCta.eyebrow}
                  onChange={(value) => updateContent(['finalCta', 'eyebrow'], value)}
                />
                <Field
                  label="Title"
                  value={content.finalCta.title}
                  onChange={(value) => updateContent(['finalCta', 'title'], value)}
                />
              </div>
              <TextArea
                label="Body"
                value={content.finalCta.body}
                onChange={(value) => updateContent(['finalCta', 'body'], value)}
              />
              <Field
                label="Button label"
                value={content.finalCta.ctaLabel}
                onChange={(value) => updateContent(['finalCta', 'ctaLabel'], value)}
              />
            </Panel>
          </div>
        )}

        {activeTab === 'faq' && (
          <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <Panel title="FAQ section">
              <Toggle
                label="Show FAQ"
                checked={content.faq.enabled}
                onChange={(checked) => updateContent(['faq', 'enabled'], checked)}
              />
              <Field
                label="Eyebrow"
                value={content.faq.eyebrow}
                onChange={(value) => updateContent(['faq', 'eyebrow'], value)}
              />
              <Field
                label="Title"
                value={content.faq.title}
                onChange={(value) => updateContent(['faq', 'title'], value)}
              />
              <TextArea
                label="Body"
                value={content.faq.body}
                onChange={(value) => updateContent(['faq', 'body'], value)}
              />
            </Panel>

            <Panel title="Questions" description="Add, edit, or remove questions.">
              <div className="space-y-3">
                {content.faq.items.map((item, index) => (
                  <div key={`faq-${index}`} className="border border-[#EFF2F7] bg-[#FAFBFF] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8A94A6]">
                        Question {index + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          updateContent(
                            ['faq', 'items'],
                            content.faq.items.filter((_, itemIndex) => itemIndex !== index)
                          )
                        }
                        className="inline-flex h-7 w-7 items-center justify-center text-[#8A94A6] transition-colors hover:text-[#D92D20]"
                        aria-label={`Remove question ${index + 1}`}
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="space-y-2.5">
                      <Field
                        label="Question"
                        value={item.question}
                        onChange={(value) =>
                          updateContent(['faq', 'items', index, 'question'], value)
                        }
                      />
                      <TextArea
                        label="Answer"
                        value={item.answer}
                        onChange={(value) =>
                          updateContent(['faq', 'items', index, 'answer'], value)
                        }
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    updateContent(['faq', 'items'], [
                      ...content.faq.items,
                      { question: '', answer: '' },
                    ])
                  }
                  className="inline-flex min-h-[38px] items-center gap-1.5 border border-[#E7EBF3] bg-white px-3 text-[10px] font-bold text-[#101217] transition-colors hover:bg-[#F6F8FA]"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Add question
                </button>
              </div>
            </Panel>
          </div>
        )}

        {activeTab === 'founder' && (
          <div className="grid gap-4 xl:grid-cols-2">
            <Panel title="Founder section">
              <Toggle
                label="Show founder section"
                checked={content.founder.enabled}
                onChange={(checked) => updateContent(['founder', 'enabled'], checked)}
              />
              <Field
                label="Eyebrow"
                value={content.founder.eyebrow}
                onChange={(value) => updateContent(['founder', 'eyebrow'], value)}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Name"
                  value={content.founder.name}
                  onChange={(value) => updateContent(['founder', 'name'], value)}
                />
                <Field
                  label="Role"
                  value={content.founder.role}
                  onChange={(value) => updateContent(['founder', 'role'], value)}
                />
              </div>
              <TextArea
                label="Quote"
                value={content.founder.quote}
                onChange={(value) => updateContent(['founder', 'quote'], value)}
              />
              <Field
                label="Photo URL"
                value={content.founder.imageUrl}
                onChange={(value) => updateContent(['founder', 'imageUrl'], value)}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="LinkedIn URL"
                  type="url"
                  value={content.founder.linkedinUrl}
                  onChange={(value) => updateContent(['founder', 'linkedinUrl'], value)}
                />
                <Field
                  label="X URL"
                  type="url"
                  value={content.founder.xUrl}
                  onChange={(value) => updateContent(['founder', 'xUrl'], value)}
                />
              </div>
            </Panel>

            <Panel title="Founder bio" description="Each paragraph appears in order.">
              <div className="space-y-3">
                {content.founder.bio.map((paragraph, index) => (
                  <div key={`bio-${index}`} className="border border-[#EFF2F7] bg-[#FAFBFF] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8A94A6]">
                        Paragraph {index + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          updateContent(
                            ['founder', 'bio'],
                            content.founder.bio.filter((_, bioIndex) => bioIndex !== index)
                          )
                        }
                        className="inline-flex h-7 w-7 items-center justify-center text-[#8A94A6] transition-colors hover:text-[#D92D20]"
                        aria-label={`Remove paragraph ${index + 1}`}
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <TextArea
                      label="Text"
                      rows={3}
                      value={paragraph}
                      onChange={(value) => updateContent(['founder', 'bio', index], value)}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    updateContent(['founder', 'bio'], [...content.founder.bio, ''])
                  }
                  className="inline-flex min-h-[38px] items-center gap-1.5 border border-[#E7EBF3] bg-white px-3 text-[10px] font-bold text-[#101217] transition-colors hover:bg-[#F6F8FA]"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Add paragraph
                </button>
              </div>
              <p className="text-[10px] font-medium leading-relaxed text-[#8A94A6]">
                Current bio preview: {bioText.length > 180 ? `${bioText.slice(0, 180)}...` : bioText}
              </p>
            </Panel>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="grid gap-4 xl:grid-cols-2">
            <Panel title="Contact page">
              <Field
                label="Title"
                value={content.contact.title}
                onChange={(value) => updateContent(['contact', 'title'], value)}
              />
              <TextArea
                label="Description"
                value={content.contact.description}
                onChange={(value) => updateContent(['contact', 'description'], value)}
              />
            </Panel>
            <Panel
              title="Email routing"
              description="Investor and partnership topics go to the founder. General and patient support goes to customer support."
            >
              <Field
                label="General and patient support"
                type="email"
                value={content.contact.generalEmail}
                onChange={(value) => updateContent(['contact', 'generalEmail'], value)}
              />
              <Field
                label="Investor and partnership enquiries"
                type="email"
                value={content.contact.founderEmail}
                onChange={(value) => updateContent(['contact', 'founderEmail'], value)}
              />
              <Field
                label="Privacy and data requests"
                type="email"
                value={content.contact.privacyEmail}
                onChange={(value) => updateContent(['contact', 'privacyEmail'], value)}
              />
              <Field
                label="Security reports"
                type="email"
                value={content.contact.securityEmail}
                onChange={(value) => updateContent(['contact', 'securityEmail'], value)}
              />
            </Panel>
          </div>
        )}

        {activeTab === 'ads' && (
          <div className="space-y-4">
            <Panel
              title="Ad slots"
              description="Each slot has an aspect-ratio placeholder and an admin image upload. The placeholder is visible until an image is uploaded and saved."
            >
              <p className="text-[10px] font-medium leading-relaxed text-[#8A94A6]">
                Images are stored in the public <code>site</code> Supabase Storage bucket. The
                upload button uses the same admin session as the rest of the website admin.
              </p>
            </Panel>

            {ads.map((ad) => (
              <AdEditor
                key={ad.id}
                ad={ad}
                onChange={(patch) => updateAd(ad.id, patch)}
                onUpload={(file) => void uploadAdImage(ad.id, file)}
                uploading={uploadingId === ad.id}
                uploadError={uploadError?.adId === ad.id ? uploadError.message : null}
              />
            ))}
          </div>
        )}

        {activeTab === 'advanced' && (
          <Panel
            title="Advanced JSON"
            description="Edit the full site content object directly. This is useful for bulk copy changes and agent handoffs."
          >
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAdvancedJson(JSON.stringify(content, null, 2))}
                className="inline-flex min-h-[38px] items-center border border-[#E7EBF3] bg-white px-3 text-[10px] font-bold text-[#101217] transition-colors hover:bg-[#F6F8FA]"
              >
                Refresh from form
              </button>
              <button
                type="button"
                onClick={applyAdvancedJson}
                className="inline-flex min-h-[38px] items-center bg-[#020924] px-3 text-[10px] font-bold text-white transition-colors hover:bg-[#101217]"
              >
                Apply JSON
              </button>
            </div>
            <textarea
              value={advancedJson}
              onChange={(event) => setAdvancedJson(event.target.value)}
              rows={28}
              spellCheck={false}
              className="w-full resize-y border border-[#E7EBF3] bg-[#0B1020] px-4 py-3 font-mono text-[11px] leading-relaxed text-[#D7E0F5] outline-none focus:border-primary"
            />
          </Panel>
        )}
      </main>
    </div>
  );
}
