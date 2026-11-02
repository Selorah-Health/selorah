// Supabase Edge Function: deliver queued Selorah emails.
//
// Deploy:
//   supabase functions deploy send-email --no-verify-jwt
//
// Required function secrets:
//   RESEND_API_KEY
//   EMAIL_FROM      e.g. "Selorah Health <hello@selorah.app>"
//
// The function drains public.email_queue in small batches. When a provider is
// not configured it leaves rows queued and reports configured: false, so no
// email is ever silently dropped or invented. Trigger it from a scheduled job
// (pg_cron, GitHub Action, or any uptime monitor) with:
//   POST /functions/v1/send-email  { "limit": 25 }
//   x-email-cron-secret: <EMAIL_CRON_SECRET>
//
// Set EMAIL_CRON_SECRET to stop arbitrary callers from draining the queue.
// Only the service role can read email_queue, so this function uses the
// service key and must not be called by the public app.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type QueuedEmail = {
  id: string;
  to_email: string;
  template: string;
  subject: string;
  payload: Record<string, unknown> | null;
};

type RenderedEmail = { subject: string; html: string; text: string };

const BRAND = {
  name: 'Selorah Health',
  color: '#6183FF',
  ink: '#101217',
  muted: '#6B7280',
  background: '#F8F9FA',
  site: 'https://www.selorah.app',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (request.method !== 'POST') {
    return json({ ok: false, message: 'Use POST.' }, 405);
  }

  const cronSecret = Deno.env.get('EMAIL_CRON_SECRET');
  if (cronSecret && request.headers.get('x-email-cron-secret') !== cronSecret) {
    return json({ ok: false, message: 'Not authorised.' }, 401);
  }

  const provider = resolveProvider();
  if (!provider) {
    return json({
      ok: false,
      configured: false,
      message:
        'No email provider is configured. Set RESEND_API_KEY and EMAIL_FROM to start delivery.',
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return json({ ok: false, message: 'Supabase service credentials are not available.' }, 500);
  }

  let limit = 25;
  try {
    const body = await request.json();
    if (Number.isFinite(body?.limit)) {
      limit = Math.min(Math.max(Number(body.limit), 1), 100);
    }
  } catch {
    // An empty body is fine; use the default batch size.
  }

  const admin = createClient(supabaseUrl, serviceKey);

  const { data: rows, error } = await admin
    .from('email_queue')
    .select('id, to_email, template, subject, payload')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    return json({ ok: false, message: error.message }, 500);
  }

  const queue = (rows || []) as QueuedEmail[];
  if (queue.length === 0) {
    return json({ ok: true, sent: 0, failed: 0, remaining: 0 });
  }

  let sent = 0;
  let failed = 0;

  for (const email of queue) {
    const rendered = renderTemplate(email);
    const result = await provider.send({
      to: email.to_email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });

    if (result.ok) {
      sent += 1;
      await admin
        .from('email_queue')
        .update({ status: 'sent', sent_at: new Date().toISOString(), error: null })
        .eq('id', email.id);
    } else {
      failed += 1;
      await admin
        .from('email_queue')
        .update({ status: 'failed', error: result.message.slice(0, 500) })
        .eq('id', email.id);
    }
  }

  return json({ ok: true, configured: true, sent, failed, processed: queue.length });
});

type Provider = {
  send: (message: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }) => Promise<{ ok: true } | { ok: false; message: string }>;
};

function resolveProvider(): Provider | null {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('EMAIL_FROM');
  if (resendKey && from) {
    return {
      async send(message) {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from,
            to: [message.to],
            subject: message.subject,
            html: message.html,
            text: message.text,
          }),
        });
        if (response.ok) return { ok: true };
        const detail = await response.text().catch(() => '');
        return { ok: false, message: `Resend ${response.status}: ${detail}` };
      },
    };
  }

  return null;
}

function renderTemplate(email: QueuedEmail): RenderedEmail {
  const payload = email.payload || {};
  const firstName = stringValue(payload.first_name) || 'there';
  const surveyTitle = stringValue(payload.survey_title);
  const plan = stringValue(payload.plan);
  const expiresAt = stringValue(payload.expires_at);

  switch (email.template) {
    case 'welcome':
      return layout({
        subject: email.subject || `Welcome to ${BRAND.name}`,
        heading: `Welcome, ${firstName}`,
        paragraphs: [
          'Your Selorah account is ready. Your health records stay encrypted and portable, and you decide who can see them.',
          'Add your first record, invite a doctor with a temporary QR code, and keep your care history in one place.',
        ],
        action: { label: 'Open your dashboard', href: `${BRAND.site}/dashboard` },
      });

    case 'new_survey':
      return layout({
        subject: email.subject || 'A new paid survey is waiting for you',
        heading: surveyTitle ? `New survey: ${surveyTitle}` : 'A new paid survey is waiting',
        paragraphs: [
          `Hi ${firstName}, a researcher has published a new survey on Selorah.`,
          'Every question is worth 1 point, and each point is worth N20 when you withdraw.',
        ],
        action: { label: 'Start the survey', href: `${BRAND.site}/dashboard/research` },
      });

    case 'upgrade':
      return layout({
        subject: email.subject || 'Your Selorah Pro plan is active',
        heading: 'Your Selorah Pro plan is active',
        paragraphs: [
          `Hi ${firstName}, your ${plan || 'Selorah Pro'} subscription is now active.`,
          expiresAt
            ? `Your plan is paid through ${formatDate(expiresAt)}.`
            : 'Your plan is paid and ready to use.',
          'Pro includes unlimited record storage, priority sharing, and the full research rewards programme.',
        ],
        action: { label: 'Manage your plan', href: `${BRAND.site}/dashboard/settings` },
      });

    default:
      return layout({
        subject: email.subject || `A message from ${BRAND.name}`,
        heading: email.subject || `A message from ${BRAND.name}`,
        paragraphs: ['You have a new update from Selorah Health.'],
        action: { label: 'Open Selorah', href: `${BRAND.site}/dashboard` },
      });
  }
}

function layout(input: {
  subject: string;
  heading: string;
  paragraphs: string[];
  action?: { label: string; href: string };
}): RenderedEmail {
  const paragraphsHtml = input.paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.ink};">${escapeHtml(
          paragraph
        )}</p>`
    )
    .join('');

  const actionHtml = input.action
    ? `<p style="margin:24px 0 8px;">
         <a href="${input.action.href}" style="display:inline-block;background:${BRAND.color};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 20px;border-radius:10px;">${escapeHtml(
           input.action.label
         )}</a>
       </p>`
    : '';

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${BRAND.background};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.background};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:32px;">
            <tr>
              <td>
                <p style="margin:0 0 24px;font-size:14px;font-weight:700;letter-spacing:0.02em;color:${BRAND.color};">${BRAND.name}</p>
                <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${BRAND.ink};">${escapeHtml(
                  input.heading
                )}</h1>
                ${paragraphsHtml}
                ${actionHtml}
                <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:${BRAND.muted};">
                  You received this email because you have a Selorah account. If this was not you, reply to this message.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    input.heading,
    '',
    ...input.paragraphs,
    input.action ? `\n${input.action.label}: ${input.action.href}` : '',
    '',
    BRAND.name,
  ].join('\n');

  return { subject: input.subject, html, text };
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
