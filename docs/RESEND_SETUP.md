# Resend setup for Selorah

This guide connects Resend to the Selorah email queue and to Supabase Auth.
It uses the existing `send-email` Edge Function and the `email_queue` table.

Project values used below:

- Supabase project ref: `dbpyyhrbekamyejizson`
- Public site: `https://www.selorah.app`
- Support inbox: `selorahealth@gmail.com`

## 1. Add and verify the sending domain

1. Open the Resend dashboard and go to **Domains**.
2. Add the root domain, usually `selorah.app`. Do not add `www.selorah.app` as
   the sending domain.
3. Resend shows the exact DNS records for the domain. Add every record it
   gives you at your DNS provider. The records are normally:
   - an MX record for the sending subdomain
   - a TXT record for SPF
   - a TXT record for DKIM
4. If your DNS provider is Cloudflare, set these records to **DNS only**, not
   proxied.
5. Wait for Resend to show the domain as **Verified**.
6. Add a DMARC record for the root domain. Start in monitor mode:

```text
_dmarc.selorah.app  TXT  "v=DMARC1; p=none; rua=mailto:selorahealth@gmail.com; fo=1"
```

Do not invent DNS values. Always copy the exact values Resend gives you. If an
SPF record already exists on the root domain, merge the Resend include into it
instead of creating a second SPF record.

## 2. Create the API key

1. In Resend, go to **API Keys**.
2. Create a key named `Selorah production`.
3. Give it **Sending access** for the verified domain only.
4. Copy the key once and store it in a password manager. It starts with `re_`.

## 3. Set Supabase Edge Function secrets

Use the Supabase CLI from the repository root:

```bash
supabase login
supabase link --project-ref dbpyyhrbekamyejizson
supabase secrets set \
  RESEND_API_KEY="re_your_key" \
  EMAIL_FROM="Selorah Health <hello@selorah.app>" \
  EMAIL_REPLY_TO="selorahealth@gmail.com" \
  EMAIL_CRON_SECRET="$(openssl rand -hex 32)"
```

You can also set these in Supabase Dashboard > Edge Functions > Secrets.

Notes:

- `EMAIL_FROM` must use the verified domain. `hello@selorah.app` and
  `no-reply@selorah.app` are safe choices once the domain is verified.
- `EMAIL_REPLY_TO` sends replies to the monitored Gmail inbox.
- Keep `EMAIL_CRON_SECRET` private. It protects the queue worker.

## 4. Deploy the email function

```bash
supabase functions deploy send-email --no-verify-jwt
```

The function is intentionally deployed without JWT verification because the
scheduled worker calls it with `x-email-cron-secret`. Do not remove the secret
check.

## 5. Send a test email

Queue a test message in the Supabase SQL editor:

```sql
select public.enqueue_email(
  'you@example.com',
  'welcome',
  'Welcome to Selorah',
  '{"first_name":"Test"}'::jsonb
);
```

Then run the worker:

```bash
curl -X POST \
  "https://dbpyyhrbekamyejizson.supabase.co/functions/v1/send-email" \
  -H "Content-Type: application/json" \
  -H "x-email-cron-secret: YOUR_EMAIL_CRON_SECRET" \
  -d '{"limit":5}'
```

A healthy response looks like:

```json
{ "ok": true, "configured": true, "sent": 1, "failed": 0, "processed": 1 }
```

If you see `"configured": false`, the Resend key or `EMAIL_FROM` is missing.

## 6. Run the queue on a schedule

Enable `pg_cron` and `pg_net` in Supabase Dashboard > Database > Extensions, then
run this once in the SQL editor. Replace the secret placeholder first.

```sql
select cron.schedule(
  'selorah-send-email',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://dbpyyhrbekamyejizson.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-email-cron-secret', 'YOUR_EMAIL_CRON_SECRET'
    ),
    body := '{"limit":25}'::jsonb
  );
  $$
);
```

To stop the schedule:

```sql
select cron.unschedule('selorah-send-email');
```

An external scheduler such as a GitHub Action or cron-job.org also works. Call
the same endpoint once a minute or once every five minutes.

## 7. Use Resend for Supabase Auth email

The `email_queue` handles product email. Supabase Auth handles signup
confirmation, password reset, magic links, invites, and email changes. Configure
Auth SMTP so those messages also come from the verified domain.

1. Supabase Dashboard > Authentication > Emails > SMTP Settings.
2. Enable custom SMTP.
3. Use:
   - Host: `smtp.resend.com`
   - Port: `465` (SSL). Use `587` with TLS if your setup requires it.
   - Username: `resend`
   - Password: the Resend API key
   - Sender email: `no-reply@selorah.app`
   - Sender name: `Selorah Health`
4. Save and send a test email from the dashboard.
5. Set reasonable Auth rate limits so the form cannot be used to send unlimited
   messages.

## 8. Set Auth URLs and templates

Supabase Dashboard > Authentication > URL Configuration:

- Site URL: `https://www.selorah.app`
- Redirect URLs:
  - `https://www.selorah.app/auth/callback`
  - `https://selorah.app/auth/callback`
  - `http://localhost:5199/auth/callback`

The app callback checks the session, sends new patients to `/onboarding`, and
sends existing patients and staff to their portal home.

Paste the branded templates from `supabase/email-templates` into
Authentication > Emails:

| Template | File | Suggested subject |
| --- | --- | --- |
| Confirm signup | `confirmation.html` | Confirm your Selorah email |
| Reset password | `recovery.html` | Reset your Selorah password |
| Magic link | `magic-link.html` | Your Selorah sign in link |
| Invite user | `invite.html` | You have been invited to Selorah |
| Change email address | `email-change.html` | Confirm your new Selorah email |

Keep Supabase template variables such as `{{ .ConfirmationURL }}` unchanged.

## 9. Verify delivery

- Resend > Emails shows provider delivery status.
- Supabase `email_queue` shows `queued`, `sent`, or `failed`, plus the provider
  error for failures.
- Auth > Users shows whether a user has confirmed their email.

Useful checks:

```sql
select status, count(*)
from public.email_queue
group by status;

select id, to_email, template, status, error, created_at
from public.email_queue
order by created_at desc
limit 20;
```

Failed rows stay failed so nothing is silently lost. After fixing the cause,
set the row back to queued:

```sql
update public.email_queue
set status = 'queued', error = null
where id = 'THE_EMAIL_ID';
```

## 10. Deliverability checklist

- SPF, DKIM, and DMARC all pass.
- `EMAIL_FROM` uses the verified domain, not a Gmail address.
- Test messages land in the inbox, not spam.
- The welcome and survey emails include a clear reason for receiving them.
- The support inbox is monitored and replies go to `selorahealth@gmail.com`.
- Never put the Resend key in frontend code or a committed file.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `configured: false` | Missing `RESEND_API_KEY` or `EMAIL_FROM` | Set both secrets and redeploy if needed |
| Resend `403` | Domain is not verified | Finish the DNS records and wait for verification |
| Resend `422` | Sender address is not on the verified domain | Use `hello@selorah.app` or `no-reply@selorah.app` |
| Queue stays `queued` | Cron is not running or the secret is wrong | Check the schedule and `x-email-cron-secret` |
| Auth emails do not arrive | Custom SMTP is not enabled | Complete section 7 and send a test email |
| Messages go to spam | SPF, DKIM, or DMARC is missing | Fix DNS, then send a fresh test |
