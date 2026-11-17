import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createClient } from '../lib/supabase/client';
import {
  DEFAULT_AD_SLOTS,
  DEFAULT_SITE_CONTENT,
  SITE_CONTENT_CACHE_KEYS,
  mergeAdSlots,
  mergeSiteContent,
  readCachedAdSlots,
  readCachedSiteContent,
  writeCachedAdSlots,
  writeCachedSiteContent,
  type AdSlotContent,
  type AdSlotRow,
  type SiteContent,
} from '../lib/siteContent';

type SiteContentContextValue = {
  content: SiteContent;
  ads: AdSlotContent[];
  source: 'default' | 'cache' | 'remote';
  isLoading: boolean;
  refresh: () => Promise<void>;
};

const SiteContentContext = createContext<SiteContentContextValue | undefined>(undefined);

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(
    () => readCachedSiteContent() || DEFAULT_SITE_CONTENT
  );
  const [ads, setAds] = useState<AdSlotContent[]>(() => readCachedAdSlots() || DEFAULT_AD_SLOTS);
  const [source, setSource] = useState<'default' | 'cache' | 'remote'>(() =>
    readCachedSiteContent() ? 'cache' : 'default'
  );
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const supabase = createClient();

    try {
      const [contentResult, adsResult] = await Promise.all([
        supabase.from('site_content').select('value').eq('key', 'site').maybeSingle(),
        supabase.from('ad_slots').select('*').order('sort_order', { ascending: true }),
      ]);

      if (!contentResult.error && contentResult.data?.value) {
        const next = mergeSiteContent(contentResult.data.value);
        setContent(next);
        writeCachedSiteContent(next);
        setSource('remote');
      }

      if (!adsResult.error) {
        const nextAds = mergeAdSlots((adsResult.data || []) as Partial<AdSlotRow>[]);
        setAds(nextAds);
        writeCachedAdSlots(nextAds);
        if (!contentResult.error) setSource('remote');
      }
    } catch {
      // The public site must render even when Supabase is unreachable or the
      // site CMS migration has not been applied yet.
    } finally {
      setIsLoading(false);
    }
  }, []);

  const applyCachedSnapshot = useCallback(() => {
    const cachedContent = readCachedSiteContent();
    const cachedAds = readCachedAdSlots();

    if (cachedContent) setContent(cachedContent);
    if (cachedAds) setAds(cachedAds);
    if (cachedContent || cachedAds) setSource('cache');
  }, []);

  useEffect(() => {
    // The provider starts with defaults or a cached snapshot, then hydrates from
    // Supabase. The async refresh is intentionally fire-and-forget.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  useEffect(() => {
    // A save in the website admin writes the cache and triggers a storage event
    // in every other tab. Focus and visibility refresh catch changes made on
    // another device while this tab stayed open.
    const onStorage = (event: StorageEvent) => {
      if (!event.key) return;
      if (!(SITE_CONTENT_CACHE_KEYS as readonly string[]).includes(event.key)) return;
      applyCachedSnapshot();
    };

    const onFocus = () => {
      void refresh();
    };

    const onVisibility = () => {
      if (!document.hidden) void refresh();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [applyCachedSnapshot, refresh]);

  const value = useMemo(
    () => ({ content, ads, source, isLoading, refresh }),
    [content, ads, source, isLoading, refresh]
  );

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  const context = useContext(SiteContentContext);
  if (!context) {
    throw new Error('useSiteContent must be used within a SiteContentProvider');
  }
  return context;
}
