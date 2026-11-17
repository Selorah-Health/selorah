import {
  ArrowRightIcon,
  MegaphoneIcon,
  PhotoIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useSiteContent } from '../../contexts/SiteContentContext';
import { aspectRatioLabel, type AdSlotContent } from '../../lib/siteContent';

function AdCta({ slot, className }: { slot: AdSlotContent; className: string }) {
  const content = (
    <>
      {slot.ctaLabel || 'Partner with Selorah'}
      <ArrowRightIcon
        className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
        strokeWidth={2}
      />
    </>
  );

  if (/^https?:\/\//i.test(slot.ctaUrl)) {
    return (
      <a
        href={slot.ctaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`group ${className}`}
      >
        {content}
      </a>
    );
  }

  return (
    <Link to={slot.ctaUrl || '/contact'} className={`group ${className}`}>
      {content}
    </Link>
  );
}

export function AdMedia({
  slot,
  className = '',
  showPlaceholder = false,
}: {
  slot: AdSlotContent;
  className?: string;
  /** The admin preview opts in. Public pages never render an empty ad box. */
  showPlaceholder?: boolean;
}) {
  const hasImage = Boolean(slot.imageUrl.trim());
  const ratio = slot.aspectRatio || '16 / 3';

  if (!hasImage && !showPlaceholder) return null;

  return (
    <div
      data-ad-state={hasImage ? 'image' : 'placeholder'}
      className={`relative w-full overflow-hidden border border-[#D5DCE8] bg-white ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {hasImage ? (
        <img
          src={slot.imageUrl}
          alt={slot.imageAlt || slot.headline}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-[#F8F9FA] px-4 text-center">
          <PhotoIcon className="h-5 w-5 text-[#B6C0D0]" strokeWidth={1.6} />
          <span className="text-[9px] font-black uppercase tracking-[0.14em] text-[#8A94A6]">
            {slot.label || 'Partner feature'} placeholder
          </span>
          <span className="text-[10px] font-semibold text-[#A0A9B8]">
            {aspectRatioLabel(ratio)}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * A slim partnership band. The slots are intentionally empty until a real
 * partner is approved, so the page never invents a relationship.
 */
export function PartnerBand() {
  const { ads } = useSiteContent();
  const slot = ads.find((item) => item.id === 'partner-band');

  if (!slot?.isActive || !slot.imageUrl.trim()) return null;

  return (
    <section
      aria-labelledby="partners-heading"
      className="border-y border-[var(--border)] bg-white px-5 py-8 sm:px-8 lg:px-10"
      data-ad-slot="partner-band"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
            {slot.label || 'Partnership band'}
          </p>
          <h2
            id="partners-heading"
            className="mt-2 text-base font-bold leading-snug tracking-tight text-[#101217] sm:text-lg"
          >
            {slot.headline}
          </h2>
          <p className="mt-1.5 text-xs font-medium leading-relaxed text-gray-500">{slot.body}</p>
        </div>

        <div className="w-full lg:max-w-md lg:flex-1">
          <AdMedia slot={slot} />
        </div>

        <AdCta
          slot={slot}
          className="inline-flex shrink-0 items-center gap-2 text-xs font-bold text-primary transition-colors hover:text-primary-hover"
        />
      </div>
    </section>
  );
}

/**
 * A clearly labelled partnership placement. It is a real placement, not a fake
 * third-party advert, and it can be swapped for a direct partner later.
 */
export function AdSlot({ variant = 'leaderboard' }: { variant?: 'leaderboard' | 'native' }) {
  const { ads } = useSiteContent();
  const slot = ads.find((item) => item.id === variant);

  if (!slot?.isActive || !slot.imageUrl.trim()) return null;

  const native = variant === 'native';

  return (
    <section
      aria-label={slot.label || 'Partner feature'}
      className={native ? 'bg-[#F8F9FA] px-5 py-10 sm:px-8 lg:px-10' : 'bg-white px-5 py-10 sm:px-8 lg:px-10'}
      data-ad-slot={variant}
    >
      <div
        className={`mx-auto max-w-6xl border border-[#E5E7EB] ${
          native ? 'bg-white p-5 sm:p-6' : 'bg-[#F8F9FA] px-5 py-6 sm:px-7 sm:py-7'
        }`}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center border text-primary ${
                native
                  ? 'border-[#E5E7EB] bg-[#F8F9FA]'
                  : 'border-[#D5DCE8] bg-white'
              }`}
            >
              {native ? (
                <SparklesIcon className="h-5 w-5" strokeWidth={1.8} />
              ) : (
                <MegaphoneIcon className="h-5 w-5" strokeWidth={1.8} />
              )}
            </span>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400">
                {slot.label || (native ? 'Paid partnership' : 'Partner feature')}
              </p>
              <h2 className="mt-1 text-base font-bold leading-snug text-[#101217] sm:text-lg">
                {slot.headline}
              </h2>
              <p className="mt-1 max-w-xl text-xs font-medium leading-relaxed text-gray-500">
                {slot.body}
              </p>
            </div>
          </div>

          <div className="w-full sm:max-w-[260px]">
            <AdMedia slot={slot} />
          </div>

          <AdCta
            slot={slot}
            className={`inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 px-4 text-xs font-bold transition-colors ${
              native
                ? 'border border-[#D5DCE8] bg-white text-[#101217] hover:bg-[#F6F8FA]'
                : 'bg-[#101217] text-white hover:bg-[#020924]'
            }`}
          />
        </div>
      </div>
    </section>
  );
}
