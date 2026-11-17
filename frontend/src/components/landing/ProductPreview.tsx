import { LockClosedIcon } from '@heroicons/react/24/outline';

const IMAGE_WIDTH = 1366;
const IMAGE_HEIGHT = 589;

const HIGHLIGHTS = [
  {
    id: 1,
    label: 'Add a record',
    x: 1170,
    y: 106,
    width: 156,
    height: 52,
  },
  {
    id: 2,
    label: 'Create a QR code',
    x: 521,
    y: 433,
    width: 191,
    height: 52,
  },
  {
    id: 3,
    label: 'Control active access',
    x: 818,
    y: 179,
    width: 250,
    height: 153,
  },
] as const;

function percent(value: number, total: number) {
  return `${(value / total) * 100}%`;
}

export default function ProductPreview() {
  return (
    <figure className="relative mx-auto mt-14 w-full max-w-5xl sm:mt-20">
      <div
        aria-hidden
        className="absolute -inset-x-8 -top-8 bottom-10 rounded-[40px] bg-gradient-to-b from-primary/20 via-[#5FFAB0]/10 to-transparent blur-2xl"
      />

      <div className="relative overflow-hidden rounded-[14px] border border-white/70 bg-white shadow-[0_40px_120px_-32px_rgba(2,9,36,0.38)] ring-1 ring-[#020924]/5 sm:rounded-[15px]">
        <div className="flex items-center gap-3 border-b border-[#E9EDF5] bg-[#FBFCFE] px-4 py-3 sm:px-5">
          <div className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          </div>
          <div className="mx-auto flex w-full max-w-[280px] items-center justify-center gap-1.5 rounded-full border border-[#E9EDF5] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#8A94A6] sm:text-[11px]">
            <LockClosedIcon className="h-3 w-3 text-[#0F9F6E]" strokeWidth={2} />
            selorah.app/dashboard
          </div>
          <div className="hidden w-14 sm:block" />
        </div>

        <div className="relative bg-[#F4F7FB]">
          <img
            src="/landing/dashboard-preview.png"
            alt="Selorah dashboard showing a health score, recent records, active grants, and quick actions. Numbered highlights show Add a record, Create a QR code, and Control active access."
            width={IMAGE_WIDTH}
            height={IMAGE_HEIGHT}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full"
          />

          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {HIGHLIGHTS.map((highlight) => (
              <div
                key={highlight.id}
                className="absolute rounded-[10px] border-2 border-primary/85 shadow-[0_0_0_4px_rgba(97,131,255,0.16),0_10px_30px_rgba(97,131,255,0.18)]"
                style={{
                  left: percent(highlight.x, IMAGE_WIDTH),
                  top: percent(highlight.y, IMAGE_HEIGHT),
                  width: percent(highlight.width, IMAGE_WIDTH),
                  height: percent(highlight.height, IMAGE_HEIGHT),
                }}
              >
                <span className="absolute -left-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white shadow-md sm:-left-2.5 sm:-top-2.5 sm:h-6 sm:w-6 sm:text-[11px]">
                  {highlight.id}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <figcaption className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {HIGHLIGHTS.map((highlight) => (
          <span
            key={highlight.id}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#4B5563]"
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-black text-white">
              {highlight.id}
            </span>
            {highlight.label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
