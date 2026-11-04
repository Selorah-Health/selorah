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
  deep: '#4269F5',
  ink: '#101217',
  muted: '#6B7280',
  soft: '#8A93A6',
  background: '#F4F6FC',
  border: '#E6EAF6',
  site: 'https://www.selorah.app',
  logo: 'https://www.selorah.app/logo.png',
  support: 'selorahealth@gmail.com',
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
  const replyTo = Deno.env.get('EMAIL_REPLY_TO');
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
            reply_to: replyTo ? [replyTo] : undefined,
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
  const points = stringValue(payload.points);
  const minutes = stringValue(payload.minutes);
  const amount = stringValue(payload.amount);
  const reference = stringValue(payload.reference);
  const bank = stringValue(payload.bank);
  const event = stringValue(payload.event);
  const eventTime = stringValue(payload.time);
  const device = stringValue(payload.device);

  switch (email.template) {
    case 'welcome':
      return layout({
        subject: email.subject || `Welcome to ${BRAND.name}`,
        preheader: 'Your health records, finally in one place.',
        eyebrow: 'Welcome',
        heading: `Welcome, ${firstName}`,
        paragraphs: [
          'Your Selorah account is ready. Your health records stay encrypted and portable, and you decide who can see them.',
          'Add your first record, invite a doctor with a temporary QR code, and keep your care history in one place.',
        ],
        action: { label: 'Open your dashboard', href: `${BRAND.site}/dashboard` },
        note: 'Start with one record. You can always add more later.',
      });

    case 'new_survey':
      return layout({
        subject: email.subject || 'A new paid survey is waiting for you',
        preheader: `${surveyTitle || 'A new survey'} is open on Selorah.`,
        eyebrow: 'Paid research',
        heading: surveyTitle ? `New survey: ${surveyTitle}` : 'A new paid survey is waiting',
        paragraphs: [
          `Hi ${firstName}, a researcher has published a new survey on Selorah.`,
          'Every question is worth 1 point, and each point is worth ₦20 when you withdraw.',
        ],
        details: [
          { label: 'Reward', value: '₦20 per point' },
          { label: 'Questions', value: points || 'Open the survey to see' },
          { label: 'Estimated time', value: minutes ? `${minutes} minutes` : 'A few minutes' },
        ],
        action: { label: 'Start the survey', href: `${BRAND.site}/dashboard/research` },
        note: 'Survey points are the only cash reward. Health points track progress and are not cash.',
      });

    case 'upgrade':
      return layout({
        subject: email.subject || 'Your Selorah Pro plan is active',
        preheader: 'Your Selorah Pro plan is active.',
        eyebrow: 'Subscription',
        heading: 'Your Selorah Pro plan is active',
        paragraphs: [
          `Hi ${firstName}, your ${plan || 'Selorah Pro'} subscription is now active.`,
          expiresAt
            ? `Your plan is paid through ${formatDate(expiresAt)}.`
            : 'Your plan is paid and ready to use.',
          'Pro includes unlimited record storage, priority sharing, and the full research rewards programme.',
        ],
        details: [
          { label: 'Plan', value: plan || 'Selorah Pro' },
          { label: 'Paid through', value: expiresAt ? formatDate(expiresAt) : 'Active' },
        ],
        action: { label: 'Manage your plan', href: `${BRAND.site}/dashboard/settings` },
        note: 'You can cancel from Settings. Your access stays active until the paid-through date.',
      });

    case 'payment_receipt':
      return layout({
        subject: email.subject || 'Your Selorah payment receipt',
        preheader: 'Your payment has been confirmed.',
        eyebrow: 'Payment received',
        heading: 'Your payment is confirmed',
        paragraphs: [
          `Hi ${firstName}, we received your payment and your Selorah account has been updated.`,
          'Keep this email as your receipt. You can also find the payment in your billing history.',
        ],
        details: [
          { label: 'Amount', value: amount || 'See billing history' },
          { label: 'Reference', value: reference || 'Not provided' },
          { label: 'Date', value: eventTime || formatDate(new Date().toISOString()) },
        ],
        action: { label: 'View billing history', href: `${BRAND.site}/dashboard/billing` },
      });

    case 'withdrawal_paid':
      return layout({
        subject: email.subject || 'Your Selorah withdrawal has been paid',
        preheader: 'Your withdrawal has been sent to your bank.',
        eyebrow: 'Withdrawal paid',
        heading: 'Your withdrawal has been sent',
        paragraphs: [
          `Hi ${firstName}, your withdrawal has been processed and sent to your bank account.`,
          'Bank processing times can vary. If it does not arrive, reply to this email with the reference below.',
        ],
        details: [
          { label: 'Amount', value: amount || 'See earnings' },
          { label: 'Bank', value: bank || 'Saved bank account' },
          { label: 'Reference', value: reference || 'Not provided' },
        ],
        action: { label: 'View earnings', href: `${BRAND.site}/dashboard/earnings` },
      });

    case 'security_alert':
      return layout({
        subject: email.subject || 'A security change was made to your Selorah account',
        preheader: 'Review this security change.',
        eyebrow: 'Security',
        heading: 'A security change was made',
        paragraphs: [
          `Hi ${firstName}, a security setting on your Selorah account was changed.`,
          'If you made this change, no action is needed.',
        ],
        details: [
          { label: 'Change', value: event || 'Security setting updated' },
          { label: 'Time', value: eventTime || formatDate(new Date().toISOString()) },
          { label: 'Device', value: device || 'Unknown device' },
        ],
        action: { label: 'Review security', href: `${BRAND.site}/dashboard/security` },
        note: `If this was not you, contact ${BRAND.support} immediately and change your password.`,
      });

    default:
      return layout({
        subject: email.subject || `A message from ${BRAND.name}`,
        preheader: 'A new update from Selorah Health.',
        eyebrow: 'Update',
        heading: email.subject || `A message from ${BRAND.name}`,
        paragraphs: ['You have a new update from Selorah Health.'],
        action: { label: 'Open Selorah', href: `${BRAND.site}/dashboard` },
      });
  }
}

type EmailDetail = { label: string; value: string };

function layout(input: {
  subject: string;
  preheader?: string;
  eyebrow?: string;
  heading: string;
  paragraphs: string[];
  details?: EmailDetail[];
  action?: { label: string; href: string };
  note?: string;
}): RenderedEmail {
  const paragraphsHtml = input.paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${BRAND.ink};">${escapeHtml(
          paragraph
        )}</p>`
    )
    .join('');

  const detailsHtml = input.details?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;background:#F7F9FF;border:1px solid ${BRAND.border};border-radius:14px;">
         <tr>
           <td style="padding:8px 18px;">
             <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
               ${input.details
                 .map(
                   (detail) => `<tr>
                     <td style="padding:7px 0;font-size:13px;line-height:1.5;color:${BRAND.soft};">${escapeHtml(
                       detail.label
                     )}</td>
                     <td style="padding:7px 0;text-align:right;font-size:13px;line-height:1.5;font-weight:700;color:${BRAND.ink};">${escapeHtml(
                       detail.value
                     )}</td>
                   </tr>`
                 )
                 .join('')}
             </table>
           </td>
         </tr>
       </table>`
    : '';

  const actionHtml = input.action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
         <tr>
           <td style="border-radius:12px;background:${BRAND.color};">
             <a href="${input.action.href}" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">${escapeHtml(
               input.action.label
             )}</a>
           </td>
         </tr>
       </table>`
    : '';

  const noteHtml = input.note
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 0;background:#F7F9FF;border-radius:12px;">
         <tr>
           <td style="padding:14px 16px;font-size:12px;line-height:1.65;color:${BRAND.muted};">${escapeHtml(
             input.note
           )}</td>
         </tr>
       </table>`
    : '';

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light only">
    <meta name="supported-color-schemes" content="light only">
    <title>${escapeHtml(input.subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.background};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <div style="display:none;font-size:1px;color:${BRAND.background};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(
      input.preheader || input.heading
    )}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.background};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
            <tr>
              <td style="padding:0 0 18px;">
                <a href="${BRAND.site}" style="text-decoration:none;">
                  <img src="${BRAND.logo}" width="34" height="34" alt="" style="vertical-align:middle;border-radius:9px;border:0;">
                  <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:16px;font-weight:800;letter-spacing:-0.02em;color:${BRAND.ink};">Selorah Health</span>
                </a>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;border:1px solid ${BRAND.border};border-radius:20px;padding:36px 34px;">
                ${
                  input.eyebrow
                    ? `<p style="margin:0 0 12px;font-size:10px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:${BRAND.color};">${escapeHtml(
                        input.eyebrow
                      )}</p>`
                    : ''
                }
                <h1 style="margin:0 0 16px;font-size:25px;line-height:1.25;letter-spacing:-0.02em;color:${BRAND.ink};">${escapeHtml(
                  input.heading
                )}</h1>
                ${paragraphsHtml}
                ${detailsHtml}
                ${actionHtml}
                ${noteHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:22px 10px 0;text-align:center;">
                <p style="margin:0 0 6px;font-size:12px;line-height:1.6;color:${BRAND.soft};">
                  Selorah Health, Lagos, Nigeria
                </p>
                <p style="margin:0 0 6px;font-size:12px;line-height:1.6;color:${BRAND.soft};">
                  <a href="${BRAND.site}/privacy" style="color:${BRAND.color};text-decoration:none;">Privacy</a>
                  &nbsp;&middot;&nbsp;
                  <a href="${BRAND.site}/terms" style="color:${BRAND.color};text-decoration:none;">Terms</a>
                  &nbsp;&middot;&nbsp;
                  <a href="mailto:${BRAND.support}" style="color:${BRAND.color};text-decoration:none;">Contact</a>
                </p>
                <p style="margin:0;font-size:11px;line-height:1.6;color:${BRAND.soft};">
                  You received this email because you have a Selorah account.
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
    ...(input.details?.length ? [''] : []),
    ...(input.details || []).map((detail) => `${detail.label}: ${detail.value}`),
    input.action ? `\n${input.action.label}: ${input.action.href}` : '',
    input.note ? `\n${input.note}` : '',
    '',
    BRAND.name,
    `${BRAND.site}/privacy · ${BRAND.site}/terms`,
  ]
    .filter((line, index, lines) => !(line === '' && lines[index - 1] === ''))
    .join('\n');

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
