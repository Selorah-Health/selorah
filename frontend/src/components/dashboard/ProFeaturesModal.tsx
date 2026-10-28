import { useEffect, useState } from 'react';
import {
  CheckCircleIcon,
  CreditCardIcon,
  LockClosedIcon,
  StarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../../contexts/ToastContext';
import { createClient } from '../../lib/supabase/client';
import { readLocalSession } from '../../lib/auth/session';
import {
  PRO_FEATURES,
  PRO_PRICE_KOBO,
  PRO_PRICE_NAIRA,
  activatePro,
} from '../../lib/pro';
import { isPaystackConfigured, startPaystackCheckout } from '../../lib/paystack';

interface ProFeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgraded?: () => void;
  source?: string;
}

export default function ProFeaturesModal({
  isOpen,
  onClose,
  onUpgraded,
  source = 'dashboard',
}: ProFeaturesModalProps) {
  const { success, error: toastError, info } = useToast();
  const supabase = createClient();
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setProcessing(false);
    setErrorMsg(null);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !processing) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow || '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose, processing]);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setErrorMsg(null);

    if (!isPaystackConfigured()) {
      setErrorMsg(
        'Card payments are not available right now. Please try again later or contact support.'
      );
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const email = user?.email || readLocalSession()?.email;

      if (!email) {
        setErrorMsg('Add an email address to your account before upgrading.');
        return;
      }

      setProcessing(true);

      await startPaystackCheckout({
        email,
        amountKobo: PRO_PRICE_KOBO,
        metadata: {
          source,
          user_id: user?.id,
        },
        onSuccess: async (response) => {
          try {
            await activatePro(response.reference, {
              amountKobo: PRO_PRICE_KOBO,
              supabase,
            });
            success(
              'Your payment was confirmed. Selorah Pro is now active on your account.',
              'Welcome to Pro'
            );
            onUpgraded?.();
            onClose();
          } catch (error) {
            setErrorMsg(
              error instanceof Error
                ? error.message
                : 'Payment succeeded but we could not activate Pro. Contact support with your receipt.'
            );
          } finally {
            setProcessing(false);
          }
        },
        onCancel: () => {
          setProcessing(false);
          info('Payment cancelled. You have not been charged.');
        },
      });
    } catch (error) {
      setProcessing(false);
      const message =
        error instanceof Error ? error.message : 'Could not start the payment.';
      setErrorMsg(message);
      toastError(message, 'Payment unavailable');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-[#05081A]/80 p-0 backdrop-blur-md sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pro-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !processing) onClose();
      }}
    >
      <div className="relative max-h-[94dvh] w-full max-w-md overflow-y-auto rounded-t-[32px] border border-white/10 bg-white p-6 shadow-2xl sm:rounded-[32px] sm:p-8">
        <button
          type="button"
          onClick={onClose}
          disabled={processing}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors hover:bg-gray-100 disabled:opacity-50"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 pr-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6183FF] to-[#4D6ED6] text-white shadow-lg shadow-[#6183FF]/25">
            <StarIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#6183FF]">
              Selorah Pro
            </p>
            <h3 id="pro-title" className="text-xl font-bold tracking-tight text-[#101217]">
              Everything unlocked
            </h3>
          </div>
        </div>

        <p className="mt-4 text-sm font-medium leading-relaxed text-gray-500">
          One payment of{' '}
          <span className="font-bold text-[#101217]">
            ₦{PRO_PRICE_NAIRA.toLocaleString('en-NG')}
          </span>{' '}
          covers a full year. Your data stays yours, always.
        </p>

        {errorMsg && (
          <div
            role="alert"
            className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold leading-relaxed text-red-600"
          >
            {errorMsg}
          </div>
        )}

        <div className="mt-5 space-y-3 rounded-2xl bg-[#F8F9FE] p-4">
          {PRO_FEATURES.map((feature) => (
            <div key={feature} className="flex items-start gap-2.5">
              <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#6183FF]" />
              <span className="text-xs font-semibold leading-relaxed text-gray-600">
                {feature}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleUpgrade}
          disabled={processing}
          className="mt-5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#6183FF] px-5 text-sm font-bold text-white shadow-lg shadow-[#6183FF]/25 transition-all hover:bg-[#4D6ED6] active:scale-[0.99] disabled:opacity-60"
        >
          {processing ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Confirming payment...
            </>
          ) : (
            <>
              <CreditCardIcon className="h-4 w-4" />
              Upgrade for ₦{PRO_PRICE_NAIRA.toLocaleString('en-NG')} / year
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onClose}
          disabled={processing}
          className="mt-2 min-h-[44px] w-full rounded-2xl text-xs font-bold text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50"
        >
          Maybe later
        </button>

        <p className="mt-2 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-gray-300">
          <LockClosedIcon className="h-3 w-3" />
          Secure payment by Paystack. Cancel anytime.
        </p>
      </div>
    </div>
  );
}
