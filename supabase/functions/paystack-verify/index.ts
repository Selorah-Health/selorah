// Supabase Edge Function: verify Paystack payments and grant Selorah Pro.
//
// Deploy:
//   supabase functions deploy paystack-verify --no-verify-jwt
//
// Required function secret:
//   PAYSTACK_SECRET_KEY
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically by
// hosted Supabase. The function accepts two kinds of requests:
//   1. A signed Paystack webhook (charge.success) from the Paystack dashboard.
//   2. A JSON body { "reference": "..." } from the signed-in app, where the
//      caller's access token is sent in the Authorization header.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const PRO_AMOUNT_KOBO = 500000;
const PRO_DURATION_MONTHS = 12;

type PaystackTransaction = {
  reference?: string;
  status?: string;
  amount?: number;
  currency?: string;
  customer?: { email?: string };
  metadata?: Record<string, unknown> | string | null;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return json({ verified: false, message: 'Use POST.' }, 405);
  }

  const secret = Deno.env.get('PAYSTACK_SECRET_KEY');
  if (!secret) {
    return json({ verified: false, message: 'PAYSTACK_SECRET_KEY is not configured.' }, 500);
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature');

  // Webhook delivery. Paystack signs the exact raw request body with HMAC
  // SHA512 using the secret key.
  if (signature) {
    const isValid = await verifySignature(rawBody, signature, secret);
    if (!isValid) {
      return json({ verified: false, message: 'Invalid Paystack signature.' }, 401);
    }

    let event: { event?: string; data?: PaystackTransaction } = {};
    try {
      event = JSON.parse(rawBody);
    } catch {
      return json({ verified: false, message: 'Invalid webhook payload.' }, 400);
    }

    // Acknowledge unrelated events so Paystack does not retry them.
    if (event.event !== 'charge.success') {
      return json({ received: true, ignored: event.event || 'unknown' });
    }

    const reference = event.data?.reference;
    if (!reference) {
      return json({ received: true, ignored: 'missing reference' });
    }

    const result = await confirmPayment(secret, reference, event.data);
    return json({ received: true, ...result });
  }

  // App-initiated verification.
  let payload: { reference?: string } = {};
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ verified: false, message: 'A payment reference is required.' }, 400);
  }

  if (!payload.reference || typeof payload.reference !== 'string') {
    return json({ verified: false, message: 'A payment reference is required.' }, 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  let callerId: string | null = null;

  if (supabaseUrl && serviceKey) {
    const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    if (token) {
      const admin = createClient(supabaseUrl, serviceKey);
      const {
        data: { user },
      } = await admin.auth.getUser(token);
      callerId = user?.id || null;
    }
  }

  const result = await confirmPayment(secret, payload.reference, null, callerId);
  return json(result, result.verified ? 200 : 402);
});

async function confirmPayment(
  secret: string,
  reference: string,
  webhookData: PaystackTransaction | null = null,
  callerId: string | null = null
) {
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secret}` } }
  );

  const body = (await response.json().catch(() => null)) as
    | { status?: boolean; data?: PaystackTransaction; message?: string }
    | null;

  const data = body?.data || webhookData;
  if (!response.ok || !body?.status || data?.status !== 'success') {
    return { verified: false, message: 'Payment could not be verified.' };
  }

  const amount = Number(data?.amount || 0);
  const currency = String(data?.currency || 'NGN').toUpperCase();

  if (amount < PRO_AMOUNT_KOBO) {
    return {
      verified: false,
      message: 'The payment amount does not match the Selorah Pro plan.',
    };
  }
  if (currency !== 'NGN') {
    return { verified: false, message: 'Payments must be made in NGN.' };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (supabaseUrl && serviceKey) {
    const admin = createClient(supabaseUrl, serviceKey);
    const userId = await resolveUserId(admin, data, callerId);

    if (userId) {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + PRO_DURATION_MONTHS);

      await admin.from('payments').upsert(
        {
          user_id: userId,
          reference,
          amount,
          currency,
          status: 'paid',
          provider: 'paystack',
          plan: 'Selorah Pro',
        },
        { onConflict: 'reference' }
      );

      const entitlement = {
        tier: 'pro',
        is_pro: true,
        pro_reference: reference,
        pro_expires_at: expiresAt.toISOString(),
      };

      const { error } = await admin
        .from('patient_profiles')
        .update(entitlement)
        .eq('user_id', userId);

      // Older projects may not have the Pro columns yet. `tier` exists, so
      // activation still works while the migration is being applied.
      if (error) {
        await admin.from('patient_profiles').update({ tier: 'pro' }).eq('user_id', userId);
      }

      try {
        await admin.auth.admin.updateUserById(userId, {
          user_metadata: {
            is_pro: true,
            pro_reference: reference,
            pro_expires_at: expiresAt.toISOString(),
          },
        });
      } catch {
        // The profile row is the source of truth. Metadata is a convenience.
      }
    }
  }

  return {
    verified: true,
    reference,
    amount,
    currency,
  };
}

async function resolveUserId(
  admin: ReturnType<typeof createClient>,
  data: PaystackTransaction | null,
  callerId: string | null
): Promise<string | null> {
  if (callerId) return callerId;

  const metadata =
    typeof data?.metadata === 'string'
      ? safeJson(data.metadata)
      : (data?.metadata as Record<string, unknown> | null | undefined);

  const metadataId = metadata?.user_id;
  if (typeof metadataId === 'string' && metadataId) return metadataId;

  const email = data?.customer?.email;
  if (!email) return null;

  const { data: userRow } = await admin
    .from('users')
    .select('id')
    .ilike('email', email)
    .maybeSingle();

  return userRow?.id || null;
}

async function verifySignature(body: string, signature: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );

  const expected = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  );
  const provided = hexToBytes(signature);

  if (provided.length !== expected.length) return false;

  // Constant time comparison.
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected[index] ^ provided[index];
  }
  return difference === 0;
}

function hexToBytes(value: string) {
  const clean = value.trim().toLowerCase();
  if (!/^[0-9a-f]+$/.test(clean) || clean.length % 2 !== 0) return new Uint8Array();
  const bytes = new Uint8Array(clean.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = parseInt(clean.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function safeJson(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
