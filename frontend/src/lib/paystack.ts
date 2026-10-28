type PaystackResponse = {
  reference: string;
  status?: string;
  trans?: string;
  transaction?: string;
  message?: string;
};

type PaystackSetupOptions = {
  key: string;
  email: string;
  amount: number;
  currency: string;
  ref: string;
  plan?: string;
  metadata?: Record<string, unknown>;
  callback: (response: PaystackResponse) => void;
  onClose: () => void;
};

type PaystackPop = {
  setup: (options: PaystackSetupOptions) => { openIframe: () => void };
};

declare global {
  interface Window {
    PaystackPop?: PaystackPop;
  }
}

const SCRIPT_ID = 'paystack-inline-js';
const SCRIPT_SRC = 'https://js.paystack.co/v1/inline.js';
const SCRIPT_TIMEOUT_MS = 15000;

let loader: Promise<void> | null = null;

export function getPaystackKey() {
  return (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined)?.trim() || '';
}

export function isPaystackConfigured() {
  const key = getPaystackKey();
  return key.startsWith('pk_');
}

export function loadPaystack(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Paystack can only load in the browser.'));
  }
  if (window.PaystackPop) return Promise.resolve();
  if (loader) return loader;

  loader = new Promise<void>((resolve, reject) => {
    let settled = false;

    const finish = (action: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      action();
    };

    const timer = window.setTimeout(() => {
      loader = null;
      finish(() =>
        reject(
          new Error(
            'Paystack is taking too long to load. Check your connection or disable any blocker and try again.'
          )
        )
      );
    }, SCRIPT_TIMEOUT_MS);

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      const state = existing.dataset.state;
      if (state === 'ready' || state === 'failed') {
        // The tag finished earlier but the script did not register, or it
        // failed. Remove it so a retry starts with a fresh request.
        existing.remove();
      } else {
        existing.addEventListener('load', () => finish(() => resolve()), { once: true });
        existing.addEventListener(
          'error',
          () => {
            existing.dataset.state = 'failed';
            loader = null;
            finish(() => reject(new Error('Could not load Paystack. Check your connection.')));
          },
          { once: true }
        );
        return;
      }
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      script.dataset.state = 'ready';
      finish(() => resolve());
    };
    script.onerror = () => {
      script.dataset.state = 'failed';
      loader = null;
      finish(() => reject(new Error('Could not load Paystack. Check your connection and try again.')));
    };
    document.head.appendChild(script);
  });

  return loader;
}

export type PaystackCheckout = {
  email: string;
  amountKobo: number;
  planCode?: string;
  metadata?: Record<string, unknown>;
  onSuccess: (response: PaystackResponse) => void;
  onCancel?: () => void;
};

export async function startPaystackCheckout({
  email,
  amountKobo,
  planCode,
  metadata,
  onSuccess,
  onCancel,
}: PaystackCheckout) {
  const key = getPaystackKey();
  if (!key) {
    throw new Error(
      'Paystack is not configured. Add VITE_PAYSTACK_PUBLIC_KEY to the frontend environment.'
    );
  }

  await loadPaystack();
  if (!window.PaystackPop) {
    throw new Error('Paystack could not start. Please refresh and try again.');
  }

  const reference = `SEL-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const handler = window.PaystackPop.setup({
    key,
    email,
    amount: amountKobo,
    currency: 'NGN',
    ref: reference,
    plan: planCode || undefined,
    metadata: {
      ...metadata,
      custom_fields: [
        { display_name: 'Product', variable_name: 'product', value: 'Selorah Pro' },
        { display_name: 'Source', variable_name: 'source', value: 'selorah-web' },
      ],
    },
    callback: (response) => onSuccess({ ...response, reference: response.reference || reference }),
    onClose: () => onCancel?.(),
  });

  handler.openIframe();
  return reference;
}
