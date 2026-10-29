// Supabase Edge Function: verify a Nigerian NIN and return identity details.
//
// Deploy:
//   supabase functions deploy verify-nin
//
// Required function secrets:
//   DOJAH_APP_ID
//   DOJAH_API_KEY
//
// The function never invents identity data. If the provider is not configured
// it returns configured: false and the onboarding form asks the person to type
// their details instead.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function pick(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ ok: false, message: 'Method not allowed.' }, 405);
  }

  let nin = '';

  try {
    const body = await request.json();
    nin = String(body?.nin || '').replace(/\D/g, '');
  } catch {
    return json({ ok: false, message: 'Send a NIN to verify.' }, 400);
  }

  if (nin.length !== 11) {
    return json({ ok: false, message: 'A NIN must be exactly 11 digits.' }, 400);
  }

  const appId = Deno.env.get('DOJAH_APP_ID');
  const apiKey = Deno.env.get('DOJAH_API_KEY');

  if (!appId || !apiKey) {
    return json({
      ok: false,
      configured: false,
      message:
        'NIN lookup is not configured on this deployment yet. Enter your details manually and they will be saved with your profile.',
    });
  }

  try {
    const response = await fetch(
      `https://api.dojah.io/api/v1/kyc/nin?nin=${encodeURIComponent(nin)}`,
      {
        headers: {
          AppId: appId,
          Authorization: apiKey,
        },
      }
    );

    const payload = await response.json().catch(() => null);

    if (!response.ok || payload?.error) {
      const providerMessage =
        typeof payload?.error === 'string'
          ? payload.error
          : typeof payload?.message === 'string'
            ? payload.message
            : 'The NIN could not be verified.';
      return json({ ok: false, configured: true, message: providerMessage }, 200);
    }

    const entity =
      payload?.entity && typeof payload.entity === 'object'
        ? payload.entity
        : payload?.data?.entity && typeof payload.data.entity === 'object'
          ? payload.data.entity
          : payload?.data && typeof payload.data === 'object'
            ? payload.data
            : null;

    if (!entity) {
      return json(
        { ok: false, configured: true, message: 'No identity record was returned for that NIN.' },
        200
      );
    }

    const firstName = pick(entity, ['first_name', 'firstName', 'firstname']);
    const lastName = pick(entity, ['last_name', 'lastName', 'lastname', 'surname']);
    const middleName = pick(entity, ['middle_name', 'middleName', 'middlename']);
    const dateOfBirth = pick(entity, ['date_of_birth', 'dob', 'birthdate']);
    const gender = pick(entity, ['gender']).toLowerCase();

    if (!firstName && !lastName) {
      return json(
        { ok: false, configured: true, message: 'The NIN record did not include a name.' },
        200
      );
    }

    return json({
      ok: true,
      verified: true,
      first_name: firstName,
      last_name: lastName,
      middle_name: middleName,
      date_of_birth: dateOfBirth,
      gender: gender === 'm' ? 'male' : gender === 'f' ? 'female' : gender,
    });
  } catch (error) {
    console.error('NIN lookup failed:', error);
    return json(
      {
        ok: false,
        configured: true,
        message: 'The NIN service could not be reached. Try again or enter your details manually.',
      },
      200
    );
  }
});
