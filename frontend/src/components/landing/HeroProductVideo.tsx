import { useEffect, useRef, useState } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import ProductPreview from './ProductPreview';

/**
 * The hero product loop. The recording is decorative, so it stays muted and
 * pauses for people who ask for reduced motion. If WebM playback fails, the
 * static product mockup is shown instead.
 */
export default function HeroProductVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduceMotion) return;
    const play = () => {
      void video.play().catch(() => {
        // Autoplay can be blocked. The poster frame remains visible.
      });
    };
    play();
  }, [reduceMotion]);

  if (failed || reduceMotion) {
    return <ProductPreview />;
  }

  return (
    <div className="relative mx-auto mt-14 w-full max-w-5xl sm:mt-20">
      <div
        aria-hidden
        className="absolute -inset-x-6 -top-6 bottom-6 rounded-[32px] bg-[radial-gradient(closest-side,rgba(97,131,255,0.16),rgba(95,250,176,0.08),transparent)] blur-2xl"
      />

      <div className="relative overflow-hidden rounded-xl border border-[#E1E7F0] bg-white shadow-[0_24px_80px_-40px_rgba(2,9,36,0.35)]">
        <video
          ref={videoRef}
          src="/landing-hero-product.webm"
          width={1366}
          height={589}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          disablePictureInPicture
          aria-label="A short loop of the Selorah health records dashboard"
          className="block w-full bg-white"
          onError={() => setFailed(true)}
        />
      </div>

      <div className="absolute -bottom-4 left-4 hidden items-center gap-2.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 shadow-sm sm:flex">
        <ClockIcon className="h-4 w-4 text-primary" strokeWidth={1.8} />
        <div>
          <p className="text-xs font-medium text-[#101217]">Time-limited access</p>
          <p className="text-[11px] text-[#6B7280]">Expires automatically</p>
        </div>
      </div>
    </div>
  );
}
